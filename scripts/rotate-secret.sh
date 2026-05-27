#!/usr/bin/env bash
# Dual-version secret rotation with zero downtime
# Maintains 2 active versions of each secret for seamless rotation
# Usage: ./scripts/rotate-secret.sh <SECRET_NAME>
# Example: ./scripts/rotate-secret.sh JWT_SIGNING_KEY

set -e

SECRET_NAME="${1:-}"

if [ -z "$SECRET_NAME" ]; then
  echo "❌ Usage: $0 <SECRET_NAME>"
  echo ""
  echo "Example:"
  echo "  $0 JWT_SIGNING_KEY"
  echo "  $0 API_KEY"
  echo "  $0 DB_PASSWORD"
  exit 1
fi

echo "🔄 Rotating secret: $SECRET_NAME"
echo ""

# Environment variable names
CURRENT_PRIMARY="${SECRET_NAME}_PRIMARY"
CURRENT_SECONDARY="${SECRET_NAME}_SECONDARY"

# Check if .env file exists
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  .env file not found - creating from .env.example"
  if [ -f ".env.example" ]; then
    cp .env.example "$ENV_FILE"
  else
    echo "❌ Neither .env nor .env.example found"
    exit 1
  fi
fi

# Step 1: Generate new key
echo "[1/5] Generating new signing key..."
if command -v openssl &> /dev/null; then
  NEW_KEY=$(openssl rand -base64 64)
else
  # Fallback to /dev/urandom
  NEW_KEY=$(head -c 48 /dev/urandom | base64)
fi
NEW_VERSION="v$(date +%Y%m%d%H%M%S)"
NEW_CREATED=$(date -Iseconds)

echo "  ✅ New key generated"
echo "     Version: $NEW_VERSION"
echo "     Created: $NEW_CREATED"

# Step 2: Read current primary (will become secondary)
echo ""
echo "[2/5] Promoting current primary to secondary..."
if grep -q "^${SECRET_NAME}_PRIMARY=" "$ENV_FILE" 2>/dev/null; then
  OLD_PRIMARY_VALUE=$(grep "^${SECRET_NAME}_PRIMARY=" "$ENV_FILE" | cut -d'=' -f2-)
  OLD_PRIMARY_VERSION=$(grep "^${SECRET_NAME}_PRIMARY_VERSION=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || echo "v1")
  OLD_PRIMARY_CREATED=$(grep "^${SECRET_NAME}_PRIMARY_CREATED=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- || echo "unknown")
  
  echo "  ✅ Current primary found"
  echo "     Version: $OLD_PRIMARY_VERSION"
  echo "     Created: $OLD_PRIMARY_CREATED"
else
  echo "  ⚠️  No existing primary key found - creating initial key"
  OLD_PRIMARY_VALUE="$NEW_KEY"
  OLD_PRIMARY_VERSION="$NEW_VERSION"
  OLD_PRIMARY_CREATED="$NEW_CREATED"
  NEW_KEY=$(openssl rand -base64 64 2>/dev/null || head -c 48 /dev/urandom | base64)
  NEW_VERSION="v$(date +%Y%m%d%H%M%S)"
  NEW_CREATED=$(date -Iseconds)
fi

# Step 3: Update .env file with new primary
echo ""
echo "[3/5] Setting new key as primary..."

# Remove old entries if they exist
sed -i "/^${SECRET_NAME}_PRIMARY=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_PRIMARY_VERSION=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_PRIMARY_CREATED=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_SECONDARY=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_SECONDARY_VERSION=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_SECONDARY_CREATED=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_LAST_ROTATED=/d" "$ENV_FILE"
sed -i "/^${SECRET_NAME}_NEXT_ROTATION=/d" "$ENV_FILE"

# Add new entries
cat >> "$ENV_FILE" << EOF

# Secret Rotation: $SECRET_NAME
# Primary (active)
${SECRET_NAME}_PRIMARY=$NEW_KEY
${SECRET_NAME}_PRIMARY_VERSION=$NEW_VERSION
${SECRET_NAME}_PRIMARY_CREATED=$NEW_CREATED

# Secondary (previous primary, for grace period)
${SECRET_NAME}_SECONDARY=$OLD_PRIMARY_VALUE
${SECRET_NAME}_SECONDARY_VERSION=$OLD_PRIMARY_VERSION
${SECRET_NAME}_SECONDARY_CREATED=$OLD_PRIMARY_CREATED

# Rotation metadata
${SECRET_NAME}_LAST_ROTATED=$NEW_CREATED
${SECRET_NAME}_NEXT_ROTATION=$(date -d '+30 days' -Iseconds 2>/dev/null || date -v+30d +%Y-%m-%dT%H:%M:%S%z)
${SECRET_NAME}_GRACE_PERIOD_DAYS=30
EOF

echo "  ✅ Primary key updated"
echo "     Version: $NEW_VERSION"

# Step 4: Set old primary as secondary
echo ""
echo "[4/5] Setting old primary as secondary..."
echo "  ✅ Secondary key set"
echo "     Version: $OLD_PRIMARY_VERSION"
echo "     Grace period: 30 days"

# Step 5: Update rotation metadata
echo ""
echo "[5/5] Updating rotation metadata..."
echo "  ✅ Metadata updated"

# Summary
echo ""
echo "=============================="
echo "✅ Rotation complete!"
echo ""
echo "Summary:"
echo "  Primary:   $NEW_VERSION (created $NEW_CREATED)"
echo "  Secondary: $OLD_PRIMARY_VERSION (created $OLD_PRIMARY_CREATED)"
echo "  Grace period: 30 days"
echo "  Next rotation: $(date -d '+30 days' +%Y-%m-%d 2>/dev/null || date -v+30d +%Y-%m-%d)"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. Review changes: git diff .env"
echo "  2. DO NOT commit .env to version control!"
echo "  3. Update secrets in all environments (dev, staging, prod)"
echo "  4. Monitor for validation failures during grace period"
echo "  5. Schedule next rotation in 30 days"
echo ""
echo "📝 To apply changes:"
echo "  - Restart applications to load new secrets"
echo "  - Or send SIGHUP to reload config (if supported)"
echo ""
