import { Page, expect } from "@playwright/test";

/**
 * Test Utilities for Evan's Class Tracker E2E Tests
 *
 * Provides helper functions for common test actions.
 *
 * IMPORTANT NOTES (Nov 4, 2025):
 * - Login form uses ID selectors (#username, #password) NOT name attributes
 * - App header displays "Class Tracker" not "Evan's Class Tracker"
 * - Password change dialog may appear for test users with requirePasswordChange flag
 * - All selectors must support bilingual UI (English + Thai)
 * - Use these helpers instead of inline logic to maintain consistency
 */

export interface TestUser {
  username: string;
  password: string;
  role: "admin" | "moderator" | "teacher";
}

/** Default test users */
export const TEST_USERS = {
  admin: {
    username: "admin",
    password: "TeacherAdmin",
    role: "admin" as const,
  },
  moderator: {
    username: "moderator1",
    password: "TeacherModerator1",
    role: "moderator" as const,
  },
  teacher: {
    username: "Evan",
    password: "TeacherEvan",
    role: "teacher" as const,
  },
};

/**
 * Login helper function
 *
 * Handles complete login flow including:
 * - ID-based form selectors (#username, #password)
 * - Bilingual button text (Login / เข้าสู่ระบบ)
 * - Automatic password change dialog dismissal
 * - Login verification using actual app header text
 * - Waits for Convex connection and database initialization
 *
 * @param page - Playwright Page object
 * @param user - Test user credentials
 */
