# SRE Operational Insights

SRE Operational Insights is a local-first operational dashboard for SRE teams. It centralizes Opsgenie on-call visibility, alert analytics, team task reporting, important operational links, and a lightweight to-do tracker in one web application.

The application is designed to run locally with Docker Compose and can be extended later for ECS, EKS, or another container platform.

## What The App Shows

- Current Opsgenie on-call engineers for the configured schedule.
- Opsgenie alerts for a selected time range.
- Alert analytics similar to Opsgenie Analytics, including priority, status, source, tag, hourly, daily, and day-of-week breakdowns.
- Team task summary from `backend/app/data/tasks.csv`.
- Important operational URLs stored in browser `localStorage`.
- To-do tracker stored in browser `localStorage`.
- Live IST and UTC clock in the top navigation bar.
- Dark and light glass-style UI with responsive mobile support.

## Architecture

```text
Browser React UI
  |
  | Axios
  v
FastAPI Backend
  |
  | Server-side API key only
  v
Opsgenie API

FastAPI Backend
  |
  v
CSV file: /app/data/tasks.csv

Browser
  |
  v
localStorage: theme, sidebar state, important URLs, to-do tasks, panel sizes
```

The Opsgenie API key is never exposed to the frontend. The React application only calls FastAPI endpoints under `/api`.

## Tech Stack

- Frontend: React, Vite, Material UI, Recharts, Axios
- Backend: FastAPI, Python 3.11, Requests, Pydantic Settings
- Deployment: Docker Compose
- Storage: CSV file for team task data, browser `localStorage` for personal UI data

## Quick Start

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend health: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

## Environment Configuration

Backend configuration lives in `backend/.env`.

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
GOOGLE_CHAT_WEBHOOK_URL=
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=
JIRA_DEFAULT_JQL=
JIRA_MAX_RESULTS=100
```

Use `https://api.opsgenie.com` for Opsgenie US and `https://api.eu.opsgenie.com` for Opsgenie EU.

If `DEFAULT_SCHEDULE_ID` contains a schedule name such as `AMP_schedule`, keep:

```env
OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=name
```

If it contains a UUID schedule ID, use:

```env
OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=id
```

## Opsgenie Integration

The backend calls Opsgenie for:

- Available schedules.
- Current on-call engineers.
- Alert list.
- Alert summary metrics.
- MTTA and MTTR calculations where timestamp fields are available.

Alert fetching is paginated. `OPSGENIE_ALERT_PAGE_LIMIT` controls page size, and `OPSGENIE_ALERT_MAX_RECORDS` controls the maximum number of records fetched for one selected range.

Example:

```env
OPSGENIE_ALERT_PAGE_LIMIT=100
OPSGENIE_ALERT_MAX_RECORDS=2000
```

If you see Opsgenie `429` rate-limit warnings, reduce `OPSGENIE_ALERT_MAX_RECORDS` or increase `OPSGENIE_CACHE_TTL_SECONDS`.

The backend caches alert results per selected time range for `OPSGENIE_CACHE_TTL_SECONDS`. This prevents duplicate frontend refreshes from repeatedly fetching the same Opsgenie pages.

If Opsgenie alert reads occasionally time out, increase `REQUEST_TIMEOUT_SECONDS` to `40` or `60`, keep `OPSGENIE_REQUEST_RETRIES=2`, and consider reducing `OPSGENIE_ALERT_MAX_RECORDS` for very large date ranges.

## Shift Handover

The app includes a dedicated Shift Handover page.

It lets the user select a shift and date, then fetches only open alerts for that shift window. The supported shifts are:

- Morning Shift: 7:30 AM to 4:30 PM
- Afternoon Shift: 3:00 PM to 12:00 AM
- Night Shift: 10:30 PM to 7:30 AM

The user can add handover notes and send the open-alert summary to Google Chat. When the user clicks send, the frontend calls FastAPI, and FastAPI sends the message to Google Chat with `GOOGLE_CHAT_WEBHOOK_URL`.

The Google Chat webhook is never exposed to the frontend.

## Jira Summary

The app includes a dedicated Jira Summary page for read-only Jira reporting. The frontend calls FastAPI, and FastAPI authenticates to Jira using the API token from `backend/.env`.

Required Jira settings:

```env
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=you@example.com
JIRA_API_TOKEN=
```

Optional Jira settings:

```env
JIRA_PROJECT_KEY=OPS
JIRA_DEFAULT_JQL=project = "OPS" ORDER BY updated DESC
JIRA_MAX_RESULTS=100
```

The Jira API token is never exposed to the frontend. Use a Jira API token/account with read-only project access.

## Date And Time Behavior

The global dashboard filter supports:

- Last 15 Min
- Last 30 Min
- Last 1 Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days
- Current Month
- Custom start date/time and end date/time

Quick filters auto-apply immediately.

Alert timestamps are displayed in IST in the UI. The top bar displays live IST and UTC clocks.

## Alert Analytics

The Opsgenie Alerts page includes:

- Number of alerts.
- P1 alert count.
- Open alert count.
- Closed alert count.
- Alerts by status donut.
- Alerts by priority donut.
- Alerts per day by status.
- Alerts per day by priority.
- Alerts by source.
- Alerts by tag.
- Alerts by hour in IST.
- Alerts by day of week.
- Closed versus total alerts.
- Alert trend.
- Latest-first alert details table.

