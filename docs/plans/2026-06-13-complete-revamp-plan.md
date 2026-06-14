# Complete Revamp Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Execute the complete mechanical revamp per design doc: schema rationalization, component primitives, typed hooks, mobile PWA, private student integration, i18n overhaul.

**Architecture:** Convex backend, Next.js 15 App Router, React 19, TanStack Query, Tailwind v4, TypeScript.

**Tech Stack:** Vitest (unit), Playwright (E2E), Convex test helpers, Workbox (PWA).

---

## Phase 0: Foundation (Week 1)

### Task 0.1: Project Setup & Tooling

**Files:**

- Create: `vitest.config.ts` (update for new structure)
- Create: `tests/convex/helpers.ts`
- Create: `tests/convex/factories.ts`
- Modify: `package.json` (add `@tanstack/react-query`, `@tanstack/react-query-devtools`, `workbox-cli`)

**Step 1: Write failing test**

```bash
# Test that test infrastructure works
npm test -- tests/convex/helpers.test.ts
```

**Step 2: Run test — confirm it fails**
Expected: Module not found / no tests

**Step 3: Write minimal implementation**

```typescript
// tests/convex/helpers.ts
import { ConvexTest } from "convex-test";
import schema from "../../convex/schema";

export function createTestCtx() {
  return new ConvexTest(schema);
}

export function seedTestData(ctx: ConvexTest) {
  // Create test users, schools, providers, students
  const adminId = ctx.db.insert("users", {
    username: "testadmin",
    passwordHash: "hash",
    role: "admin",
    requirePasswordChange: false,
    createdAt: Date.now(),
    preferredLanguage: "en",
  });
  const schoolId = ctx.db.insert("schools", {
    name: "Test School",
    nameTh: "โรงเรียนทดสอบ",
    moderatorId: adminId,
    createdAt: Date.now(),
  });
  const providerId = ctx.db.insert("providers", {
    name: "Personal",
    nameTh: "ส่วนตัว",
    category: "personal",
    createdBy: adminId,
    schoolId: null,
    isActive: true,
    createdAt: Date.now(),
  });
  return { adminId, schoolId, providerId };
}
```

```typescript
// tests/convex/helpers.test.ts
import { createTestCtx, seedTestData } from "./helpers";

describe("Convex test helpers", () => {
  it("creates test context and seeds data", () => {
    const ctx = createTestCtx();
    const data = seedTestData(ctx);
    expect(data.adminId).toBeDefined();
    expect(data.schoolId).toBeDefined();
    expect(data.providerId).toBeDefined();
  });
});
```

**Step 4: Run test — confirm it passes**
Command: `npm test -- tests/convex/helpers.test.ts`
Expected: PASS

**Step 5: Commit**
`git add tests/convex/ && git commit -m "test: add Convex test helpers and factories"`

---

### Task 0.2: TanStack Query Provider Setup

**Files:**

- Create: `lib/query-provider.tsx`
- Create: `lib/query-client.ts`
- Modify: `app/providers.tsx` (wrap with QueryClientProvider)

**Step 1: Write failing test**

```bash
npm test -- tests/unit/hooks/query-client.test.ts
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
```

```typescript
// lib/query-provider.tsx
"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./query-client";

const QueryClientContext = createContext<QueryClient | null>(null);

export function useQueryClient() {
  const client = useContext(QueryClientContext);
  if (!client) throw new Error("QueryClientProvider missing");
  return client;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <QueryClientContext.Provider value={client}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </QueryClientContext.Provider>
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add lib/query-provider.tsx lib/query-client.ts app/providers.tsx && git commit -m "feat: add TanStack Query provider"`

---

## Phase 1: Schema v2 & Migration (Week 1-2)

### Task 1.1: Define Schema v2 Tables

**Files:**

- Create: `convex/schemaV2.ts`
- Modify: `convex/schema.ts` (import and merge)

