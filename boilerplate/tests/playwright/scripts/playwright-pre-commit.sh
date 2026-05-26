#!/usr/bin/env bash

# Pre-commit hook: Enforce E2E tests on code changes
# Install: cp playwright-pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "🔍 Checking for E2E test coverage..."

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|vue)$' || true)

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ No source code changes detected"
  exit 0
fi

# Check if any test files were changed
TEST_FILES=$(git diff --cached --name-only | grep -E 'e2e/.*\.spec\.ts$' || true)

echo "Changed source files:"
echo "$CHANGED_FILES"
echo ""

# Heuristic: If source files changed but no test files, warn
if [ -n "$CHANGED_FILES" ] && [ -z "$TEST_FILES" ]; then
  echo "⚠️  WARNING: Source code changed but no E2E tests modified"
  echo ""
  echo "Modified files:"
  echo "$CHANGED_FILES" | sed 's/^/  - /'
  echo ""
  echo "Consider adding E2E tests for these changes:"
  echo "  - New components → Add smoke tests"
  echo "  - New features → Add feature E2E tests"
  echo "  - Bug fixes → Add regression tests"
  echo ""
  echo "To skip this check (NOT RECOMMENDED), use:"
  echo "  git commit --no-verify"
  echo ""
  
  # Uncomment to enforce (make it fail):
  # echo "❌ E2E tests required for code changes"
  # echo "Please add tests in e2e/ directory"
  # exit 1
fi

# Run smoke tests if they exist
if [ -f "e2e/smoke.spec.ts" ]; then
  echo "🏃 Running smoke tests..."
  if command -v npm &> /dev/null; then
    npm run e2e -- --grep "@smoke" --reporter=list || {
      echo "❌ Smoke tests failed"
      echo "Please fix failing tests before committing"
      exit 1
    }
  else
    echo "⚠️  npm not found, skipping smoke test execution"
  fi
fi

echo "✅ Pre-commit checks passed"
exit 0
