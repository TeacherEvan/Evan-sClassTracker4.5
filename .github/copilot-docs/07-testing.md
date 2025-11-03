# E2E Testing Guide

[← Back to Index](../copilot-instructions.md)

---

## Playwright Setup & Commands

```powershell
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:ui       # Run tests with Playwright UI (recommended for debugging)
npm run test:e2e:headed   # Run tests in headed browser (see what's happening)
npm run test:e2e:debug    # Debug mode with breakpoints
npm run test:e2e:report   # View test report from last run
```

---

## Test Structure Overview

**Test files** (see `tests/e2e/`):

- `helpers.ts` - Reusable utilities (login, logout, waitForToast, navigateToTab, generateTestData)
- `auth.spec.ts` - Login, logout, password change, language persistence
- `class-booking.spec.ts` - Book classes, approval workflow, moderator notifications
- `student-management.spec.ts` - Create students, search, edit
- `notifications.spec.ts` - Toast notifications, real-time updates

**⚠️ CRITICAL TEST INFRASTRUCTURE NOTES (Nov 4, 2025)**:

1. **Login Form Uses ID Selectors**: The login form uses `id="username"` and `id="password"` attributes, NOT `name` attributes. Always use `#username` and `#password` selectors in tests.

2. **Password Change Dialog**: Test users may have `requirePasswordChange: true` flag, causing a password change dialog to appear after login. The `login()` helper automatically detects and dismisses this dialog.

3. **Bilingual Header Text**: App displays "Class Tracker" / "ติดตามชั้นเรียน" (NOT "Evan's Class Tracker"). Test assertions must match actual rendered text.

4. **Playwright Manages Servers**: The `playwright.config.ts` webServer configuration automatically starts both Convex (`npx convex dev`) and Next.js (`npm run dev`) before tests run. Do NOT manually start these servers.

---

## 7 Best Practices for Writing Tests

### 1. Use Bilingual Selectors

Tests must work in both English and Thai:

```typescript
// ✅ CORRECT - Handles both languages
await page.locator('button:has-text("Login"), button:has-text("เข้าสู่ระบบ")').first().click();

// ❌ WRONG - Only works in English
await page.locator('button:has-text("Login")').click();
```

### 2. Use Reusable Helpers

Don't duplicate login/navigation logic:

```typescript
// ✅ CORRECT - Use helper functions
await login(page, TEST_USERS.teacher);
await navigateToTab(page, 'Classes');

// ❌ WRONG - Inline login logic with incorrect selectors
await page.fill('input[name="username"]', 'Evan'); // WRONG: Use #username instead!
await page.fill('input[name="password"]', 'TeacherEvan');
// ... repeated in every test
```

**NOTE**: Always use the `login()` helper which correctly handles:

- ID-based selectors (`#username`, `#password`)
- Bilingual button text ("Login" / "เข้าสู่ระบบ")
- Password change dialog dismissal
- Login verification with correct header text

### 3. Handle Optional Elements Gracefully

```typescript
// ✅ CORRECT - Check if element exists before interacting
const deleteButton = page.locator('button:has-text("Delete")').first();
if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
  await deleteButton.click();
}

// ❌ WRONG - Assumes element always exists
await page.locator('button:has-text("Delete")').click(); // Fails if not found
```

### 4. Use generateTestData for Unique Values

```typescript
// ✅ CORRECT - Generates unique test data
const testData = generateTestData('student');
await page.fill('input[name="firstName"]', testData.firstName);

// ❌ WRONG - Hardcoded values cause conflicts
await page.fill('input[name="firstName"]', 'John');
```

### 5. Wait for Real-time Updates

Convex updates are asynchronous:

```typescript
// ✅ CORRECT - Wait for toast confirmation
await submitButton.click();
await waitForToast(page, undefined, 'success');
await expect(page.locator('text=approved')).toBeVisible({ timeout: 5000 });

// ❌ WRONG - Assumes immediate update
await submitButton.click();
await expect(page.locator('text=approved')).toBeVisible(); // May fail
```

### 6. Test Role-Based Access

```typescript
test('moderator cannot see admin features', async ({ page }) => {
  await login(page, TEST_USERS.moderator);
  
  // Verify admin-only buttons are hidden
  await expect(page.locator('button:has-text("Delete All Users")')).not.toBeVisible();
});
```

### 7. Test Bilingual Functionality

```typescript
test('language switcher persists across sessions', async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  
  // Switch to Thai
  await switchLanguage(page, 'th');
  await expect(page.locator('text=จองคลาส')).toBeVisible();
  
  // Logout and login again
  await logout(page);
  await login(page, TEST_USERS.teacher);
  
  // Verify Thai persisted
  await expect(page.locator('text=จองคลาส')).toBeVisible();
});
```

---

## 4 Performance Optimization Patterns

### 1. Parallelize Independent Tests

Playwright runs tests in parallel by default:

```typescript
// These tests can run in parallel
test('test 1', async ({ page }) => { /* ... */ });
test('test 2', async ({ page }) => { /* ... */ });
```

