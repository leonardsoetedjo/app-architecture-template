# Build stage
FROM python:3.12-slim AS builder

WORKDIR /build

# Install Poetry
RUN pip install --no-cache-dir poetry

# Copy poetry files first for better caching
COPY pyproject.toml ./

# Install dependencies (creates virtualenv)
RUN poetry install --only=main --no-root --no-interaction --no-ansi --no-directory

# ──────────────────────────────────────────────
# Runtime stage
# ──────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /root/.cache/pypoetry/virtualenvs /root/.cache/pypoetry/virtualenvs

# Copy application code
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini pyproject.toml ./

# Find the virtualenv and add it to PATH
ENV VIRTUAL_ENV=/root/.cache/pypoetry/virtualenvs/*
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Non-root user
RUN groupadd --system appgroup && useradd --system --gid appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

ENV PYTHONPATH=/app/src
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:8080/health || exit 1

# Run migrations before starting the app
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8080"]
