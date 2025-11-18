import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Evan's Class Tracker
 *
 * Runs E2E tests against staging environment after deployment.
 * Tests all critical user workflows and features.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Maximum time one test can run - OPTIMIZED: Reduced from 60s to 45s */
  timeout: 45 * 1000,

  /* Run tests in files in parallel AND within files (OPTIMIZED) */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* OPTIMIZED: Limit workers for stability and speed - Increased local workers from 4 to 6 */
  workers: process.env.CI ? 2 : 6,

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
    baseURL: process.env.STAGING_URL || 'http://localhost:3001',

    /* OPTIMIZED: Disable trace locally (25-30% faster), enable on CI retry */
    trace: process.env.CI ? 'on-first-retry' : 'off',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* OPTIMIZED: Disable video locally (saves overhead), enable on CI failures */
    video: process.env.CI ? 'retain-on-failure' : 'off',

    /* Default timeout for each action (click, fill, etc.) - OPTIMIZED: Reduced from 10s to 8s */
    actionTimeout: 8 * 1000,
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
  webServer: {
    // Only start Next.js dev server for local testing
    // Skip webServer when running against staging (NEXT_PUBLIC_CONVEX_URL_STAGING is set)
    //
    // ⚠️ IMPORTANT: You must start Convex separately before running tests:
    //    1. Run: npx convex dev
    //    2. Then run: npm run test:e2e
    //
    // Or use the helper script: .\\scripts\\start-test-servers.ps1
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for Next.js to start
    env: {
      // Ensure Convex URL is set for tests (reads from .env.local)
      NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || 'https://greedy-partridge-29.convex.cloud',
      // Disable Next.js telemetry and dev overlays during tests
      NEXT_TELEMETRY_DISABLED: '1',
      // This tells Next.js we're in a "production-like" testing environment
      // which disables dev overlays while still using dev mode
      __NEXT_TEST_MODE: 'true',
    },
  },
});
