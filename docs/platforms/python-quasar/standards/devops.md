# DevOps Standards (Python/Quasar)

## 1. Containerization
All Python services must be containerized using a multi-stage Dockerfile to minimize image size and attack surface.

### Dockerfile Pattern
```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Final stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 2. CI/CD Pipeline
We use GitHub Actions for the CI/CD pipeline.

### Pipeline Stages:
1. **Linting & Type Checking**: Run `ruff` and `mypy` to enforce coding standards.
2. **Testing**: Run `pytest` with coverage reports.
3. **Build**: Build and push the Docker image to the registry.
4. **Deploy**: Update the deployment manifest (Kubernetes/Docker Compose).

## 3. Deployment (Docker Compose & Traefik)
Follow the agnostic guidelines in `docs/agnostic/guidelines/deployment.md` for routing and network configuration.

- **Domain**: `api.python-platform.localhost`
- **Port**: `8000`

## 4. Monitoring & Logging
- **Logging**: Use `loguru` to emit NDJSON logs to stdout.
- **Metrics**: Expose `/metrics` for Prometheus using `prometheus-fastapi-instrumentator`.
- **Health Checks**: Implement `/health` and `/info` endpoints for liveness/readiness probes.
