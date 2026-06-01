name: Playwright E2E - Enforce Tests on Every Code Update

trigger: Any code change to frontend or backend services

goal: Ensure every code change has corresponding E2E tests that pass before merge

---

## Workflow Steps

### 1. BEFORE Making Code Changes

**AI Agent MUST:**
1. Check if existing E2E tests cover the affected feature
   ```bash
   # Search for related tests
   ctx_search(queries: ["orders page test"], source: "playwright-e2e-template")
   ```
2. If tests exist → Update them to cover new behavior
3. If tests don't exist → Create new test spec following templates

### 2. AFTER Making Code Changes

**AI Agent MUST:**
1. Run E2E tests locally before committing:
   ```bash
   npm run e2e
   ```
2. If tests fail → Fix code OR fix tests (never skip)
3. Verify test coverage matches the change scope
4. Only then commit and push

### 3. Pre-Commit Validation (Automated)

**Install pre-commit hook:**
```bash
# Add to package.json scripts
{
  "scripts": {
    "precommit": "npm run e2e -- --grep=@smoke",
    "e2e": "playwright test"
  }
}
```

**Or use Husky:**
```bash
npm install -D husky
npx husky install
npx husky add .husky/pre-commit "npm run e2e -- --grep=@smoke"
```

### 4. CI/CD Gate (Automated)

**GitHub Actions blocks merge if:**
- E2E tests not present for changed files
- E2E tests fail
- Test coverage below threshold

---

## AI Agent Test Creation Checklist

**When modifying ANY code, AI agent MUST:**

### For New Features
- [ ] Create new E2E test spec in `e2e/` directory
- [ ] Follow Page Object Model pattern
- [ ] Include positive and negative test cases
- [ ] Add test to CI/CD workflow
- [ ] Verify tests pass locally

### For Bug Fixes
- [ ] Add regression test that would have caught the bug
- [ ] Verify existing tests still pass
- [ ] Update test assertions if behavior changed intentionally

### For Refactoring
- [ ] Verify all existing E2E tests still pass
- [ ] Update tests if selectors/structure changed
- [ ] No test should break without explicit reason

### For UI Changes
- [ ] Update visual regression tests (if applicable)
- [ ] Update selector-based tests
- [ ] Verify accessibility tests pass

---

## Test Naming Convention

```typescript
// Format: describe.feature.test
test.describe('Order Management', () => {
  test('creates a new order with valid data', async ({ page }) => {...});
  test('rejects order with empty items', async ({ page }) => {...});
  test('displays validation errors for invalid form', async ({ page }) => {...});
});
```

---

## Enforcement Rules

### NEVER Accept:
- ❌ Code changes without corresponding test updates
- ❌ Comments like "TODO: add tests later"
- ❌ Skipping tests with `test.skip()` without issue reference
- ❌ Disabling CI/CD checks to bypass failures

### ALWAYS Require:
- ✅ Tests created BEFORE or WITH code changes
- ✅ Tests passing locally BEFORE commit
- ✅ Tests passing in CI BEFORE merge
- ✅ Test coverage report attached to PR

---

## Quick Reference Commands

```bash
# Run all E2E tests
npm run e2e

# Run specific test file
npm run e2e -- e2e/orders.spec.ts

# Run tests matching pattern
npm run e2e -- --grep "order"

# Run in headed mode for debugging
npm run e2e:headed

# Run with UI mode
npm run e2e:ui

# Generate HTML report
npm run e2e:report
```

---

## AI Agent Pre-Commit Checklist

**MANDATORY before ANY commit:**

```markdown
- [ ] Identified all affected features from code changes
- [ ] Created/updated E2E tests for each affected feature
- [ ] Ran `npm run e2e` locally - all tests pass
- [ ] Verified no unrelated tests broken
- [ ] Added test coverage summary to commit message
- [ ] GitHub issue referenced in test comments (if applicable)
```

---

## Example AI Agent Workflow

**User:** "Add a discount field to the order form"

**AI Agent Response:**

1. **First:** Check existing tests
   ```bash
   # Load existing order tests
   ctx_search(queries: ["order form test"], source: "playwright-e2e-template")
   ```

2. **Create test BEFORE implementation:**
   ```typescript
   // e2e/orders.spec.ts
   test('applies discount code to order total', async ({ page }) => {
     // Test implementation
   });
   ```

3. **Implement feature:**
   - Add discount field to form
   - Add discount calculation logic
   - Update API endpoint

4. **Run tests:**
   ```bash
   npm run e2e -- --grep "discount"
   ```

5. **Fix any failures** → Iterate until green

6. **Commit:**
   ```bash
   git commit -m "feat: add discount field to orders (#123)

   - Added discount field to OrderForm component
   - Updated Order entity and API endpoint
   - Added E2E test: applies discount code to order total
   - All 47 E2E tests passing"
   ```

---

*This workflow is MANDATORY for all AI agents working on this project.*

**Last Updated:** 2026-05-26
