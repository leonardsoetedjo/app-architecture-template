#!/usr/bin/env bash
# scripts/verify-container-freshness.sh
# Usage: verify-container-freshness.sh <service_name> [expected_commit]
# Checks if a running Docker container's commit label matches the expected commit.
# Exits 0 if fresh (or container not running), exits 1 with message if stale.

set -euo pipefail

SERVICE_NAME="${1:-}"
if [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <service_name> [expected_commit]"
  echo "  service_name     : Docker container name (e.g. order-service-nestjs)"
  echo "  expected_commit  : Git commit SHA to compare against (default: git rev-parse --short HEAD)"
  exit 1
fi

# Determine expected commit
if [ -n "${2:-}" ]; then
  EXPECTED_COMMIT="$2"
else
  # Must be run from inside a git repo
  if ! git rev-parse --short HEAD >/dev/null 2>&1; then
    echo "WARN: Not inside a git repo; skipping freshness check for $SERVICE_NAME"
    exit 0
  fi
  EXPECTED_COMMIT=$(git rev-parse --short HEAD)
fi

# Check if container is running
if ! docker ps --format '{{.Names}}' | grep -qx "$SERVICE_NAME"; then
  echo "INFO: Container '$SERVICE_NAME' is not running — freshness check skipped"
  exit 0
fi

# Get commit label from running container
RUNNING_COMMIT=$(docker inspect --format='{{index .Config.Labels "commit"}}' "$SERVICE_NAME" 2>/dev/null || echo "none")

if [ "$RUNNING_COMMIT" = "none" ] || [ -z "$RUNNING_COMMIT" ]; then
  echo "FAIL: Container '$SERVICE_NAME' has no 'commit' label — image was built before freshness tracking"
  echo "      Rebuild with: docker compose up --build -d $SERVICE_NAME"
  exit 1
fi

if [ "$RUNNING_COMMIT" != "$EXPECTED_COMMIT" ]; then
  echo "FAIL: Container '$SERVICE_NAME' is STALE"
  echo "      Running:  $RUNNING_COMMIT"
  echo "      Expected: $EXPECTED_COMMIT"
  echo "      Fix: docker compose up --build -d $SERVICE_NAME"
  exit 1
fi

echo "PASS: Container '$SERVICE_NAME' is fresh ($RUNNING_COMMIT)"
exit 0
