import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Storybook visual regression testing.
 * 
 * Run tests: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run specific file: npx playwright test tests/storybook.spec.ts
 */
export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  outputDir: 'playwright-results/',

  webServer: {
    command: 'npm run build-storybook && npx http-server ./storybook-static -p 6006 -s',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
