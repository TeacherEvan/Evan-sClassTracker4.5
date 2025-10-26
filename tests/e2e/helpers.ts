import { Page, expect } from '@playwright/test';

/**
 * Test Utilities for Evan's Class Tracker E2E Tests
 * 
 * Provides helper functions for common test actions.
 */

export interface TestUser {
    username: string;
    password: string;
    role: 'admin' | 'moderator' | 'teacher';
}

/** Default test users */
export const TEST_USERS = {
    admin: {
        username: 'admin',
        password: 'TeacherAdmin',
        role: 'admin' as const,
    },
    moderator: {
        username: 'moderator1',
        password: 'TeacherModerator1',
        role: 'moderator' as const,
    },
    teacher: {
        username: 'Evan',
        password: 'TeacherEvan',
        role: 'teacher' as const,
    },
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
    await page.goto('/');

    // Wait for login form
    await page.waitForSelector('input[name="username"], input[type="text"]');

    // Fill credentials (try both possible input names)
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await usernameInput.fill(user.username);
    await passwordInput.fill(user.password);

    // Click login button
    await page.locator('button:has-text("Login"), button:has-text("เข้าสู่ระบบ")').first().click();

    // Wait for successful login (URL change or main content)
    await page.waitForURL(/.*/, { timeout: 10000 });

    // Verify not on login page anymore
    await expect(page.locator('text=Evan\'s Class Tracker, text=ระบบติดตามชั้นเรียนของเอวาน')).toBeVisible();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
    // Look for logout button/link
    await page.locator('button:has-text("Logout"), button:has-text("ออกจากระบบ"), a:has-text("Logout"), a:has-text("ออกจากระบบ")').first().click();

    // Wait for login page
    await page.waitForSelector('input[name="username"], input[type="text"]');
}

/**
 * Switch language helper
 */
export async function switchLanguage(page: Page, language: 'en' | 'th') {
    const button = page.locator('button:has-text("EN"), button:has-text("TH"), button:has-text("🇬🇧"), button:has-text("🇹🇭")').first();
    await button.click();

    // Wait a bit for language to change
    await page.waitForTimeout(500);
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string, type?: 'success' | 'error') {
    const toastSelector = message
        ? `[role="alert"]:has-text("${message}")`
        : '[role="alert"]';

    await expect(page.locator(toastSelector).first()).toBeVisible({ timeout: 5000 });
}

/**
 * Initialize database (for first test run)
 */
export async function initializeDatabase(page: Page) {
    await page.goto('/');

    // Check if init button exists
    const initButton = page.locator('button:has-text("Initialize Database"), button:has-text("เริ่มต้นฐานข้อมูล")').first();

    if (await initButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await initButton.click();
        await waitForToast(page, undefined, 'success');

        // Wait for page to settle
        await page.waitForTimeout(2000);
    }
}

/**
 * Navigate to a specific tab/section
 */
export async function navigateToTab(page: Page, tabName: string) {
    await page.locator(`button:has-text("${tabName}"), a:has-text("${tabName}")`).first().click();

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
    valueTh: string
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
export function generateTestData(type: 'student'): {
    firstName: string;
    firstNameTh: string;
    lastName: string;
    lastNameTh: string;
    id: string;
};
export function generateTestData(type: 'class'): {
    title: string;
    titleTh: string;
    id: string;
};
export function generateTestData(type: 'test'): {
    id: string;
    timestamp: number;
    random: string;
};
export function generateTestData(type: 'student' | 'class' | 'test' = 'test') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    if (type === 'student') {
        return {
            firstName: `TestStudent${random}`,
            firstNameTh: `นักเรียน${random}`,
            lastName: `User${timestamp}`,
            lastNameTh: `ทดสอบ${timestamp}`,
            id: `student-${timestamp}-${random}`,
        };
    }

    if (type === 'class') {
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
export async function waitForRealtimeUpdate(page: Page, selector: string, timeout: number = 5000) {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
}
