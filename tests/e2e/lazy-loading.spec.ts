import { expect, test } from "@playwright/test";
import { login, navigateToTab, TEST_USERS } from "./helpers";

// Constants for common selectors used across tests
const MODAL_SELECTOR = '[role="dialog"], .modal, .fixed.inset-0';
const CLOSE_BUTTON_SELECTOR =
  'button:has-text("Close"), button:has-text("ปิด"), button:has([aria-label="Close"])';

test.describe("Lazy Loading", () => {
  test("bulk edit modal lazy loads correctly", async ({ page }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Navigate to Students tab
    await navigateToTab(page, "Students");

    // Wait for student list to load
    await page.waitForSelector('table, [role="table"]', { timeout: 10000 });

    // Check if there are any checkboxes (students)
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 1) {
      // Select first student (skip the "select all" checkbox)
      await checkboxes.nth(1).click();

      // Look for bulk edit button
      const bulkEditButton = page
        .locator(
          'button:has-text("Bulk Edit"), button:has-text("แก้ไขแบบกลุ่ม")',
        )
        .first();

      // If button exists, click it
      if (
        await bulkEditButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await bulkEditButton.click();

        // Wait for modal to load (checking for modal header or content)
        await page.waitForSelector(MODAL_SELECTOR, { timeout: 5000 });

        // Verify modal loaded successfully (should have close button)
        const closeButton = page.locator(CLOSE_BUTTON_SELECTOR).first();
        await expect(closeButton).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("class analytics modal lazy loads correctly for moderator", async ({
    page,
  }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Navigate to Analytics tab
    await navigateToTab(page, "Analytics");

    // Wait for analytics page to load
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 });

    // Look for analytics button or link that opens ClassAnalytics modal
    const detailsButton = page
      .locator(
        'button:has-text("Details"), button:has-text("รายละเอียด"), button:has-text("View Details")',
      )
      .first();

    if (await detailsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await detailsButton.click();

      // Wait for modal to load
      await page.waitForSelector(MODAL_SELECTOR, { timeout: 5000 });

      // Verify modal has loaded (should have analytics content)
      const modalContent = page.locator(MODAL_SELECTOR).first();
      await expect(modalContent).toBeVisible();
    }
  });

  test("payment calculator modal lazy loads correctly", async ({ page }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Navigate to Analytics tab
    await navigateToTab(page, "Analytics");

    // Wait for analytics page to load
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 });

    // Look for calculator button
    const calculatorButton = page
      .locator(
        'button:has([data-lucide="calculator"]), button:has-text("Calculator"), button:has-text("คำนวณ")',
      )
      .first();

    if (
      await calculatorButton.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await calculatorButton.click();

      // Wait for calculator modal to load
      await page.waitForSelector(MODAL_SELECTOR, { timeout: 5000 });

      // Verify calculator modal loaded
      const modalContent = page.locator(MODAL_SELECTOR).first();
      await expect(modalContent).toBeVisible();
    }
  });

  test("admin analytics dashboard lazy loads correctly", async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin);

    // Navigate to Analytics tab
    await navigateToTab(page, "Analytics");

    // Wait for admin analytics dashboard to load
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 });

    // Verify dashboard loaded (should have analytics content)
    const dashboardContent = page.locator("body").first();
    await expect(dashboardContent).toContainText(/analytics|teacher|school/i);
  });

  test("admin app updates lazy loads correctly", async ({ page }) => {
    // Login as admin
    await login(page, TEST_USERS.admin);

    // Navigate to Updates tab
    await navigateToTab(page, "Updates");

    // Wait for updates page to load
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 });

    // Verify updates page loaded
    const updatesContent = page.locator("body").first();
    await expect(updatesContent).toContainText(/update|version|changelog/i);
  });

  test("deleted students dashboard lazy loads correctly", async ({ page }) => {
    // Login as admin (or moderator if they have access)
    await login(page, TEST_USERS.admin);

    // Navigate to Deleted Students tab
    await navigateToTab(page, "Deleted Students");

    // Wait for deleted students page to load
    await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 10000 });

    // Verify deleted students page loaded
    const deletedContent = page.locator("body").first();
    await expect(deletedContent).toContainText(/deleted|remove|trash/i);
  });
});
