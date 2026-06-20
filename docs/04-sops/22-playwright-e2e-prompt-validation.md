---
name: "SOP: Write Playwright E2E Tests for Prompt Validation"
type: "SOP"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# SOP 22: Write Playwright E2E Tests for Prompt Validation

## Trigger

You have a throwaway app (from **SOP-21**) and need to write automated E2E tests that prove the prompt requirements are satisfied.

## Goal

Produce a Playwright test suite that exercises every feature in `feature-list.json`, with clear PASS/FAIL semantics and reproducible evidence.

## Pre-conditions

- Throwaway app is running locally (frontend + backend)
- `feature-list.json` exists with IDs F01–FNN
- Playwright is installed: `npm install -D @playwright/test`

## Procedure

### Step 1: Configure Playwright (5 min)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 2: Create Page Objects (10 min)

```typescript
// tests/e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly usernameError: Locator;
  readonly passwordError: Locator;
  readonly demoCredentials: Locator;
  readonly globalError: Locator;

  constructor(private page: Page) {
    this.usernameInput = page.locator('[data-testid="login-username"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.usernameError = page.locator('[data-testid="login-username-error"]');
    this.passwordError = page.locator('[data-testid="login-password-error"]');
    this.demoCredentials = page.locator('[data-testid="demo-credentials"]');
    this.globalError = page.locator('[data-testid="login-global-error"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectFieldError(field: 'username' | 'password', message: string) {
    const locator = field === 'username' ? this.usernameError : this.passwordError;
    await expect(locator).toBeVisible();
    await expect(locator).toHaveText(message);
  }
}
```

```typescript
// tests/e2e/pages/LandingPage.ts
import { Page, Locator } from '@playwright/test';

export class LandingPage {
  readonly menuItems: Locator;
  readonly logoutButton: Locator;

  constructor(private page: Page) {
    this.menuItems = page.locator('[data-testid="menu-item"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
  }

  async expectMenuCount(count: number) {
    await expect(this.menuItems).toHaveCount(count);
  }

  async logout() {
    await this.logoutButton.click();
  }
}
```

### Step 3: Write Feature Tests (variable — 1 test per feature)

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';

test.describe('F01: Login page with demo credentials', () => {
  test('shows demo username and password on login page', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.demoCredentials).toContainText('admin');
    await expect(login.demoCredentials).toContainText('admin123');
  });
});

test.describe('F02: Input validation', () => {
  test('shows error below username when empty', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('', 'any');
    await login.expectFieldError('username', 'Username is required');
    await expect(login.passwordError).not.toBeVisible();
  });

  test('shows error below password when empty', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('any', '');
    await login.expectFieldError('password', 'Password is required');
    await expect(login.usernameError).not.toBeVisible();
  });
});

test.describe('F03: Successful login redirect', () => {
  test('redirects to landing page on valid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('admin', 'admin123');
    await page.waitForURL('/landing');
    await expect(page).toHaveTitle(/Landing/);
  });
});

test.describe('F04: Failed login error', () => {
  test('shows graceful error for invalid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('wrong', 'wrong');
    await expect(login.globalError).toBeVisible();
    await expect(login.globalError).toHaveText(/invalid/i);
    // Must NOT redirect
    expect(page.url()).toContain('/login');
  });
});

test.describe('F05: Landing page menus', () => {
  test('displays exactly 5 placeholder menu items', async ({ page }) => {
    // Precondition: logged in
    const login = new LoginPage(page);
    const landing = new LandingPage(page);
    await login.goto();
    await login.login('admin', 'admin123');
    await landing.expectMenuCount(5);
  });
});

test.describe('F06: Logout', () => {
  test('clears session and redirects to login', async ({ page }) => {
    const login = new LoginPage(page);
    const landing = new LandingPage(page);
    await login.goto();
    await login.login('admin', 'admin123');
    await landing.logout();
    await page.waitForURL('/login');
    // Verify session cleared: revisit landing should redirect to login
    await page.goto('/landing');
    await page.waitForURL('/login');
  });
});
```

### Step 4: Add Architecture Compliance Tests (10 min)

Verify the throwaway app follows layer rules:

```typescript
// tests/e2e/architecture.spec.ts
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Architecture Compliance', () => {
  test('frontend does not import backend paths directly', () => {
    const output = execSync('grep -r "../backend" src/ || true').toString();
    expect(output.trim()).toBe('');
  });

  test('all pages have data-testid attributes', async ({ page }) => {
    // Accessibility + testability
    await page.goto('/login');
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      await expect(input).toHaveAttribute('data-testid', /.+/);
    }
  });
});
```

### Step 5: Run and Capture (5 min)

```bash
# Run all tests
npx playwright test

# Generate HTML report
npx playwright show-report

# Export JUnit for CI
npx playwright test --reporter=junit --output=./playwright-results.xml
```

Capture:
- Screenshot on first failure (`trace: 'on-first-retry'`)
- `playwright-results.xml` for CI ingestion
- `test-results/` directory with traces

### Step 6: Map Results to `feature-list.json` (5 min)

After running tests, update `feature-list.json`:

```bash
python3 -c "
import json, subprocess, sys
# Parse playwright output
result = subprocess.run(['npx','playwright','test','--reporter=list'], capture_output=True, text=True)
passes = 'passed' in result.stdout
with open('feature-list.json') as f:
    data = json.load(f)
for feat in data['features']:
    # Map test file names to feature IDs
    feat['passes'] = passes
with open('feature-list.json', 'w') as f:
    json.dump(data, f, indent=2)
"
```

**Manual mapping rule:** If `login.spec.ts` has 6 passed tests, features F01–F06 are PASS. Any failed test → corresponding feature FAIL.

## Verification Steps

1. `playwright.config.ts` exists and points to `baseURL`
2. `tests/e2e/pages/` has page objects for every screen
3. Every `feature-list.json` entry has ≥1 test case
4. `data-testid` attributes exist on every interactive element
5. `npx playwright test` exits 0 (all pass) or exits 1 with clear failure names
6. Trace files generated for first retry

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Config | `./playwright.config.ts` | Browser, retries, baseURL, webServer |
| Page objects | `./tests/e2e/pages/*.ts` | Encapsulated selectors |
| Feature tests | `./tests/e2e/*.spec.ts` | One per feature |
| Arch tests | `./tests/e2e/architecture.spec.ts` | Layer rule spot-checks |
| Reports | `./playwright-report/` | HTML evidence |
| Traces | `./test-results/` | Zip traces for debug |
| SOP | `docs/04-sops/22-playwright-e2e-prompt-validation.md` | This procedure |

## Notes

- **data-testid over CSS selectors.** `data-testid` is stable; CSS classes change.
- **One test per feature.** Do not write mega-tests. A failing mega-test obscures WHICH requirement broke.
- **Page objects for every screen.** Even a 3-screen app benefits from encapsulation.
- **Traces on first retry.** Saves debugging time; does not bloat CI artifacts.
- **Architecture tests in E2E?** Yes, spot-checks only. Full architecture validation runs in backend CI (ArchUnit/import-linter). E2E catches gross violations (frontend importing backend paths).

---

*SOP version: 1.0*
*Companion to SOP-21: Validate Prompt via Throwaway App*
