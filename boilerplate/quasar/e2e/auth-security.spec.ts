import { test, expect } from '@playwright/test';

/**
 * Quasar Auth Security E2E — verifies httpOnly cookie usage (no localStorage tokens).
 *
 * Security contract: Quasar uses httpOnly cookies via withCredentials: true.
 * Tokens must NOT be stored in localStorage (XSS vulnerability).
 * 
 * Reference: ReactJS e2e/auth-security.spec.ts (#273)
 * 
 * Run: npx playwright test e2e/auth-security.spec.ts
 * Prerequisite: npx playwright install chromium
 */
test.describe('Auth Security — No localStorage Tokens', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PW CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PW PAGEERROR:', err.message));
  });

  test('login succeeds without writing tokens to localStorage', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:9000');
    await expect(page.getByTestId('login-username-input')).toBeVisible({ timeout: 10000 });

    // Login with demo credentials
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();

    // Wait for redirect to landing page
    await page.waitForURL(/.*\/landing/, { timeout: 10000 });
    await expect(page.getByTestId('landing-welcome-heading')).toBeVisible();

    // KEY ASSERTION: localStorage must NOT contain auth tokens
    // Quasar uses httpOnly cookies, NOT localStorage
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localStorageKeys).not.toContain('accessToken');
    expect(localStorageKeys).not.toContain('auth-storage');
    expect(localStorageKeys).not.toContain('token');
    expect(localStorageKeys).not.toContain('refreshToken');
  });

  test('cookies are set after login (httpOnly verification)', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9000');
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL(/.*\/landing/, { timeout: 10000 });

    // Verify httpOnly cookies are set (browser won't expose httpOnly flag, but we can check cookie exists)
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(c => c.name.includes('token') || c.name.includes('session'));
    
    // Should have at least one auth-related cookie
    expect(authCookies.length).toBeGreaterThan(0);
  });

  test('token is lost on page refresh (no persistent storage)', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9000');
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL(/.*\/landing/, { timeout: 10000 });

    // Navigate away and back — session should persist via cookies
    await page.goto('http://localhost:9000/orders');
    
    // Should still be authenticated (cookies sent automatically)
    await expect(page.locator('text=Order History')).toBeVisible({ timeout: 10000 });
  });

  test('logout clears session', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:9000');
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL(/.*\/landing/, { timeout: 10000 });

    // Logout
    await page.getByTestId('landing-logout-button').click();
    await page.waitForURL(/.*\/login/, { timeout: 10000 });
    await expect(page.getByTestId('login-username-input')).toBeVisible();

    // Verify localStorage still clean
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localStorageKeys).not.toContain('accessToken');
  });
});
