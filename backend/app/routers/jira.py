from fastapi import APIRouter, Query

from app.models.schemas import JiraSummary
from app.services.jira_service import JiraService

router = APIRouter()
service = JiraService()


@router.get("/summary", response_model=JiraSummary)
def jira_summary(
    jql: str | None = Query(default=None),
    max_results: int | None = Query(default=None, ge=1, le=500),
) -> JiraSummary:
    return service.summary(jql=jql, max_results=max_results)
