import { expect, test } from '@playwright/test';
import { login, navigateToTab, TEST_USERS, waitForToast } from './helpers';

test.describe('Merge Classes Multi-Select Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Login as teacher who can create and merge classes
        await login(page, TEST_USERS.teacher);
        await navigateToTab(page, 'Classes');
    });

    test('merge modal displays groups with mergeable classes', async ({ page }) => {
        // Click merge classes button (if it exists)
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        // Only proceed if merge button exists
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();

            // Wait for modal to appear
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            // Check if there are mergeable groups
            const groupHeaders = page.locator('text=/Group.*\\d+/');
            const groupCount = await groupHeaders.count();

            if (groupCount > 0) {
                // Verify group information is displayed
                await expect(page.locator('text="Location:", text="สถานที่:"')).toBeVisible();
                await expect(page.locator('text="Date/Time:", text="วัน/เวลา:"')).toBeVisible();
                await expect(page.locator('text="Total Classes:", text="จำนวนคลาส:"')).toBeVisible();
            } else {
                // Verify "no classes to merge" message
                await expect(page.locator('text=/No classes available to merge/i')).toBeVisible();
            }

            // Close modal
            const closeButton = page.locator('button[aria-label="Close"], button:has(svg)').first();
            await closeButton.click();
        }
    });

    test('can enable and disable group checkboxes', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            // Find group checkboxes
            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            if (checkboxCount > 0) {
                // Test enabling first group
                const firstCheckbox = groupCheckboxes.first();
                const wasChecked = await firstCheckbox.isChecked();
                
                await firstCheckbox.click();
                
                // Verify checkbox state changed
                const isNowChecked = await firstCheckbox.isChecked();
                expect(isNowChecked).toBe(!wasChecked);

                // Verify UI changes when group is enabled
                if (isNowChecked) {
                    // Should show target selection UI
                    await expect(page.locator('text="1. Select Target Class", text="1. เลือกคลาสหลัก"').first()).toBeVisible();
                }
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('can select target class for enabled group', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            if (checkboxCount > 0) {
                // Enable first group
                const firstCheckbox = groupCheckboxes.first();
                if (!await firstCheckbox.isChecked()) {
                    await firstCheckbox.click();
                }

                // Wait for target selection to appear
                await page.waitForSelector('input[type="radio"]', { timeout: 2000 });

                // Select first target class radio button
                const targetRadios = page.locator('input[type="radio"]');
                const radioCount = await targetRadios.count();
                
                if (radioCount > 0) {
                    await targetRadios.first().click();
                    
                    // Verify radio is selected
                    await expect(targetRadios.first()).toBeChecked();

                    // Verify source selection appears
                    await expect(page.locator('text="2. Select Classes to Merge", text="2. เลือกคลาสที่จะรวม"').first()).toBeVisible();
                }
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('can select source classes for merging', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            if (checkboxCount > 0) {
                // Enable first group
                const firstCheckbox = groupCheckboxes.first();
                if (!await firstCheckbox.isChecked()) {
                    await firstCheckbox.click();
                }

                // Select first target
                await page.waitForSelector('input[type="radio"]', { timeout: 2000 });
                const targetRadios = page.locator('input[type="radio"]');
                if (await targetRadios.count() > 0) {
                    await targetRadios.first().click();

                    // Wait for source checkboxes to appear
                    await page.waitForSelector('text="2. Select Classes to Merge"', { timeout: 2000 });
                    
                    // Find source checkboxes (not the group enable checkbox)
                    const allCheckboxes = page.locator('input[type="checkbox"]');
                    const totalCheckboxes = await allCheckboxes.count();
                    
                    // If there are more than just the group checkbox, we have source options
                    if (totalCheckboxes > checkboxCount) {
                        // Click first source checkbox (skip the group checkbox)
                        const sourceCheckbox = allCheckboxes.nth(1);
                        await sourceCheckbox.click();
                        
                        // Verify it's checked
                        await expect(sourceCheckbox).toBeChecked();
                    }
                }
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('merge button is disabled when no groups are selected', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            // Find the merge button in the modal footer
            const submitButton = page.locator('button:has-text("Merge Selected Groups"), button:has-text("รวมกลุ่มที่เลือก")').first();
            
            // Should be disabled initially
            await expect(submitButton).toBeDisabled();

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('merge button is enabled when group has valid selection', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            if (checkboxCount > 0) {
                // Enable first group
                const firstCheckbox = groupCheckboxes.first();
                if (!await firstCheckbox.isChecked()) {
                    await firstCheckbox.click();
                }

                // Select target
                await page.waitForSelector('input[type="radio"]', { timeout: 2000 });
                const targetRadios = page.locator('input[type="radio"]');
                if (await targetRadios.count() > 0) {
                    await targetRadios.first().click();

                    // Select source
                    await page.waitForSelector('text="2. Select Classes to Merge"', { timeout: 2000 });
                    const allCheckboxes = page.locator('input[type="checkbox"]');
                    if (await allCheckboxes.count() > checkboxCount) {
                        await allCheckboxes.nth(1).click();

                        // Now the submit button should be enabled
                        const submitButton = page.locator('button:has-text("Merge Selected Groups"), button:has-text("รวมกลุ่มที่เลือก")').first();
                        await expect(submitButton).toBeEnabled();
                    }
                }
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('can enable multiple groups simultaneously', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            // If there are multiple groups, enable them
            if (checkboxCount >= 2) {
                // Enable first group
                await groupCheckboxes.nth(0).click();
                await expect(groupCheckboxes.nth(0)).toBeChecked();

                // Enable second group
                await groupCheckboxes.nth(1).click();
                await expect(groupCheckboxes.nth(1)).toBeChecked();

                // Both should remain enabled
                await expect(groupCheckboxes.nth(0)).toBeChecked();
                await expect(groupCheckboxes.nth(1)).toBeChecked();
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });

    test('shows visual feedback for enabled groups', async ({ page }) => {
        const mergeButton = page.locator('button:has-text("Merge Classes"), button:has-text("รวมคลาส")').first();
        
        if (await mergeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mergeButton.click();
            await page.waitForSelector('text="Merge Classes", text="รวมคลาส"', { timeout: 5000 });

            const groupCheckboxes = page.locator('input[type="checkbox"][class*="w-5 h-5"]');
            const checkboxCount = await groupCheckboxes.count();

            if (checkboxCount > 0) {
                // Get the parent container of the first group
                const firstGroup = page.locator('div[class*="border-2 rounded-xl"]').first();
                
                // Check initial state (should have gray border)
                const initialClass = await firstGroup.getAttribute('class');
                expect(initialClass).toContain('border-gray');

                // Enable the group
                await groupCheckboxes.first().click();

                // Wait a bit for UI update
                await page.waitForTimeout(200);

                // Check updated state (should have purple border)
                const updatedClass = await firstGroup.getAttribute('class');
                expect(updatedClass).toContain('border-purple');
            }

            // Close modal
            await page.keyboard.press('Escape');
        }
    });
});
