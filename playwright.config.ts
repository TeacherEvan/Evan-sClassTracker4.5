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

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

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

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

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
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes for Next.js to start
    },
});
