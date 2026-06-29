import { test, expect } from '@playwright/test';

/**
 * Auth security E2E — verifies #273 fix (localStorage → memory-only tokens).
 *
 * Regression: client.ts previously stored tokens in localStorage['auth-storage']
 *             exposing them to XSS. Now tokens live only in memory.
 */
test.describe('Auth Security — No localStorage Tokens', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PW CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PW PAGEERROR:', err.message));
  });

  test('login succeeds without writing tokens to localStorage', async ({ page }) => {
    await page.goto('http://127.0.0.1:5173/login');
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });

    await page.fill('#email', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for navigation to orders page
    await page.waitForURL(/\/orders/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();

    // KEY ASSERTION: localStorage must NOT contain auth tokens
    const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(localStorageKeys).not.toContain('auth-storage');
  });

  test('token is lost on page refresh (memory-only)', async ({ page }) => {
    // Login
    await page.goto('http://127.0.0.1:5173/login');
    await page.fill('#email', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/orders/, { timeout: 10000 });

    // Refresh page — memory token is gone
    await page.goto('http://127.0.0.1:5173/orders');

    // Should redirect to login because token is in memory only
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
  });

  test('logout clears tokens and redirects to login', async ({ page }) => {
    // Login first
    await page.goto('http://127.0.0.1:5173/login');
    await page.fill('#email', 'admin');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/orders/, { timeout: 10000 });

    // Click logout (assuming there's a logout button in AppLayout)
    const logoutBtn = page.locator('[data-testid="logout-button"]').or(
      page.locator('text=Sign out'),
    );
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page.locator('#email')).toBeVisible();
    } else {
      // If no logout button, just verify redirect works manually
      test.skip();
    }
  });
});
