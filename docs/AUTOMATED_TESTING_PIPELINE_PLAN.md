# Automated Testing Pipeline - Implementation Plan

## Date: October 25, 2025

## Executive Summary

This document outlines a comprehensive automated testing pipeline using **GitHub Actions**, **Playwright** for E2E testing, and **Docker** for containerization. The pipeline will simulate all user roles (Teacher, Moderator, Admin), detect bugs, document errors, and identify contradictions between documentation and actual behavior.

---

## Identified Issues to Address

### 1. Documentation vs Behavior Contradictions

**Example Found**: Help window states "Book a Class" but teachers can only "Request a Class" (requires moderator approval).

**Impact**: User confusion, incorrect expectations, training issues.

**Detection Strategy**: Compare help text/documentation against actual UI labels and workflow states.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Actions Workflow                │
│  (Trigger: PR, Push, Schedule, Manual)                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Docker Container Orchestration             │
│  - Next.js App Container                               │
│  - Convex Dev Container                                │
│  - Playwright Test Runner                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│                Test Execution Layer                     │
│  ├── Role-Based Test Suites                           │
│  ├── Workflow Validation Tests                        │
│  ├── Documentation Consistency Tests                  │
│  └── Visual Regression Tests                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Reporting & Analysis Layer                 │
│  ├── Test Reports (HTML/JSON)                         │
│  ├── Screenshot/Video Artifacts                       │
│  ├── Bug Report Generation                            │
│  └── Documentation Mismatch Alerts                    │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Docker Configuration

**File**: `docker-compose.test.yml`

```yaml
version: '3.8'

services:
  # Next.js Application
  app:
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=test
      - NEXT_PUBLIC_CONVEX_URL=${CONVEX_TEST_URL}
    depends_on:
      - convex
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Convex Backend (Mock/Dev mode)
  convex:
    image: node:20-alpine
    command: npx convex dev --once
    volumes:
      - ./convex:/app/convex
      - ./convex.json:/app/convex.json
    working_dir: /app
    environment:
      - CONVEX_DEPLOYMENT=${CONVEX_TEST_DEPLOYMENT}
    healthcheck:
      test: ["CMD", "npx", "convex", "status"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Playwright Test Runner
  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    depends_on:
      app:
        condition: service_healthy
      convex:
        condition: service_healthy
    volumes:
      - ./tests:/tests
      - ./test-results:/test-results
      - ./playwright-report:/playwright-report
    environment:
      - BASE_URL=http://app:3000
      - CI=true
    command: npx playwright test --reporter=html,json
```

**File**: `Dockerfile.test`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

**File**: `Dockerfile.playwright`

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /tests

# Install dependencies
COPY package*.json ./
RUN npm ci

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy test files
COPY tests ./tests
COPY playwright.config.ts ./