export async function login(page: Page, user: TestUser) {
  await page.goto("/", { timeout: 60000 });

  // CRITICAL: Wait for Convex to load and page to be ready
  // The app shows loading spinner while fetching users from Convex
  // Then either shows DatabaseInit or LoginForm

  // Wait for either:
  // 1. Login form (#username input)
  // 2. Database init button (if no users exist)
  // 3. Loading spinner to disappear

  // First, wait for the page to finish loading (max 15 seconds for Convex connection)
  await page.waitForLoadState("networkidle", { timeout: 15000 });

  // Wait for either login form or database init (optimized timeout)
  const loginFormSelector = '#username, input[type="text"]';
  const initButtonSelector =
    'button:has-text("Initialize Database"), button:has-text("เริ่มต้นฐานข้อมูล")';

  try {
    // Wait for login form to appear (optimized timeout)
    await page.waitForSelector(`${loginFormSelector}, ${initButtonSelector}`, {
      timeout: 15000,
    });
  } catch (error) {
    // If timeout, take a screenshot for debugging
    await page.screenshot({
      path: "test-results/login-timeout-debug.png",
      fullPage: true,
    });
    throw new Error(
      `Login form or init button never appeared. Check screenshot at test-results/login-timeout-debug.png. Error: ${error}`,
    );
  }

  // Check if we need to initialize the database first
  const initButton = page.locator(initButtonSelector).first();
  if (await initButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await initButton.click();
    // Wait for initialization to complete and login form to appear
    await page.waitForSelector(loginFormSelector, { timeout: 10000 });
  }

  // Fill credentials using ID selectors
  const usernameInput = page.locator('#username, input[type="text"]').first();
  const passwordInput = page
    .locator('#password, input[type="password"]')
    .first();

  await usernameInput.fill(user.username);
  await passwordInput.fill(user.password);

  // Click login button
  await page
    .locator('button:has-text("Sign In"), button:has-text("ลงชื่อเข้าใช้")')
    .first()
    .click();

  // Wait for successful login - check for either main app or password change dialog
  await page.waitForTimeout(2000);

  // CRITICAL: Check for password change dialog FIRST (test users have requirePasswordChange: true)
  // The dialog completely blocks the UI and cannot be skipped (canSkip=false by design)
  // Solution: Actually change the password to bypass the dialog
  const passwordChangeHeading = page
    .locator('h2:has-text("Change Password"), h2:has-text("เปลี่ยนรหัสผ่าน")')
    .first();
  const isPasswordChangeVisible = await passwordChangeHeading
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (isPasswordChangeVisible) {
    console.log(
      `[TEST] Password change dialog detected for user: ${user.username}`,
    );

    // Fill password change form with same password (bypassing first-login requirement)
    const currentPasswordInput = page
      .locator('input#current, input[type="password"]')
      .first();
    const newPasswordInput = page
      .locator('input#new, input[type="password"]')
      .nth(1);
    const confirmPasswordInput = page
      .locator('input#confirm, input[type="password"]')
      .nth(2);

    await currentPasswordInput.fill(user.password);
    await newPasswordInput.fill(user.password); // Use same password
    await confirmPasswordInput.fill(user.password);

    // Click "Change Password" button
    const changePasswordButton = page
      .locator(
        'button[type="submit"]:has-text("Change Password"), button[type="submit"]:has-text("เปลี่ยนรหัสผ่าน")',
      )
      .first();
    await changePasswordButton.click();

    // Wait for password change to complete and app to load
    await page.waitForTimeout(1500);

    console.log(
      `[TEST] Password changed successfully for user: ${user.username}`,
    );
  }

  // Wait for app to fully load after login (or after password change)
  await page.waitForTimeout(2000);

  // Check if welcome toast appears (first-time session) and close it
  const welcomeToast = page
    .locator("text=ยินดีต้อนรับ!, text=Welcome!")
    .first();
  const isWelcomeToastVisible = await welcomeToast
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isWelcomeToastVisible) {
    // Look for close button on the welcome toast
    const toastCloseButton = page
      .locator(
        'button:has-text("ปิด"), button:has-text("Close"), button:has-text("×")',
      )
      .first();
    if (
      await toastCloseButton.isVisible({ timeout: 1000 }).catch(() => false)
    ) {
      await toastCloseButton.click();
      await page.waitForTimeout(500);
    }
  }

  // Check for Startup Wizard (shows for moderators/teachers with "Welcome Boss" / "ยินดีต้อนรับ บอส")
  const startupWizard = page
    .locator("text=Welcome Boss, text=ยินดีต้อนรับ บอส")
    .first();
  const isStartupWizardVisible = await startupWizard
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isStartupWizardVisible) {
    console.log(
      `[TEST] Startup wizard detected for user: ${user.username}, dismissing...`,
    );

    // Wait a moment for the wizard to fully render
    await page.waitForTimeout(500);

    // Look for close button with improved selectors (matches closeAllOverlays logic)
    const wizardCloseButton = page
      .locator(
        'button[aria-label*="Close"], button[aria-label*="ปิด"], button:has(svg.lucide-x)',
      )
      .first();
    if (
      await wizardCloseButton.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      console.log(`[TEST] Clicking wizard close button`);
      // Wait for button to be stable and clickable
      await wizardCloseButton.waitFor({ state: "visible", timeout: 2000 });
      await wizardCloseButton.click({ timeout: 3000 });
      await page.waitForTimeout(500);
      console.log(`[TEST] Wizard close button clicked`);
    } else {
      // If no close button found, press Escape key
      console.log(`[TEST] No close button found, pressing Escape`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    console.log(`[TEST] Startup wizard dismissed for user: ${user.username}`);
  }

  // DON'T call closeAllOverlays here - we just closed the wizard manually
  // Let the app settle after wizard dismissal
  await page.waitForTimeout(500);

  // Verify not on login page anymore - look for the Monthly Calendar heading (bilingual)
  // After successful login, the app displays "Monthly Calendar" or "ปฏิทินรายเดือน"
  await expect(
    page
      .locator('h2:has-text("Monthly Calendar"), h2:has-text("ปฏิทินรายเดือน")')
      .first(),
  ).toBeVisible({ timeout: 5000 });

  console.log(`[TEST] Login completed successfully for user: ${user.username}`);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  // Look for logout button/link
  await page
    .locator(
      'button:has-text("Logout"), button:has-text("ออกจากระบบ"), a:has-text("Logout"), a:has-text("ออกจากระบบ")',
    )
    .first()
    .click();

  // Wait for login page
  await page.waitForSelector('input[name="username"], input[type="text"]');
}

/**
 * Switch language helper
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function switchLanguage(page: Page, language: "en" | "th") {
  const button = page
    .locator(
      'button:has-text("EN"), button:has-text("TH"), button:has-text("🇬🇧"), button:has-text("🇹🇭")',
    )
    .first();
  await button.click();

  // Wait a bit for language to change
  await page.waitForTimeout(500);
}

/**
 * Wait for toast notification
 */

export async function waitForToast(
  page: Page,
  message?: string,
  type?: "success" | "error",
) {
  const toastSelector = message
    ? `[role="alert"]:has-text("${message}")`
    : '[role="alert"]';

  await expect(page.locator(toastSelector).first()).toBeVisible({
    timeout: 5000,
  });
}

/**
 * Initialize database (for first test run)
 */
export async function initializeDatabase(page: Page) {
  await page.goto("/");

  // Check if init button exists
  const initButton = page
    .locator(
      'button:has-text("Initialize Database"), button:has-text("เริ่มต้นฐานข้อมูล")',
    )
    .first();

  if (await initButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await initButton.click();
    await waitForToast(page, undefined, "success");

    // Wait for page to settle
    await page.waitForTimeout(2000);
  }
}

/**
 * Close all visible modals, overlays, and dialogs
 * Attempts multiple strategies to dismiss blocking UI elements
 * Ignores permanent UI overlays (navigation, headers, etc.)
 */
export async function closeAllOverlays(page: Page) {
  // Try up to 2 times to close overlays (reduced from 3 for speed)
  for (let attempt = 0; attempt < 2; attempt++) {
    // Look for the specific overlay pattern from error messages:
    // <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
    const modalOverlays = page.locator(
      'div.fixed.inset-0[class*="z-"][class*="bg-black"]',
    );
    const overlayCount = await modalOverlays.count().catch(() => 0);

    if (overlayCount === 0) {
      console.log(`[TEST] No overlays found`);
      break; // No modal overlays found, we're done
    }

    console.log(
      `[TEST] Found ${overlayCount} overlay(s) (attempt ${attempt + 1}/2)...`,
    );

    // Strategy 1: Click close buttons (look for aria-label, text, or lucide X icon)
    const closeButtons = page.locator(
      'button[aria-label*="Close"], button[aria-label*="ปิด"], button:has-text("×"), button:has-text("Close"), button:has-text("ปิด"), button.close, button:has(svg.lucide-x)',
    );
    const closeButtonCount = await closeButtons.count().catch(() => 0);
    console.log(`[TEST] Found ${closeButtonCount} close button(s)`);

    if (closeButtonCount > 0) {
      // Click first visible close button only (faster)
      const btn = closeButtons.first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`[TEST] Clicking close button`);
        await btn.click({ force: true, timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }

    // Strategy 2: Press Escape key
    console.log(`[TEST] Pressing Escape key...`);
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(200);

    // Wait a bit for animations to complete
    await page.waitForTimeout(300);

    // Check if overlays are actually gone
    const remainingOverlays = await page
      .locator('div.fixed.inset-0[class*="z-"][class*="bg-black"]')
      .count()
      .catch(() => 0);
    console.log(
      `[TEST] Remaining overlays after attempt ${attempt + 1}: ${remainingOverlays}`,
    );

    if (remainingOverlays === 0) {
      console.log(`[TEST] Successfully closed all overlays`);
      break; // Successfully closed all modals
    }
  }

  // If overlays still remain after 2 attempts, just continue (don't block test)
  console.log(`[TEST] closeAllOverlays complete`);
}

/**
 * Navigate to a specific tab in the application
 * Supports bilingual navigation (English/Thai)
 * Handles modal/overlay dismissal before navigation
 */
export async function navigateToTab(page: Page, tabName: string) {
  // Bilingual tab name mapping (English -> Thai)
  const tabTranslations: Record<string, string> = {
    Calendar: "ปฏิทิน",
    "School Events": "กิจกรรมโรงเรียน",
    Classes: "ชั้นเรียน",
    "Class Requests": "คำขอชั้นเรียน",
    "Class Bookings": "การจองชั้นเรียน",
    Messages: "ข้อความ",
    "Teacher's Helper": "ผู้ช่วยครู",
    Analytics: "การวิเคราะห์",
    Activity: "กิจกรรม",
    Locations: "สถานที่",
    Notifications: "การแจ้งเตือน",
    Schools: "โรงเรียน",
    Moderators: "ผู้ดูแล",
    Users: "ผู้ใช้",
    Testing: "ทดสอบ",
    "Contact Requests": "คำขอติดต่อ",
    "Deleted Students": "นักเรียนที่ถูกลบ",
    "Notification Windows": "หน้าต่างการแจ้งเตือน",
    "App Updates": "อัพเดทแอพ",
    "Audit Logs": "บันทึกการตรวจสอบ",
    "Error Reports": "รายงานข้อผิดพลาด",
    Students: "นักเรียน",
    Alerts: "แจ้งเตือน",
  };

  const thaiName = tabTranslations[tabName] || tabName;

  // Close any overlays that might block navigation
  await closeAllOverlays(page);

  // Target sidebar navigation buttons specifically (inside <ul> > <li> structure)
  // This avoids matching other buttons on the page (modals, forms, etc.)
  const tabButton = page
    .locator(
      `nav ul li button:has-text("${tabName}"), nav ul li button:has-text("${thaiName}")`,
    )
    .first();

  // Wait for tab button to be clickable
  await tabButton.waitFor({ state: "visible", timeout: 5000 });

  // Click with retry logic
  let clicked = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await tabButton.click({ timeout: 3000 });
      clicked = true;
      break;
    } catch (error) {
      if (attempt === 1) throw error;
      // Try closing overlays again and retry
      await closeAllOverlays(page);
      await page.waitForTimeout(300);
    }
  }

  if (!clicked) {
    throw new Error(`Failed to click tab "${tabName}" after 2 attempts`);
  }

  // Wait for content to load
  await page.waitForTimeout(500);
}

