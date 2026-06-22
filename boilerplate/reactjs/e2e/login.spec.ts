import { test, expect } from '@playwright/test';

test.describe('Login E2E', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PW CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PW PAGEERROR:', err.message));
    await page.goto('http://127.0.0.1:5173/login');
    await page.waitForTimeout(3000);
  });

  test('page renders login form', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
  });

  test('happy path — valid credentials redirect to orders', async ({ page }) => {
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/orders/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
  });

  test('invalid password shows error', async ({ page }) => {
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'WrongPass1!');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });
});