CMD ["npx", "playwright", "test"]
```

---

### 1.2 GitHub Actions Workflow

**File**: `.github/workflows/automated-testing.yml`

```yaml
name: Automated E2E Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Test suite to run'
        required: false
        default: 'all'
        type: choice
        options:
          - all
          - teacher
          - moderator
          - admin
          - documentation
          - workflow

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      convex-url: ${{ steps.convex-deploy.outputs.url }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Deploy Convex Test Environment
        id: convex-deploy
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_TEST_DEPLOY_KEY }}
        run: |
          npx convex deploy --cmd-url-env-var-name CONVEX_TEST_URL
          echo "url=$CONVEX_TEST_URL" >> $GITHUB_OUTPUT

      - name: Seed Test Data
        env:
          CONVEX_URL: ${{ steps.convex-deploy.outputs.url }}
        run: |
          node scripts/seed-test-data.js

  test-teacher-role:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Teacher Role Tests
        env:
          CONVEX_URL: ${{ needs.setup.outputs.convex-url }}
          TEST_TEACHER_USERNAME: test-teacher-1
          TEST_TEACHER_PASSWORD: TeacherTest1
        run: |
          npm run test:teacher

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: teacher-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

  test-moderator-role:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Moderator Role Tests
        env:
          CONVEX_URL: ${{ needs.setup.outputs.convex-url }}
          TEST_MODERATOR_USERNAME: test-moderator-1
          TEST_MODERATOR_PASSWORD: ModeratorTest1
        run: |
          npm run test:moderator

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: moderator-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

  test-admin-role:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Admin Role Tests
        env:
          CONVEX_URL: ${{ needs.setup.outputs.convex-url }}
          TEST_ADMIN_USERNAME: test-admin
          TEST_ADMIN_PASSWORD: AdminTest1
        run: |
          npm run test:admin

      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: admin-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

  test-documentation-consistency:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Documentation Consistency Tests
        env:
          CONVEX_URL: ${{ needs.setup.outputs.convex-url }}
        run: |
          npm run test:documentation

      - name: Upload Documentation Mismatch Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: documentation-mismatch-report
          path: |
            test-results/documentation-mismatches.json
            test-results/documentation-report.html
          retention-days: 30

  test-workflow-validation:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Workflow Validation Tests
        env:
          CONVEX_URL: ${{ needs.setup.outputs.convex-url }}
        run: |
          npm run test:workflows

      - name: Upload Workflow Test Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: workflow-test-results
          path: |
            test-results/
            playwright-report/
          retention-days: 30

  analyze-and-report:
    needs: 
      - test-teacher-role
      - test-moderator-role
      - test-admin-role
      - test-documentation-consistency
      - test-workflow-validation
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download All Artifacts
        uses: actions/download-artifact@v4
        with:
          path: ./all-test-results

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Analyze Test Results
        run: |
          node scripts/analyze-test-results.js

      - name: Generate Consolidated Report
        run: |
          node scripts/generate-test-report.js

      - name: Create GitHub Issue for Failures
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('./test-results/summary.md', 'utf8');
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Automated Test Failures - ${new Date().toISOString().split('T')[0]}`,
              body: report,
              labels: ['automated-test', 'bug']
            });

      - name: Upload Consolidated Report
        uses: actions/upload-artifact@v4
        with:
          name: consolidated-test-report
          path: |
            test-results/summary.md
            test-results/full-report.html
            test-results/bugs-found.json
          retention-days: 90

      - name: Post to Slack (Optional)
        if: always()
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: |
            {
              "text": "Automated Tests Completed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Test Results: ${{ job.status }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Phase 2: Test Suite Development (Week 2-3)

### 2.1 Playwright Configuration

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 2.2 Test Utilities & Fixtures

**File**: `tests/fixtures/test-users.ts`

```typescript
export const TEST_USERS = {
  teacher: {
    username: 'test-teacher-1',
    password: 'TeacherTest1',
    role: 'teacher' as const,
    schoolId: 'test-school-1',
  },
  moderator: {
    username: 'test-moderator-1',
    password: 'ModeratorTest1',
    role: 'moderator' as const,
    schoolId: 'test-school-1',
  },
  admin: {
    username: 'test-admin',
    password: 'AdminTest1',
    role: 'admin' as const,
  },
};

export type TestUser = typeof TEST_USERS[keyof typeof TEST_USERS];
```

**File**: `tests/fixtures/auth.ts`

```typescript
import { test as base, Page } from '@playwright/test';
import { TEST_USERS, TestUser } from './test-users';

type AuthFixtures = {
  authenticatedPage: Page;
  currentUser: TestUser;
};

export const test = base.extend<AuthFixtures>({
  currentUser: async ({}, use, testInfo) => {
    // Determine user from test file name
    const testFile = testInfo.file;
    let user: TestUser;
    
    if (testFile.includes('teacher')) {
      user = TEST_USERS.teacher;
    } else if (testFile.includes('moderator')) {
      user = TEST_USERS.moderator;
    } else if (testFile.includes('admin')) {
      user = TEST_USERS.admin;
    } else {
      user = TEST_USERS.teacher; // default
    }
    
    await use(user);
  },

  authenticatedPage: async ({ page, currentUser }, use) => {
    // Navigate to login
    await page.goto('/');
    
    // Fill login form
    await page.fill('input[name="username"]', currentUser.username);
    await page.fill('input[name="password"]', currentUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*/, { timeout: 10000 });
    
    // Verify login success by checking for logout button or role-specific element
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
    
    await use(page);
    
    // Cleanup: logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');
  },
});

export { expect } from '@playwright/test';
```

---

### 2.3 Role-Based Test Suites

**File**: `tests/teacher/class-booking.spec.ts`

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Teacher - Class Booking/Requesting', () => {
  test('should see "Request Class" not "Book Class" in UI', async ({ authenticatedPage }) => {
    // Navigate to class booking page
    await authenticatedPage.click('button:has-text("Classes")');
    
    // Check for correct terminology
    const requestButton = authenticatedPage.locator('button:has-text("Request Class")');
    const bookButton = authenticatedPage.locator('button:has-text("Book Class")');
    
    await expect(requestButton).toBeVisible();
    await expect(bookButton).not.toBeVisible();
  });

  test('should require moderator approval for class requests', async ({ authenticatedPage }) => {
    // Navigate to class booking
    await authenticatedPage.click('button:has-text("Request Class")');
    
    // Fill out class request form
    await authenticatedPage.fill('input[name="date"]', '2025-11-01');
    await authenticatedPage.selectOption('select[name="location"]', 'Test Location');
    await authenticatedPage.selectOption('select[name="student"]', { index: 0 });
    
    // Submit request
    await authenticatedPage.click('button:has-text("Submit Request")');
    
    // Verify status shows "pending"
    await expect(authenticatedPage.locator('text=Pending Approval')).toBeVisible({ timeout: 5000 });
    
    // Screenshot for documentation
    await authenticatedPage.screenshot({ 
      path: 'test-results/screenshots/teacher-pending-approval.png' 
    });
  });

  test('should not be able to approve own requests', async ({ authenticatedPage }) => {
    // Navigate to classes view
    await authenticatedPage.click('button:has-text("My Classes")');
    
    // Find a pending class
    const pendingClass = authenticatedPage.locator('[data-status="pending"]').first();
    
    if (await pendingClass.isVisible()) {
      await pendingClass.click();
      
      // Verify NO approve/reject buttons visible for teachers
      await expect(authenticatedPage.locator('button:has-text("Approve")')).not.toBeVisible();
      await expect(authenticatedPage.locator('button:has-text("Reject")')).not.toBeVisible();
    }
  });

  test('should receive notification when class is approved', async ({ authenticatedPage }) => {
    // This test requires cross-role interaction
    // Will be implemented in workflow tests
  });
});
```

