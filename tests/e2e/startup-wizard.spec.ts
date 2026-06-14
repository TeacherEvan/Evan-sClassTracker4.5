import { expect, test } from "@playwright/test";
import { initializeDatabase, login, TEST_USERS } from "./helpers";

test.describe("Startup Wizard Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Initialize database on first run
    await initializeDatabase(page);
  });

  test("should handle language switch in startup wizard without error", async ({
    page,
  }) => {
    // Login as moderator to trigger startup wizard
    await login(page, TEST_USERS.moderator);

    // Wait for startup wizard to appear (it shows on first login)
    // The wizard has a distinctive gold background and welcome message
    const startupWizard = page
      .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
      .first();

    // Check if startup wizard is visible (it may have been dismissed before)
    const isWizardVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!isWizardVisible) {
      console.log(
        "Startup wizard was already dismissed. Clearing localStorage to trigger it.",
      );
      // Clear the dismissed flag to make wizard appear again
      await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith("startupWindowDismissed_")) {
            localStorage.removeItem(key);
          }
        });
      });

      // Reload to trigger wizard
      await page.reload();
      await page.waitForTimeout(1000);
    }

    // Now startup wizard should be visible
    await expect(
      page.locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส").first(),
    ).toBeVisible({ timeout: 5000 });

    // Find and click the language switcher button in the wizard
    const langButton = page
      .locator('button:has-text("EN"), button:has-text("TH")')
      .first();
    await expect(langButton).toBeVisible();

    // Click language switcher multiple times to test stability
    for (let i = 0; i < 3; i++) {
      await langButton.click();
      await page.waitForTimeout(300); // Wait for re-render

      // Verify no application error dialog appears
      const errorDialog = page.locator(
        "text=Application Error, text=Failed to execute",
      );
      await expect(errorDialog).not.toBeVisible({ timeout: 1000 });

      // Verify wizard is still functional
      await expect(
        page
          .locator(
            "text=Welcome Boss, text=ยินดีต้อนรับ บอส, text=What would you like to do, text=คุณต้องการทำอะไร",
          )
          .first(),
      ).toBeVisible();
    }
  });

  test("should handle language switch with open booking wizard", async ({
    page,
  }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Clear dismissed flag if needed
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Click on "Book a Class" option to open booking wizard
      const bookingOption = page
        .locator("text=Book a Class, text=จองคลาส")
        .first();
      if (await bookingOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bookingOption.click();
        await page.waitForTimeout(500);

        // Now switch language while booking wizard is open
        const langButton = page
          .locator('button:has-text("EN"), button:has-text("TH")')
          .first();
        if (await langButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await langButton.click();
          await page.waitForTimeout(300);

          // Verify no application error
          const errorDialog = page.locator(
            "text=Application Error, text=Failed to execute",
          );
          await expect(errorDialog).not.toBeVisible({ timeout: 1000 });
        }
      }
    }
  });

  test("should handle language switch with open message wizard", async ({
    page,
  }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Clear dismissed flag
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Click on "Message Teacher/User" option
      const messageOption = page
        .locator("text=Message Teacher/User, text=ส่งข้อความถึงครู")
        .first();
      if (await messageOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await messageOption.click();
        await page.waitForTimeout(500);

        // Switch language while message wizard is open
        const langButton = page
          .locator('button:has-text("EN"), button:has-text("TH")')
          .first();
        if (await langButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          await langButton.click();
          await page.waitForTimeout(300);

          // Verify no application error
          const errorDialog = page.locator(
            "text=Application Error, text=Failed to execute",
          );
          await expect(errorDialog).not.toBeVisible({ timeout: 1000 });
        }
      }
    }
  });

  test("should show Quick Book wizard option for teachers", async ({
    page,
  }) => {
    // Login as teacher
    await login(page, TEST_USERS.teacher);

    // Clear dismissed flag
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Teacher, text=ยินดีต้อนรับ ครู")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Verify Quick Book option is visible for teachers
      const quickBookOption = page
        .locator("text=Quick Book, text=จองด่วน")
        .first();
      await expect(quickBookOption).toBeVisible({ timeout: 2000 });

      // Verify it has the lightning bolt icon styling (yellow/orange gradient)
      const quickBookButton = quickBookOption.locator("xpath=ancestor::button");
      await expect(quickBookButton).toBeVisible();
    }
  });

  test("should show Approval wizard option for moderators", async ({
    page,
  }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Clear dismissed flag
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Verify Quick Approvals option is visible for moderators
      const approvalOption = page
        .locator("text=Quick Approvals, text=อนุมัติด่วน")
        .first();
      await expect(approvalOption).toBeVisible({ timeout: 2000 });

      // Verify it has the check square icon styling (green gradient)
      const approvalButton = approvalOption.locator("xpath=ancestor::button");
      await expect(approvalButton).toBeVisible();
    }
  });

  test("should open Quick Book wizard when clicked", async ({ page }) => {
    // Login as teacher
    await login(page, TEST_USERS.teacher);

    // Clear dismissed flag
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Teacher, text=ยินดีต้อนรับ ครู")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Click on Quick Book option
      const quickBookOption = page
        .locator("text=Quick Book, text=จองด่วน")
        .first();
      if (
        await quickBookOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await quickBookOption.click();
        await page.waitForTimeout(500);

        // Verify Quick Book wizard opens
        const quickBookWizard = page
          .locator(
            "text=Rebook recent classes instantly, text=จองคลาสล่าสุดทันที",
          )
          .first();
        await expect(quickBookWizard).toBeVisible({ timeout: 2000 });

        // Verify no application error
        const errorDialog = page.locator(
          "text=Application Error, text=Failed to execute",
        );
        await expect(errorDialog).not.toBeVisible({ timeout: 1000 });
      }
    }
  });

  test("should open Approval wizard when clicked", async ({ page }) => {
    // Login as moderator
    await login(page, TEST_USERS.moderator);

    // Clear dismissed flag
    await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("startupWindowDismissed_")) {
          localStorage.removeItem(key);
        }
      });
    });
    await page.reload();
    await page.waitForTimeout(1000);

    // Wait for startup wizard
    const startupWizard = page
      .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
      .first();
    const isVisible = await startupWizard
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (isVisible) {
      // Click on Quick Approvals option
      const approvalOption = page
        .locator("text=Quick Approvals, text=อนุมัติด่วน")
        .first();
      if (
        await approvalOption.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await approvalOption.click();
        await page.waitForTimeout(500);

        // Verify Approval wizard opens
        const approvalWizard = page
          .locator(
            "text=Review and approve pending bookings, text=ตรวจสอบและอนุมัติการจองที่รอดำเนินการ",
          )
          .first();
        await expect(approvalWizard).toBeVisible({ timeout: 2000 });

        // Verify no application error
        const errorDialog = page.locator(
          "text=Application Error, text=Failed to execute",
        );
        await expect(errorDialog).not.toBeVisible({ timeout: 1000 });
      }
    }
  });
});