**Step 1: Write failing test**

```bash
npm test -- tests/convex/schemaV2.test.ts
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// convex/schemaV2.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const i18n = v.object({ en: v.string(), th: v.string() });
const optionalI18n = v.optional(i18n);

export const schemaV2 = defineSchema({
  // ... (paste full schema from design doc)
});

// convex/schema.ts
import { schemaV2 } from "./schemaV2";
export default schemaV2;
```

**Step 4: Run test — confirm it passes** (schema validates)

**Step 5: Commit**
`git add convex/schemaV2.ts convex/schema.ts && git commit -m "feat: schema v2 with i18n objects and unified providers"`

---

### Task 1.2: Migration Actions

**Files:**

- Create: `convex/migrateToV2.ts`
- Create: `convex/migrateToV2.test.ts`

**Step 1: Write failing test**

```bash
npm test -- tests/convex/migrateToV2.test.ts
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// convex/migrateToV2.ts
import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const migrateStudents = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, { batchSize = 100 }) => {
    // Transform old students → new format with providerId
    // For school students: find/create provider for their school
    // For guardian-linked: create personal provider for teacher
  },
});

export const migrateClasses = internalAction({ ... });
export const migrateProviders = internalAction({ ... });
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add convex/migrateToV2.ts && git commit -m "feat: add schema v2 migration actions"`

---

### Task 1.3: Dual-Write Mutations

**Files:**

- Modify: `convex/classes/crud_mutations.ts`
- Modify: `convex/students.ts`
- Create: `convex/dualWrite.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// convex/dualWrite.ts
export async function dualWriteStudent(ctx, oldArgs, newArgs) {
  // Write to both old and new tables during transition
  await ctx.db.insert("students", oldArgs);
  await ctx.db.insert("studentsV2", newArgs);
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add convex/dualWrite.ts convex/classes/crud_mutations.ts convex/students.ts && git commit -m "feat: dual-write mutations for schema migration"`

---

## Phase 2: Typed Hooks & Query Layer (Week 2)

### Task 2.1: Generated Convex Hooks

**Files:**

- Create: `lib/convex/hooks.ts` (auto-generated via script)
- Create: `scripts/generate-hooks.ts`

**Step 1: Write failing test**

```bash
npm test -- tests/unit/hooks/useStudents.test.ts
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// lib/convex/hooks.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

export function useStudents(filters?: { providerId?: Id<"providers">; schoolId?: Id<"schools">; grade?: string; includeDeleted?: boolean }) {
  return useQuery(api.students.list, filters);
}

export function useCreateStudent() {
  return useMutation(api.students.create);
}

// ... all hooks from design doc
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add lib/convex/hooks.ts scripts/generate-hooks.ts && git commit -m "feat: typed Convex hooks with TanStack Query integration"`

---

### Task 2.2: Optimistic Mutation Hooks

**Files:**

- Create: `lib/hooks/useOptimisticMutation.ts`
- Create: `tests/unit/hooks/useOptimisticMutation.test.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// lib/hooks/useOptimisticMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useOptimisticMutation(mutationFn, options) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars) => {
      await options.onMutate?.(vars, queryClient);
    },
    onError: (err, vars, context) => {
      options.onError?.(err, vars, context, queryClient);
    },
    onSuccess: (data, vars, context) => {
      options.onSuccess?.(data, vars, context, queryClient);
    },
  });
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add lib/hooks/useOptimisticMutation.ts && git commit -m "feat: optimistic mutation hook wrapper"`

---

## Phase 3: Component Primitives (Week 2-3)

### Task 3.1: UI Primitive Library

**Files (create all):**