**File**: `tests/moderator/class-approval.spec.ts`

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Moderator - Class Approval Workflow', () => {
  test('should see pending class requests from teachers', async ({ authenticatedPage }) => {
    // Navigate to moderator dashboard
    await authenticatedPage.click('button:has-text("Pending Requests")');
    
    // Should see list of pending classes
    const pendingList = authenticatedPage.locator('[data-testid="pending-classes-list"]');
    await expect(pendingList).toBeVisible();
  });

  test('should be able to acknowledge class request', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Pending Requests")');
    
    const firstPending = authenticatedPage.locator('[data-status="pending"]').first();
    await firstPending.click();
    
    // Acknowledge button should be visible
    const acknowledgeBtn = authenticatedPage.locator('button:has-text("Acknowledge")');
    await expect(acknowledgeBtn).toBeVisible();
    
    await acknowledgeBtn.click();
    
    // Status should change to acknowledged
    await expect(authenticatedPage.locator('text=Acknowledged')).toBeVisible({ timeout: 3000 });
  });

  test('should be able to approve class request', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Pending Requests")');
    
    const acknowledgedClass = authenticatedPage.locator('[data-status="acknowledged"]').first();
    
    if (await acknowledgedClass.isVisible()) {
      await acknowledgedClass.click();
      
      // Approve button should be visible
      const approveBtn = authenticatedPage.locator('button:has-text("Approve")');
      await expect(approveBtn).toBeVisible();
      
      await approveBtn.click();
      
      // Confirm approval
      await authenticatedPage.click('button:has-text("Confirm")');
      
      // Status should change to approved
      await expect(authenticatedPage.locator('text=Approved')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should only see classes from own school', async ({ authenticatedPage, currentUser }) => {
    await authenticatedPage.click('button:has-text("All Classes")');
    
    // Get all class cards
    const classCards = authenticatedPage.locator('[data-testid="class-card"]');
    const count = await classCards.count();
    
    // Verify each class belongs to moderator's school
    for (let i = 0; i < count; i++) {
      const card = classCards.nth(i);
      const schoolName = await card.locator('[data-testid="school-name"]').textContent();
      
      // Should match test school (this requires test data setup)
      expect(schoolName).toContain('Test School 1');
    }
  });
});
```

**File**: `tests/admin/user-management.spec.ts`

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('Admin - User Management', () => {
  test('should be able to create new teacher', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Users")');
    await authenticatedPage.click('button:has-text("Create User")');
    
    // Fill user form
    await authenticatedPage.fill('input[name="username"]', `test-teacher-${Date.now()}`);
    await authenticatedPage.selectOption('select[name="role"]', 'teacher');
    await authenticatedPage.selectOption('select[name="school"]', { index: 0 });
    
    await authenticatedPage.click('button:has-text("Create")');
    
    // Should see success message
    await expect(authenticatedPage.locator('text=User created successfully')).toBeVisible();
  });

  test('should be able to reset user password', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Users")');
    
    // Find a teacher user
    const teacherRow = authenticatedPage.locator('tr:has-text("teacher")').first();
    await teacherRow.click();
    
    // Reset password button
    await authenticatedPage.click('button:has-text("Reset Password")');
    
    // Confirm reset
    await authenticatedPage.click('button:has-text("Confirm")');
    
    // Should see success message
    await expect(authenticatedPage.locator('text=Password reset')).toBeVisible();
  });

  test('should be able to bulk delete students', async ({ authenticatedPage }) => {
    await authenticatedPage.click('button:has-text("Students")');
    
    // Select multiple students
    const checkboxes = authenticatedPage.locator('input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    
    // Bulk delete button should appear
    const bulkDeleteBtn = authenticatedPage.locator('button:has-text("Delete Selected")');
    await expect(bulkDeleteBtn).toBeVisible();
    
    await bulkDeleteBtn.click();
    
    // Enter reason (minimum 3 characters - from recent fix)
    await authenticatedPage.fill('input[name="reason"]', 'Test deletion');
    
    await authenticatedPage.click('button:has-text("Confirm Delete")');
    
    // Should see success message
    await expect(authenticatedPage.locator('text=deleted successfully')).toBeVisible();
  });
});
```

