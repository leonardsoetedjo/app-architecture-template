---
name: "DevOps Standards"
type: "Guideline"
version: "1.0"
status: "Active"
owner: "@devops-team"
---

# DevOps Standards

## 1. Git Workflow

### 1.1 Branching

- `main` is production.
- Branch from `main` using prefixes:
  - `feature/` — new functionality
  - `bugfix/` — fixes
  - `hotfix/` — critical production fixes
  - `refactor/` — non-functional code changes

### 1.2 Commits

- Imperative mood.
- Reference ticket IDs if applicable.

```
Add order cancellation use case

Implements the domain logic and persistence adapter for
canceling an order within 24 hours of placement.

Closes #42
```

### 1.3 Pull Requests

- Require review before merge.
- CI must pass (build, test, lint).
- Prefer squash merge for feature branches. Keep `main` history linear.

## 2. Deployment & CI/CD

### 2.1 Containerization

- Use Docker for both backend and frontend.
- Multi-stage builds to minimize image size.
- Base images:
  - Java: `registry.access.redhat.com/ubi9/openjdk-21-runtime:latest`
- Run containers as **non-root user**.
- Pin image tags. Never use `latest`.
- Use `.dockerignore`.

### 2.2 Docker Compose

- Use for local development and integration testing.
- Define services (app, DB, cache, broker) in `docker-compose.yml`.

### 2.3 CI/CD Pipeline

1. **Build**: Compile backend, build frontend bundle.
2. **Lint**: Checkstyle/Spotless (Java), ESLint/Prettier (TypeScript).
   - **Guardrails**: Use ArchUnit for architecture enforcement (e.g., Domain layer isolation). Configure ESLint to error on `any` and `useEffect` without dependency arrays.
3. **Test**: Unit tests, integration tests, E2E tests.
4. **Security scan**: SAST (SonarQube, Snyk), dependency vulnerability scan, container image scan (Trivy).
5. **Automated Audits**:
   - **Cognitive Complexity**: Fail build if any method score > 15 (SonarQube/Checkstyle).
   - **Dependency Drift**: Monthly automated report of unused dependencies.
   - **API Breaking Changes**: OpenAPI Diff check against `main` to flag breaking changes.
6. **Database migration**: Flyway/Liquibase migrate in a pre-deploy step.
6. **Deploy**: Deploy to staging first, then production with approval gates.

### 2.4 Environments

| Env | Purpose | Deploy From |
|-----|---------|-------------|
| Local | Developer machines | Docker Compose |
| Dev | Shared development | Auto-deploy `main` |
| Staging | Pre-production | Release branches; full E2E |
| Production | Live | Tagged releases |

### 2.5 Deployment Patterns

- **Blue-green / canary**: Zero-downtime deployments. Route traffic gradually.
- **Rollback**: Keep previous release artifacts. Document and test rollback in staging.
- **Migrations**: Run **before** app deployment. Never run destructive migrations without backup.
- **Secrets**: Inject via CI environment variables or secrets manager. Never commit CI secrets.

### 2.6 Infrastructure as Code

- Use Terraform, Pulumi, or CloudFormation.
- Version control infrastructure code.

## 3. Kubernetes (When Used)

- Rolling updates with readiness/liveness probes.
- Resource limits: CPU and memory requests/limits for every service.
- HPA (Horizontal Pod Autoscaler) for stateless services.
- Central message broker for backpressure handling.

## 4. Secrets Management

- Never commit secrets, API keys, passwords, or private keys to version control.
- Use `.gitignore` for local config files.
- Local development: `.env` files with `.env.example` committed.
- Backend: Load via `application.yml` or Docker Compose.
- Frontend: Use build-time env vars (`import.meta.env.VITE_*` with Vite). Never expose backend secrets.
- Rotation: Implement for database credentials, API keys, JWT signing keys. Document procedures.
- Encryption: At rest (database) and in transit (TLS 1.2+).

## 5. Environment Configuration

- Spring profiles: `application-dev.yml`, `application-prod.yml`.
- Keep `application.yml` for defaults.
- Externalize sensitive values via environment variables or secrets manager (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault).

## 6. Alert Thresholds

| Condition | Threshold |
|-----------|-----------|
| Error rate | > 1% for 5 min |
| P95 latency | > 2s for 5 min |
| CPU/memory | > 80% |
| DLQ messages | > 0 |
