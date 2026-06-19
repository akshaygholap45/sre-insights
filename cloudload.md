**Recommended AWS Target**
Use **ECS Fargate** for the backend, **S3 + CloudFront** for the React frontend, **Secrets Manager/SSM Parameter Store** for secrets, and **S3 or RDS** for task data. ECS is a fully managed container orchestration service, and Fargate avoids server management/capacity planning, which fits this app well. Source: AWS ECS docs describe ECS/Fargate as managed container orchestration/serverless container compute.

**Phase 1: Production-Ready App Changes**
1. Split frontend and backend deployment.
2. Build frontend as static assets using `npm run build`.
3. Serve frontend from S3 + CloudFront.
4. Run backend FastAPI container on ECS Fargate.
5. Replace local CSV persistence with one of:
   - Short-term: EFS mounted into ECS if you want minimal code changes.
   - Better: S3-backed CSV storage.
   - Best: RDS/PostgreSQL for task records and future multi-user workflows.

AWS supports EFS volumes with ECS/Fargate, but I’d treat that as a bridge, not the long-term design.

**Phase 2: AWS Infrastructure**
Create:

- VPC with public/private subnets across 2 AZs.
- ECS Cluster.
- ECR repositories:
  - `sre-insights-backend`
  - optionally `sre-insights-frontend` if frontend is also containerized.
- Application Load Balancer for backend HTTPS traffic.
- ECS Fargate Service for FastAPI.
- CloudFront distribution for frontend.
- S3 bucket for frontend static hosting.
- Secrets Manager or SSM Parameter Store for:
  - `OPSGENIE_API_KEY`
  - `DEFAULT_SCHEDULE_ID`
  - Opsgenie region/base URL
- CloudWatch Logs for ECS containers.

AWS recommends injecting sensitive data into ECS containers from Secrets Manager or SSM Parameter Store instead of hardcoding env files.

**Phase 3: Backend Deployment**
Backend target:

```text
Client Browser
  -> CloudFront frontend
  -> API calls to api.your-domain.com
  -> ALB
  -> ECS Fargate FastAPI backend
  -> Opsgenie API
```

Use ALB because ECS services on Fargate support Application Load Balancers for HTTP/HTTPS routing.

Backend environment should move from `.env` to ECS task definition config:

```env
OPSGENIE_BASE_URL=https://api.opsgenie.com
DEFAULT_SCHEDULE_ID=AMP_schedule
OPSGENIE_SCHEDULE_IDENTIFIER_TYPE=name
OPSGENIE_ALERT_PAGE_LIMIT=100
OPSGENIE_ALERT_MAX_RECORDS=2000
OPSGENIE_CACHE_TTL_SECONDS=60
```

Secret:

```env
OPSGENIE_API_KEY
```

**Phase 4: Frontend Deployment**
Recommended:

```text
React build -> S3 bucket -> CloudFront -> users
```

S3 is a scalable object store suitable for static web assets. CloudFront is the CDN layer in front of it.

Set frontend API URL at build time:

```env
VITE_API_BASE_URL=https://api.your-domain.com/api
```

**Phase 5: Data Storage Decision**
Current app uses:

```text
backend/app/data/tasks.csv
```

Roadmap options:

- **Option A: EFS**
  - Fastest migration.
  - Keeps file path behavior.
  - Good for MVP.
  - Still file-based and not ideal for multi-user editing.

- **Option B: S3**
  - Store uploaded CSV in S3.
  - Backend reads/writes `tasks.csv` from S3.
  - Good low-cost option.

- **Option C: RDS PostgreSQL**
  - Best long-term.
  - Enables task history, audit logs, multiple users, row-level operations, and proper filtering.

My recommendation: use **S3 for the next AWS version**, then move to **RDS** once task tracking becomes more than CSV reporting.

**Phase 6: Security**
Add:

- HTTPS via ACM certificates.
- API behind ALB.
- CORS restricted to CloudFront domain.
- Secrets in Secrets Manager/SSM.
- ECS task role with least privilege.
- Security groups:
  - ALB public on `443`.
  - Backend ECS only reachable from ALB.
  - No public backend task IPs.
- Optional authentication:
  - AWS Cognito
  - Google Workspace SSO
  - ALB OIDC authentication

**Phase 7: Monitoring**
Use CloudWatch for:

- Backend container logs.
- ECS service health.
- ALB 4xx/5xx.
- API latency.
- Opsgenie rate-limit warnings.
- ECS CPU/memory.

CloudWatch is AWS’s monitoring and observability service for metrics/logs/alarms.

**Practical Milestone Plan**
1. **MVP AWS**
   - Backend on ECS Fargate.
   - Frontend on S3 + CloudFront.
   - Secrets in SSM/Secrets Manager.
   - CSV still bundled or mounted via EFS.

2. **Stable Internal Release**
   - Move task CSV to S3.
   - Add HTTPS custom domain.
   - Add CloudWatch alarms.
   - Restrict CORS.
   - Add basic auth/SSO.

3. **Production Release**
   - Move task records to RDS.
   - Add CI/CD with GitHub Actions or CodePipeline.
   - Add WAF if internet-facing.
   - Add backup/versioning for task data.
   - Add structured audit logging.

**Next step I recommend:** I can create an `AWS_DEPLOYMENT_ROADMAP.md` plus starter ECS/Fargate task definitions, Docker production files, and a GitHub Actions pipeline for pushing the backend image to ECR and deploying to ECS.