import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for Quasar orders page.
 * Uses Quasar table selectors and data-testid attributes.
 */
export class QuasarOrdersPage extends BasePage {
  readonly ordersTable: Locator;
  readonly pageTitle: Locator;
  readonly tableRows: Locator;

  constructor(page: Page) {
    super(page, `${process.env.FRONTEND_URL || 'http://localhost:9000'}/orders`);
    this.ordersTable = page.locator('.q-table');
    this.pageTitle = page.locator('.text-h5');
    this.tableRows = page.locator('.q-table tbody tr');
  }

  async waitForOrdersToLoad() {
    await this.ordersTable.waitFor({ state: 'visible' });
  }

  async getOrdersCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async getOrderAt(index: number) {
    const row = this.tableRows.nth(index);
    return {
      id: await row.locator('td:nth-child(1)').textContent(),
      status: await row.locator('td:nth-child(2)').textContent(),
      items: await row.locator('td:nth-child(3)').textContent(),
      total: await row.locator('td:nth-child(4)').textContent(),
      createdAt: await row.locator('td:nth-child(5)').textContent(),
    };
  }

  async hasOrders(): Promise<boolean> {
    const count = await this.getOrdersCount();
    return count > 0;
  }
}
