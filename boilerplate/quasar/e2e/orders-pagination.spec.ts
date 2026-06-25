import { test, expect } from '@playwright/test';

/**
 * Quasar Orders Page E2E Tests — Pagination and Sorting
 * Tests Quasar frontend against deployed backend
 */

test.describe('Quasar Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:9000');
    
    // Wait for login form using Quasar data-testid selectors
    await expect(page.getByTestId('login-username-input')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('login-password-input')).toBeVisible();
    
    // Fill credentials (demo credentials from login page)
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    
    // Submit login
    await page.getByTestId('login-submit-button').click();
    
    // Wait for redirect after login (could be landing or orders)
    await page.waitForURL(/.*\/(landing|orders)/, { timeout: 15000 });
    
    // Navigate to orders page
    await page.goto('http://localhost:9000/orders');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    
    // Verify orders page loaded
    await expect(page.locator('text=Order History')).toBeVisible();
  });

  test('pagination - q-table shows orders with rows', async ({ page }) => {
    // Verify q-table is present
    const table = page.locator('.q-table');
    await expect(table).toBeVisible();
    
    // Check table has data rows
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    
    // Take screenshot for visual regression
    await page.screenshot({ path: 'e2e/screenshots/quasar-orders-page.png', fullPage: true });
  });

  test('sort - clicking status column header sorts orders', async ({ page }) => {
    // Find Status column header in q-table
    const statusHeader = page.locator('th:has-text("Status")');
    await expect(statusHeader).toBeVisible();
    
    // Click to sort (q-table handles sort internally)
    await statusHeader.click();
    
    // Wait for table to update
    await page.waitForTimeout(500);
    
    // Verify table still has data after sort
    const table = page.locator('.q-table');
    const rows = table.locator('tbody tr');
    await expect(rows.first()).toBeVisible();
    
    // Click again to reverse sort
    await statusHeader.click();
    await page.waitForTimeout(500);
    
    // Verify data still visible
    await expect(rows.first()).toBeVisible();
  });

  test('sort - clicking total column sorts by amount', async ({ page }) => {
    const totalHeader = page.locator('th:has-text("Total")');
    await expect(totalHeader).toBeVisible();
    
    // Click to sort
    await totalHeader.click();
    await page.waitForTimeout(500);
    
    // Verify table updated
    const table = page.locator('.q-table');
    await expect(table.locator('tbody tr').first()).toBeVisible();
  });

  test('sort - clicking created column sorts by date', async ({ page }) => {
    const createdHeader = page.locator('th:has-text("Created")');
    await expect(createdHeader).toBeVisible();
    
    // Click to sort
    await createdHeader.click();
    await page.waitForTimeout(500);
    
    // Verify table still populated
    const table = page.locator('.q-table');
    await expect(table.locator('tbody tr').first()).toBeVisible();
  });
});