- `components/ui/Button.tsx`
- `components/ui/Input.tsx`
- `components/ui/Select.tsx`
- `components/ui/DatePicker.tsx`
- `components/ui/Modal.tsx`
- `components/ui/Table.tsx`
- `components/ui/Chip.tsx`
- `components/ui/Tabs.tsx`
- `components/ui/Toast.tsx`
- `components/ui/Avatar.tsx`
- `components/ui/Badge.tsx`
- `components/ui/Card.tsx`
- `components/ui/EmptyState.tsx`
- `components/ui/LoadingSkeleton.tsx`
- `components/ui/index.ts`

**Step 1: Write failing test per component**

```bash
npm test -- tests/unit/ui/Button.test.tsx
```

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation** (per component, e.g., Button)

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "primary", size = "md", loading, children, disabled, className, ...props }, ref) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };
  return (
    <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className || ""}`} disabled={disabled || loading} {...props}>
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit per component**
`git add components/ui/Button.tsx && git commit -m "feat(ui): Button primitive"`

---

### Task 3.2: I18n Input Components

**Files:**

- Create: `components/ui/I18nInput.tsx`
- Create: `components/ui/I18nTextarea.tsx`
- Create: `components/ui/I18nSelect.tsx`
- Create: `lib/hooks/useI18n.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// lib/hooks/useI18n.ts
export function useI18n(value: { en: string; th: string }, language: "en" | "th") {
  return language === "th" ? value.th : value.en;
}

export function useSetI18n(setValue: (val: { en: string; th: string }) => void, language: "en" | "th") {
  return (text: string) => setValue((prev) => ({ ...prev, [language]: text }));
}
```

```tsx
// components/ui/I18nInput.tsx
export function I18nInput({ label, value, onChange, language, ...props }) {
  const [localValue, setLocalValue] = useState(value?.[language] || "");
  const setI18n = useSetI18n(onChange, language);

  useEffect(() => setLocalValue(value?.[language] || ""), [value, language]);

  return (
    <div className="space-y-1">
      <Label>{label[language]}</Label>
      <Input value={localValue} onChange={(e) => setI18n(e.target.value)} {...props} />
    </div>
  );
}
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add components/ui/I18n*.tsx lib/hooks/useI18n.ts && git commit -m "feat(ui): bilingual input primitives"`

---

## Phase 4: Layout & Navigation (Week 3)

### Task 4.1: Dashboard Layout (Desktop)

**Files:**

- Create: `app/(dashboard)/layout.tsx`
- Create: `components/layout/Sidebar.tsx`
- Create: `components/layout/Header.tsx`
- Create: `components/layout/MobileBottomNav.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/layout.tsx components/layout/ && git commit -m "feat: dashboard layout with sidebar and header"`

---

### Task 4.2: Mobile Layout (`/mobile`)

**Files:**

- Create: `app/(dashboard)/mobile/layout.tsx`
- Create: `components/mobile/MobileLayout.tsx`
- Create: `components/mobile/MobileBottomNav.tsx`
- Create: `components/mobile/OfflineIndicator.tsx`
- Create: `public/manifest.json`
- Create: `public/sw.js` (Workbox)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/mobile/ components/mobile/ public/manifest.json public/sw.js && git commit -m "feat: mobile PWA layout with offline support"`

---

## Phase 5: Teacher Desktop Pages (Week 3-4)

### Task 5.1: Teacher Home (`/teacher`)

**Files:**

- Create: `app/(dashboard)/teacher/page.tsx`
- Create: `components/teacher/TeacherHome.tsx`
- Create: `components/teacher/UpcomingClasses.tsx`
- Create: `components/teacher/QuickActions.tsx`
- Create: `components/teacher/StatsCards.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/teacher/page.tsx components/teacher/ && git commit -m "feat: teacher home page"`

---

### Task 5.2: Teacher Classes (`/teacher/classes`)

**Files:**

