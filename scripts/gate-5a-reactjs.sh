#!/usr/bin/env bash
# Gate 5a: Frontend Config Sanity (ReactJS)
# Reads allowed hostname from .env.example, blocks hardcoded values
# Usage: scripts/gate-5a-reactjs.sh <path-to-boilerplate-dir>

set -euo pipefail

BOILERPLATE_DIR="${1:-boilerplate/reactjs}"
ENV_FILE="$BOILERPLATE_DIR/.env.example"
VITE_CONFIG="$BOILERPLATE_DIR/vite.config.ts"

# Fail if .env.example missing
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ FAIL: $ENV_FILE not found"
    echo "   Create it with: VITE_API_BASE_URL=http://localhost:8082"
    exit 1
fi

# Read VITE_API_BASE_URL from .env.example
ENV_URL=$(grep "^VITE_API_BASE_URL=" "$ENV_FILE" | cut -d= -f2 | tr -d ' \t"' || true)
if [ -z "$ENV_URL" ]; then
    echo "❌ FAIL: VITE_API_BASE_URL not configured in $ENV_FILE"
    echo "   Add: VITE_API_BASE_URL=http://localhost:8082"
    exit 1
fi

# Extract allowed hostname (strip protocol and path)
ALLOWED_HOST=$(echo "$ENV_URL" | sed -E 's|https?://([^/:]+).*|\1|')
echo "   Allowed host from $ENV_FILE: $ALLOWED_HOST"

FAIL=0

# Check 1: Hardcoded basename in BrowserRouter
if grep -rnE 'basename\s*[=:]\s*["\047]/[^"\047]+["\047]' "$BOILERPLATE_DIR/src/" --include="*.tsx" --include="*.ts" 2>/dev/null; then
    echo "❌ FAIL: Hardcoded basename detected. Use import.meta.env.VITE_APP_BASENAME"
    FAIL=1
fi

# Check 2: Hardcoded base path in vite.config.ts
if [ -f "$VITE_CONFIG" ] && grep -nE 'base\s*:\s*["\047]/[^"\047]+["\047]' "$VITE_CONFIG" 2>/dev/null; then
    echo "❌ FAIL: Hardcoded base path in vite.config.ts. Use process.env.VITE_APP_BASE"
    FAIL=1
fi

# Check 3: Proxy target must be localhost, 127.0.0.1, or ALLOWED_HOST
if [ -f "$VITE_CONFIG" ]; then
    PROXY_LINE=$(grep -n "target:" "$VITE_CONFIG" | head -1 || true)
    if [ -n "$PROXY_LINE" ]; then
        PROXY_TARGET=$(echo "$PROXY_LINE" | grep -oE 'https?://[^"\047]+' | head -1 || true)
        if [ -n "$PROXY_TARGET" ]; then
            TARGET_HOST=$(echo "$PROXY_TARGET" | sed -E 's|https?://([^/:]+).*|\1|')
            if [ "$TARGET_HOST" != "localhost" ] && [ "$TARGET_HOST" != "127.0.0.1" ] && [ "$TARGET_HOST" != "$ALLOWED_HOST" ]; then
                echo "❌ FAIL: Proxy target '$TARGET_HOST' not allowed."
                echo "   Allowed: localhost, 127.0.0.1, or $ALLOWED_HOST (from $ENV_FILE)"
                echo "   Found: $PROXY_TARGET"
                FAIL=1
            else
                echo "   ✅ Proxy target: $TARGET_HOST"
            fi
        fi
    fi
fi

if [ $FAIL -eq 1 ]; then
    exit 1
fi

echo "✅ Gate 5a: Frontend config sanity PASSED"
exit 0
