#!/usr/bin/env bash

# Commit-msg hook: Validate architecture compliance evidence
# Prevents commits without architecture compliance evidence in message
# Install: cp scripts/commit-msg-hook.sh .git/hooks/commit-msg && chmod +x .git/hooks/commit-msg

set -e

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check if commit message includes architecture compliance evidence
if ! echo "$COMMIT_MSG" | grep -qi "Architecture:"; then
  echo "❌ FAIL: Commit message must include architecture compliance evidence"
  echo ""
  echo "Required format:"
  echo "  Architecture: ./scripts/architecture-pre-commit.sh PASSED"
  echo "  - Duration: <5000ms"
  echo "  - Java architecture: OK"
  echo "  - Python architecture: OK"
  echo "  - Frontend architecture: OK"
  echo "  - E2E tests: OK"
  echo ""
  echo "Example commit message:"
  echo "  feat: add order validation (#123)"
  echo ""
  echo "  - Added OrderValidator in domain layer"
  echo "  - Created validation use case"
  echo "  - Architecture: ./scripts/architecture-pre-commit.sh PASSED"
  echo "    - Duration: 2340ms"
  echo "    - Java architecture: OK"
  echo "    - Python architecture: OK"
  echo "    - Frontend architecture: OK"
  echo "    - E2E tests: OK"
  echo ""
  echo "To fix:"
  echo "  1. Run: ./scripts/architecture-pre-commit.sh"
  echo "  2. Copy the 'Architecture:' block from output"
  echo "  3. Run: git commit --amend -m 'Your message' -m 'Architecture: ...'"
  exit 1
fi

echo "✅ Architecture compliance evidence found in commit message"
exit 0
