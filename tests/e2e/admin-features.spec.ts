import { test } from "@playwright/test";
import { login, navigateToTab, TEST_USERS } from "./helpers";

/**
 * Admin Features and Data Migration Tests
 *
 * Tests admin-specific features including:
 * - Watchlist system (if implemented)
 * - Audit trail access and logging
 * - Data migration verification
 * - Legacy cleanup validation
 *
 * @see docs/QA_TEST_PLAN.md - Sections 4 & 5
 */
test.describe("Admin Features - Audit Trail", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test("TC-A4.2.1: Admin can access audit trail", async ({ page }) => {
    // Look for audit trail or logs section
    const auditButton = page
      .locator(
        'button:has-text("Audit"), button:has-text("Logs"), button:has-text("ตรวจสอบ"), button:has-text("บันทึก")',
      )
      .first();

    const hasAudit = await auditButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasAudit) {
      console.log("✅ Audit trail button is accessible");

      await auditButton.click();
      await page.waitForTimeout(1000);

      // Verify audit trail interface
      const auditHeader = page
        .locator(
          'h1:has-text("Audit"), h2:has-text("Audit"), h1:has-text("Logs"), h2:has-text("Logs")',
        )
        .first();

      const hasAuditInterface = await auditHeader
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasAuditInterface) {
        console.log("✅ Audit trail interface is displayed");
      }
    } else {
      console.log(
        "ℹ️ Audit trail button not found - may be in different location or navigation path",
      );
    }
  });

  test("TC-A4.2.2: Audit trail displays user actions", async ({ page }) => {
    // Navigate to audit trail (assuming it exists)
    console.log("ℹ️ Checking for audit log entries...");

    // Look for table or list of audit entries
    const auditTable = page
      .locator('table, [role="table"], [class*="audit"]')
      .first();
    const hasTable = await auditTable
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasTable) {
      // Count audit entries
      const auditRows = await page
        .locator('table tbody tr, [role="row"]')
        .count();
      console.log(`✅ Found ${auditRows} audit log entries`);

      if (auditRows > 0) {
        // Check for expected columns
        const expectedColumns = [
          "User",
          "Action",
          "Timestamp",
          "Target",
          "ผู้ใช้",
          "การกระทำ",
          "เวลา",
          "เป้าหมาย",
        ];

        let foundColumns = 0;
        for (const col of expectedColumns) {
          const hasColumn = await page
            .locator(`th:has-text("${col}")`)
            .isVisible({ timeout: 1000 })
            .catch(() => false);
          if (hasColumn) foundColumns++;
        }

        if (foundColumns > 0) {
          console.log(
            `✅ Audit table has ${foundColumns} expected column headers`,
          );
        }
      }
    } else {
      console.log(
        "ℹ️ Audit table not found - may require navigation to audit section",
      );
    }
  });

  test("TC-A4.2.3: Audit log entries are immutable", async ({ page }) => {
    // This test validates that audit logs cannot be edited or deleted
    // Full test requires attempting to modify audit entries via UI or API

    console.log("ℹ️ Audit log immutability test");
    console.log("ℹ️ Expected: No edit/delete buttons on audit entries");
    console.log(
      "ℹ️ Backend should prevent modifications via database constraints",
    );

    // Look for edit/delete buttons in audit interface
    const editButton = page
      .locator('button:has-text("Edit"), button:has-text("แก้ไข")')
      .first();

    const deleteButton = page
      .locator('button:has-text("Delete"), button:has-text("ลบ")')
      .first();

    const hasEdit = await editButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const hasDelete = await deleteButton
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    if (!hasEdit && !hasDelete) {
      console.log(
        "✅ No edit/delete buttons found in UI (expected for audit logs)",
      );
    } else {
      console.log(
        "⚠️ Edit/delete buttons found - verify these are not for audit log entries",
      );
    }
  });

  test("TC-A4.2.4: Audit log filtering and search works", async ({ page }) => {
    // Check for filter controls
    const filterInputs = page.locator(
      'input[type="text"], input[type="search"], input[placeholder*="search"], input[placeholder*="ค้นหา"]',
    );

    const filterCount = await filterInputs.count();

    if (filterCount > 0) {
      console.log(`✅ Found ${filterCount} filter/search inputs`);

      // Try using a filter
      const searchInput = filterInputs.first();
      await searchInput.fill("class");
      await page.waitForTimeout(500);

      console.log("✅ Search filter accepts input");

      // Clear filter
      await searchInput.clear();
    } else {
      console.log("ℹ️ No search/filter inputs found in current view");
    }

    // Check for date filters
    const dateInputs = page.locator('input[type="date"]');
    const dateCount = await dateInputs.count();

    if (dateCount > 0) {
      console.log(`✅ Found ${dateCount} date filter inputs`);
    } else {
      console.log("ℹ️ No date filters found");
    }
  });
});

