#!/usr/bin/env bash
# Log architecture violations
# Creates audit trail of all violations for tracking and escalation
# Usage: ./scripts/log-architecture-violation.sh <type> <file_path> <details>

set -e

VIOLATION_LOG=".github/architecture-violations.log"
TIMESTAMP=$(date -Iseconds)
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
USER_NAME=$(git config user.name 2>/dev/null || echo "unknown")
USER_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Parse arguments
VIOLATION_TYPE="${1:-UNKNOWN}"
FILE_PATH="${2:-unknown}"
DETAILS="${3:-No details provided}"

# Create log file with headers if it doesn't exist
if [ ! -f "$VIOLATION_LOG" ]; then
  echo "timestamp,commit_sha,user_name,user_email,branch,violation_type,file_path,details,status" > "$VIOLATION_LOG"
fi

# Log the violation
echo "$TIMESTAMP,$COMMIT_SHA,$USER_NAME,$USER_EMAIL,$BRANCH_NAME,$VIOLATION_TYPE,$FILE_PATH,$DETAILS,OPEN" >> "$VIOLATION_LOG"

echo "📝 Architecture violation logged"
echo ""
echo "Details:"
echo "  Timestamp: $TIMESTAMP"
echo "  Type: $VIOLATION_TYPE"
echo "  File: $FILE_PATH"
echo "  Commit: $COMMIT_SHA"
echo "  User: $USER_NAME <$USER_EMAIL>"
echo "  Branch: $BRANCH_NAME"
echo ""
echo "📋 Logged to: $VIOLATION_LOG"
echo ""

# Check escalation
WEEKLY_COUNT=$(grep -c "$USER_EMAIL" "$VIOLATION_LOG" 2>/dev/null | head -1 || echo "0")
WEEKLY_COUNT=$(grep "$(date +%Y-%m)" "$VIOLATION_LOG" 2>/dev/null | wc -l || echo "0")

if [ "$WEEKLY_COUNT" -ge 5 ]; then
  echo "🚨 ESCALATION: $WEEKLY_COUNT violations this month (threshold: 5)"
  echo "   Architecture team will be notified."
  echo ""
fi
