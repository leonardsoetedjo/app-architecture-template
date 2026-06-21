import { test, expect } from '@playwright/test';

/**
 * Quasar + Vue 3 Login E2E Tests
 *
 * Selector rules per AGENTS.md §6:
 * - Quasar renders data-testid ON native elements, not wrappers
 * - Correct: page.locator('[data-testid="X"]')
 * - Wrong: page.locator('[data-testid="X"] input')
 * - Per-field errors: page.getByRole('alert') with filter({ hasText: '...' })
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9000');
  });

  test('TC-01: demo credentials are visible', async ({ page }) => {
    await expect(page.getByTestId('login-demo-credentials')).toBeVisible();
  });

  test('TC-02: empty submit shows per-field errors', async ({ page }) => {
    await page.getByTestId('login-submit-button').click();

    const usernameError = page.getByRole('alert').filter({ hasText: 'Username is required' });
    const passwordError = page.getByRole('alert').filter({ hasText: 'Password is required' });

    await expect(usernameError).toBeVisible();
    await expect(passwordError).toBeVisible();
  });

  test('TC-03: typing clears per-field errors', async ({ page }) => {
    await page.getByTestId('login-submit-button').click();

    await page.getByTestId('login-username-input').fill('x');
    const usernameError = page.getByRole('alert').filter({ hasText: 'Username is required' });
    await expect(usernameError).toHaveCount(0);
  });

  test('TC-04: wrong credentials show general error and clear password', async ({ page }) => {
    await page.getByTestId('login-username-input').fill('wrong');
    await page.getByTestId('login-password-input').fill('wrong');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('login-general-error')).toBeVisible();
    await expect(page.getByTestId('login-password-input')).toHaveValue('');
  });

  test('TC-05: successful login navigates to landing', async ({ page }) => {
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();

    await page.waitForURL('**/landing');
    await expect(page.getByTestId('landing-welcome-heading')).toContainText('Welcome');
  });

  test('TC-06: logout redirects to login', async ({ page }) => {
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('admin123');
    await page.getByTestId('login-submit-button').click();
    await page.waitForURL('**/landing');

    await page.getByTestId('landing-logout-button').click();
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-username-input')).toBeVisible();
  });
});
