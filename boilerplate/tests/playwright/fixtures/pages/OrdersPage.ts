import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the ReactJS orders page.
 * Uses data-testid attributes for stable selectors.
 */
export class OrdersPage extends BasePage {
  readonly newOrderButton: Locator;
  readonly ordersTable: Locator;
  readonly statusFilter: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    super(page, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`);
    this.newOrderButton = page.locator('[data-testid="orders-new-button"]');
    this.ordersTable = page.locator('[data-testid="orders-table"]');
    this.statusFilter = page.locator('[data-testid="orders-status-filter"]');
    this.pageTitle = page.locator('h1:text("Orders")');
  }

  async waitForOrdersToLoad() {
    await this.ordersTable.waitFor({ state: 'visible' });
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }

  async clickNewOrder() {
    await this.newOrderButton.click();
  }

  async getOrdersCount(): Promise<number> {
    const rows = this.ordersTable.locator('tbody tr');
    return await rows.count();
  }
}
