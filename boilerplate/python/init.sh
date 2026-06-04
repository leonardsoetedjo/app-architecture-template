#!/usr/bin/env bash
# init.sh — Start dev environment for python-order-service
set -e

echo "=== Starting python-order-service dev environment ==="

# Navigate to project root regardless of where this is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Start infrastructure (Docker Compose)
if [ -f "docker-compose.yml" ]; then
    docker compose up -d postgres
elif [ -f "../docker-compose.yml" ]; then
    # Called from inside service directory
    docker compose -f ../docker-compose.yml -f ../docker-compose.override.yml up -d postgres 2>/dev/null || \
    docker compose -f ../docker-compose.yml up -d postgres
fi

# 2. Wait for database
if command -v pg_isready &> /dev/null; then
    until pg_isready -h localhost -p 5432 -U postgres 2>/dev/null; do
        echo "    Waiting for PostgreSQL..."
        sleep 1
    done
    echo "    ✅ PostgreSQL ready"
else
    echo "    ⚠️  pg_isready not available; assuming PostgreSQL is ready"
fi

# 3. Create virtual environment if missing
if [ ! -d "venv" ]; then
    echo "    Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate

# 4. Install dependencies
pip install -q -r requirements.txt 2>/dev/null || pip install -e . 2>/dev/null || echo "    ⚠️  No requirements.txt or setup.py found"

# 5. Run migrations (Alembic)
if [ -f "alembic.ini" ]; then
    alembic upgrade head
    echo "    ✅ Migrations applied"
fi

# 6. Start application
if [ "$1" == "--verify" ]; then
    echo "=== Verify mode — skipping server start, running smoke tests ==="
else
    uvicorn src.main:app --host 0.0.0.0 --port 8001 --reload &
    APP_PID=$!
    export UVICORN_PID=$APP_PID
    echo "    ✅ FastAPI started (PID: $APP_PID)"
fi

# 7. Wait for health
sleep 2
curl -sf http://localhost:8001/health || true

# 8. Smoke test — verify core functionality if server is running
if [ -z "$APP_PID" ] || kill -0 $APP_PID 2>/dev/null; then
    echo "=== Smoke test ==="
    # Replace with project-specific smoke test URI
    curl -sf http://localhost:8001/api/v1/orders/health 2>/dev/null || \
    curl -sf http://localhost:8001/health 2>/dev/null || \
    echo "    ⚠️  No /health endpoint found; override $1 with your own endpoint"
fi

echo "=== Dev environment ready ==="
if [ -n "$APP_PID" ]; then
    echo "PID: $APP_PID"
    echo "Health: http://localhost:8001/health"
    echo "To stop: kill $APP_PID"
fi

# Keep running if foreground
trap "echo 'Caught signal, shutting down...'; [ -n \"\$APP_PID\" ] && kill \$APP_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait if server is running
if [ -n "$APP_PID" ]; then
    wait $APP_PID
fi
