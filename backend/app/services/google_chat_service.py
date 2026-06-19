import logging

import requests
from fastapi import HTTPException
from requests import RequestException

from app.config import settings
from app.models.schemas import Alert, ShiftHandoverRequest, ShiftHandoverResponse

logger = logging.getLogger(__name__)


class GoogleChatService:
    def send_handover(self, payload: ShiftHandoverRequest) -> ShiftHandoverResponse:
        if not settings.google_chat_webhook_url:
            raise HTTPException(status_code=400, detail="GOOGLE_CHAT_WEBHOOK_URL is not configured")

        text = build_handover_message(payload)
        try:
            response = requests.post(
                settings.google_chat_webhook_url,
                json={"text": text},
                timeout=settings.request_timeout_seconds,
            )
            response.raise_for_status()
        except RequestException as exc:
            logger.warning("Google Chat handover send failed: %s", exc)
            raise HTTPException(status_code=502, detail="Unable to send handover to Google Chat") from exc

        return ShiftHandoverResponse(
            message="Shift handover sent to Google Chat",
            sent=True,
            alert_count=len(payload.alerts),
        )


def build_handover_message(payload: ShiftHandoverRequest) -> str:
    title = "SRE Operational Insights - Shift Handover"
    lines = [f"*{title}*"]
    if payload.shift_type:
        lines.append(f"Shift Type: {payload.shift_type}")
    if payload.shift_date:
        lines.append(f"Shift Date: {payload.shift_date}")
    if payload.shift_start or payload.shift_end:
        lines.append(f"Shift Time: {payload.shift_start or 'N/A'} to {payload.shift_end or 'N/A'}")
    lines.append(f"Open alerts: {len(payload.alerts)}")
    if payload.notes.strip():
        lines.extend(["", "*Handover Notes:*", payload.notes.strip()])
    if payload.alerts:
        lines.extend(["", "*Alerts:*"])
        for index, alert in enumerate(payload.alerts[:25], start=1):
            lines.append(format_alert_line(index, alert))
        if len(payload.alerts) > 25:
            lines.append(f"...and {len(payload.alerts) - 25} more alerts.")
    return "\n".join(lines)


def format_alert_line(index: int, alert: Alert) -> str:
    owner = alert.owner or "Unassigned"
    notes = alert.notes or "No notes"
    return f"{index}. Priority: {alert.priority} | Message: {alert.message} | Owner: {owner} | Notes: {notes}"
