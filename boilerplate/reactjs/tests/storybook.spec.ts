import { test, expect } from '@playwright/test';

/**
 * Storybook Visual Regression Tests
 * 
 * These tests capture screenshots of Storybook stories and compare them
 * against baseline images to detect visual regressions.
 * 
 * ## Running Tests
 * 
 * ```bash
 * # Run all visual regression tests
 * npx playwright test
 * 
 * # Run with UI mode for debugging
 * npx playwright test --ui
 * 
 * # Run specific test file
 * npx playwright test tests/storybook.spec.ts
 * 
 * # Update baseline screenshots
 * npx playwright test --update-snapshots
 * ```
 * 
 * ## Test Structure
 * 
 * Each test navigates to a Storybook story iframe and captures a screenshot.
 * The screenshot is compared against the baseline stored in `test-results/`.
 * 
 * ## Adding New Tests
 * 
 * 1. Navigate to your story in Storybook
 * 2. Copy the iframe URL path (e.g., `/iframe.html?id=shared-ui-atoms-basebutton--primary`)
 * 3. Create a test with descriptive name
 * 4. Set appropriate viewport size for the component
 */

test.describe('BaseButton Stories', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for button tests
    await page.setViewportSize({ width: 800, height: 600 });
  });

  test('BaseButton - Primary variant', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--primary&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-primary.png', {
      fullPage: false,
    });
  });

  test('BaseButton - Secondary variant', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--secondary&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-secondary.png');
  });

  test('BaseButton - Outline variant', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--outline&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-outline.png');
  });

  test('BaseButton - Text variant', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--text&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-text.png');
  });

  test('BaseButton - Danger variant', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--danger&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-danger.png');
  });

  test('BaseButton - Loading state', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--loading&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-loading.png');
  });

  test('BaseButton - Disabled state', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--disabled&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-disabled.png');
  });

  test('BaseButton - All variants comparison', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 400 });
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--all-variants&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-all-variants.png');
  });

  test('BaseButton - All sizes comparison', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 300 });
    await page.goto('/iframe.html?id=shared-ui-atoms-basebutton--all-sizes&args=&viewMode=story');
    await expect(page).toHaveScreenshot('basebutton-all-sizes.png');
  });
});

test.describe('BaseInput Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 400 });
  });

  test('BaseInput - Default', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-baseinput--default&args=&viewMode=story');
    await expect(page).toHaveScreenshot('baseinput-default.png');
  });

  test('BaseInput - With error', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-baseinput--with-error&args=&viewMode=story');
    await expect(page).toHaveScreenshot('baseinput-error.png');
  });

  test('BaseInput - Disabled', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-baseinput--disabled&args=&viewMode=story');
    await expect(page).toHaveScreenshot('baseinput-disabled.png');
  });

  test('BaseInput - Loading state', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-atoms-baseinput--loading&args=&viewMode=story');
    await expect(page).toHaveScreenshot('baseinput-loading.png');
  });
});

test.describe('SearchField Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 400 });
  });

  test('SearchField - Default', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-molecules-searchfield--default&args=&viewMode=story');
    await expect(page).toHaveScreenshot('searchfield-default.png');
  });

  test('SearchField - Loading', async ({ page }) => {
    await page.goto('/iframe.html?id=shared-ui-molecules-searchfield--loading&args=&viewMode=story');
    await expect(page).toHaveScreenshot('searchfield-loading.png');
  });

  test('SearchField - All sizes', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 600 });
    await page.goto('/iframe.html?id=shared-ui-molecules-searchfield--all-sizes&args=&viewMode=story');
    await expect(page).toHaveScreenshot('searchfield-all-sizes.png');
  });
});

test.describe('OrderList Widget Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
  });

  test('OrderList - Default', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-list--default&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderlist-default.png');
  });

  test('OrderList - Loading state', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-list--loading&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderlist-loading.png');
  });

  test('OrderList - Empty state', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-list--empty&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderlist-empty.png');
  });

  test('OrderList - Error state', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-list--error&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderlist-error.png');
  });
});

test.describe('OrderForm Widget Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 800 });
  });

  test('OrderForm - Default', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-form--default&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderform-default.png');
  });

  test('OrderForm - Validation errors', async ({ page }) => {
    await page.goto('/iframe.html?id=widgets-order-form--validation-errors&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderform-validation.png');
  });

  test('OrderForm - All states comparison', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 1000 });
    await page.goto('/iframe.html?id=widgets-order-form--all-states&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderform-all-states.png');
  });
});

test.describe('OrdersPage Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
  });

  test('OrdersPage - Default', async ({ page }) => {
    await page.goto('/iframe.html?id=pages-orderspage--default&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderspage-default.png');
  });

  test('OrdersPage - Loading', async ({ page }) => {
    await page.goto('/iframe.html?id=pages-orderspage--loading&args=&viewMode=story');
    await expect(page).toHaveScreenshot('orderspage-loading.png');
  });
});
