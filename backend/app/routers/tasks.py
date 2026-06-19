from fastapi import APIRouter, UploadFile

from app.models.schemas import TaskAnalytics, TaskRecord, UploadResult
from app.services.csv_service import CsvService

router = APIRouter()
service = CsvService()


@router.post("/upload", response_model=UploadResult)
def upload_tasks_csv(file: UploadFile) -> UploadResult:
    return service.upload(file)


@router.get("", response_model=list[TaskRecord])
def tasks() -> list[TaskRecord]:
    return service.records()


@router.get("/analytics", response_model=TaskAnalytics)
def analytics() -> TaskAnalytics:
    return service.analytics()
