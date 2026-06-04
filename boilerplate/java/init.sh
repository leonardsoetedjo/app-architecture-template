#!/usr/bin/env bash
# init.sh — Start dev environment for java-order-service
set -e

echo "=== Starting java-order-service dev environment ==="

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

# 3. Check Java version
JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
echo "    Java version: $JAVA_VERSION"
if [[ ! "$JAVA_VERSION" =~ ^21 ]]; then
    echo "    ⚠️  Warning: Java 21 LTS recommended for Spring Boot 3.4+"
fi

# 4. Install Maven dependencies
if [ -f "pom.xml" ]; then
    echo "    Installing Maven dependencies..."
    mvn dependency:resolve -q
    echo "    ✅ Dependencies resolved"
fi

# 5. Run database migrations (Flyway)
if [ -f "pom.xml" ]; then
    echo "    Running Flyway migrations..."
    mvn flyway:migrate -q
    echo "    ✅ Migrations applied"
fi

# 6. Start application
if [ "$1" == "--verify" ]; then
    echo "=== Verify mode — skipping server start, running smoke tests ==="
else
    echo "    Starting Spring Boot application..."
    mvn spring-boot:run -Dspring-boot.run.forked=false &
    APP_PID=$!
    export SPRING_BOOT_PID=$APP_PID
    echo "    ✅ Spring Boot started (PID: $APP_PID)"
fi

# 7. Wait for health
echo "    Waiting for application health check..."
for i in {1..30}; do
    if curl -sf http://localhost:8080/actuator/health 2>/dev/null | grep -q '"status":"UP"'; then
        echo "    ✅ Application is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "    ⚠️  Application health check timed out"
    fi
    sleep 1
done

# 8. Smoke test — verify core functionality if server is running
if [ -z "$APP_PID" ] || kill -0 $APP_PID 2>/dev/null; then
    echo "=== Smoke test ==="
    curl -sf http://localhost:8080/actuator/health 2>/dev/null || \
    echo "    ⚠️  No /actuator/health endpoint found; override $1 with your own endpoint"
fi

echo "=== Dev environment ready ==="
if [ -n "$APP_PID" ]; then
    echo "PID: $APP_PID"
    echo "Health: http://localhost:8080/actuator/health"
    echo "API: http://localhost:8080/api/v1/orders"
    echo "To stop: kill $APP_PID"
fi

# Keep running if foreground
trap "echo 'Caught signal, shutting down...'; [ -n \"\$APP_PID\" ] && kill \$APP_PID 2>/dev/null || true; exit 0" INT TERM EXIT

# Wait if server is running
if [ -n "$APP_PID" ]; then
    wait $APP_PID
fi
