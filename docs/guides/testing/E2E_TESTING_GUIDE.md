# E2E Testing Guide

Automated end-to-end testing for Evan's Class Tracker using Playwright.

## 🚀 Performance Metrics (Nov 2025)

**Latest Optimizations (v4.5.25):**

- **Test Execution Time**: 2-3 minutes → 1.5-2 minutes (30-40% faster)
- **Login Flow**: 8-10 seconds → 4-5 seconds per test (50% faster)
- **Parallelism**: 4 workers → 6 workers (50% more concurrent tests)
- **Test Timeout**: 60s → 45s global, 10s → 8s actions
- **Pass Rate**: 97%+ across all test suites

## Quick Start

### Local Testing

```powershell
# Run all tests (optimized for speed)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Test Against Staging

```powershell
# Set staging URL
$env:STAGING_URL = "https://your-staging-url.vercel.app"

# Run tests
npm run test:e2e
```

## Test Structure

### Test Suites

1. **Authentication (`auth.spec.ts`)**
   - Login flows for all user roles (admin, moderator, teacher)
   - Logout functionality
   - Invalid credentials handling
   - Language persistence across sessions
   - Account lockout (after 5 failed attempts)

2. **Class Booking Workflow (`class-booking.spec.ts`)**
   - Teacher books a class
   - Moderator receives notification
   - Moderator approves/rejects booking
   - Calendar view displays classes

3. **Student Management (`student-management.spec.ts`)**
   - Create new student (bilingual)
   - Handle Thai characters correctly
   - Auto-generate unique student IDs
   - Prevent duplicate students
   - Search and filter students

4. **Notification System (`notifications.spec.ts`)**
   - Post-class notes to guardian
   - Notification window (gold tablet)
   - App update notifications
   - Real-time badge updates
   - Desktop toast notifications
   - Notification preferences persistence

### Test Helpers (`helpers.ts`) - Optimized Nov 2025

**Performance-Optimized Functions:**

- `login(page, user)` - Authenticate (50% faster: 8-10s → 4-5s)
  - Convex connection timeout: 30s → 15s
  - Password change dialog: 3s → 1.5s wait
  - Wizard dismissal: 1s → 0.5s waits
  - Monthly Calendar verification: 10s → 5s timeout
  
- `navigateToTab(page, tabName)` - Navigate sidebar (streamlined)
  - Tab button timeout: 10s → 5s
  - Retry attempts: 3 → 2
  - Content load wait: 1s → 0.5s
  
- `logout(page)` - Sign out
- `switchLanguage(page, language)` - Toggle English/Thai
- `waitForToast(page, message, type)` - Wait for notifications
- `fillBilingualInput(page, label, valueEn, valueTh)` - Fill parallel inputs
- `generateTestData(type)` - Create unique test data

## CI/CD Integration

### Automated Testing Workflow

Tests run automatically after staging deployment completes:

```yaml
# .github/workflows/e2e-tests.yml
# Triggered by: Deploy to Staging workflow completion
# Or manually via workflow_dispatch
```

**What happens:**

1. Staging deployment completes successfully
2. E2E workflow starts automatically
3. Installs dependencies and Playwright browsers
4. Runs all test suites against staging URL (6 parallel workers)
5. Uploads test reports and screenshots (on failure)
6. Comments on PR with test results

### Manual Trigger

```bash
# GitHub Actions UI → E2E Tests workflow → Run workflow
# Specify staging URL or use default
```

## Configuration

### Playwright Config (`playwright.config.ts`)

```typescript
{
  testDir: './tests/e2e',
  timeout: 60000,              // 60 second test timeout
  expect: { timeout: 5000 },   // 5 second assertion timeout
  retries: process.env.CI ? 2 : 0,  // Retry failed tests on CI
  reporter: 'html',            // HTML report
  use: {
    baseURL: process.env.STAGING_URL || 'http://localhost:3001',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  }
}
```

### Environment Variables

- `STAGING_URL` - Staging deployment URL (required for CI)
- `CI` - Enables retries and headless mode

## Test User Credentials

```typescript
// From helpers.ts
TEST_USERS = {
  admin: { username: 'admin', password: 'TeacherAdmin' },
  moderator: { username: 'moderator1', password: 'TeacherModerator1' },
  teacher: { username: 'Evan', password: 'TeacherEvan' }
}
```

**⚠️ Security Note:** These are test credentials only. Do NOT use in production.

## Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Login
    await login(page, TEST_USERS.teacher);
    
    // Navigate
    await page.locator('text=Tab Name').click();
    
    // Interact
    await page.locator('button:has-text("Action")').click();
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

### Bilingual Testing Pattern

```typescript
// Match either English OR Thai text
await page.locator('button:has-text("Book Class"), button:has-text("จองคลาส")').click();