/**
 * Fill bilingual input fields
 */
export async function fillBilingualInput(
  page: Page,
  labelEn: string,
  valueEn: string,
  _valueTh: string,
) {
  // Find English input by placeholder or label
  const enInput = page.locator(`input[placeholder*="${labelEn}"]`).first();
  if (await enInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await enInput.fill(valueEn);
  }
}

/**
 * Generate unique test data
 */
export function generateTestData(type: "student"): {
  firstName: string;
  firstNameTh: string;
  lastName: string;
  lastNameTh: string;
  id: string;
};
export function generateTestData(type: "class"): {
  title: string;
  titleTh: string;
  id: string;
};
export function generateTestData(type: "test"): {
  id: string;
  timestamp: number;
  random: string;
};
export function generateTestData(type: "student" | "class" | "test" = "test") {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  if (type === "student") {
    return {
      firstName: `TestStudent${random}`,
      firstNameTh: `นักเรียน${random}`,
      lastName: `User${timestamp}`,
      lastNameTh: `ทดสอบ${timestamp}`,
      id: `student-${timestamp}-${random}`,
    };
  }

  if (type === "class") {
    return {
      title: `Test Class ${random}`,
      titleTh: `ชั้นเรียนทดสอบ ${random}`,
      id: `class-${timestamp}-${random}`,
    };
  }

  return {
    id: `${type}_${timestamp}_${random}`,
    timestamp,
    random,
  };
}

