#!/usr/bin/env bash
# Validate commit message includes architecture compliance evidence
# Usage: ./scripts/validate-commit-message.sh "commit message"

set -e

COMMIT_MSG="${1:-}"

if [ -z "$COMMIT_MSG" ]; then
  # Read from stdin if no argument provided
  COMMIT_MSG=$(cat)
fi

# Check if commit message includes architecture compliance evidence
if ! echo "$COMMIT_MSG" | grep -qi "Architecture:"; then
  echo "❌ FAIL: Commit message must include architecture compliance evidence"
  echo ""
  echo "Required format:"
  echo "  Architecture: ./scripts/architecture-pre-commit.sh PASSED"
  echo "  - All 4 checks passed in <5 seconds"
  echo "  - No forbidden imports detected"
  echo ""
  echo "Example commit message:"
  echo "  feat: add order validation (#123)"
  echo ""
  echo "  - Added OrderValidator in domain layer"
  echo "  - Created validation use case"
  echo "  - Architecture: ./scripts/architecture-pre-commit.sh PASSED"
  echo "    - Java architecture: OK"
  echo "    - Python architecture: OK"
  echo "    - Frontend architecture: OK"
  echo "    - E2E tests: OK"
  echo ""
  echo "To fix: git commit --amend -m 'Your message' -m 'Architecture: PASSED'"
  exit 1
fi

echo "✅ Commit message includes architecture compliance evidence"
exit 0
