# SRE Operations Center

SRE Operations Center is a local-first dashboard for SRE teams. It focuses on Opsgenie live alerts, alert analytics, on-call management, and shift handover.

## Pages

- Overview: current on-call schedule at the top, alert KPIs, and high-level trend charts.
- Alerts: live Opsgenie alert table with search, filters, sorting, pagination, and Opsgenie links.
- Alerts Analytics: alert trends and breakdowns by status, priority, source, tags, hour, day, and close rate.
- On-call Management: schedules, timeline, rotations, overrides, and schedule configuration tools.
- Shift Handover: shift-based open alerts, notes, and Google Chat handover reporting.

## Architecture

```text
React + Vite frontend
  |
  | Axios
  v
FastAPI backend
  |
  | Backend-only secrets
  v
Opsgenie API / Google Chat webhook
```

Opsgenie API keys and Google Chat webhooks are never exposed to the frontend.

## Quick Start

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Backend Environment

```env
OPSGENIE_API_KEY=
OPSGENIE_BASE_URL=https://api.opsgenie.com
DEFAULT_SCHEDULE_ID=AMP_schedule
OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=name
CORS_ORIGINS=http://localhost:5173
REQUEST_TIMEOUT_SECONDS=20
DATA_DIR=/app/data
OPSGENIE_ALERT_PAGE_LIMIT=100
OPSGENIE_ALERT_MAX_RECORDS=2000
OPSGENIE_CACHE_TTL_SECONDS=60
OPSGENIE_REQUEST_RETRIES=2
OPSGENIE_VERIFY_SSL=true
OPSGENIE_CA_BUNDLE=
GOOGLE_CHAT_WEBHOOK_URL=
```

Use `https://api.opsgenie.com` for Opsgenie US and `https://api.eu.opsgenie.com` for Opsgenie EU.

If `DEFAULT_SCHEDULE_ID` is a schedule name, keep `OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=name`. If it is a UUID, use `OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=id`.

If Docker logs show `SSLCertVerificationError`, rebuild the backend image. If your network uses a private corporate root CA, place it under `backend/certs` and set `OPSGENIE_CA_BUNDLE=/app/certs/<file>.pem`.

## API Endpoints

```http
GET /api/opsgenie/oncall
GET /api/opsgenie/schedules
GET /api/opsgenie/alerts
GET /api/opsgenie/timeline
GET /api/opsgenie/schedule-config
POST /api/opsgenie/overrides
GET /api/dashboard/summary
POST /api/handover/send
```

## Validation

```bash
docker compose run --rm frontend npm run build
python3 - <<'PY'
import ast
from pathlib import Path
for path in Path("backend/app").rglob("*.py"):
    ast.parse(path.read_text(), filename=str(path))
print("Backend Python syntax OK")
PY
```
