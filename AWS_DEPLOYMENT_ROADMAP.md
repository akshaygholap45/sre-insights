# AWS Deployment Roadmap

This guide describes a practical AWS path for hosting SRE Operational Insights.

Recommended target:

```text
React frontend -> S3 -> CloudFront
FastAPI backend -> ALB -> ECS Fargate
Secrets -> AWS Secrets Manager or SSM Parameter Store
Logs/metrics -> CloudWatch
Task CSV data -> S3 now, RDS later
```

## Deployment Decision

Use this path first:

- Frontend: static React build in S3, served through CloudFront.
- Backend: Docker container in ECS Fargate behind an Application Load Balancer.
- Secrets: Secrets Manager for `OPSGENIE_API_KEY`.
- Config: ECS task definition environment variables.
- CSV tasks: keep local container file only for initial proof of concept, then move to S3.

Use EFS only if you need a quick persistent file mount with minimal code changes. Use RDS PostgreSQL once task tracking becomes a multi-user system of record.

## AWS Resources To Create

Create these once per environment:

- VPC with two public and two private subnets.
- NAT Gateway or another private subnet egress path so ECS can call Opsgenie.
- ECR repository: `sre-insights-backend`.
- ECS cluster: `sre-operational-insights`.
- CloudWatch log group: `/ecs/sre-operational-insights/backend`.
- ALB with HTTPS listener.
- Target group pointing to backend container port `8000`.
- ECS Fargate service for backend.
- S3 bucket for frontend assets.
- CloudFront distribution in front of the S3 frontend.
- ACM certificates for frontend and backend domains.
- Secrets Manager secret for Opsgenie API key.
- Secrets Manager secret for Google Chat webhook URL.
- GitHub OIDC IAM role for deployments.

## Suggested Domains

```text
https://insights.example.com      -> CloudFront frontend
https://api.insights.example.com  -> ALB backend
```

Frontend build variable:

```env
VITE_API_BASE_URL=https://api.insights.example.com/api
```

Backend CORS:

```env
CORS_ORIGINS=https://insights.example.com
```

## Backend Container

Production Dockerfile:

```text
backend/Dockerfile.prod
```

Build locally:

```bash
docker build -f backend/Dockerfile.prod -t sre-insights-backend:prod backend
```

Run locally with an env file:

```bash
docker run --env-file backend/.env -p 8000:8000 sre-insights-backend:prod
```

## Push Backend Image To ECR

Replace placeholders first:

```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=ap-south-1
ECR_REPOSITORY=sre-insights-backend
```

Commands:

```bash
aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
docker build -f backend/Dockerfile.prod -t "$ECR_REPOSITORY:latest" backend
docker tag "$ECR_REPOSITORY:latest" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
```

## ECS Task Definition

Starter file:

```text
deploy/aws/backend-task-definition.json
```

Before registering it, replace:

- `<AWS_ACCOUNT_ID>`
- `<AWS_REGION>`
- `<FRONTEND_DOMAIN>`
- IAM role ARNs
- ECR image URI
- Secrets Manager ARN

Register:

```bash
aws ecs register-task-definition \
  --cli-input-json file://deploy/aws/backend-task-definition.json \
  --region "$AWS_REGION"
```

## ECS Service

Starter file:

```text
deploy/aws/backend-service.example.json
```

Before use, replace:

- subnet IDs
- security group IDs
- target group ARN
- cluster name
- service name

Create service:

```bash
aws ecs create-service \
  --cli-input-json file://deploy/aws/backend-service.example.json \
  --region "$AWS_REGION"
```

For updates, prefer CI/CD or:

```bash
aws ecs update-service \
  --cluster sre-operational-insights \
  --service sre-operational-insights-backend \
  --force-new-deployment \
  --region "$AWS_REGION"
```

## Frontend Deployment

Build:

```bash
cd frontend
VITE_API_BASE_URL=https://api.insights.example.com/api npm run build
```

Upload:

```bash
aws s3 sync frontend/dist s3://sre-insights-frontend-prod --delete
```

Invalidate CloudFront:

```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

## GitHub Actions

Workflow:

```text
.github/workflows/deploy-aws.yml
```

Required GitHub secret:

```text
AWS_DEPLOY_ROLE_ARN
```

Recommended GitHub environment variables or workflow `env` changes:

- `AWS_REGION`
- `ECR_REPOSITORY`
- `ECS_CLUSTER`
- `ECS_SERVICE`
- `FRONTEND_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_BASE_URL`

The workflow uses GitHub OIDC. Create an IAM role trusted by GitHub and grant it narrowly scoped permissions for:

- ECR image push.
- ECS task definition registration.
- ECS service deployment.
- S3 sync to the frontend bucket.
- CloudFront invalidation.

## Secrets

Create the Opsgenie secret:

```bash
aws secretsmanager create-secret \
  --name sre-insights/opsgenie-api-key \
  --secret-string "YOUR_OPSGENIE_API_KEY" \
  --region "$AWS_REGION"
```

Create the Google Chat webhook secret:

```bash
aws secretsmanager create-secret \
  --name sre-insights/google-chat-webhook-url \
  --secret-string "YOUR_GOOGLE_CHAT_WEBHOOK_URL" \
  --region "$AWS_REGION"
```

If the secret changes, force a new ECS deployment so new tasks receive the updated value.

## Security Groups

Recommended:

- ALB security group:
  - inbound `443` from corporate network/VPN or public internet
  - outbound to backend ECS security group on `8000`
- Backend ECS security group:
  - inbound `8000` only from ALB security group
  - outbound `443` to Opsgenie and AWS services

Do not assign public IPs to backend ECS tasks if you have NAT/private egress.

## Observability

Monitor:

- ECS service desired versus running task count.
- ECS task CPU and memory.
- ALB target health.
- ALB 4xx/5xx.
- Backend CloudWatch logs.
- Opsgenie `429` warnings.
- Backend latency during large alert ranges.

Suggested alarms:

- ECS running task count below desired count.
- ALB target unhealthy.
- ALB 5xx above threshold.
- Backend log metric filter for `429`.
- Backend log metric filter for `Opsgenie request failed`.

## Data Storage Migration

Current local file:

```text
/app/data/tasks.csv
```

AWS options:

1. EFS mount at `/app/data`
   - Minimal code change.
   - Good only for MVP.

2. S3 object storage
   - Store `tasks.csv` in S3.
   - Backend downloads/uploads it.
   - Good short-term production option.

3. RDS PostgreSQL
   - Best long-term option.
   - Enables audit history, multi-user editing, and task-level APIs.

Recommended sequence:

```text
MVP: ECS + S3 frontend + Secrets Manager
Stabilize: move tasks.csv to S3
Production: move tasks to RDS PostgreSQL
```

## Cutover Checklist

- Backend health endpoint returns `200`.
- ALB target group is healthy.
- CloudFront frontend loads.
- Browser can call `/api/opsgenie/oncall`.
- Browser can call `/api/opsgenie/alerts`.
- CORS allows only frontend domain.
- `OPSGENIE_API_KEY` is not present in frontend assets.
- CloudWatch logs are visible.
- Alert range defaults are acceptable for Opsgenie rate limits.
- Access is restricted with VPN, SSO, Cognito, or ALB OIDC before broad rollout.
