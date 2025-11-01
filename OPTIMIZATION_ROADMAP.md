# Optimization Roadmap - Q4 2025 → Q1 2026
## Evan's Class Tracker 4.5 - Actionable Implementation Plan

**Last Updated:** November 1, 2025  
**Based On:** Full System Audit Report (AUDIT_REPORT_2025.md)  
**Timeline:** 3-month focused improvement plan

---

## Quick Links

- [Critical Priority](#critical-priority-none) (None - system is stable)
- [High Priority](#high-priority-next-30-days) (Next 30 days)
- [Medium Priority](#medium-priority-q1-2026) (Q1 2026)
- [Low Priority](#low-priority-nice-to-have) (Nice to have)
- [Implementation Guides](#implementation-guides)

---

## Overview

This roadmap translates audit findings into **actionable, prioritized tasks** with clear implementation steps, time estimates, and success criteria. The system is already **excellent (Grade A-)**, so all improvements are incremental optimizations rather than critical fixes.

### Time Investment Summary

| Priority Level | Total Hours | Timeline | ROI |
|---------------|-------------|----------|-----|
| **High** | 25-37 hours | Next 30 days | Legal compliance + 30% performance gain |
| **Medium** | 32-46 hours | Q1 2026 | Improved UX + development velocity |
| **Low** | 28-40 hours | Future | Nice-to-have enhancements |
| **TOTAL** | 85-123 hours | 3 months | Measurable improvements across all metrics |

---

## Critical Priority (None)

✅ **System is stable and production-ready for intended use case**

No critical issues identified. All recommendations are optimizations.

---

## High Priority (Next 30 Days)

### 1. Accessibility Audit & WCAG 2.1 Compliance 🎯

**Priority:** HIGH  
**Estimated Time:** 16-24 hours  
**Impact:** Legal compliance + inclusive design  
**Assigned To:** Frontend developer with accessibility expertise

#### Why This Matters
- **Legal Requirement:** WCAG 2.1 Level AA increasingly mandatory for educational platforms
- **Ethical Imperative:** 15-20% of users may have accessibility needs
- **SEO Benefit:** Accessibility improvements boost search rankings
- **Current Gap:** No verification of compliance

#### Implementation Steps

##### Step 1.1: Install Accessibility Tooling (1 hour)

```bash
# Install ESLint accessibility plugin
npm install -D eslint-plugin-jsx-a11y

# Install accessibility testing library
npm install -D @axe-core/playwright
```

**Configure ESLint** (`eslint.config.mjs`):
```javascript
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default [
  {
    plugins: {
      'jsx-a11y': jsxA11y
    },
    rules: {
      // Errors (must fix)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-access-key': 'error',
      
      // Warnings (should fix)
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    }
  }
];
```

**Run linter and fix errors:**
```bash
npm run lint
# Expect 50-100 warnings/errors initially
```

##### Step 1.2: Add ARIA Labels to Interactive Elements (6-8 hours)

**Priority Components** (fix these first):
1. `components/class-booking.tsx` (3,115 lines - most complex)
2. `components/user-management.tsx` (470 lines)
3. `components/student-management.tsx` (1,286 lines)
4. All modal dialogs (20+ components)

**Pattern to Follow:**
```typescript
// BEFORE: Missing ARIA label
<button onClick={handleDelete} className="text-red-500">
  <Trash2 className="h-4 w-4" />
</button>

// AFTER: Descriptive ARIA label
<button 
  onClick={handleDelete}
  className="text-red-500"
  aria-label={lang === "en" ? "Delete class" : "ลบคลาส"}
>
  <Trash2 className="h-4 w-4" />
</button>

// For icon-only buttons with tooltips
<button
  onClick={handleEdit}
  aria-label={lang === "en" ? "Edit class details" : "แก้ไขรายละเอียดคลาส"}
  title={lang === "en" ? "Edit" : "แก้ไข"}
>
  <Edit className="h-4 w-4" />
</button>
```

**Checklist**:
- [ ] All icon-only buttons have `aria-label`
- [ ] All form inputs have associated `<label>` or `aria-label`
- [ ] All modals have `aria-labelledby` and `aria-describedby`
- [ ] All custom dropdowns have ARIA combobox pattern
- [ ] All tabs have `role="tab"` and `aria-selected`

##### Step 1.3: Implement Keyboard Navigation (4-6 hours)

**Focus Management for Modals:**
```typescript
// components/modal-wrapper.tsx (NEW COMPONENT)
"use client";
import { useEffect, useRef } from "react";

export function ModalWrapper({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus();
      }
    } else {
      // Restore focus when closing
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Trap focus within modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      
      if (!focusable || focusable.length === 0) return;
      
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50"
    >
      {children}
    </div>
  );
}
```

**Apply to All Modals:**
- [ ] Wrap all modals with `ModalWrapper`
- [ ] Test keyboard navigation (Tab, Shift+Tab, Escape)
- [ ] Verify focus returns to trigger element on close

**Skip-to-Content Link:**
```typescript
// app/layout.tsx (add after <body>)
<a 
  href="#main-content" 
  className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white"
>
  {lang === "en" ? "Skip to main content" : "ข้ามไปยังเนื้อหาหลัก"}
</a>
```

##### Step 1.4: Color Contrast Verification (2-3 hours)

**Use Automated Tools:**
1. Chrome DevTools Lighthouse (Accessibility audit)
2. axe DevTools browser extension
3. Online checker: https://webaim.org/resources/contrastchecker/

**Common Issues to Fix:**
- Light gray text on white background (must be 4.5:1 minimum)
- Link colors that don't meet contrast ratios
- Disabled button states (3:1 minimum for non-text)

**Tailwind Classes for WCAG-Compliant Colors:**
```css
/* BEFORE: Low contrast */
.text-gray-400 /* 2.8:1 ratio - FAILS */

/* AFTER: High contrast */
.text-gray-700 /* 5.2:1 ratio - PASSES */

/* For links */
.text-blue-600 /* 4.5:1 on white - PASSES */
```

##### Step 1.5: Screen Reader Testing (3-4 hours)

**Testing Plan:**

**Windows (NVDA - Free):**
1. Download NVDA: https://www.nvaccess.org/download/
2. Test critical workflows:
   - Login process
   - Book a class (full workflow)
   - View analytics dashboard
   - Send a message
3. Verify:
   - All form labels read correctly
   - Button purposes clear
   - Error messages announced
   - Navigation landmarks work

**Mac (VoiceOver - Built-in):**
1. Enable VoiceOver: Cmd+F5
2. Repeat critical workflows
3. Test with Safari (best VoiceOver support)

**Test Checklist:**
- [ ] All interactive elements have accessible names
- [ ] Form errors are announced
- [ ] Loading states communicated
- [ ] Modal dialogs announced and escapable
- [ ] Page title changes announced on navigation

##### Step 1.6: Generate Accessibility Report (1 hour)

**Run Lighthouse Audit:**
```bash
# Install Lighthouse CLI
npm install -D lighthouse

# Generate report
npx lighthouse http://localhost:3001 --only-categories=accessibility --output=html --output-path=./accessibility-report.html
```

**Target Score:** 95+ (currently unknown)

**Document in**:
```markdown
# ACCESSIBILITY_REPORT.md
## Lighthouse Accessibility Score: [SCORE]/100

### Issues Fixed:
- [x] Added ARIA labels to 150+ interactive elements
- [x] Implemented keyboard navigation for all modals
- [x] Fixed 25 color contrast issues
- [x] Added skip-to-content link
- [x] Tested with NVDA and VoiceOver

### Remaining Issues:
- [ ] [Issue description if any]

### Next Review: February 2026
```

#### Success Criteria
- ✅ Lighthouse Accessibility score ≥95
- ✅ Zero critical ESLint accessibility errors
- ✅ All modals keyboard-navigable
- ✅ Screen reader testing passes for core workflows
- ✅ Color contrast ≥4.5:1 for all text
- ✅ Documentation created (ACCESSIBILITY_REPORT.md)

#### Time Breakdown
| Task | Hours |
|------|-------|
| 1.1 Install tooling | 1 |
| 1.2 Add ARIA labels | 6-8 |
| 1.3 Keyboard navigation | 4-6 |
| 1.4 Color contrast | 2-3 |
| 1.5 Screen reader testing | 3-4 |
| 1.6 Generate report | 1 |
| **TOTAL** | **17-23 hours** |

---

### 2. Bundle Size Analysis & Optimization 🎯

**Priority:** HIGH  
**Estimated Time:** 8-12 hours  
**Impact:** 30-40% faster initial load  
**Assigned To:** Frontend developer

#### Why This Matters
- **User Experience:** Faster load = higher engagement (53% of users abandon after 3s)
- **Mobile Users:** Many users on slower connections
- **SEO:** Page speed is a ranking factor
- **Current Gap:** No bundle size monitoring

#### Implementation Steps

##### Step 2.1: Configure Bundle Analyzer (1 hour)

**Good News:** `@next/bundle-analyzer` already installed! ✅

**Configure** (`next.config.ts`):
```typescript
import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Existing config
  experimental: {
    turbo: {},
  },
};

export default withBundleAnalyzer(nextConfig);
```

**Add Script** (`package.json`):
```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

**PowerShell Version** (for Windows):
```powershell
# Create scripts/analyze.ps1
$env:ANALYZE = "true"
npm run build
```

##### Step 2.2: Run Baseline Analysis (1 hour)

```bash
npm run analyze
# Opens browser with bundle visualization
```

**Document Baseline:**
```markdown
# BUNDLE_ANALYSIS_BASELINE.md
## Baseline Measurement (Nov 2025)

### Client Bundle
- **Total:** [SIZE] KB (compressed)
- **First Load JS:** [SIZE] KB
- **Page-specific JS:** [SIZE] KB

### Largest Components
1. class-booking.tsx: [SIZE] KB
2. student-management.tsx: [SIZE] KB
3. weekly-calendar.tsx: [SIZE] KB

### Third-Party Dependencies
- react/react-dom: [SIZE] KB
- convex: [SIZE] KB
- lucide-react: [SIZE] KB

### Optimization Targets
- [ ] Reduce client bundle to <300KB
- [ ] Split components >100KB
- [ ] Audit third-party deps
```

##### Step 2.3: Split Large Components (4-6 hours)

**Target:** `components/class-booking.tsx` (3,115 lines, likely >200KB)

**Refactoring Plan:**

**BEFORE (Monolithic):**
```
components/
  class-booking.tsx (3,115 lines)
```

**AFTER (Modular):**
```
components/
  class-booking/
    index.tsx (~300 lines - main orchestrator)
    filter-panel.tsx (~400 lines - filters UI)
    booking-form.tsx (~500 lines - create/edit form)
    class-list-view.tsx (~600 lines - list display)
    class-actions.tsx (~300 lines - bulk actions)
    types.ts (~50 lines - shared types)
    hooks.ts (~200 lines - custom hooks)
    utils.ts (~150 lines - helper functions)
```

**Refactoring Steps:**

1. **Create Directory Structure:**
```bash
mkdir -p components/class-booking
```

2. **Extract Types** (Start with least dependent):
```typescript
// components/class-booking/types.ts
export interface ClassBooking {
  // Move interfaces from main file
}

export type BookingStatus = "pending" | "acknowledged" | "approved" | "rejected";

export interface FilterState {
  // Move filter-related types
}
```

3. **Extract Utilities:**
```typescript
// components/class-booking/utils.ts
export function formatClassDate(date: number, lang: string): string {
  // Move pure functions
}

export function calculateClassDuration(start: number, end: number): number {
  // ...
}
```

4. **Extract Custom Hooks:**
```typescript
// components/class-booking/hooks.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useClassFilters() {
  // Move filter-related hooks
  const [selectedSchool, setSelectedSchool] = useState<Id<"schools"> | null>(null);
  // ...
  return { selectedSchool, setSelectedSchool, /* ... */ };
}

export function useClassActions() {
  // Move action-related hooks
  const bookClass = useMutation(api.classes.book);
  // ...
}
```

5. **Extract Sub-Components:**
```typescript
// components/class-booking/filter-panel.tsx
"use client";
import { FilterState } from "./types";

export function FilterPanel({ 
  filters, 
  onChange 
}: { 
  filters: FilterState; 
  onChange: (filters: FilterState) => void;
}) {
  // Move filter UI
  return <div>...</div>;
}
```

6. **Refactor Main Component:**
```typescript
// components/class-booking/index.tsx
"use client";
import { FilterPanel } from "./filter-panel";
import { BookingForm } from "./booking-form";
import { ClassListView } from "./class-list-view";
import { ClassActions } from "./class-actions";
import { useClassFilters, useClassActions } from "./hooks";

export function ClassBooking() {
  const filters = useClassFilters();
  const actions = useClassActions();

  return (
    <div>
      <FilterPanel filters={filters} onChange={...} />
      <ClassListView classes={...} />
      <BookingForm onSubmit={actions.bookClass} />
      <ClassActions />
    </div>
  );
}
```

7. **Update Imports in app/page.tsx:**
```typescript
// BEFORE
const ClassBooking = lazy(() => import("@/components/class-booking").then(m => ({ default: m.ClassBooking })));

// AFTER (no change needed - same import path works!)
const ClassBooking = lazy(() => import("@/components/class-booking").then(m => ({ default: m.ClassBooking })));
```

**Testing After Refactor:**
```bash
# 1. Type check
npx tsc --noEmit

# 2. Build
npm run build

# 3. Run E2E tests
npm run test:e2e

# 4. Verify functionality manually
npm run dev
```

##### Step 2.4: Identify Server Component Candidates (1-2 hours)

**Analyze Components for Server Conversion:**

**Good Candidates (Static/Read-Only Initial Render):**
1. `database-init.tsx` - Only shown on first run
2. `fish-school-background.tsx` - Pure SVG rendering
3. `rolling-vitruvian-men.tsx` - Loading animation
4. Headers/footers/static layouts

**Poor Candidates (Require Client Interactivity):**
- Anything with `useState`, `useEffect`, or event handlers
- Forms, modals, interactive charts

**Example Conversion:**
```typescript
// BEFORE: components/database-init.tsx
"use client";
import { useQuery } from "convex/react";

export function DatabaseInit() {
  const users = useQuery(api.users.list);
  // ...
}

// AFTER: Split into Server + Client
// components/database-init-server.tsx (Server Component)
import { api } from "@/convex/_generated/api";

export async function DatabaseInitServer() {
  const users = await api.users.list(); // Server fetch
  
  if (users && users.length > 0) {
    return null; // Already initialized
  }
  
  return <DatabaseInitClient />;
}

// components/database-init-client.tsx (Client Component)
"use client";
export function DatabaseInitClient() {
  // Interactive initialization UI
}
```

**Note:** Server Components require server-side data fetching setup. If complexity is high, defer to Medium Priority.

##### Step 2.5: Re-Run Analysis & Compare (1 hour)

```bash
npm run analyze
```

**Document Improvements:**
```markdown
# BUNDLE_ANALYSIS_RESULTS.md

## Before Optimization
- Client Bundle: 450KB
- Largest Component: class-booking.tsx (220KB)

## After Optimization
- Client Bundle: 320KB (-29%)
- Largest Component: class-list-view.tsx (85KB)

## Techniques Applied
- [x] Split class-booking.tsx into 8 modules
- [x] Converted 3 components to Server Components
- [ ] Tree-shaken unused dependencies

## Next Steps
- Audit third-party dependencies quarterly
- Monitor bundle size in CI/CD (block PRs >350KB)
```

#### Success Criteria
- ✅ Client bundle <300KB (compressed)
- ✅ No single component >100KB
- ✅ Baseline documented with before/after comparison
- ✅ E2E tests pass after refactoring
- ✅ Build time improved or maintained

#### Time Breakdown
| Task | Hours |
|------|-------|
| 2.1 Configure analyzer | 1 |
| 2.2 Run baseline | 1 |
| 2.3 Split large components | 4-6 |
| 2.4 Server Components | 1-2 |
| 2.5 Re-run & document | 1 |
| **TOTAL** | **8-11 hours** |

---

### 3. Fix npm Vulnerability 🎯

**Priority:** HIGH  
**Estimated Time:** 1 hour  
**Impact:** Security compliance  
**Assigned To:** Any developer

#### Why This Matters
- **Security Best Practice:** Even moderate vulnerabilities should be addressed
- **Dependency Hygiene:** Keep packages up-to-date
- **Audit Clean:** Prepare for potential security scans

#### Implementation Steps

##### Step 3.1: Fix Vulnerability (30 minutes)

```bash
# View vulnerability details
npm audit

# Attempt automatic fix
npm audit fix

# If automatic fix fails, check if safe to force
npm audit fix --force

# Verify no breaking changes
npm run build
npm run test:e2e
```

##### Step 3.2: Document Resolution (15 minutes)

```markdown
# SECURITY_AUDIT_LOG.md

## November 2025 - npm Vulnerability Fix

### Vulnerability Details
- **Package:** tar
- **Severity:** Moderate
- **Issue:** Race condition leading to uninitialized memory exposure
- **CVE:** GHSA-29xp-372q-xqph

### Resolution
- **Action:** `npm audit fix`
- **Result:** Updated tar from 7.5.1 to 7.5.2
- **Testing:** Build and E2E tests passed ✅

### Next Audit: February 2026
```

##### Step 3.3: Add npm Audit to CI/CD (15 minutes)

**Create:** `.github/workflows/security-audit.yml`
```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch: # Manual trigger

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
        continue-on-error: true
      - name: Notify on failures
        if: failure()
        run: echo "::warning::Security vulnerabilities detected. Run 'npm audit' locally."
```

#### Success Criteria
- ✅ `npm audit` shows 0 vulnerabilities
- ✅ Build passes
- ✅ E2E tests pass
- ✅ CI/CD workflow added
- ✅ Documentation updated

#### Time Breakdown
| Task | Hours |
|------|-------|
| Fix vulnerability | 0.5 |
| Document resolution | 0.25 |
| Add CI/CD check | 0.25 |
| **TOTAL** | **1 hour** |

---

## Medium Priority (Q1 2026)

### 4. Feature Discoverability Enhancements

**Estimated Time:** 12-16 hours  
**Impact:** Reduced onboarding time, higher feature adoption

#### Implementation Steps

1. **Create Student Creation Wizard** (4-5 hours)
   - Follow pattern from `booking-wizard.tsx`
   - Steps: School → Grade → Student Details → Confirmation
   - Bilingual throughout

2. **Create User Management Wizard** (4-5 hours)
   - Steps: Role Selection → School Assignment → Permissions → Review
   - Admin-only access

3. **Implement First-Time User Tour** (3-4 hours)
   - Use library: `react-joyride` or `driver.js`
   - 5-step tour highlighting key features
   - Dismissible, never shown again

4. **Add Contextual Tooltips** (1-2 hours)
   - Use Tailwind's tooltip pattern
   - Add to complex features (e.g., "What's ClassCount?")

**Success Criteria:**
- ✅ User onboarding time <5 minutes (down from <10 min)
- ✅ Feature discovery rate >80% in first week
- ✅ Wizards match UX quality of existing wizards

---

### 5. Enhanced Error Messaging

**Estimated Time:** 4-6 hours  
**Impact:** Reduced support requests, better debugging

#### Implementation Steps

1. **Create Error Code System** (1 hour)
```typescript
// lib/errors.ts
export const ErrorCodes = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: "AUTH001",
  AUTH_ACCOUNT_LOCKED: "AUTH002",
  AUTH_SESSION_EXPIRED: "AUTH003",
  
  // Class Booking
  BOOKING_CONFLICT: "BOOK001",
  BOOKING_UNAUTHORIZED: "BOOK002",
  BOOKING_INVALID_DATE: "BOOK003",
  
  // ... 20-30 error codes
} as const;

export function getErrorMessage(code: string, lang: string): string {
  // Return bilingual error message
}
```

2. **Audit All Catch Blocks** (2-3 hours)
```bash
# Find all catch blocks
grep -rn "catch (error)" components/ convex/
# ~150-200 instances expected
```

3. **Replace Generic Messages** (1-2 hours)
```typescript
// BEFORE
catch (error) {
  toast({ type: "error", message: "An error occurred" });
}

// AFTER
catch (error) {
  const code = ErrorCodes.BOOKING_CONFLICT;
  const message = getErrorMessage(code, lang);
  toast({ 
    type: "error", 
    message,
    details: error.message, // Show technical details in console
  });
  console.error(`[${code}]`, error);
}
```

**Success Criteria:**
- ✅ All user-facing errors have descriptive bilingual messages
- ✅ Error codes trackable in logs
- ✅ Support tickets reference error codes

---

### 6. Unit Test Coverage

**Estimated Time:** 16-24 hours  
**Impact:** Faster development, fewer regressions

#### Implementation Steps

1. **Set Up Vitest** (2 hours)
2. **Write Tests for Critical Functions** (12-18 hours)
   - Priority: Convex functions (classes.ts, users.ts, analytics.ts)
   - Target: 60% coverage
3. **Add to CI/CD** (1 hour)
4. **Document Testing Guidelines** (1 hour)

**Success Criteria:**
- ✅ 60%+ backend test coverage
- ✅ Tests run in CI/CD
- ✅ Testing documentation created

---

## Low Priority (Nice to Have)

### 7. Storybook Component Library

**Estimated Time:** 8-12 hours  
**Benefit:** Visual component documentation, faster design reviews

### 8. Progressive Security Hardening

**Estimated Time:** 12-16 hours  
**Benefit:** Production-ready security (only if deploying publicly)

### 9. Mobile UX Enhancements

**Estimated Time:** 12-16 hours  
**Benefit:** Better mobile experience (bottom sheets, haptics)

---

## Implementation Sequence

### Week 1-2 (High Priority)
```
Day 1-3: Accessibility Audit & Fixes
Day 4-5: Bundle Size Analysis & Component Splitting
Day 6: npm Vulnerability Fix
Day 7: Testing & Documentation
```

### Week 3-4 (Buffer & Iteration)
```
Day 8-10: Address any accessibility issues found during testing
Day 11-12: Optimize additional components identified in bundle analysis
Day 13-14: Code review, documentation updates, celebrate wins! 🎉
```

### Month 2-3 (Medium Priority)
```
Week 5-6: Feature Discoverability (Wizards)
Week 7: Enhanced Error Messaging
Week 8-10: Unit Test Coverage
Week 11-12: Testing & Documentation
```

---

## Success Metrics & Monitoring

### Key Performance Indicators (KPIs)

| Metric | Baseline | 30-Day Target | 90-Day Target | How to Measure |
|--------|----------|---------------|---------------|----------------|
| Lighthouse Accessibility | Unknown | 95+ | 98+ | Chrome DevTools |
| Client Bundle Size | Unknown | <300KB | <250KB | `npm run analyze` |
| User Onboarding Time | <10min | <7min | <5min | User surveys |
| Feature Discovery Rate | Unknown | 70% | 80% | Analytics |
| Test Coverage (Backend) | 0% | 40% | 60% | Vitest |
| npm Vulnerabilities | 1 moderate | 0 | 0 | `npm audit` |

### Monthly Review Process

**First Friday of Each Month:**
1. Run bundle analyzer
2. Run Lighthouse audit
3. Check npm audit
4. Review test coverage report
5. Gather user feedback
6. Update roadmap based on findings

---

## Risk Mitigation

### Potential Blockers & Solutions

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes from refactoring | Medium | High | Comprehensive E2E tests before merge |
| Time overruns | Medium | Low | Buffer weeks built into plan |
| Accessibility testing complexity | Low | Medium | Use automated tools first, manual testing last |
| Bundle analysis reveals unexpected issues | Low | Medium | Start with baseline measurement, iterate |

---

## Resources & References

### Tools Required
- ✅ ESLint with jsx-a11y plugin
- ✅ @next/bundle-analyzer (already installed)
- ❌ axe DevTools (browser extension)
- ❌ NVDA screen reader (Windows)
- ❌ Vitest (for unit testing)
- ❌ react-joyride (for user tours)

### External Documentation
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Next.js Bundle Analyzer: https://www.npmjs.com/package/@next/bundle-analyzer
- Vitest Setup: https://vitest.dev/guide/
- ESLint jsx-a11y: https://github.com/jsx-eslint/eslint-plugin-jsx-a11y

---

## Conclusion

This roadmap provides a **clear, actionable path** to optimize Evan's Class Tracker 4.5. The system is already excellent; these improvements will make it **exceptional**.

**Next Steps:**
1. Review roadmap with team
2. Assign tasks to developers
3. Set up weekly progress check-ins
4. Begin with Week 1 (Accessibility Audit)

**Questions?** See AUDIT_REPORT_2025.md for detailed rationale behind each recommendation.

---

**Roadmap Prepared By:** AI Code Auditor  
**Review Schedule:** Monthly (first Friday)  
**Next Update:** December 1, 2025
