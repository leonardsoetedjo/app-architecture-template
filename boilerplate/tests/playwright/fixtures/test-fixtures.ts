import { test as base, Page } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';

/**
 * Custom test fixtures extending Playwright's base test.
 * Use these fixtures to share common setup across tests.
 */
type Fixtures = {
  loginPage: LoginPage;
  ordersPage: OrdersPage;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  
  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    await page.goto(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`);
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL(/\/dashboard/);
    
    await use(page);
  },
});

export { expect } from '@playwright/test';