Each chart panel has controls to resize height and switch between half-width and full-width. These preferences are saved in browser `localStorage`.

## Team Task Summary

Team task data comes from:

```text
backend/app/data/tasks.csv
```

CSV uploads replace the active task file inside Docker at:

```text
/app/data/tasks.csv
```

Required CSV columns:

```csv
Date,Client,Reportee,Alert Name,Summary,Resolution / Action Item,Tracker,Updates / Remark
```

The backend also supports older CSVs that use `Resolution` instead of `Resolution / Action Item`.

The Team Task Summary page includes:

- Total tasks.
- Unique clients.
- Unique reportees.
- Tasks missing resolution/action item.
- Tasks by client.
- Tasks by reportee.
- Tasks by date.
- Latest-date-first task table.
- Search by client, reportee, tracker, or alert name.
- Custom task date filter.

The previous Tasks by Tracker panel has been removed.

## Important URLs

Important URLs are stored in browser `localStorage`, not on the backend.

Each URL contains:

- Title
- URL
- Category
- Description

Supported actions:

- Add
- Edit
- Delete
- Open

Because this data is stored in the browser, it is local to the user and browser profile.

## To-Do Tracker

To-do tasks are stored in browser `localStorage`.

Each task contains:

- Task title
- Description
- Priority
- Status
- Owner
- Due date

Supported actions:

- Add task
- Edit task
- Delete task
- Mark complete
- Filter by status, priority, and owner

## UI And Responsiveness

The UI supports:

- Dark mode by default.
- Light mode toggle.
- Glass-style cards, sidebar, top bar, and panels.
- Collapsible desktop sidebar.
- Mobile drawer navigation.
- Responsive charts and tables.
- Browser-width scaling without top bar/sidebar overlap.

The sidebar collapse preference is stored in browser `localStorage`.

## API Endpoints

```http
GET /api/opsgenie/oncall?schedule_id=AMP_schedule
GET /api/opsgenie/schedules
GET /api/opsgenie/alerts?start=2026-06-01T00:00:00.000Z&end=2026-06-15T23:59:59.000Z
GET /api/dashboard/summary?start=...&end=...
GET /api/tasks
GET /api/tasks/analytics
POST /api/tasks/upload
POST /api/handover/send
GET /api/jira/summary?jql=project%20%3D%20OPS%20ORDER%20BY%20updated%20DESC
```

Swagger is available at:

```text
http://localhost:8000/docs
```

## Docker Services

Backend:

```text
http://localhost:8000
```

Frontend:

```text
http://localhost:5173
```

The frontend service uses a named Docker volume for `/app/node_modules` so the local bind mount does not hide installed dependencies.

## Common Commands

Start or rebuild:

```bash
docker compose up --build
```

Run in background:

```bash
docker compose up -d --build
```

Restart services:

```bash
docker compose restart backend frontend
```

View logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Stop:

```bash
docker compose down
```

## Troubleshooting

If on-call data does not show:

- Confirm `OPSGENIE_API_KEY` is set.
- Confirm the API key has configuration access.
- Confirm `DEFAULT_SCHEDULE_ID` is correct.
- Use `OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=name` for schedule names.
- Use `OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=id` for schedule UUIDs.

If only a small number of alerts show:

- Increase `OPSGENIE_ALERT_MAX_RECORDS`.
- Keep in mind that higher values can hit Opsgenie rate limits.

If Opsgenie returns `429`:

- Reduce `OPSGENIE_ALERT_MAX_RECORDS`.
- Increase `OPSGENIE_CACHE_TTL_SECONDS`.
- Avoid repeatedly refreshing very large date ranges.

If the frontend says `vite: not found` in Docker:

- Ensure `docker-compose.yml` includes the named volume:

```yaml
volumes:
  - ./frontend:/app
  - frontend_node_modules:/app/node_modules
```

Then rebuild:

```bash
docker compose up -d --build frontend
```

If the CSV upload fails:

- Verify the required columns are present.
- Ensure the file is a `.csv`.
- Ensure at least one data row exists.

## Security Notes

- Opsgenie API keys are backend-only.
- Google Chat webhooks are backend-only.
- Do not commit `backend/.env`.
- Browser `localStorage` data is local to the user and should not be treated as shared team state.

## Future AWS Deployment Notes

For the detailed AWS plan and starter deployment files, see:

- [AWS_DEPLOYMENT_ROADMAP.md](AWS_DEPLOYMENT_ROADMAP.md)
- [deploy/aws/backend-task-definition.json](deploy/aws/backend-task-definition.json)
- [deploy/aws/backend-service.example.json](deploy/aws/backend-service.example.json)
- [.github/workflows/deploy-aws.yml](.github/workflows/deploy-aws.yml)

Recommended AWS target:

- Frontend: S3 + CloudFront.
- Backend: ECS Fargate behind an Application Load Balancer.
- Secrets: AWS Secrets Manager or SSM Parameter Store.
- Logs and metrics: CloudWatch.
- Task CSV data: S3 initially, RDS PostgreSQL later.

For ECS or EKS:

- Put backend secrets in AWS Secrets Manager or SSM Parameter Store.
- Mount persistent storage for task CSVs or migrate task data to S3/RDS.
- Serve the React frontend from S3/CloudFront or a container.
- Restrict CORS to the deployed frontend domain.
- Add authentication before exposing externally.
