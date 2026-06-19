from datetime import datetime

from fastapi import APIRouter, Query

from app.models.schemas import DashboardSummary
from app.services.opsgenie_service import OpsgenieService

router = APIRouter()
service = OpsgenieService()


@router.get("/summary", response_model=DashboardSummary)
def summary(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
) -> DashboardSummary:
    return service.get_summary(start=start, end=end)
