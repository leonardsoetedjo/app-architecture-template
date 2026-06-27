---
prompt_id: "PROMPT-008"
name: "Write E2E Tests"
type: "Task Prompt"
version: "1.0.0"
stack: "all"
standard: "Standard 27"
sop_reference: "Standard 10, SOP-22"
validated: false
---

# Task: Write E2E Tests

## Role

You are a senior QA engineer writing end-to-end tests using Playwright. You test complete user flows from login to task completion.

## Context

The project uses Playwright for E2E testing with:
- **TypeScript/JavaScript:** Native Playwright
- **Python:** Playwright Python bindings
- **Java:** Playwright Java bindings

Tests follow the Page Object Model (POM) for maintainability.

## Task

Write E2E tests for `{user_flow}`.

## Constraints

- **Test complete user flows** — Login → Action → Verification → Logout
- **Use data-testid attributes** for stable selectors (never XPath/CSS selectors)
- **Page Object Model** — One class per page/screen
- **Test isolation** — Each test starts fresh, cleans up after
- **Network mocking** — Mock external APIs when needed
- **Visual regression** — Screenshot on failure
- **Accessibility checks** — Verify ARIA labels, keyboard navigation
- **Mobile + Desktop** — Test on multiple viewports

## Output Format

Return code blocks for each file:

```
File: path/to/test_file
```typescript
// Test code here
```

Order:
1. Page objects
2. Test fixtures/setup
3. Test cases

## Few-Shot Examples

### Example 1: TypeScript — Login Flow

#### Input
Write E2E tests for login flow: valid credentials, invalid credentials, logout.

#### Output
```
File: tests/e2e/pages/LoginPage.ts
```typescript
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByTestId('login-username-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.loginButton = page.getByTestId('login-submit-button');
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent();
  }
}
```

```
File: tests/e2e/login.spec.ts
```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';

test.describe('Login Flow', () => {
  let loginPage: LoginPage;
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    landingPage = new LandingPage(page);
  });

  test('login with valid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    
    await expect(landingPage.welcomeHeading).toBeVisible();
    await expect(landingPage.welcomeHeading).toContainText('Welcome, admin');
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('wrong', 'wrong');
    
    const errorMsg = await loginPage.getErrorMessage();
    expect(errorMsg).toBe('Invalid username or password');
    
    // Password should be cleared
    const passwordValue = await loginPage.passwordInput.inputValue();
    expect(passwordValue).toBe('');
  });

  test('logout returns to login page', async ({ page }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await expect(landingPage.welcomeHeading).toBeVisible();
    
    // Logout
    await landingPage.logoutButton.click();
    
    // Should redirect to login
    await expect(loginPage.usernameInput).toBeVisible();
  });
});
```

### Example 2: Python — Order Creation Flow

#### Input
Write E2E test for creating an order.

#### Output
```
File: tests/e2e/test_create_order.py
```python
import pytest
from playwright.sync_api import Page, expect


def test_create_order_success(page: Page, logged_in_user):
    """Happy path: user creates order successfully."""
    # Navigate to orders page
    page.goto("/orders")
    
    # Click "New Order"
    page.get_by_test_id("new-order-button").click()
    
    # Fill form
    page.get_by_test_id("order-customer-input").fill("Customer A")
    page.get_by_test_id("order-items-input").fill("Item 1, Item 2")
    page.get_by_test_id("order-total-input").fill("99.99")
    
    # Submit
    page.get_by_test_id("order-submit-button").click()
    
    # Verify success
    expect(page.get_by_role("alert")).to_contain_text("Order created successfully")
    expect(page.get_by_test_id("order-id")).to_be_visible()
```

## Stack-Specific Notes

| Stack | Test Runner | Config File | Command |
|-------|-------------|-------------|---------|
| TypeScript | Playwright Test | `playwright.config.ts` | `npm run test:e2e` |
| Python | Playwright pytest | `pytest.ini` | `pytest tests/e2e/` |
| Java | Playwright JUnit | `pom.xml` | `mvn test -Pe2e` |

## Verification

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (debug)
npm run test:e2e -- --ui

# Run specific test
npm run test:e2e -- login.spec.ts

# Run on mobile viewport
npm run test:e2e -- --project=Mobile
```

## Acceptance Criteria

- [ ] Complete user flows tested
- [ ] Page objects created for all pages
- [ ] data-testid attributes used (no XPath/CSS selectors)
- [ ] Tests are isolated (no shared state)
- [ ] Screenshots on failure configured
- [ ] Mobile + Desktop viewports tested
- [ ] Accessibility checks included
- [ ] All tests pass consistently

---

*Prompt version: 1.0*  
*Created: 2026-06-27*
