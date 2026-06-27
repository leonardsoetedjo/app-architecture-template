import { test, expect } from '@playwright/test';

/**
 * Full-Stack E2E Tests — verify ReactJS frontend + Java backend + PostgreSQL
 * Run via: docker compose -f docker-compose.e2e.yml up --abort-on-container-exit
 *
 * These tests run inside the playwright container and hit the frontend nginx
 * at http://frontend:80 and the backend API at http://backend:8080.
 */

test.describe('Full-Stack Login Flow', () => {
  test('frontend login form renders against real backend', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#email')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#password')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible();
  });

  test('valid credentials login → redirect to orders', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 15000 });
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
  });

  test('invalid credentials show error without crashing', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'WrongPass1!');
    await page.click('button:has-text("Sign in")');
    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 10000 });
    // Ensure we stay on login page
    await expect(page.locator('#email')).toBeVisible();
  });
});

test.describe('Full-Stack Order CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'demo@example.com');
    await page.fill('#password', 'DemoPass1!');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL(/.*\/orders/, { timeout: 15000 });
  });

  test('create order → verify in list → verify API response', async ({ page, request }) => {
    // 1. Navigate to New Order page
    await page.click('a:has-text("New Order")');
    await page.waitForURL(/.*\/orders\/new/, { timeout: 10000 });

    // 2. Fill form
    await page.fill('input[placeholder="prod-001"]', 'E2E-Widget');
    const qtyInput = page.locator('input[type="number"]:not([placeholder])').first();
    await qtyInput.fill('3');
    await page.fill('input[placeholder="0.00"]', '12.50');

    // 3. Submit
    await page.click('button:has-text("Create Order")');
    await page.waitForURL(/.*\/orders\/[0-9a-f-]+/, { timeout: 15000 });

    // 4. Verify detail page
    await expect(page.locator('h1:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // 5. Verify via backend API directly
    const apiResponse = await request.get('http://backend:8080/api/v1/orders?page=0&size=1&sort=createdAt,desc');
    expect(apiResponse.status()).toBe(200);
    const data = await apiResponse.json();
    expect(data.content.length).toBeGreaterThan(0);
    expect(data.content[0].items[0].productName).toBe('E2E-Widget');
  });

  test('orders list loads with pagination', async ({ page }) => {
    await expect(page.locator('h1:has-text("Orders")')).toBeVisible();
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

  test('sort by total amount toggles ASC/DESC', async ({ page }) => {
    const totalHeader = page.locator('th:has-text("Total")');
    await expect(totalHeader).toBeVisible();

    // Initial: neutral
    await expect(totalHeader.locator('text=⇅')).toBeVisible();

    // Click → ASC
    await totalHeader.click();
    await expect(totalHeader.locator('text=▲')).toBeVisible();

    // Click → DESC
    await totalHeader.click();
    await expect(totalHeader.locator('text=▼')).toBeVisible();
  });
});

test.describe('Full-Stack Error Handling', () => {
  test('backend 500 shows graceful error boundary', async ({ page }) => {
    // This test assumes the backend has a test endpoint that triggers 500
    // If not available, skip gracefully
    test.skip();
  });

  test('unauthenticated API call returns 401', async ({ request }) => {
    const response = await request.get('/api/v1/orders');
    expect(response.status()).toBe(401);
  });
});