/**
 * Wait for real-time update (for testing notifications/live data)
 */
export async function waitForRealtimeUpdate(
  page: Page,
  selector: string,
  timeout: number = 5000,
) {
  await page.waitForSelector(selector, { timeout, state: "visible" });
}

/**
 * Provider Test Helpers (NEW - Phase 0 Guardian Migration)
 *
 * These helpers prepare test infrastructure for Phase 2 when guardian
 * tests will be migrated to provider-based workflows.
 */

/** Test provider categories */
export const PROVIDER_CATEGORIES = {
  personal: "personal",
  private: "private",
  languageSchool: "language_school",
  educationalCamp: "educational_camp",
  guardian: "guardian", // NEW - For migrated guardian users
} as const;

/** Test provider data for E2E tests */
export const TEST_PROVIDERS = {
  guardianProvider: {
    name: "Test Guardian Provider",
    nameTh: "ผู้ปกครองทดสอบ",
    category: "guardian" as const,
  },
  privateProvider: {
    name: "Test Private Tutor",
    nameTh: "ติวเตอร์ส่วนตัวทดสอบ",
    category: "private" as const,
  },
};

/**
 * Create a test provider (for Phase 2 migration)
 *
 * NOTE: This is a placeholder for Phase 2. Actual implementation will require:
 * 1. Navigate to providers tab
 * 2. Click "Create Provider" button
 * 3. Fill bilingual form (name, nameTh, category)
 * 4. Submit and verify creation
 *
 * @param page - Playwright Page object
 * @param providerData - Provider details (name, nameTh, category)
 */
export async function createTestProvider(
  page: Page,
  providerData: {
    name: string;
    nameTh: string;
    category:
      | "personal"
      | "private"
      | "language_school"
      | "educational_camp"
      | "guardian";
  },
) {
  // TODO: Implement in Phase 2 after UI migration
  // For now, this is a placeholder to document the interface
  console.log("createTestProvider - Placeholder for Phase 2:", providerData);
  throw new Error("createTestProvider not yet implemented - Phase 2 task");
}
