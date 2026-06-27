# Testing Standards — End-to-End (E2E)

## Overview

This document extends Standard 10 (`10-testing.md`) with full-stack E2E testing guidelines. E2E tests verify that frontend, backend, and database work together as an integrated system.

---

## Test Pyramid Placement

```
    /\
   /  \  E2E (Playwright + docker-compose)     ← This document
  /----\
 /      \ Integration (Bruno + Testcontainers)
/--------\
---------- Unit (Vitest / pytest / JUnit)
```

**Rule**: E2E tests are expensive and slow. Keep them focused on **critical user journeys**.

---

## When to Use E2E Tests

| Layer | Tool | When to Use |
|-------|------|-------------|
| Unit | Vitest / pytest / JUnit | Business logic, domain rules |
| Integration | Bruno + Testcontainers | API contract verification |
| **E2E** | **Playwright + docker-compose** | **User journeys spanning frontend → backend → DB** |

**Golden Rule**: If a bug can be caught at unit or integration level, do NOT write an E2E test for it.

---

## E2E Test Architecture

### Stack

| Component | Technology | Role |
|-----------|------------|------|
| Test Runner | Playwright (chromium) | Drive browser, assert UI |
| Frontend | ReactJS (nginx) | Serves built SPA |
| Backend | Java Spring Boot | REST API + JWT auth |
| Database | PostgreSQL 16 | Persistence |
| Cache | Redis | Sessions / rate limiting |
| Orchestrator | docker-compose | Spins up entire stack |

### File Layout

```
docker-compose.e2e.yml              # E2E stack definition
.github/workflows/e2e.yml           # CI job for E2E tests
boilerplate/tests/playwright/
├── playwright.fullstack.config.ts  # Playwright config for containers
├── e2e-fullstack/
│   └── fullstack.spec.ts           # Full-stack test specs
│       ├── Login Flow
│       ├── Order CRUD
│       └── Error Handling
└── e2e/                            # Existing template specs
    ├── login.spec.ts
    └── orders-pagination.spec.ts
```

---

## Running E2E Tests

### Local Development

```bash
# Option 1: Use npm script (from boilerplate/reactjs/)
cd boilerplate/reactjs
npm run e2e:fullstack

# Option 2: Manual docker compose
docker compose -f docker-compose.e2e.yml up --abort-on-container-exit

# Option 3: CI mode (exit code from playwright container)
docker compose -f docker-compose.e2e.yml up --abort-on-container-exit --exit-code-from playwright
```

### CI (GitHub Actions)

The `e2e.yml` workflow runs on:
- Push to `main`
- PR touching `boilerplate/java/**`, `boilerplate/reactjs/**`, `boilerplate/tests/playwright/**`, or `docker-compose.e2e.yml`

---

