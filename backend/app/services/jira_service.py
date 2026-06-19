import logging
from collections import Counter
from datetime import datetime
from typing import Any

import requests
from requests import RequestException

from app.config import settings
from app.models.schemas import JiraIssue, JiraSummary

logger = logging.getLogger(__name__)


class JiraService:
    def __init__(self) -> None:
        self.base_url = (settings.jira_base_url or "").rstrip("/")
        self.timeout = settings.request_timeout_seconds

    @property
    def configured(self) -> bool:
        return bool(self.base_url and settings.jira_email and settings.jira_api_token)

    def summary(self, jql: str | None = None, max_results: int | None = None) -> JiraSummary:
        query = jql or settings.jira_default_jql or default_jql()
        if not self.configured:
            return JiraSummary(
                jql=query,
                configured=False,
                authenticated=False,
                error_message="Jira is not fully configured. Set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN.",
            )

        auth_error = self._auth_error()
        if auth_error:
            return JiraSummary(jql=query, configured=True, authenticated=False, error_message=auth_error)

        payload = self._search(query, max_results=max_results)
        issues = [self._map_issue(item) for item in payload.get("issues", [])]
        return build_summary(issues, query)

    def _auth_error(self) -> str | None:
        try:
            response = requests.get(
                f"{self.base_url}/rest/api/3/myself",
                auth=(settings.jira_email or "", settings.jira_api_token or ""),
                headers={"Accept": "application/json"},
                timeout=self.timeout,
            )
            if response.status_code in {401, 403}:
                return "Jira authentication failed. Verify JIRA_EMAIL and JIRA_API_TOKEN belong to the same Atlassian account and that the account has Jira access."
            if not response.ok:
                logger.warning("Jira auth check returned %s: %s", response.status_code, response.text[:300])
                return f"Jira authentication check failed with HTTP {response.status_code}."
            return None
        except RequestException as exc:
            logger.warning("Jira auth check failed: %s", exc)
            return "Jira authentication check failed due to a network or timeout error."

    def _search(self, jql: str, max_results: int | None = None) -> dict[str, Any]:
        limit = max(1, min(max_results or settings.jira_max_results, 500))
        try:
            response = requests.get(
                f"{self.base_url}/rest/api/3/search/jql",
                auth=(settings.jira_email or "", settings.jira_api_token or ""),
                headers={"Accept": "application/json"},
                params={
                    "jql": jql,
                    "maxResults": limit,
                    "fields": ["summary", "status", "priority", "issuetype", "assignee", "reporter", "updated", "created"],
                },
                timeout=self.timeout,
            )
            if not response.ok:
                logger.warning("Jira request returned %s: %s", response.status_code, response.text[:300])
                return {}
            return response.json()
        except RequestException as exc:
            logger.warning("Jira request failed: %s", exc)
            return {}

    def _map_issue(self, item: dict[str, Any]) -> JiraIssue:
        fields = item.get("fields", {})
        key = item.get("key", "")
        assignee = fields.get("assignee") or {}
        reporter = fields.get("reporter") or {}
        return JiraIssue(
            key=key,
            summary=fields.get("summary", ""),
            status=nested_name(fields.get("status"), "Unknown"),
            priority=nested_name(fields.get("priority"), "Unprioritized"),
            issue_type=nested_name(fields.get("issuetype"), "Task"),
            assignee=assignee.get("displayName") or assignee.get("emailAddress") or "Unassigned",
            reporter=reporter.get("displayName") or reporter.get("emailAddress") or "Unknown",
            updated=parse_jira_datetime(fields.get("updated")),
            created=parse_jira_datetime(fields.get("created")),
            url=f"{self.base_url}/browse/{key}" if key else None,
        )


def default_jql() -> str:
    if settings.jira_project_key:
        return f'project = "{settings.jira_project_key}" ORDER BY updated DESC'
    return "ORDER BY updated DESC"


def nested_name(value: Any, fallback: str) -> str:
    if isinstance(value, dict):
        return value.get("name") or fallback
    return fallback


def parse_jira_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def counter_rows(issues: list[JiraIssue], field: str) -> list[dict[str, int | str]]:
    counts = Counter(getattr(issue, field) or "Unknown" for issue in issues)
    return [{"name": name, "value": value} for name, value in counts.most_common()]


def build_summary(issues: list[JiraIssue], jql: str) -> JiraSummary:
    open_statuses = {"open", "to do", "backlog", "selected for development"}
    progress_statuses = {"in progress", "in review", "review", "blocked"}
    done_statuses = {"done", "closed", "resolved"}
    return JiraSummary(
        total_issues=len(issues),
        open_issues=sum(1 for issue in issues if issue.status.lower() in open_statuses),
        in_progress_issues=sum(1 for issue in issues if issue.status.lower() in progress_statuses),
        done_issues=sum(1 for issue in issues if issue.status.lower() in done_statuses),
        unassigned_issues=sum(1 for issue in issues if issue.assignee == "Unassigned"),
        by_status=counter_rows(issues, "status"),
        by_priority=counter_rows(issues, "priority"),
        by_issue_type=counter_rows(issues, "issue_type"),
        by_assignee=counter_rows(issues, "assignee"),
        recent_issues=sorted(issues, key=lambda issue: issue.updated or datetime.min, reverse=True)[:25],
        jql=jql,
        configured=True,
        authenticated=True,
    )
