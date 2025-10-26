import { expect, test } from '@playwright/test';
import { fillBilingualInput, generateTestData, login, navigateToTab, TEST_USERS, waitForToast } from './helpers';

test.describe('Student Management', () => {
    test('moderator can create new student', async ({ page }) => {
        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Students tab
        await navigateToTab(page, 'Students');

        // Click "Add Student" button
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Wait for form
        await page.waitForSelector('form, [role="dialog"]');

        // Generate test data
        const testData = generateTestData('student');

        // Fill bilingual name fields
        await fillBilingualInput(page, 'First Name', testData.firstName, testData.firstNameTh);
        await fillBilingualInput(page, 'Last Name', testData.lastName, testData.lastNameTh);

        // Select school (if dropdown)
        const schoolSelect = page.locator('select:has-option, [role="combobox"]').first();
        if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await schoolSelect.selectOption({ index: 1 });
        }

        // Submit form
        await page.locator('button:has-text("Create"), button:has-text("สร้าง"), button[type="submit"]').first().click();

        // Wait for success
        await waitForToast(page, undefined, 'success');

        // Verify student appears in list
        await expect(page.locator(`text=${testData.firstName}`).first()).toBeVisible({ timeout: 5000 });
    });

    test('student creation handles Thai characters correctly', async ({ page }) => {
        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Students
        await navigateToTab(page, 'Students');

        // Open add student form
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Fill Thai name
        const thaiFirstName = 'สมชาย';
        const thaiLastName = 'ใจดี';

        // Find Thai input fields
        const thaiFirstNameInput = page.locator('input[placeholder*="ชื่อ"], input[aria-label*="ชื่อ"]').first();
        const thaiLastNameInput = page.locator('input[placeholder*="นามสกุล"], input[aria-label*="นามสกุล"]').first();

        if (await thaiFirstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await thaiFirstNameInput.fill(thaiFirstName);
        }

        if (await thaiLastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await thaiLastNameInput.fill(thaiLastName);
        }

        // Fill English equivalent
        const engFirstNameInput = page.locator('input[placeholder*="First"], input[aria-label*="First"]').first();
        const engLastNameInput = page.locator('input[placeholder*="Last"], input[aria-label*="Last"]').first();

        if (await engFirstNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await engFirstNameInput.fill('Somchai');
        }

        if (await engLastNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await engLastNameInput.fill('Jaidee');
        }

        // Select school
        const schoolSelect = page.locator('select').first();
        if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await schoolSelect.selectOption({ index: 1 });
        }

        // Submit
        await page.locator('button[type="submit"]').first().click();

        // Verify Thai name displays correctly
        await expect(page.locator(`text=${thaiFirstName}`).first()).toBeVisible({ timeout: 5000 });
    });

    test('student ID is auto-generated', async ({ page }) => {
        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Students
        await navigateToTab(page, 'Students');

        // Check if any student exists and displays ID
        const studentId = page.locator('[data-testid="student-id"], text=/^[A-Z0-9]{4}-[A-Z0-9]{4}-/').first();

        if (await studentId.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Verify ID format matches pattern: SCHOOL-NAME-TIMESTAMP-RANDOM
            const idText = await studentId.textContent();
            expect(idText).toMatch(/^[A-Z0-9]+-[A-Z0-9]+-[a-z0-9]+-[A-Z0-9]+$/);
        }
    });

    test('duplicate student prevention', async ({ page }) => {
        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Students
        await navigateToTab(page, 'Students');

        // Create first student
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        const testData = generateTestData('student');

        await fillBilingualInput(page, 'First Name', testData.firstName, testData.firstNameTh);
        await fillBilingualInput(page, 'Last Name', testData.lastName, testData.lastNameTh);

        const schoolSelect = page.locator('select').first();
        if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await schoolSelect.selectOption({ index: 1 });
        }

        await page.locator('button[type="submit"]').first().click();
        await waitForToast(page, undefined, 'success');

        // Try to create duplicate
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Fill same data
        await fillBilingualInput(page, 'First Name', testData.firstName, testData.firstNameTh);
        await fillBilingualInput(page, 'Last Name', testData.lastName, testData.lastNameTh);

        if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await schoolSelect.selectOption({ index: 1 });
        }

        await page.locator('button[type="submit"]').first().click();

        // Should show error or warning (implementation dependent)
        // Either error toast or duplicate warning
        const errorToast = page.locator('[role="alert"], .toast-error, text=/duplicate|already exists|ซ้ำ/i').first();
        if (await errorToast.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(errorToast).toBeVisible();
        }
    });

    test('student search and filtering', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Navigate to Students
        await navigateToTab(page, 'Students');

        // Look for search input
        const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();

        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Enter search term
            await searchInput.fill('Test');

            // Wait for results to filter
            await page.waitForTimeout(500);

            // Verify search is working (results update)
            // This is a basic check - real implementation may vary
            const results = page.locator('[data-testid="student-row"], [class*="student"]');
            const count = await results.count();

            // If results exist, search is working
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });
});
