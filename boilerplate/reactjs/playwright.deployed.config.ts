import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config for deployed app-architecture-template.
 * Tests run against live Tailscale deployment.
 * Usage: BASE_URL=https://hermes.piranha-broadnose.ts.net npx playwright test -c playwright.deployed.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://hermes.piranha-broadnose.ts.net',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium-deployed',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
});
