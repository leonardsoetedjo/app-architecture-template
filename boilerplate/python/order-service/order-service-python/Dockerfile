# Build stage
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends gcc libpq-dev &amp;&amp; rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ──────────────────────────────────────────────
# Runtime stage
# ──────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Runtime libpq for psycopg2-binary
RUN apt-get update &amp;&amp; apt-get install -y --no-install-recommends libpq5 &amp;&amp; rm -rf /var/lib/apt/lists/*

# Copy installed dependencies from builder
COPY --from=builder /root/.local /app/.local

# Copy application
COPY src/ ./src/
COPY alembic/ ./alembic/
COPY alembic.ini ./
COPY requirements.txt pyproject.toml Makefile ./

# Non-root user
RUN groupadd --system appgroup &amp;&amp; useradd --system --gid appgroup appuser
USER appuser

ENV PATH=/app/.local/bin:$PATH
ENV PYTHONPATH=/app/src
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c \
    "import urllib.request; urllib.request.urlopen('http://localhost:8080/actuator/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
