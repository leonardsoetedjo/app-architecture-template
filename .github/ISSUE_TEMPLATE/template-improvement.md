---
name: 🔧 Template Improvement
about: Suggest improvements to the app-architecture-template
title: '[IMPROVEMENT] Fix boilerplate issues discovered during cody-test deployment'
labels: ['enhancement', 'boilerplate', 'high-priority']
assignees: ''
---

## Summary
During deployment of `cody-test` boilerplate (Java 21 + ReactJS), **10 distinct issues** were encountered that caused build failures and deployment blockers. This issue consolidates all findings and proposes fixes.

## Issues Discovered

### CRITICAL / HIGH Priority (Blockers)

#### 1. Maven Wrapper Missing
- **Problem:** New projects lack `mvnw` and `.mvn/`, causing immediate build failure
- **Fix:** Add Maven wrapper to `boilerplate/java/` directory
- **Impact:** 🔴 Blocks all Java builds

#### 2. npm ci Without package-lock.json
- **Problem:** Frontend Dockerfile uses `npm ci` but no lockfile exists
- **Fix:** Either commit `package-lock.json` OR change to `npm install`
- **Impact:** 🔴 Blocks all frontend builds

#### 3. Missing `canBeCancelled()` Getter in OrderState
- **Problem:** `OrderState` enum has field but no getter, causing compilation error
- **Fix:** Add `public boolean canBeCancelled() { return canBeCancelled; }`
- **Impact:** 🔴 Blocks Java compilation

#### 4. JWT_SECRET Not Set / Too Weak
- **Problem:** `.env.example` has placeholder, causing `WeakKeyException` at startup
- **Fix:** Generate random 32+ char base64 secret; add validation with clear error message
- **Impact:** 🔴 Application won't start; security risk

### MEDIUM Priority (Important)

#### 5. TypeScript Strict Mode Causes Failures
- **Problem:** `strict: true` causes RTK Query patterns to fail
- **Fix:** Set `strict: false` in boilerplate tsconfig.json
- **Impact:** 🟡 Requires TypeScript knowledge to fix

#### 6. Wrong Import Paths in Feature Files
- **Problem:** Features use `./baseApi` instead of `../../shared/api/baseApi`
- **Fix:** Correct all import paths; use `@/` alias
- **Impact:** 🟡 Causes confusion, easy to fix

#### 7. Backend Port Not Exposed
- **Problem:** `docker-compose.yml` doesn't expose port 8080 for local dev
- **Fix:** Add `ports: ["8080:8080"]` to backend service
- **Impact:** 🟡 Blocks local testing

#### 8. Obscure Spring Boot Error Messages
- **Problem:** Configuration errors buried in nested exceptions
- **Fix:** Add `@PostConstruct` validation with clear messages
- **Impact:** 🟡 Increases debugging time

### LOW Priority (Quality of Life)

#### 9. No Pre-Build Validation Script
- **Fix:** Add `scripts/validate.sh` for local checks before Docker build

#### 10. Fleet Mode Documentation Unclear
- **Fix:** Add deployment mode comparison table; provide `TRAEFIK_HOST` examples

## Proposed Action Plan

### Phase 1: Immediate Fixes (This Week)
- [ ] Add Maven wrapper to `boilerplate/java/`
- [ ] Commit `package-lock.json` in `boilerplate/reactjs/`
- [ ] Fix `OrderState.canBeCancelled()` getter
- [ ] Generate random `JWT_SECRET` in `.env.example`
- [ ] Add JWT validation with clear error message

### Phase 2: Important Improvements (Next Week)
- [ ] Relax TypeScript strict mode in boilerplate
- [ ] Fix all import paths; document `@/` alias usage
- [ ] Add port mapping to standalone docker-compose.yml
- [ ] Improve error messages for common configuration issues

### Phase 3: Documentation & Tooling (Following Week)
- [ ] Create `scripts/validate.sh` for pre-build checks
- [ ] Add deployment mode comparison to README
- [ ] Create troubleshooting section in AGENTS.md
- [ ] Add boilerplate issue template to `.github/issue-templates/`

## Verification Checklist

After fixes, verify:
```bash
# Java compiles
cd boilerplate/java/order-service && ./mvnw compile -q

# TypeScript compiles
cd boilerplate/reactjs && npm install && npx tsc --noEmit

# Docker builds successfully
docker compose build

# Services start and health check passes
docker compose up -d
sleep 15
curl http://localhost:8080/api/v1/health

# Cleanup
docker compose down
```

## Reference

Full detailed analysis: `issues-found-cody-test.md` (attached to this repo)

**Deployment Context:**
- Project: `cody-test` (Java 21 + ReactJS monorepo)
- Date: 2026-06-28
- Agent: Cody (Hermes Agent)
- All issues resolved manually; documented for template improvement

## Labels
- `bug` - Multiple bugs in boilerplate code
- `boilerplate` - Affects template users
- `high-priority` - Blocks deployments
- `documentation` - Several docs improvements needed
- `java` - Java backend issues
- `typescript` - Frontend TypeScript issues
- `docker` - Docker configuration issues

---

**Related:** None (new issue)  
**Severity:** High (multiple blockers)  
**Estimated Effort:** 4-6 hours for all fixes