- Create: `app/(dashboard)/teacher/classes/page.tsx`
- Create: `components/teacher/class-booking/ClassList.tsx`
- Create: `components/teacher/class-booking/ClassFilters.tsx`
- Create: `components/teacher/class-booking/ClassCard.tsx`
- Create: `components/teacher/class-booking/BookingForm.tsx`
- Create: `components/teacher/class-booking/BookingWizard.tsx` (simplified)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/teacher/classes/ components/teacher/class-booking/ && git commit -m "feat: teacher classes page with booking"`

---

### Task 5.3: Teacher Students (`/teacher/students`)

**Files:**

- Create: `app/(dashboard)/teacher/students/page.tsx`
- Create: `components/teacher/students/StudentTabs.tsx` (School | Private)
- Create: `components/teacher/students/StudentList.tsx`
- Create: `components/teacher/students/StudentForm.tsx`
- Create: `components/teacher/students/StudentDetail.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/teacher/students/ components/teacher/students/ && git commit -m "feat: teacher students management with private tab"`

---

### Task 5.4: Teacher Analytics (`/teacher/analytics`)

**Files:**

- Create: `app/(dashboard)/teacher/analytics/page.tsx`
- Create: `components/teacher/analytics/AnalyticsDashboard.tsx`
- Create: `components/teacher/analytics/AttendanceChart.tsx`
- Create: `components/teacher/analytics/ClassCountChart.tsx`
- Create: `components/teacher/analytics/ExportButton.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/teacher/analytics/ components/teacher/analytics/ && git commit -m "feat: teacher analytics dashboard"`

---

## Phase 6: Moderator Pages (Week 4)

### Task 6.1: Moderator Home & Approvals

**Files:**

- Create: `app/(dashboard)/moderator/page.tsx`
- Create: `app/(dashboard)/moderator/approvals/page.tsx`
- Create: `components/moderator/ApprovalQueue.tsx`
- Create: `components/moderator/ApprovalCard.tsx`
- Create: `components/moderator/BulkActions.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/moderator/ components/moderator/ && git commit -m "feat: moderator approvals queue"`

---

### Task 6.2: Moderator Schools & Analytics

**Files:**

- Create: `app/(dashboard)/moderator/schools/page.tsx`
- Create: `app/(dashboard)/moderator/analytics/page.tsx`
- Create: `components/moderator/SchoolManagement.tsx`
- Create: `components/moderator/AnalyticsView.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/moderator/schools/ app/(dashboard)/moderator/analytics/ && git commit -m "feat: moderator schools and analytics"`

---

## Phase 7: Admin Pages (Week 4-5)

### Task 7.1: Admin Users & Schools

**Files:**

- Create: `app/(dashboard)/admin/users/page.tsx`
- Create: `app/(dashboard)/admin/schools/page.tsx`
- Create: `components/admin/UserManagement.tsx`
- Create: `components/admin/SchoolManagement.tsx`
- Create: `components/admin/ProviderManagement.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/admin/ components/admin/ && git commit -m "feat: admin user, school, provider management"`

---

### Task 7.2: Admin Analytics & Settings

**Files:**

- Create: `app/(dashboard)/admin/analytics/page.tsx`
- Create: `app/(dashboard)/admin/settings/page.tsx`
- Create: `components/admin/SystemAnalytics.tsx`
- Create: `components/admin/SettingsForm.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/admin/analytics/ app/(dashboard)/admin/settings/ && git commit -m "feat: admin analytics and settings"`

---

## Phase 8: Mobile PWA Pages (Week 5)

### Task 8.1: Mobile Home (`/mobile`)

**Files:**

- Create: `app/(dashboard)/mobile/page.tsx`
- Create: `components/mobile/MobileHome.tsx`
- Create: `components/mobile/TodayClasses.tsx`
- Create: `components/mobile/QuickLogButton.tsx`
- Create: `components/mobile/StatsCards.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/mobile/page.tsx components/mobile/ && git commit -m "feat: mobile home - today view"`

---

### Task 8.2: Mobile Log Class (`/mobile/log`)

**Files:**

- Create: `app/(dashboard)/mobile/log/page.tsx`
- Create: `components/mobile/MobileLogForm.tsx`
- Create: `components/mobile/MobileStudentPicker.tsx`
- Create: `components/mobile/VoiceNoteButton.tsx`
- Create: `components/mobile/DateTimePicker.tsx` (Thai calendar)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/mobile/log/ components/mobile/MobileLogForm.tsx components/mobile/MobileStudentPicker.tsx components/mobile/VoiceNoteButton.tsx && git commit -m "feat: mobile class logging with voice notes"`

