import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Configuration Template
 * 
 * This configuration supports:
 * - Multi-browser testing (Chromium, Firefox, WebKit)
 * - Mobile device emulation
 * - API testing with separate baseURL
 * - CI/CD integration with GitHub Actions
 * 
 * Usage:
 *   npm run e2e           # Run all tests
 *   npm run e2e:ui        # Open UI mode
 *   npm run e2e:headed    # Run in visible browser
 *   npm run e2e:debug     # Debug mode
 */

export default defineConfig({
  // Directory containing test files
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if test.only is present
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only (flaky test protection)
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallelization on CI for stability
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [['html', { open: 'never' }], ['list']],
  
  // Shared configuration for all projects
  use: {
    // Base URL for frontend tests
    baseURL: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    // Collect trace on first retry (for debugging)
    trace: 'on-first-retry',
    
    // Screenshot on failure only
    screenshot: 'only-on-failure',
    
    // Video on failure only
    video: 'retain-on-failure',
    
    // Action timeout (ms)
    actionTimeout: 10000,
    
    // Navigation timeout (ms)
    navigationTimeout: 30000,
  },
  
  // Output directory for test results
  outputDir: 'test-results/',
  
  // Test projects (browsers + API)
  projects: [
    // Desktop browsers
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
    
    // Mobile browsers (optional - uncomment to enable)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
    
    // API tests (separate baseURL for direct backend testing)
    {
      name: 'api',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
      },
    },
  ],
  
  // Optional: Global setup (run once before all tests)
  // globalSetup: require.resolve('./global-setup'),
  
  // Optional: Global teardown (run once after all tests)
  // globalTeardown: require.resolve('./global-teardown'),
});
