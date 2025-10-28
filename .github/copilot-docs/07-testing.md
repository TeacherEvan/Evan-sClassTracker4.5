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

// ❌ WRONG - Inline login logic
await page.fill('input[name="username"]', 'Evan');
await page.fill('input[name="password"]', 'TeacherEvan');
// ... repeated in every test
```

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

## Next Steps

- **Review pitfalls** → [Common Pitfalls](./08-pitfalls.md)
- **Development workflow** → [Development Workflow](./06-development.md)
- **Post-implementation** → [Procedures](./09-procedures.md)

---

[← Back to Index](../copilot-instructions.md)