---

### Task 8.3: Mobile History & Events

**Files:**

- Create: `app/(dashboard)/mobile/history/page.tsx`
- Create: `app/(dashboard)/mobile/events/page.tsx`
- Create: `components/mobile/MobileHistoryList.tsx`
- Create: `components/mobile/MobileCalendar.tsx`
- Create: `components/mobile/MobileEventCard.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/mobile/history/ app/(dashboard)/mobile/events/ && git commit -m "feat: mobile history and calendar"`

---

### Task 8.4: Mobile Private Students

**Files:**

- Create: `app/(dashboard)/mobile/students/page.tsx`
- Create: `components/mobile/MobilePrivateStudents.tsx`
- Create: `components/mobile/MobileStudentCard.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add app/(dashboard)/mobile/students/ components/mobile/MobilePrivateStudents.tsx && git commit -m "feat: mobile private students view"`

---

### Task 8.5: PWA Configuration

**Files:**

- Modify: `next.config.ts` (PWA plugin)
- Create: `public/sw.js` (complete)
- Create: `components/mobile/PWAInstallPrompt.tsx`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add next.config.ts public/sw.js components/mobile/PWAInstallPrompt.tsx && git commit -m "feat: PWA install prompt and service worker"`

---

## Phase 9: i18n Migration (Week 5)

### Task 9.1: i18n Data Migration

**Files:**

- Create: `convex/migrateI18n.ts`
- Create: `scripts/run-i18n-migration.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

```typescript
// convex/migrateI18n.ts
export const migrateAllI18nFields = internalAction({
  handler: async (ctx) => {
    // For each table with field + fieldTh pairs:
    // 1. Read all documents
    // 2. Transform to { en: field, th: fieldTh }
    // 3. Write back
  },
});
```

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add convex/migrateI18n.ts scripts/run-i18n-migration.ts && git commit -m "feat: i18n field migration action"`

---

### Task 9.2: Component i18n Adoption

**Files:**

- Modify: All components using bilingual fields
- Use `I18nInput`, `I18nTextarea`, `useI18n` hook

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation** (systematic replacement)

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add components/ && git commit -m "refactor: adopt i18n primitives across all components"`

---

## Phase 10: Private Student Integration (Week 5-6)

### Task 10.1: Personal Provider Creation Flow

**Files:**

- Create: `components/teacher/providers/PersonalProviderSetup.tsx`
- Create: `components/teacher/providers/ProviderSelector.tsx`
- Modify: `convex/providers.ts` (add `createPersonalProvider` mutation)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add components/teacher/providers/ convex/providers.ts && git commit -m "feat: personal provider creation for private students"`

---

### Task 10.2: Unified Student/Class Logic

**Files:**

- Modify: `convex/classes/booking_mutations.ts` (XOR validation)
- Modify: `convex/students.ts` (providerId required)
- Modify: Teacher booking form (provider dropdown)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add convex/classes/booking_mutations.ts convex/students.ts components/teacher/class-booking/ && git commit -m "feat: unified student/provider logic with XOR validation"`

---

## Phase 11: Testing & Polish (Week 6)

### Task 11.1: Unit Test Coverage

**Files:**

- Create missing tests for all hooks, utils, components
- Target: 80% coverage

**Step 1: Run coverage**

```bash
npm run test:coverage
```

**Step 2: Add tests for uncovered lines**

**Step 3: Commit**
`git add tests/ && git commit -m "test: achieve 80% unit coverage"`

