from datetime import datetime

from fastapi import APIRouter, Query

from app.models.schemas import (
    Alert,
    OnCallResponse,
    OnCallTimelineResponse,
    OpsgenieOverrideRequest,
    OpsgenieSchedule,
    OpsgenieScheduleConfig,
    OpsgenieWriteResponse,
)
from app.services.opsgenie_service import OpsgenieService

router = APIRouter()
service = OpsgenieService()


@router.get("/oncall", response_model=OnCallResponse)
def oncall(
    schedule_id: str | None = Query(default=None),
    schedule_identifier_type: str | None = Query(default=None),
) -> OnCallResponse:
    return service.get_oncall(schedule_id=schedule_id, schedule_identifier_type=schedule_identifier_type)


@router.get("/schedules", response_model=list[OpsgenieSchedule])
def schedules() -> list[OpsgenieSchedule]:
    return service.get_schedules()


@router.get("/alerts", response_model=list[Alert])
def alerts(
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
) -> list[Alert]:
    return service.get_alerts(start=start, end=end)


@router.get("/timeline", response_model=OnCallTimelineResponse)
def timeline(
    schedule_id: str = Query(...),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
    schedule_identifier_type: str = Query(default="id"),
) -> OnCallTimelineResponse:
    return service.get_timeline(
        schedule_id=schedule_id,
        start=start,
        end=end,
        schedule_identifier_type=schedule_identifier_type,
    )


@router.post("/overrides", response_model=OpsgenieWriteResponse)
def create_override(payload: OpsgenieOverrideRequest) -> OpsgenieWriteResponse:
    return service.create_override(payload)


@router.get("/schedule-config", response_model=OpsgenieScheduleConfig)
def schedule_config(
    schedule_id: str = Query(...),
    schedule_identifier_type: str = Query(default="id"),
) -> OpsgenieScheduleConfig:
    return service.get_schedule_config(schedule_id=schedule_id, schedule_identifier_type=schedule_identifier_type)


@router.patch("/schedule-config", response_model=OpsgenieWriteResponse)
def update_schedule_config(
    schedule_id: str,
    payload: dict,
    schedule_identifier_type: str = Query(default="id"),
) -> OpsgenieWriteResponse:
    return service.update_schedule_config(
        schedule_id=schedule_id,
        payload=payload,
        schedule_identifier_type=schedule_identifier_type,
    )
