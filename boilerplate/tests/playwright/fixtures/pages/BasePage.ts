import { Page, Locator } from '@playwright/test';

/**
 * Base page class with common methods.
 * All page objects should extend this class.
 */
export class BasePage {
  readonly page: Page;
  readonly url: string;

  constructor(page: Page, url: string) {
    this.page = page;
    this.url = url;
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}