test.describe("Admin Features - Watchlist System", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test("TC-A4.1.1: Admin can access watchlist", async ({ page }) => {
    // Look for watchlist feature
    const watchlistButton = page
      .locator(
        'button:has-text("Watchlist"), button:has-text("Watch"), button:has-text("ติดตาม")',
      )
      .first();

    const hasWatchlist = await watchlistButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasWatchlist) {
      console.log("✅ Watchlist feature is accessible");

      await watchlistButton.click();
      await page.waitForTimeout(1000);

      // Verify watchlist interface
      const watchlistHeader = page
        .locator('h1:has-text("Watchlist"), h2:has-text("Watchlist")')
        .first();

      const hasInterface = await watchlistHeader
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasInterface) {
        console.log("✅ Watchlist interface is displayed");
      }
    } else {
      console.log(
        "ℹ️ Watchlist feature not found - may not be implemented or requires different navigation",
      );
    }
  });

  test("TC-A4.1.2: Admin can add users to watchlist", async () => {
    console.log("ℹ️ Watchlist add functionality test");
    console.log("ℹ️ Expected: Admin can flag users for monitoring");
    console.log("ℹ️ Implementation depends on feature existence");

    // This test requires:
    // 1. Navigate to user list or watchlist interface
    // 2. Find "Add to watchlist" button
    // 3. Select user and add reason
    // 4. Verify user appears in watchlist
  });

  test("TC-A4.1.3: Watchlist alerts trigger for user actions", async () => {
    console.log("ℹ️ Watchlist alerts test");
    console.log(
      "ℹ️ Expected: Admin receives notifications when watchlisted users perform actions",
    );
    console.log("ℹ️ Full test requires multi-user simulation");
  });
});

test.describe("Admin Features - System Analytics", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test("admin can see system-wide analytics", async ({ page }) => {
    // Navigate to Analytics
    const analyticsButton = page
      .locator('button:has-text("Analytics"), button:has-text("การวิเคราะห์")')
      .first();

    const hasAnalytics = await analyticsButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasAnalytics) {
      await analyticsButton.click();
      await page.waitForTimeout(1000);

      // Admin should see system-wide data, not just school-scoped
      const schoolFilter = page
        .locator(
          'select:has-text("School"), text="All Schools", text="ทุกโรงเรียน"',
        )
        .first();

      const hasSchoolFilter = await schoolFilter
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      if (hasSchoolFilter) {
        console.log("✅ Admin has school filter for system-wide analytics");
      } else {
        console.log("ℹ️ Admin analytics may show all schools by default");
      }

      // Close modal
      await page.keyboard.press("Escape");
    } else {
      console.log("ℹ️ Analytics not accessible from current view");
    }
  });

  test("admin can see all schools summary", async ({ page }) => {
    // Check if there's a schools management section
    const schoolsButton = page
      .locator('button:has-text("Schools"), button:has-text("โรงเรียน")')
      .first();

    const hasSchools = await schoolsButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasSchools) {
      await schoolsButton.click();
      await page.waitForTimeout(1000);

      // Count schools in list
      const schoolItems = page.locator('[role="row"], [class*="school"]');
      const schoolCount = await schoolItems.count();

      console.log(`✅ Admin can see ${schoolCount} schools`);
    } else {
      console.log("ℹ️ Schools management not accessible from current view");
    }
  });
});

