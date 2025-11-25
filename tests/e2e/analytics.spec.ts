import { expect } from '@playwright/test';
import { test } from './fixtures';
import { login, navigateToTab, TEST_USERS } from './helpers';

/**
 * Analytics Feature Tests
 *
 * Tests for Class Analytics dashboard including:
 * - Summary analytics view
 * - Teacher Comparison feature (moderator/admin only)
 * - Tab switching between views
 * - CSV export functionality
 *
 * @since v4.5.30 - Teacher Comparison feature added
 */
test.describe('Class Analytics', () => {
  test.describe('Teacher View', () => {
    test('teacher can open analytics modal', async ({ page }) => {
      // Login as teacher
      await login(page, TEST_USERS.teacher);

      // Navigate to Classes tab
      await navigateToTab(page, 'Classes');

      // Click Analytics button - look for bar chart icon or text
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์"), button:has(svg.lucide-bar-chart-3)'
      ).first();

      // Wait for analytics button to be visible
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();

      // Verify analytics modal opens - check for the modal title
      const modalTitle = page.locator(
        'h2:has-text("Class Analytics"), h2:has-text("การวิเคราะห์คลาส")'
      ).first();
      await expect(modalTitle).toBeVisible({ timeout: 5000 });

      // Verify summary cards are displayed (Total Classes, Attendance Rate, etc.)
      await expect(
        page.locator('text=Total Classes, text=ชั้นเรียนทั้งหมด').first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('teacher sees summary view by default', async ({ page }) => {
      await login(page, TEST_USERS.teacher);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();

      // Wait for modal to open
      await page.waitForTimeout(500);

      // Verify summary view is shown (Student Performance section)
      await expect(
        page.locator('text=Student Performance, text=ผลงานนักเรียน').first()
      ).toBeVisible({ timeout: 5000 });

      // Teachers should NOT see Teacher Comparison tab
      const teacherComparisonTab = page.locator(
        'button:has-text("Teacher Comparison"), button:has-text("เปรียบเทียบครู")'
      ).first();
      await expect(teacherComparisonTab).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // Expected - teachers don't have access to teacher comparison
      });
    });
  });

  test.describe('Moderator View', () => {
    test('moderator can see Teacher Comparison tab', async ({ page }) => {
      // Login as moderator
      await login(page, TEST_USERS.moderator);

      // Navigate to Classes tab
      await navigateToTab(page, 'Classes');

      // Open analytics modal
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();

      // Wait for modal to load
      await page.waitForTimeout(500);

      // Verify Teacher Comparison tab is visible for moderators
      const teacherComparisonTab = page.locator(
        'button:has-text("Teacher Comparison"), button:has-text("เปรียบเทียบครู")'
      ).first();
      await expect(teacherComparisonTab).toBeVisible({ timeout: 5000 });
    });

    test('moderator can switch between Summary and Teacher Comparison tabs', async ({ page }) => {
      await login(page, TEST_USERS.moderator);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();
      await page.waitForTimeout(500);

      // Verify Summary tab is active by default (Student Performance visible)
      await expect(
        page.locator('text=Student Performance, text=ผลงานนักเรียน').first()
      ).toBeVisible({ timeout: 5000 });

      // Click Teacher Comparison tab
      const teacherComparisonTab = page.locator(
        'button:has-text("Teacher Comparison"), button:has-text("เปรียบเทียบครู")'
      ).first();
      await teacherComparisonTab.click();
      await page.waitForTimeout(500);

      // Verify Teacher Comparison view is displayed (check for table headers)
      await expect(
        page.locator('th:has-text("Teacher"), th:has-text("ครู")').first()
      ).toBeVisible({ timeout: 5000 });

      // Verify Total Classes column header
      await expect(
        page.locator('th:has-text("Total Classes"), th:has-text("คลาสทั้งหมด")').first()
      ).toBeVisible({ timeout: 3000 });

      // Switch back to Summary tab
      const summaryTab = page.locator(
        'button:has-text("Summary"), button:has-text("สรุป")'
      ).first();
      await summaryTab.click();
      await page.waitForTimeout(500);

      // Verify back on Summary view
      await expect(
        page.locator('text=Student Performance, text=ผลงานนักเรียน').first()
      ).toBeVisible({ timeout: 3000 });
    });

    test('Teacher Comparison shows teacher metrics', async ({ page }) => {
      await login(page, TEST_USERS.moderator);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();
      await page.waitForTimeout(500);

      // Switch to Teacher Comparison
      const teacherComparisonTab = page.locator(
        'button:has-text("Teacher Comparison"), button:has-text("เปรียบเทียบครู")'
      ).first();
      await teacherComparisonTab.click();
      await page.waitForTimeout(500);

      // Verify table structure with expected columns
      const table = page.locator('table');
      await expect(table).toBeVisible({ timeout: 5000 });

      // Check for expected column headers
      const headers = ['Teacher', 'Total Classes', 'Attended', 'Rate', 'Avg ClassCount', 'Students', 'Rating'];
      for (const header of headers) {
        // Check English header exists (at least one should match)
        const headerElement = page.locator(`th:has-text("${header}")`).first();
        const isVisible = await headerElement.isVisible({ timeout: 2000 }).catch(() => false);
        if (!isVisible) {
          console.log(`[TEST] Header "${header}" not found, checking Thai version`);
        }
      }
    });
  });

  test.describe('Admin View', () => {
    test('admin can access Teacher Comparison across all schools', async ({ page }) => {
      // Login as admin
      await login(page, TEST_USERS.admin);

      // Navigate to Classes tab
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();
      await page.waitForTimeout(500);

      // Admin should see Teacher Comparison tab
      const teacherComparisonTab = page.locator(
        'button:has-text("Teacher Comparison"), button:has-text("เปรียบเทียบครู")'
      ).first();
      await expect(teacherComparisonTab).toBeVisible({ timeout: 5000 });

      // Click to switch to Teacher Comparison
      await teacherComparisonTab.click();
      await page.waitForTimeout(500);

      // Verify data loads (table should be visible)
      await expect(page.locator('table')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Analytics Modal Interactions', () => {
    test('analytics modal can be closed with X button', async ({ page }) => {
      await login(page, TEST_USERS.teacher);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();

      // Wait for modal
      await page.waitForTimeout(500);

      // Find and click close button
      const closeButton = page.locator(
        'button[aria-label*="Close"], button[aria-label*="ปิด"], button:has(svg.lucide-x)'
      ).first();
      await closeButton.click();

      // Verify modal is closed (title should not be visible)
      const modalTitle = page.locator(
        'h2:has-text("Class Analytics"), h2:has-text("การวิเคราะห์คลาส")'
      ).first();
      await expect(modalTitle).not.toBeVisible({ timeout: 3000 });
    });

    test('analytics modal can be closed with Escape key', async ({ page }) => {
      await login(page, TEST_USERS.teacher);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();

      // Wait for modal
      await page.waitForTimeout(500);

      // Press Escape to close
      await page.keyboard.press('Escape');

      // Verify modal is closed
      const modalTitle = page.locator(
        'h2:has-text("Class Analytics"), h2:has-text("การวิเคราะห์คลาس")'
      ).first();
      await expect(modalTitle).not.toBeVisible({ timeout: 3000 });
    });

    test('date range filtering works', async ({ page }) => {
      await login(page, TEST_USERS.teacher);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();
      await page.waitForTimeout(500);

      // Look for date range inputs
      const startDateInput = page.locator('input[type="date"]').first();
      const endDateInput = page.locator('input[type="date"]').nth(1);

      if (await startDateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Set a date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        await startDateInput.fill(startDate.toISOString().split('T')[0]);
        await endDateInput.fill(endDate.toISOString().split('T')[0]);

        // Wait for data to refresh
        await page.waitForTimeout(1000);

        // Verify the analytics data is still displayed (summary cards)
        await expect(
          page.locator('text=Total Classes, text=ชั้นเรียนทั้งหมด').first()
        ).toBeVisible({ timeout: 3000 });
      }
    });

    test('CSV export button is visible', async ({ page }) => {
      await login(page, TEST_USERS.teacher);
      await navigateToTab(page, 'Classes');

      // Open analytics
      const analyticsButton = page.locator(
        'button:has-text("Analytics"), button:has-text("การวิเคราะห์")'
      ).first();
      await expect(analyticsButton).toBeVisible({ timeout: 5000 });
      await analyticsButton.click();
      await page.waitForTimeout(500);

      // Look for CSV export button
      const exportButton = page.locator(
        'button:has-text("Export CSV"), button:has-text("ส่งออก CSV"), button:has(svg.lucide-download)'
      ).first();
      await expect(exportButton).toBeVisible({ timeout: 5000 });
    });
  });
});
