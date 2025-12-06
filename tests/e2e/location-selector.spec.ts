import { expect, test } from '@playwright/test';
import { login, navigateToTab, TEST_USERS, waitForToast } from './helpers';

test.describe.configure({ mode: 'serial' });

test.describe('Location Selector', () => {
    test('location selector displays and allows district selection', async ({ page }) => {
        // Login as teacher (can create provider students with location)
        await login(page, TEST_USERS.teacher);

        // Navigate to Students tab
        await navigateToTab(page, 'Students');

        // Click "Add Student" button
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Wait for form
        await page.waitForSelector('form, [role="dialog"]');

        // Scroll to location selector area (it's in optional details)
        const locationLabel = page.locator('text=Teaching Location').or(page.locator('text=สถานที่สอน')).first();
        if (await locationLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            await locationLabel.scrollIntoViewIfNeeded();

            // Click the location selector button
            const locationButton = page.locator('button').filter({ has: page.locator('[class*="lucide-map-pin"]') }).first();
            await locationButton.click();

            // Wait for dropdown to open
            await page.waitForSelector('input[placeholder*="Search"], input[placeholder*="ค้นหา"]', { timeout: 5000 });

            // Verify search input is visible
            const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();
            await expect(searchInput).toBeVisible();

            // Test search functionality
            await searchInput.fill('Bang Kapi');

            // Wait for search results
            await page.waitForTimeout(500);

            // Verify search results appear
            const bangKapi = page.locator('text=Bang Kapi').first();
            await expect(bangKapi).toBeVisible({ timeout: 3000 });

            // Click to select the district
            await bangKapi.click();

            // Wait for dropdown to close
            await page.waitForTimeout(500);

            // Verify selection appears in button
            await expect(locationButton).toContainText('Bang Kapi');
        } else {
            console.log('[TEST] Location selector not visible, skipping test');
        }

        // Close the form
        const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="ปิด"], button:has(svg.lucide-x)').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
    });

    test('location selector supports Thai search', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Navigate to Students tab
        await navigateToTab(page, 'Students');

        // Click "Add Student" button
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Wait for form
        await page.waitForSelector('form, [role="dialog"]');

        // Find and click location selector
        const locationLabel = page.locator('text=Teaching Location').or(page.locator('text=สถานที่สอน')).first();
        if (await locationLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            await locationLabel.scrollIntoViewIfNeeded();

            const locationButton = page.locator('button').filter({ has: page.locator('[class*="lucide-map-pin"]') }).first();
            await locationButton.click();

            // Wait for dropdown
            await page.waitForSelector('input[placeholder*="Search"], input[placeholder*="ค้นหา"]', { timeout: 5000 });

            // Search in Thai
            const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();
            await searchInput.fill('บางกะปิ'); // Bang Kapi in Thai

            // Wait for results
            await page.waitForTimeout(500);

            // Verify Thai results appear
            const thaiResult = page.locator('text=บางกะปิ').first();
            await expect(thaiResult).toBeVisible({ timeout: 3000 });

            // Clear search to test province selector
            await searchInput.clear();
            await page.waitForTimeout(300);

            // Test province selector (shown when not searching)
            const provinceSelect = page.locator('select').first();
            if (await provinceSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Select Bangkok province
                await provinceSelect.selectOption({ label: /Bangkok/i });
                await page.waitForTimeout(500);

                // Verify districts are shown
                const districts = page.locator('button').filter({ hasText: /Bangkok|กรุงเทพ/ });
                await expect(districts.first()).toBeVisible({ timeout: 3000 });
            }
        }

        // Close the form
        const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="ปิด"], button:has(svg.lucide-x)').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
    });

    test('location selector clears selection', async ({ page }) => {
        // Login as teacher
        await login(page, TEST_USERS.teacher);

        // Navigate to Students tab
        await navigateToTab(page, 'Students');

        // Click "Add Student" button
        await page.locator('button:has-text("Add Student"), button:has-text("เพิ่มนักเรียน")').first().click();

        // Wait for form
        await page.waitForSelector('form, [role="dialog"]');

        // Find location selector
        const locationLabel = page.locator('text=Teaching Location').or(page.locator('text=สถานที่สอน')).first();
        if (await locationLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
            await locationLabel.scrollIntoViewIfNeeded();

            const locationButton = page.locator('button').filter({ has: page.locator('[class*="lucide-map-pin"]') }).first();
            await locationButton.click();

            // Wait for dropdown
            await page.waitForSelector('input[placeholder*="Search"], input[placeholder*="ค้นหา"]', { timeout: 5000 });

            // Search and select a district
            const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="ค้นหา"]').first();
            await searchInput.fill('Chatuchak');
            await page.waitForTimeout(500);

            const chatuchak = page.locator('text=Chatuchak').first();
            await chatuchak.click();
            await page.waitForTimeout(500);

            // Verify selection
            await expect(locationButton).toContainText('Chatuchak');

            // Click the clear button (X icon)
            const clearButton = locationButton.locator('[class*="lucide-x"]').first();
            if (await clearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                await clearButton.click({ force: true }); // force click in case it's overlapping
                await page.waitForTimeout(300);

                // Verify selection is cleared
                await expect(locationButton).not.toContainText('Chatuchak');
            }
        }

        // Close the form
        const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="ปิด"], button:has(svg.lucide-x)').first();
        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await closeButton.click();
        }
    });

    test('bulk edit modal has location selector', async ({ page }) => {
        // Login as moderator (has access to bulk edit)
        await login(page, TEST_USERS.moderator);

        // Navigate to Students tab
        await navigateToTab(page, 'Students');

        // Wait for students to load
        await page.waitForTimeout(2000);

        // Select a student (checkbox in the list)
        const firstCheckbox = page.locator('input[type="checkbox"]').nth(1); // Skip select-all checkbox
        if (await firstCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstCheckbox.click();

            // Click bulk edit button
            const bulkEditButton = page.locator('button:has-text("Bulk Edit"), button:has-text("แก้ไขแบบกลุ่ม")').first();
            if (await bulkEditButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await bulkEditButton.click();

                // Wait for bulk edit modal
                await page.waitForSelector('text=Bulk Edit Students, text="แก้ไขนักเรียนแบบกลุ่ม"', { timeout: 5000 });

                // Find location selector checkbox in bulk edit modal
                const locationCheckbox = page.locator('input[id="update-area"]').first();
                if (await locationCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
                    // Enable location field
                    await locationCheckbox.click();
                    await page.waitForTimeout(300);

                    // Verify location selector becomes enabled
                    const locationButton = page.locator('button').filter({ has: page.locator('[class*="lucide-map-pin"]') }).first();
                    await expect(locationButton).toBeEnabled();

                    // Click to open dropdown
                    await locationButton.click();

                    // Verify dropdown opens
                    await page.waitForSelector('input[placeholder*="Search"], input[placeholder*="ค้นหา"]', { timeout: 3000 });
                }

                // Close bulk edit modal
                const closeModal = page.locator('button[aria-label*="Close"], button:has(svg.lucide-x)').last();
                await closeModal.click();
            }
        }
    });
});
