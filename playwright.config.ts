import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Evan's Class Tracker
 *
 * Runs E2E tests against staging environment after deployment.
 * Tests all critical user workflows and features.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Maximum time one test can run */
  timeout: 60 * 1000,

  /* Run tests in files in parallel AND within files (OPTIMIZED) */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* OPTIMIZED: Limit workers for stability and speed */
  workers: process.env.CI ? 2 : 4,

  /* OPTIMIZED: Fail fast on CI to save time */
  maxFailures: process.env.CI ? 10 : undefined,

  /* Reporter to use */
  reporter: [
    ['html'],
    ['list'],
    ['github'], // GitHub Actions annotations
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL - will be overridden by STAGING_URL env var in CI */
    baseURL: process.env.STAGING_URL || 'http://localhost:3002',

    /* OPTIMIZED: Disable trace locally (25-30% faster), enable on CI retry */
    trace: process.env.CI ? 'on-first-retry' : 'off',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* OPTIMIZED: Disable video locally (saves overhead), enable on CI failures */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Default timeout for each action (click, fill, etc.) */
    actionTimeout: 10 * 1000,
  },

  /* Configure projects for different browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    // 1. Start Convex dev server first (required dependency)
    {
      command: 'npx convex dev',
      url: process.env.NEXT_PUBLIC_CONVEX_URL || 'https://greedy-partridge-29.convex.cloud',
      timeout: 60 * 1000,
      reuseExistingServer: true, // Usually already running
    },
    // 2. Then start Next.js dev server
    {
      command: 'npm run dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes for Next.js to start
    },
  ],
});
