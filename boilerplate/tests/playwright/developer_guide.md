# Developer Guide: E2E Test Enforcement

> **For:** Human developers working on projects cloned from this template  
> **Purpose:** Clear instructions on E2E test requirements and workflows

---

## 5-Minute Quick Start

**The rule:** Code change = Tests required. Period.

**Your workflow:**
1. Check if tests exist: `grep -r "feature-name" e2e/`
2. Add/update tests in `e2e/your-feature.spec.ts`
3. Run: `npm run e2e`
4. Commit: `git commit -m "feat: X (#74) - tests added"`

**That's it.** Read the rest only when you hit edge cases.

---

## Your Responsibilities

### Before Committing

**MANDATORY checklist:**

```markdown
- [ ] Created/updated E2E tests for my changes
- [ ] Ran `npm run e2e` locally - all tests pass
- [ ] No unrelated tests are broken
- [ ] Added test summary to commit message
- [ ] GitHub issue referenced (if applicable)
```

### Commit Message Format

```bash
git commit -m "feat: add discount field to orders (#74)

- Added discount field to OrderForm component
- Updated Order entity and API endpoint
- Added E2E test: applies discount code (e2e/discount.spec.ts)
- All 52 E2E tests passing"
```

---

## Test Patterns (Cheat Sheet)

**New feature:** Create `e2e/feature.spec.ts` with 2-3 scenarios (happy path + error case)

**Bug fix:** Add regression test that FAILS before your fix, PASSES after

**Refactoring:** Run `npm run e2e` before & after. Update selectors if needed.

**UI change:** Use `getByRole()` instead of CSS selectors like `.btn-primary`

**Full examples:** See [examples.md](./examples.md)

---

## Do I Need Tests?

```
Code change?
├─ User-facing behavior → YES, always
├─ Bug fix → YES, regression test
├─ Refactoring → Run existing tests
└─ Comments/docs only → NO
```

**When in doubt, run tests:**
```bash
npm run e2e -- --grep "affected-feature"
```

---

## Common Scenarios

### "I just need to fix a typo"

**Still need tests if:**
- Typo is in user-facing text that tests verify
- Typo affects functionality

**Can skip tests if:**
- Typo is in comments only
- Typo is in documentation

### "I'm refactoring, no behavior changes"

**Still need to:**
1. Run all existing tests before refactoring
2. Run all tests after refactoring
3. Update tests if selectors/structure changed

```bash
# Before refactoring
npm run e2e  # All must pass

# After refactoring
npm run e2e  # All must still pass
```

### "The test is flaky"

**Never ignore flaky tests. Instead:**

1. **Identify the cause:**
   ```bash
   npm run e2e:debug
   ```

2. **Fix the test:**
   - Use explicit waits instead of timeouts
   - Use stable selectors (getByRole, getByLabel)
   - Avoid timing-dependent assertions

3. **If truly intermittent:**
   - Add retry logic
   - Document in test comment
   - Create issue to track

```typescript
// ❌ Bad: Ignoring flakiness
test.skip('flaky test', async ({ page }) => {...});

// ✅ Good: Proper retry
test('stable test', async ({ page }) => {
  await page.waitForResponse('/api/orders', { timeout: 10000 });
  await expect(page.getByRole('table')).toBeVisible();
});
```

### "I don't know how to write the test"

**Resources:**
1. Check existing tests: `e2e/*.spec.ts`
2. Review Page Object examples: `fixtures/pages/`
3. Read full examples: [examples.md](./examples.md)
4. Playwright docs: https://playwright.dev

**Start simple:**
```typescript
test('page loads', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveTitle(/Orders/);
});
```

---

## Debugging Failing Tests

### Method 1: UI Mode (Best for most cases)
```bash
npm run e2e:ui
```
Interactive UI for running tests and viewing snapshots.

### Method 2: Headed Mode (See what's happening)
```bash
npm run e2e:headed
```
Run tests in visible browser.

*Advanced: Use `e2e:debug` for step-through or trace viewer for deep dives.*

---

## Pre-Commit Hook

**Install once:**
```bash
cp boilerplate/tests/playwright/scripts/playwright-pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

**What it does:**
- Detects source code changes on commit
- Warns if no test files modified
- Runs smoke tests automatically
- Blocks commit if smoke tests fail

**To skip (NOT RECOMMENDED):**
```bash
git commit --no-verify -m "urgent fix"
```

---

## CI/CD Pipeline

GitHub Actions automatically runs on every PR:

**What you'll see:**
- ✅ Green checkmark if all tests pass
- ❌ Red X if tests fail (blocks merge)
- ⚠️ Warning comment if no tests modified
- 📊 Test report artifact (downloadable)

**If your PR fails:**
1. Click "Details" on the failed check
2. Review test output
3. Fix failing tests or code
4. Push fixes (CI runs automatically)

---

## Test Quality Guidelines

### Good Tests
- ✅ Test one behavior per test
- ✅ Use descriptive names
- ✅ Use user-facing selectors
- ✅ Independent (no test depends on another)
- ✅ Fast (under 10 seconds each)
- ✅ Reliable (no flakiness)

### Bad Tests
- ❌ Test multiple behaviors in one test
- ❌ Vague names like "test 1"
- ❌ Use CSS selectors like `.div > span:nth-child(2)`
- ❌ Depend on other tests running first
- ❌ Take >30 seconds
- ❌ Fail intermittently

---

## Environment Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

### Environment Variables

Create `.env` file:
```bash
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8080
CI=false
```

---

## Quick Reference

See [cheatsheet.md](./cheatsheet.md) for commands and [examples.md](./examples.md) for code.

---

## Need Help?

- **5-Minute Start:** [quick_start.md](./quick_start.md)
- **Code Examples:** [examples.md](./examples.md)
- **Cheatsheet:** [cheatsheet.md](./cheatsheet.md)
- **Playwright Docs:** https://playwright.dev
- **Team Slack:** #e2e-testing

---

*Remember: Tests are not optional. They are part of the definition of done.*

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