---

### 2.4 Documentation Consistency Tests

**File**: `tests/documentation/consistency.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type DocumentationMismatch = {
  location: string;
  docText: string;
  actualText: string;
  severity: 'high' | 'medium' | 'low';
  screenshot?: string;
};

const mismatches: DocumentationMismatch[] = [];

test.describe('Documentation Consistency Checks', () => {
  test('Help Window - Teacher Class Booking Terminology', async ({ page }) => {
    // Login as teacher
    await page.goto('/');
    await page.fill('input[name="username"]', 'test-teacher-1');
    await page.fill('input[name="password"]', 'TeacherTest1');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/, { timeout: 10000 });
    
    // Open help window
    await page.click('[data-testid="help-button"]');
    
    // Get help text about booking classes
    const helpText = await page.locator('text=/book.*class/i').allTextContents();
    
    // Now check actual UI
    await page.click('button:has-text("Classes")');
    const actualButtons = await page.locator('button').allTextContents();
    
    // Check for mismatch
    const hasBookInHelp = helpText.some(text => text.toLowerCase().includes('book class'));
    const hasBookInUI = actualButtons.some(text => text.toLowerCase().includes('book class'));
    const hasRequestInUI = actualButtons.some(text => text.toLowerCase().includes('request class'));
    
    if (hasBookInHelp && !hasBookInUI && hasRequestInUI) {
      const screenshot = 'test-results/screenshots/help-ui-mismatch-booking.png';
      await page.screenshot({ path: screenshot, fullPage: true });
      
      mismatches.push({
        location: 'Help Window - Teacher Class Booking',
        docText: 'Help says: "Book Class"',
        actualText: 'UI shows: "Request Class"',
        severity: 'high',
        screenshot,
      });
      
      expect(hasBookInHelp).toBe(false); // This will fail and document the issue
    }
  });

  test('README vs Actual Feature Comparison', async ({ page }) => {
    // Read README.md
    const readmePath = path.join(__dirname, '../../README.md');
    const readme = fs.readFileSync(readmePath, 'utf-8');
    
    // Extract feature list
    const featureRegex = /- 🔐 \*\*(.+?)\*\*/g;
    const features: string[] = [];
    let match;
    while ((match = featureRegex.exec(readme)) !== null) {
      features.push(match[1]);
    }
    
    // Login as admin to see all features
    await page.goto('/');
    await page.fill('input[name="username"]', 'test-admin');
    await page.fill('input[name="password"]', 'AdminTest1');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*/, { timeout: 10000 });
    
    // Check each feature exists
    for (const feature of features) {
      // Simplified feature name check
      const simplifiedFeature = feature.replace(/[^a-zA-Z ]/g, '').toLowerCase();
      
      // Search for feature in UI (navigation, buttons, headings)
      const found = await page.locator(`text=/${simplifiedFeature}/i`).count() > 0;
      
      if (!found) {
        console.log(`Feature not found in UI: ${feature}`);
        // Log but don't fail - may be internal feature
      }
    }
  });

  test.afterAll(async () => {
    // Generate documentation mismatch report
    if (mismatches.length > 0) {
      const reportPath = 'test-results/documentation-mismatches.json';
      fs.writeFileSync(reportPath, JSON.stringify(mismatches, null, 2));
      
      // Generate HTML report
      const htmlReport = generateHTMLReport(mismatches);
      fs.writeFileSync('test-results/documentation-report.html', htmlReport);
      
      console.log(`\n⚠️  Found ${mismatches.length} documentation mismatches`);
      console.log(`📄 Report saved to: ${reportPath}`);
    }
  });
});

function generateHTMLReport(mismatches: DocumentationMismatch[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Documentation Consistency Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #d32f2f; }
    .mismatch { 
      border: 1px solid #ddd; 
      padding: 15px; 
      margin: 10px 0; 
      border-radius: 5px;
    }
    .high { border-left: 5px solid #d32f2f; }
    .medium { border-left: 5px solid #ff9800; }
    .low { border-left: 5px solid #ffc107; }
    .screenshot { max-width: 100%; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>Documentation Consistency Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
  <p>Total Mismatches: ${mismatches.length}</p>
  
  ${mismatches.map(m => `
    <div class="mismatch ${m.severity}">
      <h3>${m.location}</h3>
      <p><strong>Documentation says:</strong> ${m.docText}</p>
      <p><strong>Actual behavior:</strong> ${m.actualText}</p>
      <p><strong>Severity:</strong> <span class="${m.severity}">${m.severity.toUpperCase()}</span></p>
      ${m.screenshot ? `<img src="${m.screenshot}" class="screenshot" />` : ''}
    </div>
  `).join('')}
</body>
</html>
  `;
}
```

---

### 2.5 Workflow Validation Tests

**File**: `tests/workflows/class-booking-approval.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('Complete Class Booking Workflow', () => {
  test('End-to-end: Teacher requests → Moderator approves → Teacher receives notification', async ({ browser }) => {
    // Create two browser contexts for teacher and moderator
    const teacherContext = await browser.newContext();
    const moderatorContext = await browser.newContext();
    
    const teacherPage = await teacherContext.newPage();
    const moderatorPage = await moderatorContext.newPage();
    
    // Step 1: Teacher logs in
    await teacherPage.goto('/');
    await teacherPage.fill('input[name="username"]', TEST_USERS.teacher.username);
    await teacherPage.fill('input[name="password"]', TEST_USERS.teacher.password);
    await teacherPage.click('button[type="submit"]');
    await teacherPage.waitForURL(/.*/, { timeout: 10000 });
    
    // Step 2: Teacher requests a class
    await teacherPage.click('button:has-text("Request Class")');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await teacherPage.fill('input[name="date"]', dateString);
    await teacherPage.selectOption('select[name="location"]', { index: 0 });
    await teacherPage.selectOption('select[name="student"]', { index: 0 });
    await teacherPage.click('button:has-text("Submit Request")');
    
    // Verify success message
    await expect(teacherPage.locator('text=Request submitted')).toBeVisible({ timeout: 5000 });
    
    // Get the class ID from UI or database
    const classElement = teacherPage.locator('[data-status="pending"]').first();
    await expect(classElement).toBeVisible({ timeout: 5000 });
    
    // Step 3: Moderator logs in
    await moderatorPage.goto('/');
    await moderatorPage.fill('input[name="username"]', TEST_USERS.moderator.username);
    await moderatorPage.fill('input[name="password"]', TEST_USERS.moderator.password);
    await moderatorPage.click('button[type="submit"]');
    await moderatorPage.waitForURL(/.*/, { timeout: 10000 });
    
    // Step 4: Moderator should see notification
    const notificationBadge = moderatorPage.locator('[data-testid="notification-badge"]');
    await expect(notificationBadge).toBeVisible({ timeout: 5000 });
    
    // Step 5: Moderator acknowledges
    await moderatorPage.click('button:has-text("Pending Requests")');
    const pendingClass = moderatorPage.locator('[data-status="pending"]').first();
    await pendingClass.click();
    
    await moderatorPage.click('button:has-text("Acknowledge")');
    await expect(moderatorPage.locator('text=Acknowledged')).toBeVisible({ timeout: 3000 });
    
    // Step 6: Moderator approves
    await moderatorPage.click('button:has-text("Approve")');
    await moderatorPage.click('button:has-text("Confirm")');
    await expect(moderatorPage.locator('text=Approved')).toBeVisible({ timeout: 3000 });
    
    // Step 7: Teacher should receive notification
    await teacherPage.bringToFront();
    
    // Check for notification (may need to refresh or wait for real-time update)
    await teacherPage.waitForTimeout(2000); // Wait for real-time update
    
    const teacherNotification = teacherPage.locator('[data-testid="notification-badge"]');
    await expect(teacherNotification).toBeVisible({ timeout: 5000 });
    
    // Verify class status changed to approved in teacher's view
    await teacherPage.click('button:has-text("My Classes")');
    const approvedClass = teacherPage.locator('[data-status="approved"]').first();
    await expect(approvedClass).toBeVisible({ timeout: 5000 });
    
    // Screenshot final state
    await teacherPage.screenshot({ 
      path: 'test-results/screenshots/workflow-teacher-approved-class.png' 
    });
    await moderatorPage.screenshot({ 
      path: 'test-results/screenshots/workflow-moderator-approved-class.png' 
    });
    
    // Cleanup
    await teacherContext.close();
    await moderatorContext.close();
  });

  test('Guardian-linked student should auto-approve', async ({ browser }) => {
    const teacherContext = await browser.newContext();
    const teacherPage = await teacherContext.newPage();
    
    // Login as teacher
    await teacherPage.goto('/');
    await teacherPage.fill('input[name="username"]', TEST_USERS.teacher.username);
    await teacherPage.fill('input[name="password"]', TEST_USERS.teacher.password);
    await teacherPage.click('button[type="submit"]');
    await teacherPage.waitForURL(/.*/, { timeout: 10000 });
    
    // Request class with guardian-linked student
    await teacherPage.click('button:has-text("Request Class")');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await teacherPage.fill('input[name="date"]', dateString);
    await teacherPage.selectOption('select[name="location"]', { index: 0 });
    
    // Select student with guardian linked (test data should have this)
    await teacherPage.selectOption('select[name="student"]', { label: /.*Guardian.*/ });
    
    await teacherPage.click('button:has-text("Submit Request")');
    
    // Should auto-approve (skip moderator workflow)
    await expect(teacherPage.locator('text=Automatically approved')).toBeVisible({ timeout: 5000 });
    
    // Verify status is "approved" not "pending"
    const classElement = teacherPage.locator('[data-status="approved"]').first();
    await expect(classElement).toBeVisible({ timeout: 5000 });
    
    await teacherContext.close();
  });
});
```

---

## Phase 3: Test Data Management (Week 3)

### 3.1 Seed Script for Test Data

**File**: `scripts/seed-test-data.js`

```javascript
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.CONVEX_URL);

