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

---

## Acceptance Criteria for E2E Tests

- [ ] `docker-compose.e2e.yml` runs backend + frontend + DB together
- [ ] Playwright tests verify full user journeys (login, CRUD, error handling)
- [ ] CI runs E2E tests on PR to `main`
- [ ] Test fixtures include seed data and cleanup
- [ ] Documentation includes E2E testing strategy
- [ ] Works for all stack combinations

---

## Related Standards

- Standard 10: `docs/01-agnostic/01-standards/10-testing.md` — General testing standards
- Standard 24: `docs/01-agnostic/01-standards/24-complete-testing-harness.md` — Complete testing harness
- Playwright Tests: `boilerplate/tests/playwright/`
- Bruno Tests: `boilerplate/tests/bruno/`
- Docker Compose: `docker-compose.e2e.yml`
