#!/usr/bin/env bash
# Log architecture bypass attempts
# Called when pre-commit hook is bypassed with --no-verify
# Usage: ./scripts/log-bypass-attempt.sh

set -e

BYPASS_LOG=".github/architecture-bypass.log"
TIMESTAMP=$(date -Iseconds)
COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
USER_NAME=$(git config user.name 2>/dev/null || echo "unknown")
USER_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Create log file if it doesn't exist
if [ ! -f "$BYPASS_LOG" ]; then
  echo "timestamp,commit_sha,user_name,user_email,branch,bypass_type,details" > "$BYPASS_LOG"
fi

# Log the bypass attempt
BYPASS_TYPE="${1:-no-verify}"
DETAILS="${2:-Pre-commit hook bypassed}"

echo "$TIMESTAMP,$COMMIT_SHA,$USER_NAME,$USER_EMAIL,$BRANCH_NAME,$BYPASS_TYPE,$DETAILS" >> "$BYPASS_LOG"

echo "⚠️  WARNING: Pre-commit hook bypass attempt logged"
echo ""
echo "Details:"
echo "  Timestamp: $TIMESTAMP"
echo "  Commit: $COMMIT_SHA"
echo "  User: $USER_NAME <$USER_EMAIL>"
echo "  Branch: $BRANCH_NAME"
echo "  Bypass type: $BYPASS_TYPE"
echo ""
echo "📝 Logged to: $BYPASS_LOG"
echo ""
echo "⚠️  NOTE: Even with --no-verify, server-side checks will still block this PR:"
echo "   - GitHub branch protection rules"
echo "   - CODEOWNERS review requirements"
echo "   - CI/CD architecture gate"
echo "   - Commit message validation"
echo ""
echo "   Bypassing client-side hooks provides no benefit - violations will be caught anyway."
