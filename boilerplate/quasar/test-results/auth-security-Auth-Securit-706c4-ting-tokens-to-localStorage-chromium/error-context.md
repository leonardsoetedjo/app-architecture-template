# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-security.spec.ts >> Auth Security — No localStorage Tokens >> login succeeds without writing tokens to localStorage
- Location: e2e/auth-security.spec.ts:20:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9000/
Call log:
  - navigating to "http://localhost:9000/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Quasar Auth Security E2E — verifies httpOnly cookie usage (no localStorage tokens).
  5  |  *
  6  |  * Security contract: Quasar uses httpOnly cookies via withCredentials: true.
  7  |  * Tokens must NOT be stored in localStorage (XSS vulnerability).
  8  |  * 
  9  |  * Reference: ReactJS e2e/auth-security.spec.ts (#273)
  10 |  * 
  11 |  * Run: npx playwright test e2e/auth-security.spec.ts
  12 |  * Prerequisite: npx playwright install chromium
  13 |  */
  14 | test.describe('Auth Security — No localStorage Tokens', () => {
  15 |   test.beforeEach(async ({ page }) => {
  16 |     page.on('console', msg => console.log('PW CONSOLE:', msg.type(), msg.text()));
  17 |     page.on('pageerror', err => console.log('PW PAGEERROR:', err.message));
  18 |   });
  19 | 
  20 |   test('login succeeds without writing tokens to localStorage', async ({ page }) => {
  21 |     // Navigate to login page
> 22 |     await page.goto('http://localhost:9000');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9000/
  23 |     await expect(page.getByTestId('login-username-input')).toBeVisible({ timeout: 10000 });
  24 | 
  25 |     // Login with demo credentials
  26 |     await page.getByTestId('login-username-input').fill('admin');
  27 |     await page.getByTestId('login-password-input').fill('admin123');
  28 |     await page.getByTestId('login-submit-button').click();
  29 | 
  30 |     // Wait for redirect to landing page
  31 |     await page.waitForURL(/.*\/landing/, { timeout: 10000 });
  32 |     await expect(page.getByTestId('landing-welcome-heading')).toBeVisible();
  33 | 
  34 |     // KEY ASSERTION: localStorage must NOT contain auth tokens
  35 |     // Quasar uses httpOnly cookies, NOT localStorage
  36 |     const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
  37 |     expect(localStorageKeys).not.toContain('accessToken');
  38 |     expect(localStorageKeys).not.toContain('auth-storage');
  39 |     expect(localStorageKeys).not.toContain('token');
  40 |     expect(localStorageKeys).not.toContain('refreshToken');
  41 |   });
  42 | 
  43 |   test('cookies are set after login (httpOnly verification)', async ({ page }) => {
  44 |     // Login
  45 |     await page.goto('http://localhost:9000');
  46 |     await page.getByTestId('login-username-input').fill('admin');
  47 |     await page.getByTestId('login-password-input').fill('admin123');
  48 |     await page.getByTestId('login-submit-button').click();
  49 |     await page.waitForURL(/.*\/landing/, { timeout: 10000 });
  50 | 
  51 |     // Verify httpOnly cookies are set (browser won't expose httpOnly flag, but we can check cookie exists)
  52 |     const cookies = await page.context().cookies();
  53 |     const authCookies = cookies.filter(c => c.name.includes('token') || c.name.includes('session'));
  54 |     
  55 |     // Should have at least one auth-related cookie
  56 |     expect(authCookies.length).toBeGreaterThan(0);
  57 |   });
  58 | 
  59 |   test('token is lost on page refresh (no persistent storage)', async ({ page }) => {
  60 |     // Login
  61 |     await page.goto('http://localhost:9000');
  62 |     await page.getByTestId('login-username-input').fill('admin');
  63 |     await page.getByTestId('login-password-input').fill('admin123');
  64 |     await page.getByTestId('login-submit-button').click();
  65 |     await page.waitForURL(/.*\/landing/, { timeout: 10000 });
  66 | 
  67 |     // Navigate away and back — session should persist via cookies
  68 |     await page.goto('http://localhost:9000/orders');
  69 |     
  70 |     // Should still be authenticated (cookies sent automatically)
  71 |     await expect(page.locator('text=Order History')).toBeVisible({ timeout: 10000 });
  72 |   });
  73 | 
  74 |   test('logout clears session', async ({ page }) => {
  75 |     // Login first
  76 |     await page.goto('http://localhost:9000');
  77 |     await page.getByTestId('login-username-input').fill('admin');
  78 |     await page.getByTestId('login-password-input').fill('admin123');
  79 |     await page.getByTestId('login-submit-button').click();
  80 |     await page.waitForURL(/.*\/landing/, { timeout: 10000 });
  81 | 
  82 |     // Logout
  83 |     await page.getByTestId('landing-logout-button').click();
  84 |     await page.waitForURL(/.*\/login/, { timeout: 10000 });
  85 |     await expect(page.getByTestId('login-username-input')).toBeVisible();
  86 | 
  87 |     // Verify localStorage still clean
  88 |     const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
  89 |     expect(localStorageKeys).not.toContain('accessToken');
  90 |   });
  91 | });
  92 | 
```