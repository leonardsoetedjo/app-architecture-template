# Template: Init Script (`init.sh`)

> **Purpose**: Starter template for the `init.sh` artifact used by the Agent Session Harness.
> **When to use**: The initializer agent creates this file at the start of every multi-session task.
> **Where it lives**: Repository root, tracked in git.
> **See also**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`

---

## Requirements

An `init.sh` script must satisfy these invariants:

1. **One-command startup**: `./init.sh` starts the dev environment with no further prompts.
2. **Fail-fast**: If anything fails, the script exits with non-zero status and clear error message.
3. **Smoke test included**: After startup, the script verifies the application is actually working.
4. **PID tracking**: Prints the application PID so the agent can shut it down.
5. **Re-runnable**: Running `./init.sh` twice should not fail (idempotent where possible).
6. **Health check**: Verifies the most recently completed feature still works.

---

## Templates by Stack

### Java (Spring Boot)

```bash
#!/usr/bin/env bash
# init.sh — Start dev environment for <PROJECT_NAME>
set -euo pipefail

PROJECT_NAME="<PROJECT_NAME>"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.standalone.yml"
HEALTH_URL="http://localhost:8080/actuator/health"
SMOKE_TEST_URL="http://localhost:8080/api/v1/orders"

# Parse arguments
VERIFY_ONLY=false
if [ "${1:-}" = "--verify" ]; then
    VERIFY_ONLY=true
fi

if [ "$VERIFY_ONLY" = false ]; then
    echo "=== Starting <PROJECT_NAME> dev environment ==="

    # 1. Start infrastructure
    docker compose $COMPOSE_FILES up -d postgres

    # 2. Wait for database
    echo "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if pg_isready -h localhost -p 5432 -q; then
            break
        fi
        sleep 1
    done
    pg_isready -h localhost -p 5432 || {
        echo "ERROR: PostgreSQL failed to start"
        exit 1
    }

    # 3. Run migrations
    ./mvnw flyway:migrate -pl <SERVICE_MODULE> -q

    # 4. Start application
    echo "Starting application..."
    ./mvnw spring-boot:run -pl <SERVICE_MODULE> -q &
    APP_PID=$!

    # 5. Wait for health
    echo "Waiting for application..."
    for i in {1..60}; do
        if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# 6. Health check
echo "=== Health check ==="
curl -sf "$HEALTH_URL" || {
    echo "ERROR: Application health check failed"
    [ "$VERIFY_ONLY" = false ] && kill $APP_PID 2>/dev/null || true
    exit 1
}

# 7. Smoke test — verify most recent feature
echo "=== Smoke test ==="
# Replace with project-specific smoke test
curl -sf "$SMOKE_TEST_URL" >/dev/null 2>&1 && echo "Smoke test: PASS" || echo "Smoke test: SKIPPED (no orders yet)"

echo "=== Dev environment ready ==="
[ "$VERIFY_ONLY" = false ] && echo "PID: $APP_PID"
echo "Health: $HEALTH_URL"
echo "API docs: http://localhost:8080/swagger-ui.html"
```

### Python (FastAPI)

```bash
#!/usr/bin/env bash
# init.sh — Start dev environment for <PROJECT_NAME>
set -euo pipefail

PROJECT_NAME="<PROJECT_NAME>"
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.standalone.yml"
HEALTH_URL="http://localhost:8000/health"
SMOKE_TEST_URL="http://localhost:8000/api/v1/orders"

VERIFY_ONLY=false
if [ "${1:-}" = "--verify" ]; then
    VERIFY_ONLY=true
fi

if [ "$VERIFY_ONLY" = false ]; then
    echo "=== Starting <PROJECT_NAME> dev environment ==="

    # 1. Start infrastructure
    docker compose $COMPOSE_FILES up -d postgres

    # 2. Wait for database
    echo "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if pg_isready -h localhost -p 5432 -q; then
            break
        fi
        sleep 1
    done

    # 3. Run migrations
    alembic upgrade head

    # 4. Start application
    echo "Starting application..."
    uvicorn src.main:app --host 0.0.0.0 --port 8000 &
    APP_PID=$!

    # 5. Wait for health
    echo "Waiting for application..."
    for i in {1..30}; do
        if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# 6. Health + smoke
echo "=== Verification ==="
curl -sf "$HEALTH_URL" || {
    echo "ERROR: Health check failed"
    [ "$VERIFY_ONLY" = false ] && kill $APP_PID 2>/dev/null || true
    exit 1
}

curl -sf "$SMOKE_TEST_URL" >/dev/null 2>&1 && echo "Smoke test: PASS" || echo "Smoke test: SKIPPED"

echo "=== Ready ==="
[ "$VERIFY_ONLY" = false ] && echo "PID: $APP_PID"
echo "Health: $HEALTH_URL"
echo "Docs: http://localhost:8000/docs"
```

### React / Frontend

```bash
#!/usr/bin/env bash
# init.sh — Start dev environment for <PROJECT_NAME> frontend
set -euo pipefail

PROJECT_NAME="<PROJECT_NAME>"
DEV_URL="http://localhost:5173"
SMOKE_TEST_URL="http://localhost:5173"

VERIFY_ONLY=false
if [ "${1:-}" = "--verify" ]; then
    VERIFY_ONLY=true
fi

if [ "$VERIFY_ONLY" = false ]; then
    echo "=== Starting <PROJECT_NAME> frontend ==="

    # 1. Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        npm ci
    fi

    # 2. Start dev server
    npm run dev &
    APP_PID=$!

    # 3. Wait for dev server
    echo "Waiting for dev server..."
    for i in {1..30}; do
        if curl -sf "$DEV_URL" >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi

# 4. Health check
echo "=== Verification ==="
curl -sf "$DEV_URL" || {
    echo "ERROR: Dev server not responding"
    [ "$VERIFY_ONLY" = false ] && kill $APP_PID 2>/dev/null || true
    exit 1
}

echo "=== Ready ==="
[ "$VERIFY_ONLY" = false ] && echo "PID: $APP_PID"
echo "Dev server: $DEV_URL"
```

---

## Customization Guide

When the initializer agent creates `init.sh`, it must customize these variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PROJECT_NAME` | Project name for messages | `order-service` |
| `COMPOSE_FILES` | Docker Compose files to use | `-f docker-compose.yml -f docker-compose.standalone.yml` |
| `HEALTH_URL` | Application health endpoint | `http://localhost:8080/actuator/health` |
| `SMOKE_TEST_URL` | URL to test most recent feature | `http://localhost:8080/api/v1/orders` |
| `SERVICE_MODULE` | Maven module name (Java only) | `order-service` |

### Adding Smoke Tests

The smoke test should exercise the **most recently completed feature**. Update it as features are completed:

```bash
# After ORD-001 (create order)
curl -sf -X POST "$SMOKE_TEST_URL" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"550e8400-e29b-41d4-a716-446655440000","items":[{"product_id":"1","quantity":2,"unit_price":"9.99"}]}' \
  || { echo "ERROR: Create order smoke test failed"; exit 1; }
```

---

## Validation Checklist

Before claiming `init.sh` complete, verify:

- [ ] Script is executable: `chmod +x init.sh`
- [ ] `./init.sh` starts all services without errors
- [ ] `./init.sh --verify` runs quickly and reports status
- [ ] Script prints PID when it starts the app
- [ ] Script fails with clear message if health check fails
- [ ] Smoke test covers the most recent feature
- [ ] Running twice doesn't break anything

---

*Template version: 1.0*
*Part of Agent Session Harness standard*
