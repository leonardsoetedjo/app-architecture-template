import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      // Tests targeting the Java backend API directly
    },
  ],
});
