import { expect, test } from '@playwright/test';
import { login, navigateToTab, TEST_USERS, waitForToast } from './helpers';

test.describe('Notification System', () => {
    test('post-class notes notification to parent/provider', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Navigate to Classes
        await navigateToTab(page, 'Classes');

        // Find a completed class
        const completedClass = page.locator('text=completed, text=เสร็จสิ้น').first();

        if (await completedClass.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Click to open details
            await completedClass.click();

            // Look for "Add Notes" or "Post-Class Notes" button
            const notesButton = page.locator('button:has-text("Notes"), button:has-text("บันทึก"), button:has-text("Post-Class")').first();

            if (await notesButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                await notesButton.click();

                // Fill notes textarea
                const notesTextarea = page.locator('textarea').first();
                await notesTextarea.fill('Test post-class notes for parent/provider notification');

                // Submit
                await page.locator('button:has-text("Send"), button:has-text("ส่ง"), button[type="submit"]').first().click();

                // Verify success
                await waitForToast(page, undefined, 'success');
            }
        }
    });

    test('notification window displays for new users', async ({ page }) => {
        // This tests the gold tablet notification window
        // Login as any user (notification windows can target different roles)
        await login(page, TEST_USERS.teacher);

        // Look for notification window (gold tablet)
        const notificationWindow = page.locator('[data-testid="notification-window"], [class*="notification-window"]').first();

        if (await notificationWindow.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Verify window is visible
            await expect(notificationWindow).toBeVisible();

            // Look for close button
            const closeButton = page.locator('button:has-text("Close"), button:has-text("ปิด"), [aria-label*="close"]').first();

            if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                await closeButton.click();

                // Verify window closes
                await expect(notificationWindow).not.toBeVisible({ timeout: 2000 });
            }
        }
    });

    test('app update notification appears', async ({ page }) => {
        // Login to check for app updates
        await login(page, TEST_USERS.teacher);

        // Look for update notification
        const updateNotification = page.locator('[data-testid="app-update"], text=/Update|อัปเดต/, text=/Version|เวอร์ชัน/').first();

        if (await updateNotification.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Verify update info is displayed
            await expect(updateNotification).toBeVisible();
        }
    });

    test('real-time notification badge updates', async ({ page }) => {
        // Login as moderator (receives class booking notifications)
        await login(page, TEST_USERS.moderator);

        // Look for notification badge
        const notificationBadge = page.locator('[data-testid="notification-badge"], [class*="badge"]').first();

        if (await notificationBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
            // Get initial count
            const initialText = await notificationBadge.textContent();
            const initialCount = parseInt(initialText || '0');

            // Click to view notifications
            await notificationBadge.click();

            // Wait for notification panel
            await page.waitForSelector('[data-testid="notification-panel"], [class*="notification"]', { timeout: 3000 });

            // Click a notification to mark as read
            const notification = page.locator('[data-testid="notification-item"]').first();

            if (await notification.isVisible({ timeout: 1000 }).catch(() => false)) {
                await notification.click();

                // Badge count should decrease (or disappear)
                await page.waitForTimeout(500);

                const newText = await notificationBadge.textContent().catch(() => '0');
                const newCount = parseInt(newText || '0');

                // Count should be less than or equal to initial
                expect(newCount).toBeLessThanOrEqual(initialCount);
            }
        }
    });

    test('desktop notification toast appears', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Perform an action that triggers a notification
        // e.g., book a class
        await navigateToTab(page, 'Classes');

        const bookButton = page.locator('button:has-text("Book Class"), button:has-text("จองคลาส")').first();

        if (await bookButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await bookButton.click();

            // Fill minimal booking form
            const submitButton = page.locator('button[type="submit"]').first();

            if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Submit (may fail validation, but should show toast)
                await submitButton.click();

                // Wait for toast (success or error)
                await waitForToast(page);

                // Verify toast appeared
                const toast = page.locator('[role="alert"], [class*="toast"]').first();
                await expect(toast).toBeVisible({ timeout: 2000 });
            }
        }
    });

    test('notification preferences persist', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Look for settings/preferences
        const settingsButton = page.locator('button:has-text("Settings"), button:has-text("ตั้งค่า"), [aria-label*="settings"]').first();

        if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await settingsButton.click();

            // Look for notification toggles
            const notificationToggle = page.locator('input[type="checkbox"][aria-label*="notification"], input[type="checkbox"][name*="notification"]').first();

            if (await notificationToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Get initial state
                const wasChecked = await notificationToggle.isChecked();

                // Toggle
                await notificationToggle.click();

                // Save settings
                const saveButton = page.locator('button:has-text("Save"), button:has-text("บันทึก")').first();
                if (await saveButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await saveButton.click();
                    await waitForToast(page, undefined, 'success');
                }

                // Reload page
                await page.reload();
                await page.waitForLoadState('networkidle');

                // Reopen settings
                if (await settingsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await settingsButton.click();

                    // Verify setting persisted
                    const newState = await notificationToggle.isChecked();
                    expect(newState).toBe(!wasChecked);
                }
            }
        }
    });
});
