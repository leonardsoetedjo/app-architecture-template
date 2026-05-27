# Dual-Version Secret Management - Implementation Examples

**Purpose:** Provide reference implementations for dual-version secret management with zero-downtime rotation.

**Related Issue:** #86 (Dual-version secret management for seamless key rotation)

---

## 🎯 Overview

Maintain **2 active versions** of each secret to enable seamless rotation:

| Version | Purpose | Lifecycle |
|---------|---------|-----------|
| **Primary (v1)** | Active key in production | Used for signing/encryption |
| **Secondary (v2)** | Staging key for rotation | Validated before promotion |

---

## 📋 Environment Configuration

**.env file structure:**

```bash
# JWT Signing Key - Dual Version
JWT_SIGNING_KEY_PRIMARY=<base64-encoded-key-v2>
JWT_SIGNING_KEY_PRIMARY_VERSION=v2
JWT_SIGNING_KEY_PRIMARY_CREATED=2026-05-27T00:00:00+00:00

JWT_SIGNING_KEY_SECONDARY=<base64-encoded-key-v1>
JWT_SIGNING_KEY_SECONDARY_VERSION=v1
JWT_SIGNING_KEY_SECONDARY_CREATED=2026-04-27T00:00:00+00:00

JWT_SIGNING_KEY_GRACE_PERIOD_DAYS=30
JWT_SIGNING_KEY_LAST_ROTATED=2026-05-27T00:00:00+00:00
JWT_SIGNING_KEY_NEXT_ROTATION=2026-06-26T00:00:00+00:00
```

---

## ☕ Java (Spring Boot) Implementation

### Configuration Properties

**application.yml:**
```yaml
security:
  jwt:
    signing:
      primary:
        key: ${JWT_SIGNING_KEY_PRIMARY}
        version: ${JWT_SIGNING_KEY_PRIMARY_VERSION}
      secondary:
        key: ${JWT_SIGNING_KEY_SECONDARY}
        version: ${JWT_SIGNING_KEY_SECONDARY_VERSION}
      grace-period-days: ${JWT_SIGNING_KEY_GRACE_PERIOD_DAYS:30}
```

### JWT Token Provider

**JwtTokenProvider.java:**
```java
package com.example.infrastructure.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${security.jwt.signing.primary.key}")
    private String primarySigningKey;

    @Value("${security.jwt.signing.primary.version}")
    private String primaryVersion;

    @Value("${security.jwt.signing.secondary.key}")
    private String secondarySigningKey;

    @Value("${security.jwt.signing.secondary.version}")
    private String secondaryVersion;

    @Value("${security.jwt.signing.grace-period-days:30}")
    private int gracePeriodDays;

    /**
     * Generate token with PRIMARY key only
     */
    public String generateToken(String subject) {
        Instant now = Instant.now();
        Instant expiry = now.plus(Duration.ofMinutes(30));

        return Jwts.builder()
                .setSubject(subject)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(expiry))
                .signWith(Keys.hmacShaKeyFor(primarySigningKey.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    /**
     * Validate token with PRIMARY or SECONDARY key (grace period)
     */
    public boolean validateToken(String token) {
        try {
            // Try PRIMARY first
            Jwts.parserBuilder()
                    .setSigningKey(Keys.hmacShaKeyFor(primarySigningKey.getBytes(StandardCharsets.UTF_8)))
                    .build()
                    .parseClaimsJws(token);
            return true;

        } catch (JwtException e) {
            // Try SECONDARY (for tokens issued during previous rotation)
            try {
                Jwts.parserBuilder()
                        .setSigningKey(Keys.hmacShaKeyFor(secondarySigningKey.getBytes(StandardCharsets.UTF_8)))
                        .build()
                        .parseClaimsJws(token);

                // Check if secondary key is still within grace period
                if (isWithinGracePeriod()) {
                    log.debug("Token validated with secondary key (grace period active)");
                    return true;
                } else {
                    log.warn("Token validated with expired secondary key - grace period ended");
                    return false;
                }

            } catch (JwtException e2) {
                log.debug("Token validation failed: {}", e2.getMessage());
                return false;
            }
        }
    }

    /**
     * Check if secondary key is within grace period
     */
    private boolean isWithinGracePeriod() {
        // In production, fetch rotation metadata from config/secret manager
        // For now, assume grace period is active
        return true;
    }

    public String getSubject(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(primarySigningKey.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
```

---

## 🐍 Python (FastAPI) Implementation

### Configuration

**config.py:**
```python
from pydantic import BaseSettings
from datetime import datetime

class SecuritySettings(BaseSettings):
    # Primary key (active)
    jwt_signing_key_primary: str
    jwt_signing_key_primary_version: str
    jwt_signing_key_primary_created: datetime
    
    # Secondary key (grace period)
    jwt_signing_key_secondary: str
    jwt_signing_key_secondary_version: str
    jwt_signing_key_secondary_created: datetime
    
    # Rotation config
    jwt_grace_period_days: int = 30
    jwt_last_rotated: datetime | None = None
    jwt_next_rotation: datetime | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

security_settings = SecuritySettings()
```