// Use helpers for bilingual inputs
import { fillBilingualInput } from './helpers';
await fillBilingualInput(page, 'Name', 'John', 'จอห์น');
```

### Handling Optional Elements

```typescript
// Check if element exists before interacting
if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
  await element.click();
}
```

## Debugging Tests

### Interactive UI Mode

```powershell
npm run test:e2e:ui
```

**Features:**

- Visual test runner
- Step-by-step execution
- Time travel debugging
- Watch mode for development

### Debug Mode

```powershell
npm run test:e2e:debug
```

**Features:**

- Pauses before each action
- Browser DevTools integration
- Console logs preserved

### Headed Mode

```powershell
npm run test:e2e:headed
```

See browser actions in real-time (slower but visual).

### View Test Report

```powershell
npm run test:e2e:report
```

Opens HTML report with:

- Test results summary
- Screenshots (on failure)
- Videos (on failure)
- Execution traces

## Troubleshooting

### Tests Timeout

**Issue:** Tests fail with "Test timeout of 60000ms exceeded"

**Solutions:**

1. Increase timeout in `playwright.config.ts`:

   ```typescript
   timeout: 120000  // 2 minutes
   ```

2. Use specific waits instead of generic timeouts:

   ```typescript
   await page.waitForSelector('text=Expected', { timeout: 10000 });
   ```

### Element Not Found

**Issue:** `locator.click: Target closed` or element not visible

**Solutions:**

1. Check bilingual selectors:

   ```typescript
   // Both English and Thai
   await page.locator('text=Book, text=จอง').click();
   ```

2. Wait for element explicitly:

   ```typescript
   await page.waitForSelector('button:has-text("Book")');
   await page.locator('button:has-text("Book")').click();
   ```

3. Use more specific selectors:

   ```typescript
   await page.locator('[data-testid="book-button"]').click();
   ```

### Authentication Fails

**Issue:** Tests can't login

**Solutions:**

1. Verify credentials in `helpers.ts` match database
2. Check if session storage is working:

   ```typescript
   await page.evaluate(() => localStorage.getItem('currentUser'));
   ```

3. Verify login form selectors haven't changed

### Staging URL Not Set

**Issue:** Tests run against localhost instead of staging

**Solutions:**

1. Set environment variable:

   ```powershell
   $env:STAGING_URL = "https://your-staging-url.vercel.app"
   ```

2. Or hardcode in `playwright.config.ts`:

   ```typescript
   baseURL: 'https://your-staging-url.vercel.app'
   ```

### CI Tests Fail but Local Pass

**Issue:** Tests pass locally but fail in GitHub Actions

**Solutions:**

1. Enable retries (already configured):

   ```typescript
   retries: process.env.CI ? 2 : 0
   ```

2. Check CI logs for specific errors
3. Download test artifacts from GitHub Actions
4. Test timing might differ - add explicit waits

## Best Practices

### 1. Use Data Attributes

```typescript
// Good - stable selector
await page.locator('[data-testid="book-class-button"]').click();

// Bad - fragile selector
await page.locator('div > button.btn-primary').click();
```

### 2. Test User Flows, Not Implementation

```typescript
// Good - tests user journey
test('user can book and complete class', async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  await bookClass(page);
  await completeClass(page);
  await expect(page.locator('text=Completed')).toBeVisible();
});

// Bad - tests internal state
test('booking sets status to pending', async ({ page }) => {
  // Too implementation-specific
});
```

### 3. Clean Up Test Data

```typescript
test.afterEach(async ({ page }) => {
  // Delete test students created during test
  await cleanupTestData(page);
});
```

### 4. Avoid Hardcoded Waits

```typescript
// Good - wait for specific condition
await page.waitForSelector('text=Success');

// Bad - arbitrary timeout
await page.waitForTimeout(3000);
```

### 5. Test Both Languages

```typescript
test('bilingual support', async ({ page }) => {
  // Test in English
  await switchLanguage(page, 'en');
  await expect(page.locator('text=Book Class')).toBeVisible();
  
  // Test in Thai
  await switchLanguage(page, 'th');
  await expect(page.locator('text=จองคลาส')).toBeVisible();
});
```

## Coverage Goals

**Current Coverage:**

- ✅ Authentication (all roles)
- ✅ Class booking workflow
- ✅ Student management
- ✅ Notification system

**Future Coverage:**

- ⏳ Admin user management
- ⏳ School/location management
- ⏳ Messaging hub
- ⏳ Analytics dashboards
- ⏳ Audit logs

## Performance Testing

### Response Time Assertions

```typescript
test('page loads within 3 seconds', async ({ page }) => {
  const start = Date.now();
  await login(page, TEST_USERS.teacher);
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(3000);
});
```

### Database Query Performance

```typescript
test('student list loads quickly', async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  
  const start = Date.now();
  await page.locator('text=Students').click();
  await page.waitForSelector('[data-testid="student-list"]');
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(2000);
});
```

## Maintenance

### Updating Tests

When UI changes:

1. Run tests in UI mode: `npm run test:e2e:ui`
2. Use Playwright Inspector to find new selectors
3. Update test files
4. Verify all tests pass

### Adding New Features

1. Write tests BEFORE implementing feature (TDD)
2. Use test helpers for common actions
3. Follow bilingual testing pattern
4. Add to appropriate test suite or create new one
5. Update this documentation

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Selector Strategies](https://playwright.dev/docs/selectors)
- [GitHub Actions Integration](https://playwright.dev/docs/ci-intro)

## Support

**Issues with tests?**

1. Check this guide
2. Review test failures in HTML report
3. Run in debug mode
4. Check CI logs and artifacts
5. Ask for help with specific error messages

**Quick Links:**

- Test Configuration: `playwright.config.ts`
- Test Helpers: `tests/e2e/helpers.ts`
- CI Workflow: `.github/workflows/e2e-tests.yml`
- Staging Guide: `docs/STAGING_SETUP_GUIDE.md`
