import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for the orders page.
 * Encapsulates order-related selectors and actions.
 */
export class OrdersPage extends BasePage {
  readonly createOrderButton: Locator;
  readonly ordersTable: Locator;
  readonly statusFilter: Locator;

  constructor(page: Page) {
    super(page, `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders`);
    this.createOrderButton = page.getByRole('button', { name: 'Create Order' });
    this.ordersTable = page.getByRole('table');
    this.statusFilter = page.getByLabel('Filter by status');
  }

  async createOrder(customerId: string, productId: string, quantity: number, unitPrice: number) {
    await this.createOrderButton.click();
    await this.page.getByLabel('Customer ID').fill(customerId);
    await this.page.getByLabel('Product ID').fill(productId);
    await this.page.getByLabel('Quantity').fill(quantity.toString());
    await this.page.getByLabel('Unit Price').fill(unitPrice.toString());
    await this.page.getByRole('button', { name: 'Add Item' }).click();
    await this.page.getByRole('button', { name: 'Submit Order' }).click();
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
  }
}
