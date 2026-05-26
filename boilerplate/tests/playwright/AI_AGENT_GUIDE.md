# AI Agent Guide: E2E Test Enforcement

> **For:** AI agents (Hermes, Claude Code, Codex, etc.) working on this project  
> **Purpose:** Mandatory workflow for E2E test creation and validation  
> **Enforcement:** Automated via skill `enforce-e2e-tests-on-code-changes`

---

## Canonical Example (Read This First)

**User request:** "Add discount field to order form"

**Your execution:**
1. `ctx_search(queries: ["order form test"])` ← Check existing tests
2. Create `e2e/discount.spec.ts` ← Tests FIRST
3. `npm run e2e -- --grep "discount"` ← Should FAIL (not implemented)
4. Implement feature in `OrderForm.tsx`
5. `npm run e2e -- --grep "discount"` ← Should PASS
6. `npm run e2e` ← Full suite validation
7. `git commit -m "feat: discount field (#74) - 2 tests added"`
8. `gh issue comment 74 --body "Done. Tests passing."`

**This is the pattern. Follow it exactly.**

---

## ⚠️ Non-Negotiable Rules

1. **NEVER** write code before tests exist and pass
2. **NEVER** commit without running full test suite
3. **NEVER** skip tests without explicit issue reference
4. **ALWAYS** run `npm run e2e` before committing
5. **ALWAYS** reference test file + count in commit message

**Violation = Task failure. No exceptions.**

---

## CRITICAL: Test-First Mandate

**AI agents MUST follow this workflow for EVERY code change:**

```
┌─────────────────────────────────────────────────────────────┐
│  BEFORE writing ANY code:                                   │
│  1. Search existing tests (ctx_search)                      │
│  2. Create/update tests FIRST                               │
│  3. Run tests locally (MUST PASS)                           │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  THEN implement code changes                                │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│  AFTER implementation:                                      │
│  1. Re-run tests (verify still passing)                     │
│  2. Commit with test reference                              │
│  3. Update GitHub issue                                     │
└─────────────────────────────────────────────────────────────┘
```

**Violation = Task Failure.** Do not proceed without tests.

---

## Automatic Skill Activation

This skill auto-triggers when you:

- Receive a task involving code modification
- User says "add feature", "fix bug", "update component"
- You're about to write source code (`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.java`, `.py`)
- Pre-commit validation is needed

**Skill:** `enforce-e2e-tests-on-code-changes`

---

## Step-by-Step Workflow

### Step 1: Analyze the Request

**User:** "Add a discount field to the order form"

**AI Agent thinks:**
```
- This is a code modification task
- Affected files: OrderForm component, Order entity, API endpoint
- Need to check existing tests first
- Must create E2E tests BEFORE implementation
```

**Action:** Load existing tests
```python
ctx_search(queries: ["order form test", "discount test"], source: "playwright-e2e-template")
```

### Step 2: Determine Test Strategy

**Check results:**

| Scenario | Action |
|----------|--------|
| Tests exist for order form | Plan to add discount test cases |
| No tests exist | Create new spec file |
| Partial coverage | Add missing scenarios |

**Decision tree:**
```
Is there an existing e2e/orders.spec.ts?
├─ YES → Add test cases for discount functionality
└─ NO → Create new e2e/discount.spec.ts
```

### Step 3: Create Tests (BEFORE Implementation)

**Write test file:**

```typescript
// e2e/discount.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Discount Codes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('applies valid discount to order total', async ({ page }) => {
    await page.goto('http://localhost:5173/orders/new');
    await page.getByLabel('Customer ID').fill('550e8400-e29b-41d4-a716-446655440001');
    await page.getByLabel('Discount Code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('10% discount applied')).toBeVisible();
    await expect(page.getByText('Total:')).toContainText(/\d+\.\d{2}/);
  });

  test('rejects invalid discount code', async ({ page }) => {
    await page.goto('http://localhost:5173/orders/new');
    await page.getByLabel('Discount Code').fill('INVALID');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Invalid discount code')).toBeVisible();
  });
});
```

### Step 4: Run Tests Locally

**Command:**
```bash
npm run e2e -- --grep "discount"
```

**Expected outcome:** Tests FAIL (feature not implemented yet)

