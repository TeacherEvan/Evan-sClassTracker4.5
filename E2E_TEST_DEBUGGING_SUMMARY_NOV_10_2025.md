# E2E Test Debugging Summary - Nov 10, 2025

**Prepared by:** GitHub Copilot (Previous Agent)
**Purpose:** To provide a clean hand-off to a new agent for debugging the Playwright E2E test suite. This document summarizes all findings, failures, and the current hypothesis.

---

## 1. High-Level Goal & Current Status

- **Objective**: Fix the E2E test suite to achieve a stable, passing state. This is a blocker for a larger project migration.
- **Current Status**: **CRITICAL FAILURE**. All 29 tests in the suite are failing. The issue appears to be a global setup or authentication problem, as every test fails at the initial login step.

---

## 2. Summary of Failures

This session involved multiple test runs, each revealing a different layer of the problem.

### Failure A: Login Button Timeout (Initial Manual Run)

- **Action**: Manually started Convex and Next.js servers, then ran `npm run test:e2e:raw`.
- **Result**: Tests failed with a `TimeoutError` when trying to click the login button.
- **Analysis**: This was misleading. While it seemed like a simple selector issue, it was likely a symptom of an unstable application state caused by improper server startup.

### Failure B: `webServer` Timeout (Playwright-Managed Run)

- **Action**: Stopped all manual servers and ran `npm run test:e2e:raw`, letting Playwright's `webServer` config handle startup.
- **Result**: The test runner failed to even start, with `Error: Timed out waiting 120000ms from config.webServer`.
- **Analysis**: This led to the key discovery.

---

## 3. Key Discovery: The Correct Test Procedure

Investigation of `playwright.config.ts` revealed the following critical instruction:

> **⚠️ IMPORTANT: You must start Convex separately before running tests.**

The `webServer` configuration is **only** responsible for starting the Next.js server. It assumes the Convex backend is already running.

**The correct, validated procedure for running tests is a hybrid approach:**

1. **Manually start the backend:** Run `npx convex dev` in a terminal and leave it running.
2. **Let Playwright start the frontend:** Run `npm run test:e2e:raw`. Playwright will automatically start the Next.js server and connect to the already-running Convex instance.

---

## 4. The Core Problem: All Tests Failing at Login

After discovering the correct startup procedure, a final test run was executed. The result was the screenshot provided by the user: **all 29 tests failed.**

### Primary Hypothesis

**All tests are failing within the `login()` helper function in `tests/e2e/helpers.ts`. An unexpected modal dialog is appearing immediately after login, blocking the UI and causing all subsequent test steps to time out.**

### Supporting Evidence

1. **The `helpers.ts` file contains complex logic** to handle three potential blocking elements after a user logs in:
    - A mandatory "Change Password" dialog.
    - A "Welcome!" toast notification.
    - A "Startup Wizard" for teacher/moderator roles.
2. The `error-context.md` from the failed `should login as teacher successfully` test shows the page is stuck on the "Sign In" page, which is consistent with a timeout during the login process.
3. The fact that *every single test* fails (including `logout`, `class-booking`, etc.) strongly implies the failure occurs in a common setup step, and the `login()` helper is the entry point for nearly all tests.
4. A previous fix attempt (changing the login button selector from "Login" to "Sign In") was correct but insufficient, as the failure happens *after* the button is successfully clicked.

---

## 5. Recommended Next Steps for the New Agent

**DO NOT** investigate the PowerShell orchestration scripts (`.ps1` files). They are a red herring. The problem is in the test environment and helper logic.

1. **Follow the Correct Startup Procedure**:
    - First, run `npx convex dev` in a background terminal.
    - Second, run the tests. **Use the UI mode for visual debugging**: `npm run test:e2e:ui`.

2. **Focus Exclusively on `login()` in `tests/e2e/helpers.ts`**:
    - Run a single test from the UI (e.g., `should login as teacher successfully`).
    - **Visually observe** what appears on the screen immediately after the "Sign In" button is clicked. It is almost certainly one of the modals mentioned above.

3. **Debug the Modal Handling Logic**:
    - The logic for handling the password change dialog, welcome toast, and startup wizard in `helpers.ts` is flawed. It is not correctly detecting or dismissing the modal that is appearing.
    - Use the Playwright Inspector in the UI-mode test run to step through the `login` function and identify which `isVisible()` check is failing or which element is not being interacted with correctly.

4. **Implement a Robust Fix**:
    - Adjust the selectors and waiting logic within the `login` helper to reliably detect and dismiss whichever modal is blocking the tests. Add `console.log` statements within the helper to trace its execution path during the test run.

By following this plan, the new agent can avoid repeating failed steps and immediately focus on the true root cause of the test suite's instability.