async function seedTestData() {
  console.log("🌱 Seeding test data...");

  // Create test schools
  const school1 = await client.mutation("schools.create", {
    name: "Test School 1",
    nameTh: "โรงเรียนทดสอบ 1",
    location: "Bangkok",
    isActive: true,
  });

  const school2 = await client.mutation("schools.create", {
    name: "Test School 2",
    nameTh: "โรงเรียนทดสอบ 2",
    location: "Chiang Mai",
    isActive: true,
  });

  console.log("✅ Schools created");

  // Create test users
  const testUsers = [
    {
      username: "test-teacher-1",
      password: "TeacherTest1",
      role: "teacher",
      schoolId: school1,
      requirePasswordChange: false,
    },
    {
      username: "test-moderator-1",
      password: "ModeratorTest1",
      role: "moderator",
      schoolId: school1,
      requirePasswordChange: false,
    },
    {
      username: "test-admin",
      password: "AdminTest1",
      role: "admin",
      requirePasswordChange: false,
    },
  ];

  for (const user of testUsers) {
    await client.mutation("users.create", user);
  }

  console.log("✅ Users created");

  // Create test students
  const students = [];
  for (let i = 1; i <= 10; i++) {
    const student = await client.mutation("students.create", {
      firstName: `Test${i}`,
      firstNameTh: `ทดสอบ${i}`,
      lastName: `Student`,
      lastNameTh: `นักเรียน`,
      schoolId: school1,
      isGuardianLinked: i === 1, // First student has guardian
    });
    students.push(student);
  }

  console.log("✅ Students created");

  // Create test locations
  await client.mutation("locations.create", {
    name: "Test Location 1",
    nameTh: "สถานที่ทดสอบ 1",
    schoolId: school1,
    isActive: true,
  });

  console.log("✅ Locations created");

  console.log("🎉 Test data seeding complete!");
}