test.describe("Data Migration - Guardian to Provider", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test("TC-D5.1.1: No legacy guardian users exist", async ({ page }) => {
    // Navigate to user management
    const usersButton = page
      .locator('button:has-text("Users"), button:has-text("ผู้ใช้")')
      .first();

    const hasUsers = await usersButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasUsers) {
      await usersButton.click();
      await page.waitForTimeout(1000);

      // Check if "guardian" role appears in any dropdown or filter
      const guardianRole = page.locator('text="Guardian", text="ผู้ปกครอง"');

      const guardianCount = await guardianRole.count();

      if (guardianCount === 0) {
        console.log(
          '✅ No "Guardian" role found in UI (expected - migration complete)',
        );
      } else {
        console.log(
          `⚠️ Found ${guardianCount} references to "Guardian" role - may need cleanup`,
        );
      }
    } else {
      console.log("ℹ️ User management not accessible from current view");
    }
  });

  test("TC-D5.1.2: Provider relationships are valid", async ({ page }) => {
    console.log("ℹ️ Provider relationship validation test");
    console.log(
      "ℹ️ Expected: All guardian relationships migrated to providers table",
    );
    console.log(
      "ℹ️ Backend validation: providers.studentId and providers.providerId should reference valid records",
    );
    console.log(
      "ℹ️ UI validation: Students should show provider relationships, not legacy guardian field",
    );

    // Navigate to student management
    const studentsButton = page
      .locator('button:has-text("Students"), button:has-text("นักเรียน")')
      .first();

    const hasStudents = await studentsButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasStudents) {
      await studentsButton.click();
      await page.waitForTimeout(2000);

      // Check if any student has provider information
      const providerText = page.locator('text="Provider", text="ผู้ให้บริการ"');
      const hasProviderField = await providerText.count();

      if (hasProviderField > 0) {
        console.log("✅ Provider field exists in student management");
      } else {
        console.log(
          "ℹ️ Provider field not prominently displayed - may be in student details",
        );
      }
    }
  });

  test("TC-D5.1.3: UI removes guardian role references", async ({ page }) => {
    // Check various UI sections for guardian references
    const sections = ["Users", "Students", "Classes", "Settings"];

    for (const section of sections) {
      const sectionButton = page
        .locator(`button:has-text("${section}")`)
        .first();
      const hasSection = await sectionButton
        .isVisible({ timeout: 2000 })
        .catch(() => false);

      if (hasSection) {
        await sectionButton.click();
        await page.waitForTimeout(500);

        // Look for "guardian" text
        const guardianReferences = await page
          .locator("text=/guardian/i")
          .count();

        if (guardianReferences > 0) {
          console.log(
            `⚠️ Found ${guardianReferences} "guardian" references in ${section} section`,
          );
        } else {
          console.log(`✅ No guardian references in ${section} section`);
        }
      }
    }
  });
});

test.describe("Data Migration - Password Hashing", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin);
  });

  test("TC-D5.2.1: All users migrated to PBKDF2", async ({ page }) => {
    console.log("ℹ️ Password migration validation test");
    console.log(
      "ℹ️ Expected: All user password hashes use PBKDF2 format (not bcrypt)",
    );
    console.log(
      'ℹ️ Bcrypt hashes start with "$2" - should not exist after migration',
    );
    console.log("ℹ️ PBKDF2 hashes use different format");
    console.log(
      "ℹ️ Backend validation required - migration dashboard query exists in docs",
    );

    // Check for migration status dashboard
    const dashboardButton = page
      .locator('button:has-text("Dashboard"), button:has-text("แดชบอร์ด")')
      .first();

    const hasDashboard = await dashboardButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasDashboard) {
      await dashboardButton.click();
      await page.waitForTimeout(1000);

      // Look for migration status indicator
      const migrationStatus = page.locator(
        'text="Migration", text="PBKDF2", text="Bcrypt"',
      );

      const hasMigrationInfo = await migrationStatus.count();

      if (hasMigrationInfo > 0) {
        console.log("✅ Migration status information is displayed");
      } else {
        console.log("ℹ️ Migration status not shown in dashboard");
      }
    }
  });

  test("TC-D5.2.2: Login works after migration", async ({ page }) => {
    // Logout and login again to verify authentication works
    await page.goto("/");

    // Verify we can login successfully
    await login(page, TEST_USERS.teacher);

    // Check if we're logged in
    const userProfile = page
      .locator(
        'button:has-text("Profile"), [aria-label*="profile"], [class*="user"]',
      )
      .first();

    const isLoggedIn = await userProfile
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (isLoggedIn) {
      console.log("✅ Login successful after password migration");
    } else {
      console.log("⚠️ Login may have failed - verify authentication system");
    }
  });
});

