# Issues Encountered During cody-test Boilerplate Deployment

## Summary
While deploying a login + orders boilerplate following `app-architecture-template` standards, multiple issues were encountered that caused build failures and deployment blockers. This document lists all issues, root causes, resolutions, and recommended template fixes.

---

## Issue 1: Maven Wrapper Missing in Generated Projects

### Problem
New projects created from template lack Maven wrapper (`mvnw`, `.mvn/`), causing build failures.

### Root Cause
Template documentation references Maven wrapper but doesn't provide copy instructions or include it in boilerplate directories.

### Resolution
```bash
cp -r app-architecture-template/boilerplate/java/.mvn <project>/java/order-service/
cp app-architecture-template/boilerplate/java/mvnw <project>/java/order-service/
chmod +x <project>/java/order-service/mvnw
```

### Recommended Template Fix
- [ ] Add `.mvn/` and `mvnw` to `boilerplate/java/` directory
- [ ] Document wrapper copy step in boilerplate README
- [ ] Or use system Maven in Dockerfile (less portable)

**Severity:** HIGH — Blocks all Java builds

---

## Issue 2: npm ci Fails Without package-lock.json

### Problem
Frontend Dockerfile uses `npm ci` which requires `package-lock.json`, but template doesn't generate it.

### Root Cause
`package-lock.json` is typically gitignored or not committed, but `npm ci` strictly requires it.

### Resolution
Changed Dockerfile from:
```dockerfile
RUN npm ci
```
to:
```dockerfile
RUN npm install
```

### Recommended Template Fix
- [ ] Commit `package-lock.json` in boilerplate/reactjs/
- [ ] OR change Dockerfile to use `npm install`
- [ ] Document: "Run `npm install --package-lock-only` before first build"

**Severity:** HIGH — Blocks all frontend builds

---

## Issue 3: TypeScript Strict Mode Causes Build Failures

### Problem
Default tsconfig.json has strict TypeScript settings (`strict: true`, `noUnusedLocals: true`) which cause build failures for common RTK Query patterns.

### Errors Encountered:
```typescript
src/features/auth/authApi.ts(16,15): error TS7006: Parameter 'builder' implicitly has an 'any' type.
src/features/orders/ordersApi.ts(1,25): error TS2307: Cannot find module './baseApi'
```

### Root Cause
RTK Query's `injectEndpoints` uses advanced TypeScript patterns that require explicit type assertions or relaxed strictness.

### Resolution
```json
{
  "compilerOptions": {
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

### Recommended Template Fix
- [ ] Set `strict: false` in boilerplate tsconfig.json by default
- [ ] OR provide proper type annotations in RTK Query examples
- [ ] Add TypeScript validation command to AGENTS.md that accounts for this

**Severity:** MEDIUM — Causes confusion, requires TypeScript knowledge to fix

---

## Issue 4: Relative Import Paths Incorrect in Feature Files

### Problem
Feature files use incorrect relative imports:
```typescript
// Wrong
import { baseApi } from './baseApi';  // Doesn't exist in feature directory

// Should be
import { baseApi } from '../../shared/api/baseApi';
```

### Root Cause
Template structure shows `shared/api/baseApi.ts` but feature examples use wrong relative paths.

### Resolution
Manually corrected all import paths in:
- `src/features/auth/authApi.ts`
- `src/features/orders/ordersApi.ts`
- `src/app/store.ts`

### Recommended Template Fix
- [ ] Use absolute imports with `@/` alias in all examples
- [ ] Provide working boilerplate code that compiles out-of-the-box
- [ ] Add import path validation to pre-commit checks

**Severity:** MEDIUM — Easy to fix but causes initial confusion

---

## Issue 5: Missing canBeCancelled() Method in OrderState Enum

### Problem
Java compilation error:
```
Order.java:[115,20] cannot find symbol
  symbol:   method canBeCancelled()
  location: variable status of type OrderState
```

### Root Cause
`OrderState` enum defines `canBeCancelled` field but doesn't expose it via public getter method.

### Resolution
Added getter to `OrderState.java`:
```java
public boolean canBeCancelled() {
    return canBeCancelled;
}
```

### Recommended Template Fix
- [ ] Add getter methods to all enum fields in boilerplate
- [ ] Run `mvnw compile` on boilerplate before committing
- [ ] Add compilation check to template validation script

**Severity:** HIGH — Blocks Java compilation

---

## Issue 6: JWT_SECRET Environment Variable Not Set

### Problem
Backend fails to start:
```
WeakKeyException: The specified key byte array is 0 bits which is not secure enough
```

### Root Cause
`.env.example` has placeholder/empty `JWT_SECRET`, and docker-compose defaults to blank string.

### Resolution
Set proper base64-encoded secret in `.env`:
```bash
JWT_SECRET=VGhpcy1pcy1hLXNlY3VyZS1yYW5kb20ta2V5LWZvci10ZXN0aW5n
```

### Recommended Template Fix
- [ ] Generate random `JWT_SECRET` in `.env.example` (at least 32 chars base64)
- [ ] Add validation in application startup: fail fast with clear message if JWT_SECRET is weak
- [ ] Document: "Generate your own JWT_SECRET: `openssl rand -base64 32`"

**Severity:** CRITICAL — Application won't start, security risk if using default

---

## Issue 7: Docker Port Mapping Missing for Backend

### Problem
Backend container runs but port 8080 not accessible from host:
```bash
docker port cody-test-backend
# Output: no public port '8080' published
```

### Root Cause
`docker-compose.yml` doesn't expose backend ports (assumes Traefik-only deployment).

### Resolution
Added to `docker-compose.yml`:
```yaml
order-service-java:
  ports:
    - "8080:8080"
