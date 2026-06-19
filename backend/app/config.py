import logging
import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    app_name: str = "SRE Operational Insights"
    opsgenie_api_key: str | None = Field(default=None, alias="OPSGENIE_API_KEY")
    opsgenie_base_url: str = Field(default="https://api.opsgenie.com", alias="OPSGENIE_BASE_URL")
    default_schedule_id: str | None = Field(default=None, alias="DEFAULT_SCHEDULE_ID")
    opsgenie_schedule_identifier_type: str = Field(default="name", alias="OPSGENIE_SCHEDULE_IDENTIFIER_TYPE")
    cors_origins: str = Field(default="http://localhost:5173", alias="CORS_ORIGINS")
    request_timeout_seconds: int = Field(default=20, alias="REQUEST_TIMEOUT_SECONDS")
    data_dir: Path = Field(default=Path("/app/data"), alias="DATA_DIR")
    opsgenie_alert_page_limit: int = Field(default=100, alias="OPSGENIE_ALERT_PAGE_LIMIT")
    opsgenie_alert_max_records: int = Field(default=2000, alias="OPSGENIE_ALERT_MAX_RECORDS")
    opsgenie_cache_ttl_seconds: int = Field(default=60, alias="OPSGENIE_CACHE_TTL_SECONDS")
    opsgenie_request_retries: int = Field(default=2, alias="OPSGENIE_REQUEST_RETRIES")
    google_chat_webhook_url: str | None = Field(default=None, alias="GOOGLE_CHAT_WEBHOOK_URL")
    jira_base_url: str | None = Field(default=None, alias="JIRA_BASE_URL")
    jira_email: str | None = Field(default=None, alias="JIRA_EMAIL")
    jira_api_token: str | None = Field(default=None, alias="JIRA_API_TOKEN")
    jira_project_key: str | None = Field(default=None, alias="JIRA_PROJECT_KEY")
    jira_default_jql: str | None = Field(default=None, alias="JIRA_DEFAULT_JQL")
    jira_max_results: int = Field(default=100, alias="JIRA_MAX_RESULTS")

    model_config = SettingsConfigDict(env_file=".env", populate_by_name=True, extra="ignore")

    @property
    def tasks_csv_path(self) -> Path:
        return self.data_dir / "tasks.csv"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_runtime(self) -> list[str]:
        warnings: list[str] = []
        if self.opsgenie_base_url not in {"https://api.opsgenie.com", "https://api.eu.opsgenie.com"}:
            warnings.append("OPSGENIE_BASE_URL should be https://api.opsgenie.com or https://api.eu.opsgenie.com")
        if not self.opsgenie_api_key:
            warnings.append("OPSGENIE_API_KEY is not set; Opsgenie endpoints will return empty fallback data")
        if self.opsgenie_schedule_identifier_type not in {"id", "name"}:
            warnings.append("OPSGENIE_SCHEDULE_IDENTIFIER_TYPE should be id or name")
        if not self.google_chat_webhook_url:
            warnings.append("GOOGLE_CHAT_WEBHOOK_URL is not set; shift handover send will be disabled")
        if not all([self.jira_base_url, self.jira_email, self.jira_api_token]):
            warnings.append("Jira integration is not fully configured; Jira Summary will show an empty state")
        return warnings


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