**If tests pass unexpectedly:**
- Check if test assertions are correct
- Verify test is actually testing the new behavior
- Fix test logic

**If tests fail as expected:**
- ✅ Good - proceed to implementation

### Step 5: Implement Code Changes

Now implement the actual feature:

```typescript
// src/features/order/ui/OrderForm.tsx
// Add discount field and logic

// src/entities/order/model.ts
// Add discount field to Order type

// src/shared/api/order.ts
// Add discount endpoint call
```

### Step 6: Re-Run Tests

**Command:**
```bash
npm run e2e -- --grep "discount"
```

**Expected outcome:** Tests PASS

**If tests fail:**
- Debug the issue
- Fix code OR fix test (whichever is wrong)
- Re-run until green

**If tests pass:**
- ✅ Run full test suite to ensure nothing broke:
  ```bash
  npm run e2e
  ```

### Step 7: Commit with Test Reference

**Commit message format:**
```bash
feat: add discount field to order form (#74)

- Added discount field to OrderForm component
- Updated Order entity with discount property
- Added API endpoint for discount validation
- Added E2E tests: e2e/discount.spec.ts (2 tests)
- All 54 E2E tests passing

Closes #74
```

**Key elements:**
- ✅ Feature description
- ✅ Files changed
- ✅ Test files added/updated
- ✅ Test count and status
- ✅ GitHub issue reference

### Step 8: Update GitHub Issue

**Comment on issue:**
```bash
gh issue comment 74 --body "
## Implementation Complete

### Changes
- Added discount field to order form
- Implemented discount validation logic
- Added E2E tests (2 scenarios)

### Test Results
- ✅ All 54 E2E tests passing
- ✅ Smoke tests passing
- ✅ No regressions

### Files Modified
- src/features/order/ui/OrderForm.tsx
- src/entities/order/model.ts
- src/shared/api/order.ts
- e2e/discount.spec.ts (new)

PR: #124
"
```

---

## Error Handling

**If ctx_search returns no results:**
→ Create new test spec file

**If npm run e2e fails before implementation:**
→ Good, proceed to code

**If npm run e2e fails after implementation:**
→ Debug: is it the test or the code?
→ Fix whichever is wrong
→ Re-run until green

**If unrelated tests fail:**
→ You broke something
→ Fix before committing
→ Do not commit broken tests

---

## Test Creation Patterns

### Pattern 1: New Feature

```typescript
// 1. Create new spec file
// e2e/new-feature.spec.ts

test.describe('New Feature Name', () => {
  test('positive scenario - happy path', async ({ page }) => {
    // Test the main use case
  });

  test('negative scenario - error handling', async ({ page }) => {
    // Test error cases
  });

  test('edge case - boundary conditions', async ({ page }) => {
    // Test edge cases
  });
});

// 2. Run tests (should fail)
npm run e2e -- --grep "new feature"

// 3. Implement feature

// 4. Run tests (should pass)
npm run e2e -- --grep "new feature"
```

### Pattern 2: Bug Fix (Regression Test)

```typescript
// 1. Add regression test FIRST
test('regression: #123 - bug description', async ({ page }) => {
  // This test would have caught the bug
  // Write it so it FAILS on current code
  await page.goto('...');
  await expect(page.getByText('Expected Behavior')).toBeVisible();
});

// 2. Verify test fails
npm run e2e -- --grep "regression"  // Should FAIL ❌

// 3. Implement fix

// 4. Verify test passes
npm run e2e -- --grep "regression"  // Should PASS ✅
```

### Pattern 3: Refactoring or UI Change

```typescript
// 1. Find tests that use this component
ctx_search(queries: ["component name test"], source: "playwright-e2e-template")

// 2. Run all existing tests BEFORE changes
npm run e2e  // All must pass ✅

// 3. Make refactoring changes

// 4. Run all tests AFTER changes
npm run e2e  // All must still pass ✅

// 5. Update selectors if structure changed
// OLD: await page.locator('.btn-primary').click();
// NEW: await page.getByRole('button', { name: 'Submit' }).click();
```

---

## Context-Mode Queries

Use these to find existing tests:

