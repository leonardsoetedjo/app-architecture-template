import { test, expect } from '@playwright/test';

const BASE_URL = 'https://hermes.piranha-broadnose.ts.net';

test.describe('Login Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page.locator('h1')).toHaveText('Sign in');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with demo credentials and redirect to orders', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Fill login form
    await page.fill('input[type="text"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'DemoPass1!');
    
    // Click sign in
    await page.click('button:has-text("Sign in")');
    
    // Wait for redirect to orders page
    await expect(page).toHaveURL(/.*\/orders/);
    await expect(page.locator('h1')).toHaveText('Orders');
    
    // Verify auth state persisted
    await page.reload();
    await expect(page.locator('h1')).toHaveText('Orders');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(BASE_URL);
    
    await page.fill('input[type="text"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign in")');
    
    // Should stay on login page
    await expect(page.locator('h1')).toHaveText('Sign in');
  });
});

test.describe('Order Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto(BASE_URL);
    await page.fill('input[type="text"]', 'demo@example.com');
    await page.fill('input[type="password"]', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await expect(page).toHaveURL(/.*\/orders/);
  });

  test('should create a new order', async ({ page }) => {
    // Click "New Order"
    await page.click('a:has-text("New Order")');
    await expect(page).toHaveURL(/.*\/orders\/new/);
    
    // Fill order form
    await page.fill('input[placeholder="prod-001"]', 'Widget-Test');
    await page.fill('input[type="number"]:nth-of-type(2)', '2');
    await page.fill('input[placeholder="0.00"]', '9.99');
    
    // Create order
    await page.click('button:has-text("Create Order")');
    
    // Should redirect to order detail
    await expect(page).toHaveURL(/.*\/orders\/[0-9a-f-]+/);
    
    // Verify order details
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=$19.98')).toBeVisible();
  });

  test('should list orders after creation', async ({ page }) => {
    // Create an order first
    await page.click('a:has-text("New Order")');
    await page.fill('input[placeholder="prod-001"]', 'Widget-List');
    await page.fill('input[type="number"]:nth-of-type(2)', '1');
    await page.fill('input[placeholder="0.00"]', '5.00');
    await page.click('button:has-text("Create Order")');
    
    // Navigate back to orders list
    await page.click('a:has-text("Orders")');
    await expect(page).toHaveURL(/.*\/orders/);
    
    // Verify the new order appears
    await expect(page.locator('text=Widget-List')).toBeVisible();
  });
});
