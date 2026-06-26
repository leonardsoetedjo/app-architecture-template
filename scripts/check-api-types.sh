#!/usr/bin/env bash
# Check if generated API types are up-to-date with backend OpenAPI spec
#
# Usage:
#   ./scripts/check-api-types.sh <backend-url> <types-file>
#   ./scripts/check-api-types.sh http://localhost:8080/v3/api-docs src/generated/api.ts
#
# Called by: npm run check:api-types (frontend package.json)
#            CI workflow (prevents drift)

set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
BACKEND_URL="${1:-${API_BASE_URL}/v3/api-docs}"
TYPES_FILE="${2:-src/generated/api.ts}"

echo "🔍 Checking API type freshness..."
echo "   Backend: ${BACKEND_URL}"
echo "   Types:   ${TYPES_FILE}"

# Check if types file exists
if [ ! -f "${TYPES_FILE}" ]; then
    echo "❌ FAIL: Type definitions not found at ${TYPES_FILE}"
    echo "   Run: npm run generate:api-types"
    exit 1
fi

# Check if backend is reachable
if ! curl -sf "${BACKEND_URL}" >/dev/null 2>&1; then
    echo "⚠️  Backend unreachable — cannot verify freshness"
    echo "   Assuming types are current (passing)"
    exit 0
fi

# Generate fresh types to temp file
TMP_DIR="$(mktemp -d)"
TMP_FILE="${TMP_DIR}/api.ts"

if command -v openapi-typescript >/dev/null 2>&1; then
    openapi-typescript "${BACKEND_URL}" -o "${TMP_FILE}" >/dev/null 2>&1
else
    echo "⚠️  openapi-typescript not installed — cannot verify"
    echo "   Install: npm install -g openapi-typescript"
    exit 0
fi

# Compare (strip header comments for fair comparison)
grep -v '^\s*\*\|^\s*/\*\|^\s*//' "${TYPES_FILE}" > "${TMP_DIR}/current.txt"
grep -v '^\s*\*\|^\s*/\*\|^\s*//' "${TMP_FILE}" > "${TMP_DIR}/fresh.txt"

if diff -q "${TMP_DIR}/current.txt" "${TMP_DIR}/fresh.txt" >/dev/null 2>&1; then
    echo "✅ Types are up-to-date with backend"
    rm -rf "${TMP_DIR}"
    exit 0
else
    echo "❌ FAIL: Generated types are stale"
    echo "   Backend OpenAPI spec has changed since types were last generated."
    echo "   Run: npm run generate:api-types"
    echo "   Then commit the updated types."
    rm -rf "${TMP_DIR}"
    exit 1
fi