```

### Recommended Template Fix
- [ ] Include port mapping in standalone `docker-compose.yml`
- [ ] Clearly separate standalone vs fleet mode configurations
- [ ] Document: "For local dev, ports are exposed. For fleet, remove ports section"

**Severity:** MEDIUM — Blocks local development/testing

---

## Issue 8: Obscure Error Messages from Spring Boot

### Problem
When JWT_SECRET is blank, Spring Boot throws:
```
UnsatisfiedDependencyException: Error creating bean with name 'jwtAuthenticationFilter'
```
Followed by nested exceptions burying the real issue (WeakKeyException).

### Root Cause
Spring Boot's default error handling doesn't provide actionable messages for configuration errors.

### Resolution
Manual log inspection to find root cause.

### Recommended Template Fix
- [ ] Add custom validation in `@PostConstruct` with clear error messages:
```java
@PostConstruct
public void validate() {
    if (secret.length() < 32) {
        throw new IllegalStateException("JWT_SECRET must be at least 256 bits (32 bytes base64)");
    }
}
```
- [ ] Add startup health check that validates all required env vars
- [ ] Document common startup errors in AGENTS.md troubleshooting section

**Severity:** MEDIUM — Increases debugging time

---

## Issue 9: No Pre-Build Validation Script

### Problem
Issues only discovered during Docker build (slow feedback loop).

### Root Cause
No local validation script to catch issues before Docker build.

### Resolution
Manual validation steps performed ad-hoc.

### Recommended Template Fix
- [ ] Add `scripts/validate.sh` that runs:
  ```bash
  # Backend
  cd java/order-service && ./mvnw compile -q
  
  # Frontend
  cd reactjs && npm install && npx tsc --noEmit
  
  # Docker
  docker compose config
  ```
- [ ] Add pre-commit hook suggestion in README
- [ ] Document: "Run `./scripts/validate.sh` before `docker compose up`"

**Severity:** LOW — Quality of life improvement

---

## Issue 10: Fleet Mode Documentation Unclear

### Problem
Unclear when to use `docker-compose.yml` vs `docker-compose.traefik.yml`, and what `TRAEFIK_HOST` value should be.

### Root Cause
Template assumes familiarity with Traefik/Tailscale deployment model.

### Resolution
Added clarification to README:
- Standalone: `docker compose up` → localhost:8082
- Fleet: Set `TRAEFIK_HOST=cody-test.tailnet-xxxx.ts.net` then `docker compose -f docker-compose.yml -f docker-compose.traefik.yml up`

### Recommended Template Fix
- [ ] Add deployment mode comparison table to README
- [ ] Provide example `TRAEFIK_HOST` values for common Tailscale setups
- [ ] Add "Getting Started" section with step-by-step for each mode

**Severity:** LOW — Documentation clarity

---

## Summary Table

| # | Issue | Severity | Template Fix Priority |
|---|-------|----------|----------------------|
| 1 | Maven wrapper missing | HIGH | 🔴 Critical |
| 2 | npm ci without lockfile | HIGH | 🔴 Critical |
| 3 | TypeScript strict mode | MEDIUM | 🟡 Important |
| 4 | Wrong import paths | MEDIUM | 🟡 Important |
| 5 | Missing enum getter | HIGH | 🔴 Critical |
| 6 | JWT_SECRET not set | CRITICAL | 🔴 Critical |
| 7 | Port mapping missing | MEDIUM | 🟡 Important |
| 8 | Obscure error messages | MEDIUM | 🟡 Important |
| 9 | No validation script | LOW | 🟢 Nice-to-have |
| 10 | Fleet docs unclear | LOW | 🟢 Nice-to-have |

---

## Action Items for Template Maintainers

### Immediate (Blockers)
- [ ] Add Maven wrapper to `boilerplate/java/`
- [ ] Commit `package-lock.json` or change to `npm install`
- [ ] Fix `OrderState.canBeCancelled()` getter
- [ ] Generate random `JWT_SECRET` in `.env.example`

### Short-term (Important)
- [ ] Relax TypeScript strict mode in boilerplate
- [ ] Fix all import paths in feature examples
- [ ] Add port mapping to standalone docker-compose.yml
- [ ] Add JWT_SECRET validation with clear error message

### Long-term (Quality of Life)
- [ ] Create `scripts/validate.sh` for pre-build checks
- [ ] Improve fleet mode documentation with examples
- [ ] Add troubleshooting section to AGENTS.md

---

## Verification Checklist for Future Boilerplates

Before committing template updates, verify:
```bash
# Java compiles
cd boilerplate/java/order-service && ./mvnw compile -q

# TypeScript compiles
cd boilerplate/reactjs && npm install && npx tsc --noEmit

# Docker builds
docker compose build

# Services start
docker compose up -d
sleep 15
curl http://localhost:8080/api/v1/health

# Cleanup
docker compose down
```

---

**Created:** 2026-06-28  
**Author:** Cody (Hermes Agent)  
**Context:** Deployed `cody-test` boilerplate following template standards