### 2. Use test.describe.serial for Dependent Tests

```typescript
test.describe.serial('booking workflow', () => {
  test('create class', async ({ page }) => { /* ... */ });
  test('approve class', async ({ page }) => { /* ... */ }); // Depends on previous
});
```

### 3. Minimize Page Reloads

Navigate within app when possible:

```typescript
// ✅ CORRECT - Use navigation
await navigateToTab(page, 'Students');

// ❌ SLOW - Unnecessary reload
await page.goto('/students');
```

### 4. Use Fixtures for Test Data Setup

```typescript
test.beforeEach(async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  // Common setup for all tests in this suite
});
```

---

## Real Test Examples from Codebase

### Example 1: Authentication Test

```typescript
// from auth.spec.ts
test('should show error for invalid credentials', async ({ page }) => {
  await page.goto('/');
  
  await page.locator('input[name="username"]').first().fill('invalid_user');
  await page.locator('input[name="password"]').first().fill('wrong_password');
  await page.locator('button:has-text("Login")').first().click();
  
  await waitForToast(page, undefined, 'error'); // Wait for error toast
});
```

### Example 2: Class Booking Workflow

```typescript
// from class-booking.spec.ts
test('teacher can book a class', async ({ page }) => {
  await login(page, TEST_USERS.teacher);
  await navigateToTab(page, 'Classes');
  
  // Click "Book Class" button (bilingual support)
  await page.locator('button:has-text("Book Class"), button:has-text("จองคลาส")').first().click();
  
  // Fill form (selectors handle both languages)
  const schoolSelect = page.locator('select:has-option').first();
  await schoolSelect.selectOption({ index: 1 });
  
  // Submit and verify
  await page.locator('button:has-text("Book"), button[type="submit"]').first().click();
  await waitForToast(page, undefined, 'success');
  
  // Verify status appears
  await expect(page.locator('text=pending, text=รอดำเนินการ')).toBeVisible();
});
```

### Example 3: Using generateTestData Helper

```typescript
// from helpers.ts usage
const testData = generateTestData('class'); // Auto-generates unique test data
```

---

## Test Users

**Predefined in `helpers.ts`**:

- `TEST_USERS.admin` - Full system access
- `TEST_USERS.moderator` - School moderator role
- `TEST_USERS.teacher` - Teacher role

---

## CI Integration

E2E tests run automatically after staging deployment via `e2e-tests.yml` workflow.

---

## Bilingual Testing Strategies

**Key patterns in tests**:

- **Bilingual selectors**: `text=English, text=ไทย` handles both languages
- **Reusable helpers**: `login()`, `navigateToTab()`, `waitForToast()`, `generateTestData()`
- **Flexible selectors**: Use multiple selectors for robustness
- **Timeout handling**: `.isVisible({ timeout: 2000 }).catch(() => false)` for optional elements

---

## Recent Test Infrastructure Fixes (Nov 4, 2025)

### Issue #1: Login Form Selector Mismatch

**Problem**: Tests were looking for `input[name="username"]` but login form uses `id="username"` without `name` attribute.

**Fix**: Updated all test selectors from `input[name="username"]` to `#username` (ID-based).

**Files Modified**:

- `tests/e2e/helpers.ts` - Updated `login()` helper function
- `tests/e2e/auth.spec.ts` - Updated invalid credentials test

### Issue #2: Password Change Dialog Blocking

**Problem**: Test users with `requirePasswordChange: true` flag show password change dialog after login, blocking access to main app and causing test failures.

**Fix**: Added automatic detection and dismissal of password change dialog in `login()` helper.

**Implementation**:

```typescript
// Check if password change dialog appears
const passwordChangeDialog = page.locator('text=Change Password, text=เปลี่ยนรหัสผ่าน').first();
const isPasswordChangeVisible = await passwordChangeDialog.isVisible({ timeout: 2000 }).catch(() => false);

if (isPasswordChangeVisible) {
  // Close the dialog
  const closeButton = page.locator('button:has-text("Close"), button:has-text("ปิด"), button:has-text("×")').first();
  await closeButton.click();
  await page.waitForTimeout(500);
}
```

### Issue #3: Header Text Mismatch

**Problem**: Tests looked for "Evan's Class Tracker" but app displays "Class Tracker" (short form).

**Fix**: Updated login verification to match actual header text: `text=Class Tracker, text=ติดตามชั้นเรียน`

### Lessons Learned

1. **Always check actual rendered HTML** - Use error context files and page snapshots to see exact element structure
2. **ID selectors are more reliable than name attributes** - Especially for bilingual forms
3. **Handle modal dialogs in test helpers** - Don't assume direct path to main app
4. **Bilingual apps need dual selectors** - Every user-facing element may render in either language

---

## Next Steps

- **Review pitfalls** → [Common Pitfalls](./08-pitfalls.md)
- **Development workflow** → [Development Workflow](./06-development.md)
- **Post-implementation** → [Procedures](./09-procedures.md)

---

[← Back to Index](../copilot-instructions.md)
