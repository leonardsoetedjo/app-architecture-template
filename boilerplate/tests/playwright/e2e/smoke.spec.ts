import { test, expect } from '@playwright/test';

/**
 * Smoke test verifying the frontend builds and serves the SPA.
 * Requires the frontend dev server or production build running.
 */

test.describe('Frontend Smoke', () => {
  test('loads the home page', async ({ page }) => {
    await page.goto(process.env.FRONTEND_URL || 'http://localhost:5173');
    await expect(page).toHaveTitle(/Example App/);
    await expect(page.getByText('Example App')).toBeVisible();
  });

  test('displays navigation menu', async ({ page }) => {
    await page.goto(process.env.FRONTEND_URL || 'http://localhost:5173');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
