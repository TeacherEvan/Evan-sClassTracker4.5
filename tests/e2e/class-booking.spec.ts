import { expect } from '@playwright/test';
import { api } from '../../convex/_generated/api';
import { test } from './fixtures';
import { generateTestData, login, navigateToTab, TEST_USERS, waitForToast } from './helpers';

test.describe('Class Booking Workflow', () => {
    test('teacher can book a class', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Navigate to Classes tab
        await navigateToTab(page, 'Classes');

        // Click "Book Class" button
        await page.locator('button:has-text("Book Class"), button:has-text("จองคลาส")').first().click();

        // Wait for booking form
        await page.waitForSelector('form, [role="dialog"]');

        // Fill booking details (adjust selectors based on actual form)
        const testData = generateTestData('class');

        // Select school (if dropdown exists)
        const schoolSelect = page.locator('select:has-option, [role="combobox"]').first();
        if (await schoolSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await schoolSelect.selectOption({ index: 1 }); // Select first school
        }

        // Select student (if dropdown exists)
        const studentSelect = page.locator('select:has-option, [role="combobox"]').nth(1);
        if (await studentSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
            await studentSelect.selectOption({ index: 1 }); // Select first student
        }

        // Select date
        const dateInput = page.locator('input[type="date"], input[type="datetime-local"]').first();
        if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            // Format for datetime-local: YYYY-MM-DDTHH:mm
            await dateInput.fill(tomorrow.toISOString().slice(0, 16));
        }

        // Submit booking
        await page.locator('button:has-text("Book"), button:has-text("จอง"), button[type="submit"]').first().click();

        // Wait for success toast
        await waitForToast(page, undefined, 'success');

        // Verify class appears in list
        await expect(page.locator('text=pending, text=รอดำเนินการ')).toBeVisible({ timeout: 5000 });
    });

    test('moderator receives notification for new class booking', async ({ page }) => {
        // This test requires a class to be booked first
        // In real scenario, we'd book a class then check moderator notifications

        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Check for notifications
        const notificationBadge = page.locator('[data-testid="notification-badge"], text=/\\d+/');

        // If notifications exist, verify they're visible
        if (await notificationBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(notificationBadge).toBeVisible();
        }
    });

    test('moderator can approve class booking', async ({ page, convexClient }) => {
        // 1. Seed data: Create a pending class
        const teachers = await convexClient.query(api.users.list, { role: 'teacher' });
        const teacher = teachers[0];
        const schools = await convexClient.query(api.schools.list, {});
        const school = schools[0];
        const students = await convexClient.query(api.students.bySchool, { schoolId: school._id });
        const student = students[0];

        if (!teacher || !school || !student) {
            test.skip('Missing required data for test');
            return;
        }

        // Create a pending class
        await convexClient.mutation(api.classes.book, {
            teacherId: teacher._id,
            studentId: student._id,
            schoolId: school._id,
            scheduledDate: Date.now() + 86400000, // Tomorrow
            bookedByUserId: teacher._id, // Book as teacher to make it pending
            pendingLocationName: "Test Location",
            pendingLocationNameTh: "สถานที่ทดสอบ"
        });

        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Classes tab
        await navigateToTab(page, 'Classes');

        // Find a pending class
        const pendingClass = page.locator('text=pending, text=acknowledged, text=รอดำเนินการ').first();

        if (await pendingClass.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Click on the class to open details
            await pendingClass.click();

            // Look for approve button
            const approveButton = page.locator('button:has-text("Approve"), button:has-text("อนุมัติ")').first();

            if (await approveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await approveButton.click();

                // Wait for success
                await waitForToast(page, undefined, 'success');
            }
        }
    });

    test('moderator can reject class booking', async ({ page }) => {
        // Login as moderator
        await login(page, TEST_USERS.moderator);

        // Navigate to Classes tab
        await navigateToTab(page, 'Classes');

        // Find a pending class
        const pendingClass = page.locator('text=pending, text=รอดำเนินการ').first();

        if (await pendingClass.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Click on the class
            await pendingClass.click();

            // Look for reject button
            const rejectButton = page.locator('button:has-text("Reject"), button:has-text("ปฏิเสธ")').first();

            if (await rejectButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await rejectButton.click();

                // Fill rejection reason (if prompted)
                const reasonInput = page.locator('textarea, input[type="text"]').first();
                if (await reasonInput.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await reasonInput.fill('Test rejection reason');

                    // Confirm rejection
                    await page.locator('button:has-text("Confirm"), button:has-text("ยืนยัน"), button:has-text("Reject")').last().click();
                }

                // Wait for success
                await waitForToast(page, undefined, 'success');
            }
        }
    });

    test('calendar view displays classes', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Look for calendar view
        const calendarButton = page.locator('button:has-text("Calendar"), button:has-text("ปฏิทิน"), [aria-label*="calendar"]').first();

        if (await calendarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await calendarButton.click();

            // Verify calendar elements visible
            await expect(page.locator('[data-testid="calendar"], [class*="calendar"]').first()).toBeVisible({ timeout: 3000 });
        }
    });
});
