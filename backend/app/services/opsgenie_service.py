import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from typing import Any

import requests
from requests.exceptions import RequestException, SSLError

from app.config import settings
from app.models.schemas import (
    Alert,
    AlertNotesResponse,
    DashboardSummary,
    OnCallEngineer,
    OnCallResponse,
    OnCallTimelineEntry,
    OnCallTimelineResponse,
    OpsgenieOverrideRequest,
    OpsgenieSchedule,
    OpsgenieScheduleConfig,
    OpsgenieWriteResponse,
)

logger = logging.getLogger(__name__)
ALERT_CACHE: dict[tuple[str | None, str | None], tuple[float, list[Alert]]] = {}
ALERT_NOTES_CACHE: dict[str, tuple[float, str]] = {}
ALERT_NOTES_CACHE_TTL_SECONDS = 300


class OpsgenieService:
    def __init__(self) -> None:
        self.base_url = settings.opsgenie_base_url.rstrip("/")
        self.timeout = settings.request_timeout_seconds
        self.verify_ssl: bool | str = settings.opsgenie_ca_bundle or settings.opsgenie_verify_ssl

    @property
    def headers(self) -> dict[str, str]:
        if not settings.opsgenie_api_key:
            return {}
        return {"Authorization": f"GenieKey {settings.opsgenie_api_key}"}

    @property
    def request_options(self) -> dict[str, Any]:
        return {"timeout": self.timeout, "verify": self.verify_ssl}

    def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not settings.opsgenie_api_key:
            logger.warning("OPSGENIE_API_KEY is not configured")
            return {}
        attempts = max(1, settings.opsgenie_request_retries + 1)
        for attempt in range(1, attempts + 1):
            try:
                response = requests.get(
                    f"{self.base_url}{path}",
                    headers=self.headers,
                    params=params,
                    **self.request_options,
                )
                if not response.ok:
                    logger.warning(
                        "Opsgenie request returned %s for %s: %s",
                        response.status_code,
                        path,
                        response.text[:300],
                    )
                    return {}
                return response.json()
            except SSLError as exc:
                logger.warning(
                    "Opsgenie TLS verification failed for %s. If your network uses a corporate root CA, mount it in the backend container and set OPSGENIE_CA_BUNDLE to that path. Error: %s",
                    path,
                    exc,
                )
                break
            except RequestException as exc:
                if attempt == attempts:
                    logger.warning("Opsgenie request failed for %s after %s attempt(s): %s", path, attempts, exc)
                else:
                    logger.info("Retrying Opsgenie request for %s after attempt %s failed: %s", path, attempt, exc)
        return {}

    def _request_json(self, method: str, path: str, payload: dict[str, Any] | None = None, params: dict[str, Any] | None = None) -> dict[str, Any]:
        if not settings.opsgenie_api_key:
            logger.warning("OPSGENIE_API_KEY is not configured")
            return {}
        try:
            response = requests.request(
                method,
                f"{self.base_url}{path}",
                headers={**self.headers, "Content-Type": "application/json"},
                params=params,
                json=payload,
                **self.request_options,
            )
            if not response.ok:
                logger.warning("Opsgenie %s returned %s for %s: %s", method, response.status_code, path, response.text[:300])
                return {"_error": response.text[:300], "_status": response.status_code}
            return response.json() if response.content else {}
        except SSLError as exc:
            logger.warning(
                "Opsgenie TLS verification failed for %s %s. If your network uses a corporate root CA, mount it in the backend container and set OPSGENIE_CA_BUNDLE to that path. Error: %s",
                method,
                path,
                exc,
            )
            return {"_error": str(exc)}
        except RequestException as exc:
            logger.warning("Opsgenie %s failed for %s: %s", method, path, exc)
            return {"_error": str(exc)}

    def get_schedules(self) -> list[OpsgenieSchedule]:
        raw_schedules: list[dict[str, Any]] = []
        limit = 100
        offset = 0
        while True:
            payload = self._get("/v2/schedules", params={"limit": limit, "offset": offset})
            page = payload.get("data", [])
            raw_schedules.extend(page)
            if len(page) < limit:
                break
            offset += limit
        schedules = []
        for item in raw_schedules:
            schedule_id = item.get("id") or item.get("name")
            name = item.get("name") or schedule_id
            if not schedule_id or not name:
                continue
            schedules.append(
                OpsgenieSchedule(
                    id=schedule_id,
                    name=name,
                    timezone=item.get("timezone") or item.get("timeZone"),
                    enabled=item.get("enabled"),
                )
            )
        return sorted(schedules, key=lambda schedule: schedule.name.lower())

    def get_oncall(self, schedule_id: str | None = None, schedule_identifier_type: str | None = None) -> OnCallResponse:
        selected_schedule = schedule_id or settings.default_schedule_id
        if not selected_schedule:
            return OnCallResponse(engineers=[OnCallEngineer()])
        identifier_type = schedule_identifier_type or settings.opsgenie_schedule_identifier_type

        payload = self._get(
            f"/v2/schedules/{selected_schedule}/on-calls",
            params={
                "flat": "true",
                "scheduleIdentifierType": identifier_type,
            },
        )
        if not payload:
            return OnCallResponse(
                schedule_name=selected_schedule,
                escalation_level="API key needs configuration access",
                engineers=[
                    OnCallEngineer(
                        name="Opsgenie access required",
                        schedule_name=selected_schedule,
                        escalation_level="API key needs configuration access",
                    )
                ],
            )
        data = payload.get("data", {})
        recipients = data.get("onCallRecipients", [])
        schedule_name = data.get("name") or selected_schedule
        timezone_name = data.get("timezone") or data.get("timeZone")
        engineers = [normalize_oncall_recipient(recipient, schedule_name, timezone_name) for recipient in recipients]
        if not engineers:
            engineers = [OnCallEngineer(name="No active on-call", schedule_name=schedule_name, escalation_level="N/A", timezone=timezone_name)]
        return OnCallResponse(
            schedule_name=schedule_name,
            escalation_level="Primary",
            timezone=timezone_name,
            engineers=engineers,
        )

    def get_timeline(
        self,
        schedule_id: str,
        start: datetime | None = None,
        end: datetime | None = None,
        schedule_identifier_type: str = "id",
    ) -> OnCallTimelineResponse:
        params: dict[str, Any] = {"scheduleIdentifierType": schedule_identifier_type}
        if start:
            params["date"] = ensure_aware(start).isoformat()
        if start and end:
            params["interval"] = max(1, int((ensure_aware(end) - ensure_aware(start)).total_seconds() // 86400) + 1)
        payload = self._get(f"/v2/schedules/{schedule_id}/timeline", params=params)
        data = payload.get("data", payload)
        entries = extract_timeline_entries(data)
        schedule_name = schedule_id
        timezone_name = None
        if isinstance(data, dict):
            schedule_name = data.get("name") or data.get("scheduleName") or schedule_id
            timezone_name = data.get("timezone") or data.get("timeZone")
        return OnCallTimelineResponse(
            schedule_id=schedule_id,
            schedule_name=schedule_name,
            timezone=timezone_name,
            start=start,
            end=end,
            entries=entries,
            raw=data if isinstance(data, dict) else {},
        )

    def create_override(self, request: OpsgenieOverrideRequest) -> OpsgenieWriteResponse:
        payload: dict[str, Any] = {
            "user": request.user,
            "startDate": request.start.isoformat(),
            "endDate": request.end.isoformat(),
            "alias": request.alias or f"sre-insights-override-{int(time.time())}",
        }
        if request.rotation_id:
            payload["rotationId"] = request.rotation_id
        raw = self._request_json(
            "POST",
            f"/v2/schedules/{request.schedule_id}/overrides",
            payload=payload,
            params={"scheduleIdentifierType": request.schedule_identifier_type},
        )
        success = "_error" not in raw and "_status" not in raw
        return OpsgenieWriteResponse(
            success=success,
            message="Override created in Opsgenie" if success else "Unable to create Opsgenie override",
            raw=raw,
        )

    def get_schedule_config(self, schedule_id: str, schedule_identifier_type: str = "id") -> OpsgenieScheduleConfig:
        schedule_payload = self._get(
            f"/v2/schedules/{schedule_id}",
            params={"scheduleIdentifierType": schedule_identifier_type},
        )
        schedule_data = schedule_payload.get("data", schedule_payload)
        rotations = schedule_data.get("rotations", []) if isinstance(schedule_data, dict) else []
        escalations = self._get("/v2/escalations", params={"limit": 100}).get("data", [])
        return OpsgenieScheduleConfig(
            schedule=schedule_data if isinstance(schedule_data, dict) else {},
            rotations=rotations if isinstance(rotations, list) else [],
            escalations=escalations if isinstance(escalations, list) else [],
            routing_rules=[],
        )

    def update_schedule_config(self, schedule_id: str, payload: dict[str, Any], schedule_identifier_type: str = "id") -> OpsgenieWriteResponse:
        raw = self._request_json(
            "PATCH",
            f"/v2/schedules/{schedule_id}",
            payload=payload,
            params={"scheduleIdentifierType": schedule_identifier_type},
        )
        success = "_error" not in raw and "_status" not in raw
        return OpsgenieWriteResponse(
            success=success,
            message="Schedule configuration update submitted" if success else "Unable to update schedule configuration",
            raw=raw,
        )

    def get_alerts(self, start: datetime | None = None, end: datetime | None = None) -> list[Alert]:
        start = ensure_aware(start)
        end = ensure_aware(end)
        cache_key = (start.isoformat() if start else None, end.isoformat() if end else None)
        cached = ALERT_CACHE.get(cache_key)
        if cached and time.time() - cached[0] <= settings.opsgenie_cache_ttl_seconds:
            return cached[1]
        query_parts: list[str] = []
        if start:
            query_parts.append(f"createdAt >= {format_opsgenie_date(start)}")
        if end:
            query_parts.append(f"createdAt <= {format_opsgenie_date(end)}")

        raw_alerts: list[dict[str, Any]] = []
        query = " AND ".join(query_parts) if query_parts else None
        page_limit = max(1, min(settings.opsgenie_alert_page_limit, 100))
        max_records = max(page_limit, settings.opsgenie_alert_max_records)
        offset = 0
        while offset < max_records:
            payload = self._get(
                "/v2/alerts",
                params={
                    "limit": page_limit,
                    "offset": offset,
                    "sort": "createdAt",
                    "order": "desc",
                    "query": query,
                },
            )
            page = payload.get("data", [])
            raw_alerts.extend(page)
            if len(page) < page_limit:
                break
            offset += page_limit
        alerts = [self._map_alert(item) for item in raw_alerts]
        filtered_alerts = sorted(
            [
                alert
                for alert in alerts
                if (not start or not alert.created_at or alert.created_at >= start)
                and (not end or not alert.created_at or alert.created_at <= end)
            ],
            key=lambda alert: alert.created_at or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True,
        )
        ALERT_CACHE[cache_key] = (time.time(), filtered_alerts)
        return filtered_alerts

    def get_summary(self, start: datetime | None = None, end: datetime | None = None) -> DashboardSummary:
        alerts = self.get_alerts(start=start, end=end)
        return build_summary(alerts)

    def get_alert_notes(self, alert_ids: list[str]) -> AlertNotesResponse:
        unique_ids = list(dict.fromkeys(alert_id for alert_id in alert_ids if alert_id))[:50]
        notes_by_alert: dict[str, str] = {}
        missing_ids: list[str] = []
        now = time.time()
        for alert_id in unique_ids:
            cached = ALERT_NOTES_CACHE.get(alert_id)
            if cached and now - cached[0] <= ALERT_NOTES_CACHE_TTL_SECONDS:
                if cached[1]:
                    notes_by_alert[alert_id] = cached[1]
            else:
                missing_ids.append(alert_id)

        with ThreadPoolExecutor(max_workers=min(5, len(missing_ids) or 1)) as executor:
            futures = {executor.submit(self._get_notes_for_alert, alert_id): alert_id for alert_id in missing_ids}
            for future in as_completed(futures):
                alert_id = futures[future]
                try:
                    note_text = future.result()
                except Exception as exc:
                    logger.warning("Unable to load notes for alert %s: %s", alert_id, exc)
                    note_text = None
                if note_text is None:
                    continue
                ALERT_NOTES_CACHE[alert_id] = (time.time(), note_text)
                if note_text:
                    notes_by_alert[alert_id] = note_text
        return AlertNotesResponse(notes=notes_by_alert)

    def _get_notes_for_alert(self, alert_id: str) -> str | None:
        payload = self._get(
            f"/v2/alerts/{alert_id}/notes",
            params={
                "alertIdentifierType": "id",
                "limit": 100,
                "order": "desc",
            },
        )
        if not payload:
            return None
        notes = payload.get("data", [])
        formatted = [format_alert_note(note) for note in notes if isinstance(note, dict)]
        return "\n\n".join(note for note in formatted if note)

    @staticmethod
    def _map_alert(item: dict[str, Any]) -> Alert:
        responders = [
            responder.get("name") or responder.get("username") or responder.get("type", "responder")
            for responder in item.get("responders", [])
        ]
        notes = extract_alert_notes(item)
        return Alert(
            alert_id=item.get("id", ""),
            message=item.get("message", ""),
            alias=item.get("alias"),
            priority=item.get("priority", "P5"),
            status=item.get("status", "open"),
            source=item.get("source", "unknown"),
            tags=item.get("tags", []),
            created_at=parse_datetime(item.get("createdAt")),
            updated_at=parse_datetime(item.get("updatedAt")),
            acknowledged_at=parse_datetime(item.get("acknowledgedAt")),
            closed_at=parse_datetime(item.get("closedAt")),
            responders=responders,
            owner=item.get("owner"),
            notes=notes,
            alert_url=build_alert_url(item.get("id")),
        )


def build_alert_url(alert_id: str | None) -> str | None:
    if not alert_id:
        return None
    app_base_url = "https://app.eu.opsgenie.com" if "api.eu.opsgenie.com" in settings.opsgenie_base_url else "https://app.opsgenie.com"
    return f"{app_base_url}/alert/detail/{alert_id}/details"


def format_alert_note(note: dict[str, Any]) -> str:
    text = str(note.get("note") or note.get("message") or "").strip()
    if not text:
        return ""
    owner = note.get("owner")
    if isinstance(owner, dict):
        owner = owner.get("name") or owner.get("username") or owner.get("email")
    created_at = parse_datetime(note.get("createdAt"))
    metadata = [str(owner).strip() if owner else "", created_at.isoformat() if created_at else ""]
    prefix = " | ".join(value for value in metadata if value)
    return f"{prefix}: {text}" if prefix else text


def extract_alert_notes(item: dict[str, Any]) -> str | None:
    note_candidates = [
        item.get("note"),
        item.get("notes"),
        item.get("description"),
        item.get("details", {}).get("note") if isinstance(item.get("details"), dict) else None,
        item.get("details", {}).get("notes") if isinstance(item.get("details"), dict) else None,
        item.get("details", {}).get("description") if isinstance(item.get("details"), dict) else None,
    ]
    for value in note_candidates:
        if isinstance(value, list):
            text = "; ".join(str(part).strip() for part in value if str(part).strip())
        elif isinstance(value, dict):
            text = "; ".join(f"{key}: {val}" for key, val in value.items() if val)
        else:
            text = str(value).strip() if value else ""
        if text:
            return text
    return None


def extract_timeline_entries(payload: Any) -> list[OnCallTimelineEntry]:
    entries: list[OnCallTimelineEntry] = []

    def walk(value: Any, rotation: str | None = None, level: str | None = None) -> None:
        if isinstance(value, list):
            for item in value:
                walk(item, rotation=rotation, level=level)
            return
        if not isinstance(value, dict):
            return

        next_rotation = (value.get("rotation") or value.get("rotationName") or value.get("name")) if is_rotation_like(value) else rotation
        next_level = str(value.get("escalationLevel") or value.get("level") or level) if value.get("escalationLevel") or value.get("level") or level else None
        user_value = value.get("user") or value.get("recipient") or value.get("onCallRecipient") or value.get("owner")
        start_value = value.get("startDate") or value.get("start") or value.get("from")
        end_value = value.get("endDate") or value.get("end") or value.get("to")
        if user_value and (start_value or end_value):
            name, email = normalize_timeline_user(user_value)
            entries.append(
                OnCallTimelineEntry(
                    name=name,
                    email=email,
                    start=parse_datetime(start_value),
                    end=parse_datetime(end_value),
                    rotation=next_rotation,
                    escalation_level=next_level,
                )
            )

        for child_key in ("timeline", "finalTimeline", "rotations", "participants", "periods", "entries", "users", "steps"):
            if child_key in value:
                walk(value[child_key], rotation=next_rotation, level=next_level)

    walk(payload)
    deduped: dict[tuple[str, str | None, datetime | None, datetime | None], OnCallTimelineEntry] = {}
    for entry in entries:
        deduped[(entry.name, entry.rotation, entry.start, entry.end)] = entry
    ordered = sorted(
        deduped.values(),
        key=lambda entry: (entry.name, entry.rotation or "", entry.start or datetime.min.replace(tzinfo=timezone.utc)),
    )
    merged: list[OnCallTimelineEntry] = []
    for entry in ordered:
        previous = merged[-1] if merged else None
        same_assignment = previous and previous.name == entry.name and previous.rotation == entry.rotation
        touches_previous = same_assignment and previous.end and entry.start and entry.start <= previous.end
        if touches_previous:
            if not previous.end or (entry.end and entry.end > previous.end):
                previous.end = entry.end
            continue
        merged.append(entry)
    return sorted(merged, key=lambda entry: entry.start or datetime.min.replace(tzinfo=timezone.utc))


def is_rotation_like(value: dict[str, Any]) -> bool:
    return any(key in value for key in ("rotation", "rotationName", "periods", "participants"))


def normalize_timeline_user(value: Any) -> tuple[str, str | None]:
    if isinstance(value, str):
        return value, value if "@" in value else None
    if isinstance(value, dict):
        name = value.get("name") or value.get("displayName") or value.get("username") or value.get("email") or "Unknown"
        username = value.get("username")
        email = value.get("email") or (username if "@" in str(username) else None)
        return str(name), email
    return "Unknown", None


def parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return ensure_aware(datetime.fromisoformat(value.replace("Z", "+00:00")))


def normalize_oncall_recipient(recipient: Any, schedule_name: str, timezone_name: str | None = None) -> OnCallEngineer:
    if isinstance(recipient, str):
        return OnCallEngineer(
            name=recipient,
            email=recipient if "@" in recipient else None,
            schedule_name=schedule_name,
            escalation_level="Primary",
            timezone=timezone_name,
        )
    if isinstance(recipient, dict):
        name = recipient.get("name") or recipient.get("username") or recipient.get("displayName") or "Unknown on-call"
        return OnCallEngineer(
            name=name,
            email=recipient.get("username") if "@" in str(recipient.get("username")) else recipient.get("email"),
            schedule_name=schedule_name,
            escalation_level=str(recipient.get("escalationLevel", "Primary")),
            timezone=recipient.get("timezone") or recipient.get("timeZone") or timezone_name,
        )
    return OnCallEngineer(name="Unknown on-call", schedule_name=schedule_name, escalation_level="Primary", timezone=timezone_name)


def ensure_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def format_opsgenie_date(value: datetime) -> str:
    return value.strftime("%d-%m-%Y")


def average_minutes(durations: list[float]) -> float:
    if not durations:
        return 0
    return round(sum(durations) / len(durations), 2)


def build_summary(alerts: list[Alert]) -> DashboardSummary:
    status_counts = {status: 0 for status in ("open", "acknowledged", "closed")}
    priority_counts = {priority: 0 for priority in ("P1", "P2", "P3", "P4", "P5")}
    mtta_values: list[float] = []
    mttr_values: list[float] = []

    for alert in alerts:
        status = alert.status.lower()
        if status in status_counts:
            status_counts[status] += 1
        if alert.priority in priority_counts:
            priority_counts[alert.priority] += 1
        if alert.created_at and alert.acknowledged_at:
            mtta_values.append((alert.acknowledged_at - alert.created_at).total_seconds() / 60)
        if alert.created_at and alert.closed_at:
            mttr_values.append((alert.closed_at - alert.created_at).total_seconds() / 60)

    return DashboardSummary(
        total_alerts=len(alerts),
        open_alerts=status_counts["open"],
        acknowledged_alerts=status_counts["acknowledged"],
        closed_alerts=status_counts["closed"],
        p1_count=priority_counts["P1"],
        p2_count=priority_counts["P2"],
        p3_count=priority_counts["P3"],
        p4_count=priority_counts["P4"],
        p5_count=priority_counts["P5"],
        mtta=average_minutes(mtta_values),
        mttr=average_minutes(mttr_values),
    )
