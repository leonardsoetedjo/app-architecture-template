#!/usr/bin/env bash
# scripts/deploy.sh
# Deployment script with container freshness verification.
# Usage: deploy.sh [docker-compose-file] [service1 service2 ...]
#   Default compose file: docker-compose.yml
#   Default services: all services with build contexts in the compose file
#
# Example:
#   ./scripts/deploy.sh docker-compose.traefik.yml order-service-java nginx
#   ./scripts/deploy.sh order-service-java nginx
#   ./scripts/deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Determine compose file and service arguments
# If first arg looks like a compose file (.yml/.yaml), use it; otherwise default to docker-compose.yml
COMPOSE_FILE="docker-compose.yml"
SERVICES=()

if [ $# -gt 0 ]; then
  if [[ "$1" == *.yml ]] || [[ "$1" == *.yaml ]] || [ -f "$1" ]; then
    COMPOSE_FILE="$1"
    shift
  fi
  SERVICES=("$@")
fi

# Auto-detect services with build contexts if none specified
if [ ${#SERVICES[@]} -eq 0 ]; then
  if command -v python3 >/dev/null 2>&1; then
    PY_TMP=$(mktemp)
    cat > "$PY_TMP" <<'PYEOF'
import yaml, sys
try:
    with open(sys.argv[1]) as f:
        data = yaml.safe_load(f)
    services = data.get('services', {})
    for name, cfg in services.items():
        if isinstance(cfg, dict) and 'build' in cfg:
            print(name)
except Exception:
    pass
PYEOF
    mapfile -t SERVICES < <(python3 "$PY_TMP" "$COMPOSE_FILE")
    rm -f "$PY_TMP"
  else
    echo "WARN: python3 not available; cannot auto-detect services from $COMPOSE_FILE"
    echo "      Pass service names explicitly: ./scripts/deploy.sh $COMPOSE_FILE service1 service2"
  fi
fi

if [ ${#SERVICES[@]} -eq 0 ]; then
  echo "WARN: No services specified and none auto-detected in $COMPOSE_FILE"
  echo "      Pass service names explicitly: ./scripts/deploy.sh [$COMPOSE_FILE] service1 service2"
fi

# Export GIT_COMMIT so Dockerfile ARG picks it up
export GIT_COMMIT=$(git rev-parse --short HEAD)
echo "=== Deploying from commit $GIT_COMMIT ==="

# Build and start
echo "=== docker compose -f $COMPOSE_FILE up --build -d ==="
docker compose -f "$COMPOSE_FILE" up --build -d

# Freshness verification
echo ""
echo "=== Verifying container freshness ==="
EXIT_CODE=0
for svc in "${SERVICES[@]}"; do
  # Get actual container name from docker compose
  CONTAINER_ID=$(docker compose -f "$COMPOSE_FILE" ps -q "$svc" 2>/dev/null | head -1 || true)
  if [ -n "$CONTAINER_ID" ]; then
    CONTAINER_NAME=$(docker inspect --format='{{.Name}}' "$CONTAINER_ID" 2>/dev/null | sed 's/^\///' || true)
    if [ -n "$CONTAINER_NAME" ]; then
      if ! "$SCRIPT_DIR/verify-container-freshness.sh" "$CONTAINER_NAME" "$GIT_COMMIT"; then
        EXIT_CODE=1
      fi
    else
      echo "WARN: Could not inspect container for service '$svc'"
    fi
  else
    echo "WARN: Service '$svc' has no running container — skipping freshness check"
  fi
done

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "DEPLOY FAILED: One or more containers are stale."
  echo "Run: docker compose -f $COMPOSE_FILE up --build -d --force-recreate"
  exit 1
fi

echo ""
echo "=== Deploy complete. All containers are fresh. ==="
exit 0
