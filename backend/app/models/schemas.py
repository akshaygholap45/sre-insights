from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, HttpUrl


class Alert(BaseModel):
    alert_id: str
    message: str
    alias: str | None = None
    priority: str = "P5"
    status: str = "open"
    source: str = "unknown"
    tags: list[str] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None
    acknowledged_at: datetime | None = None
    closed_at: datetime | None = None
    responders: list[str] = Field(default_factory=list)
    owner: str | None = None
    notes: str | None = None
    alert_url: str | None = None


class AlertNotesRequest(BaseModel):
    alert_ids: list[str] = Field(default_factory=list, max_length=50)


class AlertNotesResponse(BaseModel):
    notes: dict[str, str] = Field(default_factory=dict)


class DashboardSummary(BaseModel):
    total_alerts: int = 0
    open_alerts: int = 0
    acknowledged_alerts: int = 0
    closed_alerts: int = 0
    p1_count: int = 0
    p2_count: int = 0
    p3_count: int = 0
    p4_count: int = 0
    p5_count: int = 0
    mtta: float = 0
    mttr: float = 0


class OnCallEngineer(BaseModel):
    name: str = "Not configured"
    email: str | None = None
    schedule_name: str = "No schedule selected"
    escalation_level: str = "N/A"
    timezone: str | None = None


class OnCallResponse(BaseModel):
    schedule_name: str = "No schedule selected"
    escalation_level: str = "N/A"
    timezone: str | None = None
    engineers: list[OnCallEngineer] = Field(default_factory=list)


class OpsgenieSchedule(BaseModel):
    id: str
    name: str
    timezone: str | None = None
    enabled: bool | None = None


class OnCallTimelineEntry(BaseModel):
    name: str
    email: str | None = None
    start: datetime | None = None
    end: datetime | None = None
    rotation: str | None = None
    escalation_level: str | None = None
    source: str = "timeline"


class OnCallTimelineResponse(BaseModel):
    schedule_id: str
    schedule_name: str | None = None
    timezone: str | None = None
    start: datetime | None = None
    end: datetime | None = None
    entries: list[OnCallTimelineEntry] = Field(default_factory=list)
    raw: dict[str, Any] = Field(default_factory=dict)


class OpsgenieOverrideRequest(BaseModel):
    schedule_id: str
    user: str
    start: datetime
    end: datetime
    alias: str | None = None
    rotation_id: str | None = None
    schedule_identifier_type: str = "id"


class OpsgenieWriteResponse(BaseModel):
    success: bool
    message: str
    raw: dict[str, Any] = Field(default_factory=dict)


class OpsgenieScheduleConfig(BaseModel):
    schedule: dict[str, Any] = Field(default_factory=dict)
    rotations: list[dict[str, Any]] = Field(default_factory=list)
    escalations: list[dict[str, Any]] = Field(default_factory=list)
    routing_rules: list[dict[str, Any]] = Field(default_factory=list)


class ShiftHandoverRequest(BaseModel):
    notes: str = ""
    shift_type: str | None = None
    shift_date: str | None = None
    shift_start: str | None = None
    shift_end: str | None = None
    alerts: list[Alert] = Field(default_factory=list)


class ShiftHandoverResponse(BaseModel):
    message: str
    sent: bool
    alert_count: int


class TaskRecord(BaseModel):
    date: str = Field(alias="Date")
    client: str = Field(alias="Client")
    reportee: str = Field(alias="Reportee")
    status: str = Field(default="Open", alias="Status")
    alert_name: str = Field(alias="Alert Name")
    summary: str = Field(alias="Summary")
    resolution_action_item: str = Field(default="", alias="Resolution / Action Item")
    tracker: str = Field(alias="Tracker")
    updates_remark: str = Field(default="", alias="Updates / Remark")

    model_config = {"populate_by_name": True}


class TaskAnalytics(BaseModel):
    total_tasks: int = 0
    unique_clients: int = 0
    unique_reportees: int = 0
    missing_resolution_tasks: int = 0
    tasks_by_client: list[dict[str, Any]] = Field(default_factory=list)
    tasks_by_reportee: list[dict[str, Any]] = Field(default_factory=list)
    tasks_by_tracker: list[dict[str, Any]] = Field(default_factory=list)
    tasks_by_date: list[dict[str, Any]] = Field(default_factory=list)
    top_alert_names: list[dict[str, Any]] = Field(default_factory=list)
    missing_resolution: list[dict[str, Any]] = Field(default_factory=list)
    recent_tasks: list[dict[str, Any]] = Field(default_factory=list)


class UploadResult(BaseModel):
    message: str
    rows: int


class HealthResponse(BaseModel):
    application: str
    status: str
    warnings: list[str] = Field(default_factory=list)


class UrlCard(BaseModel):
    title: str
    url: HttpUrl
    category: str
    description: str | None = None

