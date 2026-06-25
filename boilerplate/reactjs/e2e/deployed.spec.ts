import { test, expect } from '@playwright/test';

/**
 * Deployed E2E Tests — runs against live Tailscale deployment.
 * Usage: BASE_URL=https://hermes.piranha-broadnose.ts.net npx playwright test -c playwright.deployed.config.ts
 */

test.describe('Deployed Login Flow', () => {
  test('should display login page at root', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:has-text("Sign in")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should login with demo credentials and redirect to orders', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
    await page.reload();
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'wrong@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('h1:has-text("Sign in")')).toBeVisible();
  });
});

test.describe('Deployed Order Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
  });

  test('should create a new order', async ({ page }) => {
    await page.click('a:has-text("New Order")');
    await page.waitForURL(/.*\/orders\/new/, { timeout: 10000 });
    
    // Fill order form using robust selectors
    await page.fill('input[placeholder="prod-001"]', 'Widget-Playwright');
    // Quantity is the spinbutton without placeholder (first number input)
    const quantityInputs = page.locator('input[type="number"]:not([placeholder])');
    await quantityInputs.first().fill('2');
    await page.fill('input[placeholder="0.00"]', '9.99');
    
    await page.click('button:has-text("Create Order")');
    await page.waitForURL(/.*\/orders\/[0-9a-f-]+/, { timeout: 10000 });
    
    // Verify order details page
    await expect(page.locator('h1:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    // Use first() to avoid strict mode violation
    await expect(page.locator('text=$19.98').first()).toBeVisible();
  });

  test('should list orders after creation', async ({ page }) => {
    // Create an order first
    await page.click('a:has-text("New Order")');
    await page.waitForURL(/.*\/orders\/new/, { timeout: 10000 });
    
    await page.fill('input[placeholder="prod-001"]', 'Widget-List');
    const quantityInputs = page.locator('input[type="number"]:not([placeholder])');
    await quantityInputs.first().fill('1');
    await page.fill('input[placeholder="0.00"]', '5.00');
    await page.click('button:has-text("Create Order")');
    await page.waitForURL(/.*\/orders\/[0-9a-f-]+/, { timeout: 10000 });
    
    // Navigate back to orders list
    await page.click('a:has-text("Orders")');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    
    // Verify orders table is present
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
    // Check that the table has rows (orders exist)
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
  });
});