---

### Task 11.2: Integration Tests

**Files:**

- Create: `tests/integration/mobile-log-flow.test.ts`
- Create: `tests/integration/private-student-flow.test.ts`
- Create: `tests/integration/approval-workflow.test.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add tests/integration/ && git commit -m "test: critical path integration tests"`

---

### Task 11.3: E2E Tests (Playwright)

**Files:**

- Modify: `tests/e2e/auth.spec.ts`
- Create: `tests/e2e/teacher-class-booking.spec.ts`
- Create: `tests/e2e/moderator-approval.spec.ts`
- Create: `tests/e2e/mobile-pwa.spec.ts`

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add tests/e2e/ && git commit -m "test: E2E tests for critical user flows"`

---

### Task 11.4: Performance Audit

**Files:**

- Run: `npm run build && npm run analyze`
- Verify bundle sizes, FCP, TTI targets

**Step 1: Run build and analyze**

**Step 2: Fix any regressions**

**Step 3: Commit**
`git commit -m "perf: optimize bundle sizes and load times"`

---

### Task 11.5: Accessibility Audit

**Files:**

- Run: `npm run test:a11y` (axe-core)
- Fix violations

**Step 1: Run audit**

**Step 2: Fix violations**

**Step 3: Commit**
`git commit -m "a11y: fix WCAG 2.1 AA violations"`

---

## Phase 12: Deployment Prep (Week 6)

### Task 12.1: Feature Flags & Legacy Routes

**Files:**

- Create: `lib/feature-flags.ts`
- Create: `app/(dashboard)/legacy/...` (old routes)
- Modify: `middleware.ts` (feature flag routing)

**Step 1: Write failing test**

**Step 2: Run test — confirm it fails**

**Step 3: Write minimal implementation**

**Step 4: Run test — confirm it passes**

**Step 5: Commit**
`git add lib/feature-flags.ts middleware.ts app/(dashboard)/legacy/ && git commit -m "feat: feature flags and legacy route preservation"`

---

### Task 12.2: Staging Deploy & UAT

**Files:**

- Configure: Vercel preview deployments
- Document: `UAT_CHECKLIST.md`

**Step 1: Deploy to staging**

**Step 2: Run UAT with Thai teachers**

**Step 3: Fix feedback**

**Step 4: Commit**
`git commit -m "chore: UAT fixes"`

---

### Task 12.3: Production Deploy

**Files:**

- Merge to main
- Tag release
- Monitor

**Step 1: Merge and deploy**

**Step 2: Verify production**

**Step 3: Commit**
`git tag v5.0.0 && git push origin v5.0.0`

---

---

## Execution Order Summary

| Phase                | Tasks         | Est. Days |
| -------------------- | ------------- | --------- |
| 0: Foundation        | 0.1, 0.2      | 2         |
| 1: Schema v2         | 1.1, 1.2, 1.3 | 5         |
| 2: Hooks             | 2.1, 2.2      | 3         |
| 3: UI Primitives     | 3.1, 3.2      | 5         |
| 4: Layout            | 4.1, 4.2      | 3         |
| 5: Teacher Pages     | 5.1-5.4       | 5         |
| 6: Moderator         | 6.1, 6.2      | 3         |
| 7: Admin             | 7.1, 7.2      | 3         |
| 8: Mobile PWA        | 8.1-8.5       | 5         |
| 9: i18n              | 9.1, 9.2      | 2         |
| 10: Private Students | 10.1, 10.2    | 2         |
| 11: Testing          | 11.1-11.5     | 5         |
| 12: Deploy           | 12.1-12.3     | 3         |

**Total: ~44 working days (~9 weeks with buffer)**

---

_Plan saved. Two execution options:_

1. **Subagent-Driven** — I dispatch a fresh sub-agent per task, review between tasks
2. **Manual** — You run the tasks yourself

_Which approach?_
