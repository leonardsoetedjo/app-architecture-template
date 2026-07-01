import { test, expect } from '@playwright/test';
import { QuasarLoginPage } from '../fixtures/pages/QuasarLoginPage';
import { QuasarOrdersPage } from '../fixtures/pages/QuasarOrdersPage';

test.describe('Quasar E2E - Login to Orders Flow', () => {
  let loginPage: QuasarLoginPage;
  let ordersPage: QuasarOrdersPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new QuasarLoginPage(page);
    ordersPage = new QuasarOrdersPage(page);
  });

  test('should display demo credentials on login page', async ({ page }) => {
    await loginPage.goto();
    
    // Verify demo credentials are shown
    const demoText = await loginPage.getDemoCredentials();
    expect(demoText).toContain('admin');
    expect(demoText).toContain('admin123');
  });

  test('should login with valid credentials and navigate to orders', async ({ page }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Wait for navigation to orders page
    await page.waitForURL(/\/orders$/);
    
    // Verify we're on the orders page
    await expect(ordersPage.pageTitle).toBeVisible();
    await expect(ordersPage.pageTitle).toHaveText('Orders');
  });

  test('should display orders table after login', async ({ page }) => {
    await loginPage.goto();
    await loginPage.loginAsAdmin();
    
    // Wait for orders to load
    await ordersPage.waitForOrdersToLoad();
    
    // Verify table is visible
    await expect(ordersPage.ordersTable).toBeVisible();
  });

  test('should show validation error for empty login form', async ({ page }) => {
    await loginPage.goto();
    
    // Try to submit without filling fields
    await loginPage.submitButton.click();
    
    // Wait briefly for any validation
    await page.waitForTimeout(500);
    
    // Button should still be on login page (no navigation)
    await expect(loginPage.usernameInput).toBeVisible();
  });
});
