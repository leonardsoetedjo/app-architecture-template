import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page object for Quasar login page.
 * Uses data-testid attributes for stable selectors.
 */
export class QuasarLoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly demoCredentials: Locator;

  constructor(page: Page) {
    super(page, `${process.env.FRONTEND_URL || 'http://localhost:9000'}/login`);
    this.usernameInput = page.locator('[data-testid="login-username-input"]');
    this.passwordInput = page.locator('[data-testid="login-password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.errorMessage = page.locator('[data-testid="login-general-error"]');
    this.demoCredentials = page.locator('[data-testid="login-demo-credentials"]');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsAdmin() {
    await this.login('admin', 'admin123');
  }

  async getDemoCredentials(): Promise<string | null> {
    return await this.demoCredentials.textContent();
  }
}
