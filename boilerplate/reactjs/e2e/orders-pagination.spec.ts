import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Orders Page Pagination and Sorting
 * Tests deployed ReactJS frontend against live Java backend
 */

test.describe('Orders Page - Pagination and Sort', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
  });

  test('pagination - page indicator shows correct page', async ({ page }) => {
    // Check pagination info is visible
    const paginationInfo = page.locator('text=/Page \\d+ of \\d+/');
    await expect(paginationInfo).toBeVisible();
    
    // Take screenshot for visual regression
    await page.screenshot({ path: 'e2e/screenshots/orders-page.png', fullPage: true });
  });

  test('sort - clicking status column sorts orders', async ({ page }) => {
    // Find the Status column header (sortable)
    const statusHeader = page.locator('th:has-text("Status")');
    await expect(statusHeader).toBeVisible();
    
    // Initial state: no sort indicator or neutral
    const initialIndicator = statusHeader.locator('text=⇅');
    await expect(initialIndicator).toBeVisible();
    
    // Click to sort ascending
    await statusHeader.click();
    
    // Wait for sort indicator to change to ascending
    const ascIndicator = statusHeader.locator('text=▲');
    await expect(ascIndicator).toBeVisible();
    
    // Click again to sort descending
    await statusHeader.click();
    
    // Wait for sort indicator to change to descending
    const descIndicator = statusHeader.locator('text=▼');
    await expect(descIndicator).toBeVisible();
    
    // Click third time to clear sort (back to neutral)
    await statusHeader.click();
    await expect(initialIndicator).toBeVisible();
  });

  test('sort - clicking total column sorts by amount', async ({ page }) => {
    const totalHeader = page.locator('th:has-text("Total")');
    await expect(totalHeader).toBeVisible();
    
    // Initial state: neutral indicator (⇅)
    const neutralIndicator = totalHeader.locator('text=⇅');
    await expect(neutralIndicator).toBeVisible();
    
    // First click: sort ASC (▲)
    await totalHeader.click();
    await expect(totalHeader.locator('text=▲')).toBeVisible();
    
    // Second click: sort DESC (▼)
    await totalHeader.click();
    await expect(totalHeader.locator('text=▼')).toBeVisible();
    
    // Third click: back to neutral (⇅)
    await totalHeader.click();
    await expect(neutralIndicator).toBeVisible();
  });

  test('sort - clicking created column sorts by date', async ({ page }) => {
    const createdHeader = page.locator('th:has-text("Created")');
    await expect(createdHeader).toBeVisible();
    
    // Click to sort (ASC first)
    await createdHeader.click();
    
    // Should show ascending sort indicator
    const ascIndicator = createdHeader.locator('text=▲');
    await expect(ascIndicator).toBeVisible();
  });
});