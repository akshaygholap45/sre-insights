import csv
import logging
import shutil
from collections import Counter
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import HTTPException, UploadFile

from app.config import settings
from app.models.schemas import TaskAnalytics, TaskRecord, UploadResult

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = ["Date", "Client", "Reportee", "Alert Name", "Summary", "Tracker"]
RESOLUTION_COLUMNS = ["Resolution / Action Item", "Resolution"]
UPDATES_COLUMN = "Updates / Remark"
STATUS_COLUMN = "Status"


class CsvService:
    def __init__(self, csv_path: Path | None = None) -> None:
        self.csv_path = csv_path or settings.tasks_csv_path

    def upload(self, file: UploadFile) -> UploadResult:
        if not file.filename or not file.filename.lower().endswith(".csv"):
            raise HTTPException(status_code=400, detail="Please upload a CSV file")

        settings.data_dir.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile(delete=False, suffix=".csv") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = Path(temp_file.name)

        try:
            rows = self._read_csv(temp_path)
            self._validate_columns(rows)
            shutil.move(str(temp_path), self.csv_path)
            return UploadResult(message="CSV uploaded successfully", rows=len(rows))
        finally:
            if temp_path.exists():
                temp_path.unlink()

    def records(self) -> list[TaskRecord]:
        rows = self._read_csv(self.csv_path)
        if not rows:
            return []
        self._validate_columns(rows)
        return [TaskRecord.model_validate(self._normalize_row(row)) for row in rows]

    def analytics(self) -> TaskAnalytics:
        records = [record.model_dump(by_alias=True) for record in self.records()]
        missing_resolution = [record for record in records if not record.get("Resolution / Action Item", "").strip()]
        return TaskAnalytics(
            total_tasks=len(records),
            unique_clients=len({record["Client"] for record in records if record["Client"]}),
            unique_reportees=len({record["Reportee"] for record in records if record["Reportee"]}),
            missing_resolution_tasks=len(missing_resolution),
            tasks_by_client=self._counter(records, "Client"),
            tasks_by_reportee=self._counter(records, "Reportee"),
            tasks_by_tracker=self._counter(records, "Tracker"),
            tasks_by_date=self._counter(records, "Date"),
            top_alert_names=self._counter(records, "Alert Name", limit=8),
            missing_resolution=missing_resolution[:25],
            recent_tasks=records[-10:][::-1],
        )

    def _read_csv(self, path: Path) -> list[dict[str, str]]:
        if not path.exists():
            return []
        try:
            with path.open(newline="", encoding="utf-8-sig") as handle:
                return list(csv.DictReader(handle))
        except csv.Error as exc:
            logger.exception("Failed to parse CSV")
            raise HTTPException(status_code=400, detail="Unable to parse CSV file") from exc

    @staticmethod
    def _validate_columns(rows: list[dict[str, str]]) -> None:
        if not rows:
            raise HTTPException(status_code=400, detail="CSV must contain at least one data row")
        available = set(rows[0].keys())
        missing = [column for column in REQUIRED_COLUMNS if column not in available]
        has_resolution = any(column in available for column in RESOLUTION_COLUMNS)
        if not has_resolution:
            missing.append("Resolution / Action Item")
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required CSV columns: {', '.join(missing)}",
            )

    @staticmethod
    def _normalize_row(row: dict[str, str]) -> dict[str, str]:
        normalized = dict(row)
        normalized["Resolution / Action Item"] = next(
            (row.get(column, "") for column in RESOLUTION_COLUMNS if row.get(column, "") is not None),
            "",
        )
        normalized[STATUS_COLUMN] = row.get(STATUS_COLUMN, "") or "Open"
        normalized[UPDATES_COLUMN] = row.get(UPDATES_COLUMN, "") or ""
        return normalized

    @staticmethod
    def _counter(records: list[dict[str, str]], field: str, limit: int | None = None) -> list[dict[str, int | str]]:
        counts = Counter(record.get(field, "Unknown") or "Unknown" for record in records)
        items = counts.most_common(limit)
        if field == "Date":
            items = sorted(counts.items(), key=lambda item: item[0])
        return [{"name": name, "value": value} for name, value in items]