seedTestData().catch(console.error);
```

---

### 3.2 Test Cleanup Script

**File**: `scripts/cleanup-test-data.js`

```javascript
const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient(process.env.CONVEX_URL);

async function cleanupTestData() {
  console.log("🧹 Cleaning up test data...");

  // Delete test users
  const users = await client.query("users.list");
  for (const user of users) {
    if (user.username.startsWith("test-")) {
      await client.mutation("users.delete", { userId: user._id });
    }
  }

  // Delete test schools
  const schools = await client.query("schools.list");
  for (const school of schools) {
    if (school.name.startsWith("Test School")) {
      await client.mutation("schools.softDelete", { schoolId: school._id });
    }
  }

  console.log("✅ Test data cleanup complete!");
}

cleanupTestData().catch(console.error);
```

---

## Phase 4: Analysis & Reporting Scripts (Week 4)

### 4.1 Test Result Analyzer

**File**: `scripts/analyze-test-results.js`

```javascript
const fs = require('fs');
const path = require('path');

function analyzeTestResults() {
  const resultsDir = './all-test-results';
  const bugs = [];
  const warnings = [];
  const stats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  // Read all test result artifacts
  const artifacts = fs.readdirSync(resultsDir);

  for (const artifact of artifacts) {
    const artifactPath = path.join(resultsDir, artifact);
    
    // Find results.json in each artifact
    const resultsFile = path.join(artifactPath, 'results.json');
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
      
      // Aggregate stats
      results.suites.forEach(suite => {
        suite.specs.forEach(spec => {
          stats.total++;
          
          if (spec.ok) {
            stats.passed++;
          } else {
            stats.failed++;
            
            // Extract bug information
            bugs.push({
              test: spec.title,
              suite: suite.title,
              error: spec.tests[0]?.results[0]?.error?.message || 'Unknown error',
              screenshot: spec.tests[0]?.results[0]?.attachments?.find(a => a.name === 'screenshot')?.path,
              trace: spec.tests[0]?.results[0]?.attachments?.find(a => a.name === 'trace')?.path,
            });
          }
        });
      });
    }
  }

  // Check for documentation mismatches
  const docMismatchFile = path.join(resultsDir, 'documentation-mismatch-report', 'documentation-mismatches.json');
  if (fs.existsSync(docMismatchFile)) {
    const mismatches = JSON.parse(fs.readFileSync(docMismatchFile, 'utf-8'));
    
    mismatches.forEach(m => {
      warnings.push({
        type: 'documentation_mismatch',
        location: m.location,
        severity: m.severity,
        description: `${m.docText} vs ${m.actualText}`,
      });
    });
  }

  // Save consolidated results
  const output = {
    timestamp: new Date().toISOString(),
    stats,
    bugs,
    warnings,
  };

  fs.writeFileSync('./test-results/bugs-found.json', JSON.stringify(output, null, 2));
  
  console.log('\n📊 Test Analysis Summary:');
  console.log(`   Total Tests: ${stats.total}`);
  console.log(`   ✅ Passed: ${stats.passed}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log(`   🐛 Bugs Found: ${bugs.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  
  return output;
}

module.exports = { analyzeTestResults };

if (require.main === module) {
  analyzeTestResults();
}
```

---

### 4.2 Report Generator

**File**: `scripts/generate-test-report.js`

```javascript
const fs = require('fs');
const { analyzeTestResults } = require('./analyze-test-results');

function generateMarkdownReport(analysis) {
  const { stats, bugs, warnings } = analysis;
  
  let markdown = `# Automated Test Report\n\n`;
  markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Count |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${stats.total} |\n`;
  markdown += `| ✅ Passed | ${stats.passed} |\n`;
  markdown += `| ❌ Failed | ${stats.failed} |\n`;
  markdown += `| 🐛 Bugs Found | ${bugs.length} |\n`;
  markdown += `| ⚠️ Warnings | ${warnings.length} |\n\n`;

  if (bugs.length > 0) {
    markdown += `## 🐛 Bugs Found\n\n`;
    
    bugs.forEach((bug, index) => {
      markdown += `### ${index + 1}. ${bug.test}\n\n`;
      markdown += `**Suite:** ${bug.suite}\n\n`;
      markdown += `**Error:**\n\`\`\`\n${bug.error}\n\`\`\`\n\n`;
      
      if (bug.screenshot) {
        markdown += `**Screenshot:** [View](${bug.screenshot})\n\n`;
      }
      
      if (bug.trace) {
        markdown += `**Trace:** [View](${bug.trace})\n\n`;
      }
      
      markdown += `---\n\n`;
    });
  }

  if (warnings.length > 0) {
    markdown += `## ⚠️ Warnings\n\n`;
    
    const highSeverity = warnings.filter(w => w.severity === 'high');
    const mediumSeverity = warnings.filter(w => w.severity === 'medium');
    const lowSeverity = warnings.filter(w => w.severity === 'low');
    
    if (highSeverity.length > 0) {
      markdown += `### 🔴 High Severity (${highSeverity.length})\n\n`;
      highSeverity.forEach(w => {
        markdown += `- **${w.location}:** ${w.description}\n`;
      });
      markdown += `\n`;
    }
    
    if (mediumSeverity.length > 0) {
      markdown += `### 🟠 Medium Severity (${mediumSeverity.length})\n\n`;
      mediumSeverity.forEach(w => {
        markdown += `- **${w.location}:** ${w.description}\n`;
      });
      markdown += `\n`;
    }
    
    if (lowSeverity.length > 0) {
      markdown += `### 🟡 Low Severity (${lowSeverity.length})\n\n`;
      lowSeverity.forEach(w => {
        markdown += `- **${w.location}:** ${w.description}\n`;
      });
      markdown += `\n`;
    }
  }

  return markdown;
}

