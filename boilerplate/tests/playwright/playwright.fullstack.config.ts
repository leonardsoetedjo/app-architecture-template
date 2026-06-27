import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for full-stack E2E tests.
 * Runs inside the playwright container in docker-compose.e2e.yml.
 *
 * Environment variables (set by docker-compose):
 *   FRONTEND_URL=http://frontend:80
 *   API_BASE_URL=http://backend:8080
 */
export default defineConfig({
  testDir: './e2e-fullstack',
  fullyParallel: false,          // Sequential for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — containers are managed by docker-compose
});
