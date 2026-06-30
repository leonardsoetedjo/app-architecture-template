import { test, expect } from '@playwright/test';

/**
 * Deployed E2E Tests — runs against live Tailscale deployment.
 * Usage: BASE_URL=https://hermes.piranha-broadnose.ts.net npx playwright test -c playwright.deployed.config.ts
 */

test.describe('Deployed Login Flow', () => {
  test('should display login page at root', async ({ page }) => {
    await page.goto('/');
    // Quasar uses q-input with data-testid or label
    await expect(page.locator('h1:has-text("Sign in"), h5:has-text("Sign in"), .text-h5:has-text("Sign in")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="email-input"], input[type="email"], .q-input input')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"], input[type="password"], .q-input input[type="password"]')).toBeVisible();
  });

  test('should login with demo credentials and redirect to orders', async ({ page }) => {
    await page.goto('/');
    // Use robust Quasar selectors
    const emailInput = page.locator('[data-testid="email-input"]').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('[data-testid="password-input"]').or(page.locator('input[type="password"]'));
    const submitBtn = page.locator('[data-testid="submit-btn"]').or(page.locator('button:has-text("Sign in")'));
    
    await emailInput.fill('demo@example.com');
    await passwordInput.fill('DemoPass1!');
    await submitBtn.click();
    
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Orders"), h5:has-text("Orders"), .text-h5:has-text("Orders")')).toBeVisible();
    await page.reload();
    await expect(page.locator('h1:has-text("Orders"), h5:has-text("Orders"), .text-h5:has-text("Orders")')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('[data-testid="email-input"]').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('[data-testid="password-input"]').or(page.locator('input[type="password"]'));
    const submitBtn = page.locator('[data-testid="submit-btn"]').or(page.locator('button:has-text("Sign in")'));
    
    await emailInput.fill('wrong@example.com');
    await passwordInput.fill('wrongpassword');
    await submitBtn.click();
    
    // Should stay on login page or show error
    await expect(page.locator('h1:has-text("Sign in"), h5:has-text("Sign in"), .text-h5:has-text("Sign in")')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Deployed Order Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const emailInput = page.locator('[data-testid="email-input"]').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('[data-testid="password-input"]').or(page.locator('input[type="password"]'));
    const submitBtn = page.locator('[data-testid="submit-btn"]').or(page.locator('button:has-text("Sign in")'));
    
    await emailInput.fill('demo@example.com');
    await passwordInput.fill('DemoPass1!');
    await submitBtn.click();
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
  });

  test('should create a new order', async ({ page }) => {
    await page.click('a:has-text("New Order"), button:has-text("New Order"), .q-btn:has-text("New Order")');
    await page.waitForURL(/.*\/orders\/new/, { timeout: 10000 });
    
    // Fill order form using robust selectors
    await page.fill('input[placeholder="prod-001"]', 'Widget-Playwright');
    const quantityInputs = page.locator('input[type="number"]:not([placeholder])');
    await quantityInputs.first().fill('2');
    await page.fill('input[placeholder="0.00"]', '9.99');
    
    await page.click('button:has-text("Create Order"), .q-btn:has-text("Create Order")');
    await page.waitForURL(/.*\/orders\/[0-9a-f-]+/, { timeout: 10000 });
    
    // Verify order details page
    await expect(page.locator('h1:has-text("Order Details"), h5:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('text=Pending').or(page.locator('.q-badge:has-text("Pending")'))).toBeVisible();
  });

  test('should list orders after creation', async ({ page }) => {
    // Create an order first
    await page.click('a:has-text("New Order"), button:has-text("New Order")');
    await page.waitForURL(/.*\/orders\/new/, { timeout: 10000 });
    
    await page.fill('input[placeholder="prod-001"]', 'Widget-List');
    const quantityInputs = page.locator('input[type="number"]:not([placeholder])');
    await quantityInputs.first().fill('1');
    await page.fill('input[placeholder="0.00"]', '5.00');
    await page.click('button:has-text("Create Order"), .q-btn:has-text("Create Order")');
    await page.waitForURL(/.*\/orders\/[0-9a-f-]+/, { timeout: 10000 });
    
    // Navigate back to orders list
    await page.click('a:has-text("Orders"), .q-btn:has-text("Orders")');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    
    // Verify orders table is present
    await expect(page.locator('h1:has-text("Orders"), h5:has-text("Orders")')).toBeVisible();
    const rows = page.locator('table tbody tr, .q-table tbody tr');
    await expect(rows.first()).toBeVisible();
  });
});