function generateReport() {
  const analysis = analyzeTestResults();
  const markdown = generateMarkdownReport(analysis);
  
  fs.writeFileSync('./test-results/summary.md', markdown);
  console.log('✅ Report generated: test-results/summary.md');
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };
```

---

## Phase 5: Integration & Deployment (Week 4)

### 5.1 Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "playwright test",
    "test:teacher": "playwright test tests/teacher",
    "test:moderator": "playwright test tests/moderator",
    "test:admin": "playwright test tests/admin",
    "test:documentation": "playwright test tests/documentation",
    "test:workflows": "playwright test tests/workflows",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:report": "playwright show-report",
    "test:seed": "node scripts/seed-test-data.js",
    "test:cleanup": "node scripts/cleanup-test-data.js",
    "test:analyze": "node scripts/analyze-test-results.js",
    "test:generate-report": "node scripts/generate-test-report.js",
    "docker:test": "docker-compose -f docker-compose.test.yml up --abort-on-container-exit",
    "docker:test:build": "docker-compose -f docker-compose.test.yml build"
  }
}
```

---

### 5.2 GitHub Secrets Configuration

Add these secrets to GitHub repository settings:

1. `CONVEX_TEST_DEPLOY_KEY` - Convex deployment key for test environment
2. `SLACK_WEBHOOK_URL` (Optional) - For Slack notifications
3. `TEST_ADMIN_PASSWORD` - Admin password for test environment
4. `TEST_TEACHER_PASSWORD` - Teacher password for test environment
5. `TEST_MODERATOR_PASSWORD` - Moderator password for test environment

