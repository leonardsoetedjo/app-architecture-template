#!/usr/bin/env bash
# Gate 7: Security Scan (Polyglot)
# Detects eval/exec, hardcoded secrets, and unsafe patterns
# Usage: scripts/gate-7-security.sh <directory>

set -euo pipefail

SCAN_DIR="${1:-.}"
FAIL=0

echo "🔍 Running security scan on $SCAN_DIR..."

# Check 1: eval/exec in source code
EVIL=$(grep -rnE '\beval\s*\(|\bexec\s*\(' "$SCAN_DIR/src/" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.vue" --include="*.sh" 2>/dev/null || true)
if [ -n "$EVIL" ]; then
    echo "❌ FAIL: eval/exec detected:"
    echo "$EVIL" | head -20
    FAIL=1
fi

# Check 2: Hardcoded secrets (basic pattern) - WARNING only
SECRETS=$(grep -rnE '(password|secret|api_key|token)\s*[:=]\s*"[^"]{8,}"' "$SCAN_DIR/src/" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.vue" 2>/dev/null | grep -v 'example\|test\|mock\|TODO\|FIXME' || true)
if [ -n "$SECRETS" ]; then
    echo "⚠️  WARNING: Possible hardcoded secrets (verify these are test-only):"
    echo "$SECRETS" | head -10
fi

# Check 3: SQL injection patterns (basic)
SQL_INJ=$(grep -rnE 'execute\s*\(.*".*%.*"' "$SCAN_DIR/src/" --include="*.py" --include="*.ts" 2>/dev/null || true)
if [ -n "$SQL_INJ" ]; then
    echo "❌ FAIL: Possible SQL injection pattern:"
    echo "$SQL_INJ" | head -10
    FAIL=1
fi

if [ $FAIL -eq 1 ]; then
    echo "❌ Gate 7: Security scan FAILED"
    exit 1
fi

echo "✅ Gate 7: Security scan PASSED"
exit 0