```python
# Find tests for a feature
ctx_search(queries: ["order form test"], source: "playwright-e2e-template")

# Find API tests
ctx_search(queries: ["orders API test"], source: "playwright-e2e-template")

# Find login tests
ctx_search(queries: ["authentication test"], source: "playwright-e2e-template")

# Find page object examples
ctx_search(queries: ["page object model"], source: "playwright-e2e-template")

# Find test patterns
ctx_search(queries: ["test.describe test pattern"], source: "playwright-e2e-template")
```

---

## Commands Reference

```bash
# Run all E2E tests
npm run e2e

# Run specific test file
npm run e2e -- e2e/orders.spec.ts

# Run tests matching pattern
npm run e2e -- --grep "order"

# Run smoke tests only
npm run e2e -- --grep="@smoke"

# Debug mode (Playwright Inspector)
npm run e2e:debug

# UI mode (interactive)
npm run e2e:ui

# Headed mode (visible browser)
npm run e2e:headed

# Show HTML report
npm run e2e:report

# Install browsers (if needed)
npx playwright install
```

---

## Pre-Commit Validation

**Before committing, AI agent MUST:**

```bash
# 1. Run full test suite
npm run e2e

# 2. Verify exit code is 0
# If not, fix failing tests

# 3. Check git status
git status

# 4. Ensure test files are staged
git add e2e/discount.spec.ts

# 5. Commit with proper message
git commit -m "feat: add discount (#74)

- Implemented feature
- Added E2E tests (2 tests)
- All 54 tests passing"
```

---

## CI/CD Awareness

AI agents should understand:

**GitHub Actions will:**
1. Detect code changes in PR
2. Check if tests were modified
3. Post warning comment if no tests
4. Run full E2E suite
5. Block merge if tests fail

**If CI fails after your commit:**
- Check the workflow logs
- Identify failing tests
- Fix issues immediately
- Push fixes (CI runs automatically)

---

## Common Pitfalls

### ❌ NEVER Do This

```typescript
// ❌ Writing code without tests
export function addDiscount(order, code) {
  // Implementation
}
// TODO: add tests later

// ❌ Skipping tests without reason
test.skip('flaky test', async ({ page }) => {...});

// ❌ Disabling CI/CD
# Skip this check for now
// run: echo "tests disabled"

// ❌ Vague commit messages
git commit -m "fixed stuff"
```

### ✅ ALWAYS Do This

```typescript
// ✅ Tests FIRST
test('applies discount', async ({ page }) => {...});
npm run e2e;  // Verify fails
// Then implement

// ✅ Proper skip with reason
test.skip('flaky: waiting for #456', async ({ page }) => {...});

// ✅ Descriptive commits
git commit -m "feat: add discount field (#74)

- Added discount field to OrderForm
- Added E2E tests: discount.spec.ts (2 tests)
- All 54 tests passing"
```

---

## Decision Tree

```
User requests code change
         ↓
┌─────────────────────────────┐
│ Search existing tests       │
│ ctx_search(...)             │
└─────────────────────────────┘
         ↓
    Tests exist?
    ├─ YES → Update existing tests
    │        ↓
    │   Add new test cases
    │        ↓
    │   Run tests (must pass)
    │
    └─ NO → Create new spec file
             ↓
         Write test cases
             ↓
         Run tests (expect fail)
             ↓
         Implement feature
             ↓
         Run tests (must pass)
             ↓
         Run full suite
             ↓
         Commit with test ref
```

---

## Verification Checklist

**Before marking task complete:**

```markdown
- [ ] Searched existing tests (ctx_search)
- [ ] Created/updated E2E tests
- [ ] Tests pass locally (`npm run e2e`)
- [ ] No unrelated tests broken
- [ ] Test file staged for commit
- [ ] Commit message references tests
- [ ] GitHub issue updated
- [ ] Ready for PR
```

---

## Integration with Other Skills

- **test-driven-development**: Use for unit test enforcement
- **verification-before-completion**: Use before marking complete
- **github-pr-workflow**: Use for PR creation
- **github-issues-workflow**: Use for issue tracking
- **requesting-code-review**: Use when requesting review

---

*This workflow is MANDATORY. Do not skip steps. Do not proceed without tests.*

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