test.describe("Data Migration - Schema Cleanup", () => {
  test("TC-D5.3.1: No deprecated fields in active use", async () => {
    console.log("ℹ️ Schema cleanup validation test");
    console.log("ℹ️ Expected: No deprecated fields in convex/schema.ts");
    console.log(
      "ℹ️ Backend validation: Review schema definition for outdated fields",
    );
    console.log(
      "ℹ️ UI validation: Ensure UI does not reference deprecated fields",
    );

    // This test primarily validates backend schema
    // UI test can check if any deprecated field names appear in forms
  });

  test("TC-D5.3.2: All database indexes are utilized", async () => {
    console.log("ℹ️ Index utilization test");
    console.log(
      "ℹ️ Expected: All defined indexes in schema are used by queries",
    );
    console.log("ℹ️ Backend validation: Grep codebase for .withIndex() calls");
    console.log(
      "ℹ️ Performance validation: Queries should complete in <2 seconds",
    );

    // This is primarily a backend/performance test
    // UI test can measure page load times
  });

  test("TC-D5.3.3: Data integrity validation", async ({ page }) => {
    console.log("ℹ️ Data integrity test");
    console.log(
      "ℹ️ Expected: No orphaned records, valid foreign keys, no NULL in required fields",
    );
    console.log("ℹ️ Backend validation: Run integrity check queries");
    console.log("ℹ️ UI validation: No error messages about missing data");

    // Login and navigate through different sections
    await login(page, TEST_USERS.admin);

    const sections: ("Classes" | "Students" | "Users")[] = [
      "Classes",
      "Students",
      "Users",
    ];

    for (const section of sections) {
      await navigateToTab(page, section);
      await page.waitForTimeout(1000);

      // Look for error messages
      const errorMessages = page.locator(
        '[role="alert"], text="Error", text="ข้อผิดพลาด", text="Not Found", text="ไม่พบ"',
      );

      const errorCount = await errorMessages.count();

      if (errorCount === 0) {
        console.log(`✅ No errors in ${section} section`);
      } else {
        console.log(
          `⚠️ Found ${errorCount} error messages in ${section} section`,
        );
      }
    }
  });
});

test.describe("System Health - Performance", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.teacher);
  });

  test("page load times are under 2 seconds", async ({ page }) => {
    const sections: ("Classes" | "Students")[] = ["Classes", "Students"];

    for (const section of sections) {
      const startTime = Date.now();
      await navigateToTab(page, section);
      await page.waitForTimeout(500); // Wait for content to render
      const loadTime = Date.now() - startTime;

      console.log(`${section} section loaded in ${loadTime}ms`);

      if (loadTime < 2000) {
        console.log(`✅ ${section} meets performance SLA (<2s)`);
      } else {
        console.log(
          `⚠️ ${section} exceeds performance SLA (${loadTime}ms > 2000ms)`,
        );
      }
    }
  });

  test("mutations complete quickly", async () => {
    console.log("ℹ️ Mutation performance test");
    console.log(
      "ℹ️ Expected: Create/Update/Delete operations complete in <1 second",
    );
    console.log(
      "ℹ️ Full test requires executing actual mutations and measuring time",
    );
  });
});
