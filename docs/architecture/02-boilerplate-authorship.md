# Boilerplate Integration Checklist

**Version**: 1.0
**Last Updated**: 2026-06-26
**Applies to**: ALL new boilerplate stacks and modifications to existing ones
**Standard Reference**: `docs/01-agnostic/01-standards/29-harness-engineering.md`

---

## Purpose

Every boilerplate stack (Java, NestJS, Python, ReactJS, Quasar, and all future stacks) must pass this checklist before it can be declared "ready" by any agent (Cody, Archie, or human). The checklist is derived from the failure mode documented in [#222](https://github.com/leonardsoetedjo/app-architecture-template/issues/222): independently-authored pieces that compile in isolation can still fail when integrated end-to-end.

---

## Philosophy

> **The login flow is the integration test.** If authentication works, the frontend proxy is correct, the backend CORS is correct, the DB schema matches, the DTOs align, and the wiring is sound. If it fails, at least one of those is broken.

---

## Base Checklist (MANDATORY — All Stacks)

Every boilerplate, regardless of language or framework, must pass the following gates before it is considered complete.

### 1. Type Safety Gate

```
□ Compile / type-check passes with ZERO errors
  □ No `any` types unless explicitly justified and annotated
  □ No missing type definitions for third-party libraries
```

**Verification**: `npx tsc --noEmit` (TS), `mvn compile` (Java), `python -m mypy .` (Python)

### 2. Build Gate

```
□ Docker build succeeds for both frontend and backend images
  □ No build-time warnings treated as errors (if configured)
  □ Image size is reasonable (< 500MB for Java, < 200MB for Node.js)
□ docker compose up starts all services without manual intervention
```

**Verification**: `docker build -t <image> .` and `docker compose up -d`

### 3. Smoke Test Gate

```
□ Bruno smoke tests pass against running backend
  □ Health check: GET /actuator/health (or equivalent) returns 200
  □ Login: POST /auth/login returns JWT with accessToken
  □ Orders: GET /orders returns paginated response (status 200)
□ Bruno collection at boilerplate/tests/bruno/ is up-to-date
  □ Environment file exists for this stack (e.g., java-local.bru, local.bru)
```

**Verification**: `bru run --env <env>` from `boilerplate/tests/bruno/`

### 4. E2E Test Gate

```
□ Playwright E2E tests pass (for web app boilerplates)
  □ Login flow test: navigate → login → authenticated state
  □ At least one feature-level test exists (e.g., create order)
□ Test execution time < 60 seconds per browser
```

**Verification**: `npx playwright test --project=chromium`

**Note**: Web app boilerplates MUST have Playwright tests. API-only stacks (no frontend) skip this gate.

### 5. Configuration Gate

```
□ Frontend proxy target uses localhost:PORT, not Docker hostname
  □ Vite: check vite.config.ts proxy target
  □ Webpack / CRA: check devServer proxy config
□ BrowserRouter basename is empty or env-driven (not hardcoded)
□ CORS allowed-origins is env-driven, not wildcard in production
□ API base URL is env-driven (VITE_API_BASE_URL, etc.)
```

**Verification**: `cat .env.example` + `grep -r "proxy\|basename" vite.config.ts`

### 6. Architecture Gate

```
□ Lefthook pre-commit gates pass (or produce only documented violations)
  □ Java: ArchUnit `*RulesTest` all pass
  □ NestJS/ReactJS/Quasar: dependency-cruiser 0 violations
  □ Python: pytest tests/archunit/ pass
□ No forbidden framework imports in domain layer
```

**Verification**: `lefthook run pre-commit` (or `npx depcruise --validate`, `mvn test -Dtest='*RulesTest'`)

### 7. Documentation Gate

```
□ AGENTS.md exists and is accurate for this stack
□ README.md includes:
  □ How to start the dev server
  □ How to run tests (unit + integration + E2E)
  □ How to install lefthook (one-time setup per clone)
□ feature-list.json exists and lists all demonstrated features
□ init.sh exists and can verify the stack is healthy
```

**Verification**: `test -f AGENTS.md && test -f README.md && test -f feature-list.json && test -f init.sh`

---

## Per-Stack Appendix

### A. Java Spring Boot

```
□ DB columns use snake_case (match Flyway migration)
□ All use cases have interface + implementation pair
□ Domain entities are POJOs (no Spring/JPA/Lombok annotations)
□ Repository interfaces live in domain/ports/
□ ArchUnit tests cover:
  □ Clean Architecture layer rules
  □ MDC hygiene (no MDC.clear() in domain)
  □ Optimistic locking on aggregates
□ Testcontainers integration tests pass with real PostgreSQL
```

### B. NestJS

```
□ All use cases have @Inject() decorator (constructor injection)
□ Enum values match Java/Python domain model
□ No NestJS framework imports in domain/ application layers
□ DTOs at every boundary (no entity leakage)
□ dependency-cruiser config is valid (no to:[array] syntax errors)
```

### C. Python FastAPI

```
□ SQLAlchemy models use snake_case columns
□ Domain models are pure dataclasses (no FastAPI/SQLAlchemy imports)
□ Repository pattern: interface in domain/, implementation in infrastructure/
□ pytest-archon or equivalent architecture tests pass
```

### D. ReactJS (FSD)

```
□ Feature-Sliced Design layers respected:
  □ entities/ → no imports from features/, pages/, app/
  □ features/ → no imports from pages/
  □ shared/ → no imports from any other layer
  □ pages/ → can import from all layers
□ dependency-cruiser config matches actual src/ structure
□ baseApi (RTK Query) lives in shared/api/ (not features/)
```

### E. Quasar (Vue 3)

```
□ Composables receive services via DI (not direct imports from services/)
□ Stores do not import UI components
□ API client lives in composables/ or services/ (not in components/)
□ Pinia stores are feature-scoped, not global singletons
```

---

## CI Integration

The base checklist is enforced automatically in CI. The per-stack appendix is verified by PR reviewers.

### Automated (CI runs these on every PR touching `boilerplate/`)

| Gate | CI Job | File |
|------|--------|------|
| Type-check / Compile | `type-check` | `.github/workflows/pre-commit.yml` |
| Docker build | `build` | `.github/workflows/docker-build.yml` |
| Bruno smoke test | `smoke-test-*` | `.github/workflows/smoke-test.yml` |
| Playwright E2E | `smoke-test-*` | `.github/workflows/smoke-test.yml` |
| Architecture | `architecture-gate` | `.github/workflows/architecture-gate.yml` |

### Manual (PR reviewer verifies)

| Gate | Reviewer Action |
|------|-----------------|
| Config sanity (proxy, basename, env vars) | Review `.env.example` + `vite.config.ts` |
| Per-stack appendix | Check off items in PR description |
| Documentation completeness | Verify AGENTS.md, README.md, feature-list.json |

---

## PR Template Integration

All PRs modifying boilerplate MUST include the following section in the PR description. Use the [PR template](../../.github/pull_request_template.md) which references this checklist.

```markdown
## Boilerplate Integration Checklist

- [ ] Base checklist passes (CI will verify automatically)
- [ ] Per-stack appendix verified (reviewer checks)
  - [ ] Java: ArchUnit, snake_case, constructor injection
  - [ ] NestJS: @Inject(), depcruise config, enum parity
  - [ ] Python: SQLAlchemy model parity, domain purity
  - [ ] ReactJS: FSD layers, depcruise matches structure
  - [ ] Quasar: DI pattern, Pinia scope, API isolation
- [ ] Login flow end-to-end tested (screenshot or CI link)
```

---

## Retroactive Verification Log

This section records when existing stacks were verified against this checklist.

| Stack | Date | Verified By | Status | Notes |
|-------|------|-------------|--------|-------|
| Java | 2026-06-26 | Archie | ✅ PASS | `mvn compile` OK, ArchUnit 7/7, docker build OK, init.sh OK, feature-list.json valid |
| NestJS | 2026-06-26 | Archie | ✅ PASS | `tsc --noEmit` 0 errors, docker build OK, depcruise 0 violations |
| ReactJS | 2026-06-26 | Archie | ✅ PASS | `tsc --noEmit` 0 errors, depcruise 0 violations, lint OK, docker build OK, baseApi layer fixed |
| Python | 2026-06-26 | Archie | ✅ PASS | lefthook OK, feature-list.json valid, docker build OK (switched from UBI to `python:3.12-slim`) |
| Quasar | 2026-06-26 | Archie | ✅ PASS | depcruise 0 violations, init.sh OK, docker build OK (fixed `src/` absolute imports + uses `npx vite build`) |

---

## Enforcement

- **Cody (implementation agent)**: Must complete the base checklist before declaring a stack "ready"
- **Archie (audit agent)**: Must verify the base checklist + per-stack appendix before approving a PR
- **CI**: Blocks merge if any automated gate fails
- **PR reviewer**: Must check off manual items before approving

Failure to complete this checklist is a **Tier-1 quality gate violation** per `docs/01-agnostic/01-standards/29-harness-engineering.md`.

---

*This document is a mandatory artifact. Keep it in git.*
