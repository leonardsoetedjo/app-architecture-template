import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // webServer disabled — tests run against manually started dev server
  // webServer: {
  //   command: 'cd /tmp/throwaway-login-python/frontend && npx vite preview --port 9000',
  //   url: 'http://localhost:9000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30000,
  // },
})