---

## Phase 6: Monitoring & Maintenance

### 6.1 Daily Automated Runs

The pipeline runs automatically:

- **On every PR** - Prevents buggy code from merging
- **On push to main/develop** - Validates production code
- **Daily at 2 AM UTC** - Catches issues from external changes
- **Manual trigger** - Run specific test suites on demand

### 6.2 Metrics to Track

1. **Test Coverage** - % of features covered by tests
2. **Bug Detection Rate** - Bugs found per week
3. **Documentation Mismatches** - High/Medium/Low severity counts
4. **Test Execution Time** - Track performance
5. **Flaky Test Rate** - Tests that fail intermittently

### 6.3 Alert Thresholds

**Create GitHub Issues automatically when:**

- Any test fails on main branch
- Documentation mismatches >= 3 high severity
- Test execution time > 30 minutes
- More than 5 bugs found in single run

---

## Expected Outcomes

### Bugs That Will Be Detected

1. ✅ **Terminology Inconsistencies**
   - "Book Class" vs "Request Class"
   - "Approve" vs "Acknowledge" confusion

2. ✅ **Authorization Issues**
   - Teachers seeing moderator buttons
   - Moderators seeing classes from other schools
   - Role-based access violations

3. ✅ **Workflow Breaks**
   - Notifications not sent
   - Status transitions incorrect
   - Auto-approval not working for guardian-linked students

4. ✅ **UI/UX Issues**
   - Buttons not enabling when they should
   - Forms accepting invalid data
   - Error messages not bilingual

5. ✅ **Data Integrity**
   - Duplicate bookings not prevented
   - Soft deletes not working
   - Audit logs not created

### Documentation Issues That Will Be Found

1. **Help Window Contradictions**
2. **README Feature List vs Actual Features**
3. **API Documentation vs Actual Behavior**
4. **User Guides with Outdated Screenshots**

---

## Cost Analysis

### GitHub Actions Minutes

- **Free tier:** 2,000 minutes/month
- **Estimated usage:**
  - Per run: ~15 minutes (all test suites)
  - Daily runs: 15 min × 30 days = 450 minutes
  - PR runs: 15 min × 20 PRs = 300 minutes
  - **Total:** ~750 minutes/month (within free tier)

### Convex Test Environment

- Use separate deployment for testing
- Auto-cleanup after test runs
- Minimal data storage needed

### Storage for Artifacts

- GitHub provides free artifact storage (90 days retention)
- Screenshots/videos: ~500MB per month
- Test reports: ~50MB per month

**Total Cost: $0** (within free tiers)

---

## Success Criteria

### Week 1-2: Infrastructure

- ✅ Docker containers running successfully
- ✅ GitHub Actions workflow executing
- ✅ Test environment auto-seeding

### Week 3: Test Coverage

- ✅ 80% of user workflows covered
- ✅ All 3 user roles tested
- ✅ Documentation consistency checks working

### Week 4: Integration

- ✅ Automated reports generating
- ✅ GitHub issues auto-created for failures
- ✅ Team trained on using the system

### Ongoing

- ✅ <5% flaky test rate
- ✅ All bugs found are actionable
- ✅ Documentation stays up-to-date

---

## Next Steps for Implementation

### Immediate (Another Agent Should)

1. **Create file structure:**

   ```
   mkdir -p tests/{teacher,moderator,admin,documentation,workflows,fixtures}
   mkdir -p scripts
   mkdir -p .github/workflows
   ```

2. **Install Playwright:**

   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

3. **Create initial test files** from the examples above

4. **Set up Docker Compose** with the test configuration

5. **Configure GitHub Actions** workflow

6. **Create seed/cleanup scripts**

7. **Test locally first:**

   ```bash
   npm run test:seed
   npm run test:teacher
   npm run test:analyze
   npm run test:cleanup
   ```

8. **Deploy to GitHub Actions** and verify first run

9. **Iterate based on results**

---

## Conclusion

This automated testing pipeline will:

- ✅ Run continuously in the background (GitHub Actions)
- ✅ Test all user roles comprehensively
- ✅ Detect documentation vs behavior contradictions
- ✅ Generate detailed bug reports with screenshots
- ✅ Alert team to issues automatically
- ✅ Cost $0 using GitHub free tier
- ✅ Save hundreds of hours of manual testing

**Ready for another agent to implement following this plan.** 🚀