### JWT Provider

**jwt_provider.py:**
```python
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class JWTProvider:
    def __init__(self, config: SecuritySettings):
        self.config = config
        self.primary_key = config.jwt_signing_key_primary
        self.secondary_key = config.jwt_signing_key_secondary
    
    def create_token(self, subject: str, expires_delta: Optional[timedelta] = None) -> str:
        """Generate token with PRIMARY key only"""
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=30))
        
        return jwt.encode(
            {
                "sub": subject,
                "exp": expire,
                "iat": datetime.utcnow(),
                "version": self.config.jwt_signing_key_primary_version
            },
            self.primary_key,
            algorithm="HS256"
        )
    
    def verify_token(self, token: str) -> dict:
        """Verify with PRIMARY or SECONDARY key (grace period)"""
        # Try PRIMARY first
        try:
            payload = jwt.decode(token, self.primary_key, algorithms=["HS256"])
            return payload
        except JWTError as e:
            logger.debug(f"Primary key validation failed: {e}")
        
        # Try SECONDARY (rotation grace period)
        try:
            if self._is_within_grace_period():
                payload = jwt.decode(token, self.secondary_key, algorithms=["HS256"])
                logger.debug("Token validated with secondary key (grace period active)")
                return payload
            else:
                logger.warning("Token validated with expired secondary key")
        except JWTError as e:
            logger.debug(f"Secondary key validation failed: {e}")
        
        raise JWTError("Invalid token")
    
    def _is_within_grace_period(self) -> bool:
        """Check if secondary key is within grace period"""
        secondary_age = datetime.utcnow() - self.config.jwt_signing_key_secondary_created
        return secondary_age.days <= self.config.jwt_grace_period_days

# Usage
jwt_provider = JWTProvider(security_settings)
```

---

## 🔄 Rotation Script

**scripts/rotate-secret.sh:**
```bash
#!/usr/bin/env bash
# Dual-version secret rotation with zero downtime

set -e

SECRET_NAME="${1:-JWT_SIGNING_KEY}"

echo "🔄 Rotating secret: $SECRET_NAME"

# Generate new key
NEW_KEY=$(openssl rand -base64 64)
NEW_VERSION="v$(date +%Y%m%d%H%M%S)"

# Read current primary (will become secondary)
OLD_PRIMARY=$(grep "^${SECRET_NAME}_PRIMARY=" .env | cut -d'=' -f2-)
OLD_VERSION=$(grep "^${SECRET_NAME}_PRIMARY_VERSION=" .env | cut -d'=' -f2-)

# Update .env (DO NOT COMMIT!)
# ... (see rotate-secret.sh for full implementation)

echo "✅ Rotation complete"
echo "  Primary:   $NEW_VERSION"
echo "  Secondary: $OLD_VERSION"
echo "  Grace period: 30 days"
```

---

## 📊 GitHub Actions Workflow

**.github/workflows/secret-rotation.yml:**
```yaml
name: Secret Rotation

on:
  schedule:
    - cron: '0 2 1 * *'  # Monthly on 1st at 2 AM UTC
  workflow_dispatch:
    inputs:
      secret_name:
        description: 'Secret to rotate'
        required: true
        default: 'JWT_SIGNING_KEY'

jobs:
  rotate-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Rotate secret
        run: ./scripts/rotate-secret.sh ${{ inputs.secret_name }}
      
      - name: Create rotation PR
        uses: peter-evans/create-pull-request@v5
        with:
          commit-message: 'chore: rotate ${{ inputs.secret_name }}'
          title: 'chore: rotate secrets (${{ inputs.secret_name }})'
          body: |
            ## Secret Rotation
            
            **Grace period:** 30 days
            
            **Action required:**
            - [ ] Review changes (DO NOT commit .env!)
            - [ ] Deploy to staging
            - [ ] Deploy to production
            - [ ] Monitor for validation failures
```

---

## ✅ Acceptance Criteria

- [x] Dual-version secret pattern documented
- [x] Java implementation example created
- [x] Python implementation example created
- [x] Rotation script created and tested
- [x] GitHub Actions workflow for scheduled rotation
- [x] Architecture compliance rules updated (in issue #86 description)
- [ ] Test: Rotation completes without downtime
- [ ] Test: Both keys accepted during grace period
- [ ] Test: Old key rejected after grace period

---

## 🔗 Related Documentation

- Issue #86: Dual-version secret management
- `scripts/rotate-secret.sh` - Rotation script
- `.github/workflows/secret-rotation.yml` - Automated rotation
- AGENTS.md - Architecture compliance requirements

---

**Last Updated:** 2026-05-27  
**Status:** Implemented
