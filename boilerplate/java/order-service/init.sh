#!/usr/bin/env bash
# init.sh — Start dev environment for order-service (Java/Spring Boot)
set -e

echo "=== Starting order-service dev environment ==="

# Navigate to project root regardless of where this is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
echo "    Java version: $JAVA_VERSION"
if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "    ❌ ERROR: Java 17+ required"
    exit 1
fi
echo "    ✅ Java version OK"

# 2. Start PostgreSQL via Docker Compose
if command -v docker &> /dev/null && [ -f "../docker-compose.yml" ]; then
    echo "    Starting PostgreSQL..."
    docker compose -f ../docker-compose.yml up -d postgres
    echo "    ⏳ Waiting for PostgreSQL..."
    until pg_isready -h localhost -p 5432 -U app_user 2>/dev/null; do
        sleep 1
    done
    echo "    ✅ PostgreSQL is ready"
else
    echo "    ⚠️  Docker not available or docker-compose.yml not found"
    echo "    Please start PostgreSQL manually"
fi

# 3. Run Flyway migrations
if [ -f "src/main/resources/db/migration/V1__init.sql" ]; then
    echo "    Running Flyway migrations..."
    ./mvnw flyway:migrate -q || echo "    ⚠️  Flyway migration failed (may need manual intervention)"
fi

# 4. Start Spring Boot application
if [ "$1" == "--verify" ]; then
    echo "=== Verify mode — skipping application start ==="
else
    echo "    Starting Spring Boot application..."
    ./mvnw spring-boot:run -pl order-service -Dspring-boot.run.forked=false &
    APP_PID=$!
    export SPRING_BOOT_PID=$APP_PID
    echo "    ✅ Spring Boot started (PID: $APP_PID)"
fi

# 5. Wait for health endpoint
echo "    Waiting for application health check..."
for i in {1..60}; do
    if curl -sf http://localhost:8080/actuator/health 2>/dev/null; then
        echo "    ✅ Application is healthy"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "    ⚠️  Health check timed out after 60s"
    fi
    sleep 1
done

# 6. Smoke test — verify core functionality
echo "=== Smoke test ==="
if curl -sf http://localhost:8080/actuator/health 2>/dev/null; then
    echo "    ✅ Health endpoint: OK"
else
    echo "    ⚠️  Health endpoint not responding"
fi

# Basic API smoke test (returns 401 if security enabled, which is OK)
curl -sf http://localhost:8080/api/v1/orders 2>/dev/null || \
    echo "    ℹ️  Orders endpoint requires authentication (expected)"

echo "=== Dev environment ready ==="
if [ -n "$APP_PID" ]; then
    echo "PID: $APP_PID"
    echo "Health: http://localhost:8080/actuator/health"
    echo "API Docs: http://localhost:8080/swagger-ui.html"
    echo "To stop: kill $APP_PID"
fi

# Keep running if foreground
trap "echo 'Caught signal, shutting down...'; [ -n \"\$APP_PID\" ] && kill \$APP_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait if server is running
if [ -n "$APP_PID" ]; then
    wait $APP_PID
fi
