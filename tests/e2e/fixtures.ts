import type { Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers';

/**
 * E2E Test Fixtures with HAR Mocking and Worker-Scoped Authentication
 *
 * Performance Optimizations:
 * 1. HAR Mocking: Records/replays Convex backend traffic (eliminates external dependency)
 * 2. Worker-Scoped Auth: Login once per worker, reuse across tests (saves ~54s per run)
 * 3. Automatic cleanup: Auth state persisted to .auth/ directory
 */

// Worker-scoped fixture for shared authentication state
type WorkerFixtures = {
    /**
     * Authenticates once per worker and saves state to .auth/worker-{N}.json
     * All tests in this worker reuse this authentication state
     */
    workerAuthState: void;
};

// Test-scoped fixtures
type TestFixtures = {
    /**
     * Authenticated page using worker's saved auth state
     */
    authenticatedPage: Page;

    /**
     * Page with HAR mocking enabled for Convex backend
     * Mode: 'record' (first run) or 'replay' (subsequent runs)
     */
    harMockedPage: Page;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
    // Worker-scoped: Login once per worker, save state
    workerAuthState: [async ({ browser }, run, workerInfo) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log(`[Worker ${workerInfo.workerIndex}] Performing one-time login...`);

        // Login as teacher (default test user)
        await login(page, TEST_USERS.teacher);

        // Save authentication state
        const authFile = `.auth/worker-${workerInfo.workerIndex}.json`;
        await context.storageState({ path: authFile });

        console.log(`[Worker ${workerInfo.workerIndex}] Auth state saved to ${authFile}`);

        await page.close();
        await context.close();

        await run();
    }, { scope: 'worker' }],

    // Test-scoped: Use saved auth state for each test
    authenticatedPage: async ({ browser, workerAuthState }, run, workerInfo) => {
        const authFile = `.auth/worker-${workerInfo.workerIndex}.json`;

        // Create context with saved auth state
        const context = await browser.newContext({
            storageState: authFile
        });

        const page = await context.newPage();
        await run(page);

        await page.close();
        await context.close();
    },

    // Test-scoped: Page with HAR mocking
    harMockedPage: async ({ page }, run) => {
        const harMode = process.env.HAR_MODE || 'replay';
        const harPath = './tests/e2e/hars/convex-backend.har';

        if (harMode === 'record') {
            console.log('[HAR] Recording Convex traffic...');
            await page.routeFromHAR(harPath, {
                url: '**/greedy-partridge-29.convex.cloud/**',
                update: true,
                updateContent: 'embed',
                updateMode: 'full'
            });
        } else {
            console.log('[HAR] Replaying Convex traffic from HAR file...');
            await page.routeFromHAR(harPath, {
                url: '**/greedy-partridge-29.convex.cloud/**',
                update: false,
                notFound: 'abort'
            });
        }

        await run(page);
    }
});

export { expect };

/**
 * Usage Examples:
 *
 * 1. Standard test with manual login (existing pattern):
 *    test('my test', async ({ page }) => {
 *      await login(page, TEST_USERS.teacher);
 *      // test code
 *    });
 *
 * 2. Test with worker-scoped auth (faster - reuses login):
 *    test('my test', async ({ authenticatedPage }) => {
 *      await authenticatedPage.goto('/');
 *      // test code - already logged in
 *    });
 *
 * 3. Test with HAR mocking (fastest - no Convex dependency):
 *    test('my test', async ({ harMockedPage }) => {
 *      await login(harMockedPage, TEST_USERS.teacher);
 *      // test code - Convex calls mocked from HAR
 *    });
 *
 * 4. Test with both optimizations (recommended):
 *    test.use({ storageState: '.auth/worker-0.json' });
 *    test('my test', async ({ harMockedPage }) => {
 *      await harMockedPage.goto('/');
 *      // test code - logged in + Convex mocked
 *    });
 */