## Writing E2E Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Full-Stack Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login once per describe block
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 15000 });
  });

  test('user journey description', async ({ page }) => {
    // Arrange
    // Act
    // Assert (UI + API + DB)
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors:
   ```tsx
   <button data-testid="create-order-btn">Create Order</button>
   ```

2. **Assert side effects** — verify backend state, not just UI:
   ```typescript
   // After UI action, hit API directly
   const apiResponse = await request.get('http://backend:8080/api/v1/orders');
   expect(apiResponse.status()).toBe(200);
   ```

3. **Clean up after tests** — use unique identifiers to avoid collisions.

4. **Keep tests under 30 seconds** — parallelize where possible.

5. **Use `test.skip()` for flaky tests** — investigate, don't ignore.

6. **Validate API responses against OpenAPI spec** — use Ajv runtime validation:
   ```typescript
   import { validateResponse } from '@/utils/api-validator';
   
   const body = await response.json();
   validateResponse('/api/v1/orders', 'GET', 200, body);
   ```
   This catches shape mismatches that compile-time types miss (e.g., backend adds field,
   changes enum, renames property). See §Schema Validation below.

---

## Schema Validation (Ajv + OpenAPI)

### Purpose

Validate that backend API responses match the OpenAPI specification **at runtime**
during E2E tests. This complements:
- **Compile-time:** `openapi-typescript` generates TS types from the spec (#224)
- **Contract-time:** Pact verifies consumer/provider agreement (#231)
- **Runtime:** Ajv validates actual response JSON against the spec (**this section**)

### Why Runtime Validation?

| Scenario | Compile-time types | Contract tests | Runtime Ajv |
|----------|-------------------|----------------|-------------|
| Backend adds `discount` field | ❌ Silent drift | ✅ Consumer fails | ✅ Schema fails |
| Backend changes `status` enum | ❌ Silent drift | ✅ Regex mismatch | ✅ Enum fails |
| Backend returns `number` for money | ❌ Silent drift | ✅ Type mismatch | ✅ Pattern fails |
| Backend renames `orderId` → `id` | ✅ Compile error | ✅ Consumer fails | ✅ Required fails |

### File Layout

```
boilerplate/tests/playwright/
├── schemas/
│   └── openapi.json          # Extracted from backend at CI time
├── utils/
│   └── api-validator.ts      # Ajv wrapper: validateResponse(), isValidResponse()
├── e2e/
│   └── api-schema-validation.spec.ts   # Tests using the validator
└── playwright.config.ts        # 'api' project for direct backend testing
```

### Running Locally

```bash
cd boilerplate/tests/playwright

# 1. Start backend (so OpenAPI spec is available)
#    Java:  http://localhost:8080/api/v1/docs
#    NestJS: http://localhost:3000/api/docs-json
#    Python: http://localhost:8000/openapi.json

# 2. Extract the spec
curl http://localhost:8080/api/v1/docs -o schemas/openapi.json

# 3. Run schema validation tests
npx playwright test e2e/api-schema-validation.spec.ts --project=api
```

### Writing a Schema Validation Test

```typescript
import { test, expect } from '@playwright/test';
import { validateResponse } from '../utils/api-validator';

test('API response matches OpenAPI spec', async ({ request }) => {
  const response = await request.get('/api/v1/orders');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();

  // Runtime validation against OpenAPI schema
  validateResponse('/api/v1/orders', 'GET', 200, body);

  // Business assertions beyond schema
  expect(body.page).toBeGreaterThanOrEqual(0);
});
```

### What Ajv Validates

- ✅ All required fields present
- ✅ Field types: `string`, `integer`, `number`, `boolean`, `array`, `object`
- ✅ Enum values match spec exactly
- ✅ Nested object structures (recursively dereferences `$ref`)
- ✅ Array item shapes
- ✅ Format validation: `date-time`, `email`, `uuid`, `uri`
- ✅ Pattern matching: e.g., monetary amounts `^\d+\.\d{2}$`
- ✅ Nullable fields (OpenAPI 3.0 → Ajv `oneOf`)

### CI Integration

The `e2e.yml` workflow extracts the OpenAPI spec before running tests:

```yaml
# .github/workflows/e2e.yml (excerpt)
- name: Extract OpenAPI spec from backend
  run: |
    curl -sf http://localhost:8080/api/v1/docs -o boilerplate/tests/playwright/schemas/openapi.json
    echo "Spec extracted ($(wc -c < boilerplate/tests/playwright/schemas/openapi.json) bytes)"

- name: Run Playwright E2E tests with schema validation
  working-directory: ./boilerplate/tests/playwright
  run: |
    npm install
    npx playwright install chromium
    FRONTEND_URL=http://localhost:3000 API_BASE_URL=http://localhost:8080 \
      npx playwright test --project=api --project=chromium
```

### Design Decisions

1. **JSON file, not TypeScript import** — `schemas/openapi.json` is a committed snapshot
   of the spec at the time the tests were written. In CI, overwrite with the live spec
   from the running backend to detect drift.

2. **Ajv + manual dereferencing** — AJV natively compiles JSON Schema, but OpenAPI 3.0
   uses `$ref` (which AJV handles) and `nullable` (which AJV doesn't). The validator
   dereferences `nullable: true` into `{ oneOf: [schema, { type: 'null' }] }` before
   compilation.

3. **Compiled cache** — Each unique `(path, method, status)` schema is compiled once
   and cached in a `Map` across test runs for performance.

4. **Separate from type generation** — This is runtime validation, not compile-time.
   `src/generated/api.ts` (from `openapi-typescript`) gives you IDE autocomplete.
   `validateResponse()` gives you CI failure when the spec drifts.

### Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `$ref` not found | Schema references component not in spec | Regenerate spec from backend |
| `nullable` field rejected | AJV doesn't understand OpenAPI `nullable` | Already handled by dereference |
| Pattern mismatch | Backend sends `99.9` instead of `"99.90"` | Fix backend serializer (JacksonConfig) |
| Missing required field | Backend omits field in some cases | Update spec or fix backend |

---

## Acceptance Criteria for E2E Tests

- [ ] `docker-compose.e2e.yml` runs backend + frontend + DB together
- [ ] Playwright tests verify full user journeys (login, CRUD, error handling)
- [ ] CI runs E2E tests on PR to `main`
- [ ] Test fixtures include seed data and cleanup
- [ ] Documentation includes E2E testing strategy
- [ ] Works for all stack combinations
- [ ] **OpenAPI spec extracted in CI before E2E tests** (#233)
- [ ] **Ajv runtime schema validation covers Orders + Auth endpoints** (#233)
- [ ] **Monetary fields validated as strings with `^\d+\.\d{2}$` pattern** (#233)
- [ ] **Error responses (422, 404) validated against ProblemDetail schema** (#233)

---

## Related Standards

- Standard 10: `docs/01-agnostic/01-standards/10-testing.md` — General testing standards
- Standard 24: `docs/01-agnostic/01-standards/24-complete-testing-harness.md` — Complete testing harness
- Playwright Tests: `boilerplate/tests/playwright/`
- Bruno Tests: `boilerplate/tests/bruno/`
- Docker Compose: `docker-compose.e2e.yml`
