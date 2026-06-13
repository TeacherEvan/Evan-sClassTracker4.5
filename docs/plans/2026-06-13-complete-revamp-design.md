# Complete Revamp Design Document

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Complete mechanical revamp of Evan's Class Tracker v4.5 — modernize architecture, simplify schema, optimize queries, restructure components, and create a dedicated mobile experience for logging classes and viewing events, while preserving the existing look/feel and login screen.

**Architecture:** Stay on Convex (Option A). Rewrite backend functions with strict TypeScript patterns, typed hooks, and optimistic updates. Migrate to React 19 Server Components where beneficial, extract reusable primitives from monolithic components. Implement a simplified mobile PWA (`/mobile`) for class logging + event viewing only. Integrate private students (non-school-affiliated) as first-class citizens alongside school students.

**Tech Stack:** Next.js 15 (App Router, Turbopack), React 19, Convex 1.31+, Tailwind CSS v4, TypeScript 5.9, Vitest + Playwright for testing, PWA with Workbox.

---

## 1. Schema & Data Layer (Convex)

### 1.1 Schema Rationalization

**Current Pain Points:**
- 50+ deprecated/optional fields across tables (guardianId, guardianTitle, isGuardianLinked, area, acknowledged, etc.)
- Bilingual fields duplicated everywhere (`field` + `fieldTh`)
- Soft delete pattern inconsistent (some tables have `isDeleted`, others don't)
- 90+ indexes, many overlapping or unused
- No proper migration system — schema changes are destructive

**New Schema Principles:**
1. **i18n object pattern** — `{ en: string, th: string }` instead of duplicated fields
2. **Explicit soft delete** — `deletedAt: v.optional(v.number())` on ALL entity tables
3. **Private students as providers** — Provider category `"personal"` = private students, no schoolId needed
4. **Single source of truth** — Remove deprecated columns in same migration
5. **Versioned migrations** — Convex schema migrations with rollback capability

### 1.2 New Table Definitions

```typescript
// convex/schema.ts (simplified view)

users: defineTable({
  username: v.string(),
  passwordHash: v.string(),
  role: v.union(v.literal("teacher"), v.literal("moderator"), v.literal("admin")),
  schoolId: v.optional(v.id("schools")),
  requirePasswordChange: v.boolean(),
  createdAt: v.number(),
  preferredLanguage: v.optional(v.union(v.literal("en"), v.literal("th"))),
  // Login security (keep)
  failedLoginAttempts: v.optional(v.number()),
  accountLockedUntil: v.optional(v.number()),
  lastSuccessfulLogin: v.optional(v.number()),
  loginHistory: v.optional(v.array(v.object({...}))),
  // Wizard prefs → move to localStorage, remove from schema
  deletedAt: v.optional(v.number()),
}))
.index("by_username", ["username"])
.index("by_school", ["schoolId"])
.index("by_role", ["role"])

schools: defineTable({
  name: v.string(),
  nameTh: v.string(),
  moderatorId: v.optional(v.id("users")),
  createdAt: v.number(),
  district: v.optional(v.string()),
  districtTh: v.optional(v.string()),
  province: v.optional(v.string()),
  provinceTh: v.optional(v.string()),
  deletedAt: v.optional(v.number()),
}))
.index("by_moderator", ["moderatorId"])
.index("by_province", ["province"])

providers: defineTable({
  // Unified: schools create providers, teachers create "personal" providers for private students
  name: v.string(),           // English
  nameTh: v.string(),         // Thai
  category: v.union(
    v.literal("personal"),    // Private student (teacher-created)
    v.literal("private"),     // Private tutor center
    v.literal("language_school"),
    v.literal("educational_camp")
  ),
  createdBy: v.id("users"),
  schoolId: v.optional(v.id("schools")), // null for personal
  isActive: v.boolean(),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
}))
.index("by_created_by", ["createdBy"])
.index("by_category", ["category"])
.index("by_school", ["schoolId"])

students: defineTable({
  // Unified student model — works for both school and private
  firstName: v.string(),
  lastName: v.string(),
  studentId: v.string(), // Auto-generated unique ID
  schoolId: v.optional(v.id("schools")), // null for private students
  providerId: v.id("providers"), // REQUIRED — every student belongs to a provider
  grade: v.string(), // K1, K2, K3, P1...
  class: v.optional(v.string()), // /1, /2... (required for school students)
  // Contact info (i18n)
  parentName: v.optional(v.string()),
  parentPhone: v.optional(v.string()),
  parentEmail: v.optional(v.string()),
  secondaryParentName: v.optional(v.string()),
  secondaryParentPhone: v.optional(v.string()),
  // Profile
  nickname: v.optional(v.string()),
  dateOfBirth: v.optional(v.number()),
  allergies: v.optional(v.string()),
  specialNeeds: v.optional(v.string()),
  medicalNotes: v.optional(v.string()),
  notes: v.optional(v.string()),
  // Location (structured, for private students)
  provinceCode: v.optional(v.string()),
  districtName: v.optional(v.string()),
  // Soft delete
  isDeleted: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
  deletedBy: v.optional(v.id("users")),
  deletionReason: v.optional(v.string()),
  createdBy: v.optional(v.id("users")),
  createdAt: v.number(),
}))
.index("by_student_id", ["studentId"])
.index("by_provider", ["providerId"])
.index("by_school", ["schoolId"])
.index("by_grade_and_class", ["grade", "class"])
.index("by_province", ["provinceCode"])
.index("by_district", ["districtName"])

classes: defineTable({
  teacherId: v.id("users"),
  schoolId: v.optional(v.id("schools")), // null if provider-based
  providerId: v.optional(v.id("providers")), // for private/provider classes
  studentId: v.id("students"),
  additionalStudentIds: v.optional(v.array(v.id("students"))),
  locationId: v.optional(v.id("locations")),
  // Class details (i18n objects)
  subject: v.optional(v.object({ en: v.string(), th: v.string() })),
  lessonTopic: v.optional(v.object({ en: v.string(), th: v.string() })),
  materials: v.optional(v.object({ en: v.string(), th: v.string() })),
  preparationNotes: v.optional(v.object({ en: v.string(), th: v.string() })),
  // Scheduling
  scheduledDate: v.number(), // Unix ms
  duration: v.optional(v.number()), // Minutes, default 60
  classType: v.optional(v.union(
    v.literal("regular"),
    v.literal("makeup"),
    v.literal("assessment"),
    v.literal("trial")
  )),
  // Status workflow
  status: v.union(
    v.literal("pending"),
    v.literal("acknowledged"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("completed"), // NEW — for mobile logging
    v.literal("cancelled")
  ),
  // Approval tracking
  approvedByUserId: v.optional(v.id("users")),
  approvedByUsername: v.optional(v.string()),
  approvedAt: v.optional(v.number()),
  approvalSource: v.optional(v.union(
    v.literal("moderator"),
    v.literal("admin"),
    v.literal("auto_provider"), // Provider classes auto-approve
    v.literal("system")
  )),
  // Moderator flags
  flaggedForReview: v.optional(v.boolean()),
  includeInReports: v.optional(v.boolean()),
  reviewNotes: v.optional(v.object({ en: v.string(), th: v.string() })),
  flaggedBy: v.optional(v.id("users")),
  flaggedAt: v.optional(v.number()),
  // Edit audit
  isEdited: v.optional(v.boolean()),
  lastEditedAt: v.optional(v.number()),
  lastEditedBy: v.optional(v.id("users")),
  editHistory: v.optional(v.array(v.object({...}))),
  // Mobile logging fields
  loggedAt: v.optional(v.number()), // When teacher actually taught it
  actualDuration: v.optional(v.number()),
  attendance: v.optional(v.union(
    v.literal("present"),
    v.literal("absent"),
    v.literal("late")
  )),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
}))
.index("by_teacher", ["teacherId"])
.index("by_school", ["schoolId"])
.index("by_provider", ["providerId"])
.index("by_student", ["studentId"])
.index("by_status", ["status"])
.index("by_scheduled_date", ["scheduledDate"])
.index("by_teacher_and_date", ["teacherId", "scheduledDate"])
.index("by_teacher_and_status", ["teacherId", "status"])
.index("by_provider_and_date", ["providerId", "scheduledDate"])
.index("by_completed_date", ["loggedAt"]) // For mobile history

locations: defineTable({
  name: v.string(),
  nameTh: v.string(),
  schoolId: v.optional(v.id("schools")), // null = global/provider location
  providerId: v.optional(v.id("providers")),
  type: v.optional(v.union(v.literal("school"), v.literal("private"))),
  isActive: v.boolean(),
  isPending: v.optional(v.boolean()),
  requestedBy: v.optional(v.id("users")),
  approvedBy: v.optional(v.id("users")),
  createdAt: v.number(),
  deletedAt: v.optional(v.number()),
}))
.index("by_school", ["schoolId"])
.index("by_provider", ["providerId"])
.index("by_active", ["isActive"])

// Simplified: notifications, messages, groups, teacherLogs, postClassNotes, appUpdates
// Keep existing patterns but add deletedAt, use i18n objects
```

### 1.3 Migration Strategy

1. **Phase 1:** Add new tables alongside old (`providers_v2`, `students_v2`, `classes_v2`)
2. **Phase 2:** Write migration functions (Convex actions) to copy/transform data
3. **Phase 3:** Dual-write period (write to both old and new)
4. **Phase 4:** Switch reads to new tables, deprecate old
5. **Phase 5:** Drop old tables

---

## 2. Component Architecture

### 2.1 Current Monoliths to Decompose

| Component | Lines | New Structure |
|-----------|-------|---------------|
| `class-booking/index.tsx` | ~2000+ | `components/class-booking/` (already started — complete it) |
| `components/student-management/index.tsx` | ~1500 | `components/student-management/` with sub-components |
| `components/teacher-activity-dashboard.tsx` | ~1200 | Split into `TeacherDashboard`, `ClassList`, `AnalyticsPanel` |
| `components/messaging-hub.tsx` | ~1000 | Separate `MessageList`, `MessageComposer`, `GroupManager` |
| `components/admin-analytics-dashboard.tsx` | ~900 | Composable widgets |

### 2.2 New Component Primitive Library

```
components/ui/
├── Button.tsx              # Variants, sizes, loading states
├── Input.tsx               # With label, error, bilingual support
├── Select.tsx              # Searchable, multi-select, grouped options
├── DatePicker.tsx          # Thai calendar support (Buddhist era)
├── Modal.tsx               # Portal, focus trap, sizes
├── Table.tsx               # Sortable, paginated, virtualized
├── Chip.tsx                # Filter chips (existing filter-chip.tsx)
├── Tabs.tsx                # Keyboard accessible
├── Toast.tsx               # Global toast system (existing toast.ts)
├── Avatar.tsx              # User/student avatars
├── Badge.tsx               # Status badges
├── Card.tsx                # Consistent card layout
├── EmptyState.tsx          # Illustrations + actions
├── LoadingSkeleton.tsx     # Per-component skeletons
└── index.ts                # Barrel export
```

### 2.3 Page Structure (App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx           # KEEP — only unchanged screen
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx               # Sidebar + header shell
│   ├── teacher/
│   │   ├── page.tsx             # Teacher home (upcoming classes, quick actions)
│   │   ├── classes/page.tsx     # Class booking/list (desktop)
│   │   ├── students/page.tsx    # Student management
│   │   ├── analytics/page.tsx   # Teacher analytics
│   │   └── settings/page.tsx
│   ├── moderator/
│   │   ├── page.tsx             # Moderator home (pending approvals)
│   │   ├── approvals/page.tsx   # Class approval queue
│   │   ├── schools/page.tsx     # School management
│   │   ├── analytics/page.tsx   # School analytics
│   │   └── settings/page.tsx
│   ├── admin/
│   │   ├── page.tsx             # Admin overview
│   │   ├── users/page.tsx       # User management
│   │   ├── schools/page.tsx     # School CRUD
│   │   ├── providers/page.tsx   # Provider management
│   │   ├── analytics/page.tsx   # System analytics
│   │   └── settings/page.tsx
│   └── mobile/
│       ├── page.tsx             # MOBILE HOME — today's classes + quick log
│       ├── log/page.tsx         # Log a class (simplified form)
│       ├── history/page.tsx     # Past classes list
│       ├── events/page.tsx      # Upcoming events/calendar
│       └── students/page.tsx    # Private student quick view
├── api/                         # Keep existing API routes
└── layout.tsx                   # Root providers
```

---

## 3. Query & Hook Layer

### 3.1 Typed Convex Hooks

Replace ad-hoc `useQuery`/`useMutation` with generated, typed hooks:

```typescript
// lib/convex/hooks.ts (auto-generated from schema)

export function useStudents(filters?: {
  providerId?: Id<"providers">;
  schoolId?: Id<"schools">;
  grade?: string;
  includeDeleted?: boolean;
}) {
  return useQuery(api.students.list, filters);
}

export function useClasses(filters?: {
  teacherId?: Id<"users">;
  schoolId?: Id<"schools">;
  providerId?: Id<"providers">;
  status?: ClassStatus;
  dateRange?: { start: number; end: number };
}) {
  return useQuery(api.classes.list, filters);
}

// Optimistic mutations
export function useCreateClass() {
  const mutation = useMutation(api.classes.create);
  return useOptimisticMutation(mutation, {
    onMutate: (newClass) => {
      // Update local cache immediately
      queryClient.setQueryData(['classes', 'list'], (old) => [...old, newClass]);
    },
    onError: (err, vars, context) => {
      // Rollback
      queryClient.invalidateQueries(['classes']);
    },
  });
}
```

### 3.2 Query Strategy

- **React Query (TanStack Query)** for client-side caching, deduplication, stale-while-revalidate
- **Convex subscriptions** only for real-time needs: pending approvals count, live notifications
- **Server Components** for initial data fetch (SEO, faster FCP)
- **Prefetching** on hover/intent for instant navigation

---

## 4. Mobile-First Experience (`/mobile`)

### 4.1 Design Principles

- **Single purpose:** Log a class → View events → Manage private students
- **Thumb-zone navigation:** Bottom tab bar, no hamburger menus
- **Offline-first:** Queue class logs locally, sync when online
- **Thai-optimized:** Buddhist calendar, Thai number input, voice-to-text for notes
- **PWA:** Install prompt, home screen icon, background sync

### 4.2 Mobile Routes

| Route | Purpose | Key Features |
|-------|---------|--------------|
| `/mobile` | Today view | Today's scheduled classes, quick log button, stats cards |
| `/mobile/log` | Log class | Minimal form: Student (search), Subject, Duration, Notes, Attendance |
| `/mobile/history` | Past classes | Infinite scroll, filter by date/student, export CSV |
| `/mobile/events` | Calendar | Month view, event dots, tap for details |
| `/mobile/students` | Private students | Grid of private students, tap to log class |

### 4.3 Mobile Component Structure

```
components/mobile/
├── MobileLayout.tsx         # Bottom nav, safe area, PWA install prompt
├── MobileClassCard.tsx      # Compact class display
├── MobileLogForm.tsx        # Stepper or single-page form
├── MobileStudentPicker.tsx  # Search + recent + create new
├── MobileCalendar.tsx       # Thai month view
├── MobileStats.tsx          # Today's classes, hours, students
├── OfflineIndicator.tsx     # Sync status banner
└── VoiceNoteButton.tsx      # Speech-to-text for notes
```

---

## 5. Private Student Integration

### 5.1 Current Problem

Private students (not affiliated with any school) are handled via:
- `providerId` with category `"personal"`
- `schoolId: null`
- Scattered logic across booking, student management, analytics

### 5.2 Unified Approach

**Every student belongs to a Provider.**
- **School students:** Provider created by school (category: private/language_school/educational_camp)
- **Private students:** Provider created by teacher (category: personal)

**Teacher workflow:**
1. Teacher creates "Personal Provider" (one-time setup: "My Private Students")
2. Add students to that provider
3. Book/log classes → providerId = personal provider, schoolId = null
4. Auto-approval (no moderator needed)

**Schema enforcement:**
```typescript
// students table
providerId: v.id("providers"), // REQUIRED — no optional
schoolId: v.optional(v.id("schools")), // null for personal

// classes table
providerId: v.optional(v.id("providers")), // required if schoolId null
// XOR validation in mutation: (schoolId != null) XOR (providerId != null)
```

**UI Integration:**
- Student management shows tabs: "School Students" | "Private Students"
- Class booking: Provider dropdown includes teacher's personal provider
- Analytics: Filter by provider type
- Mobile: Private students prominently featured

---

## 6. Bilingual (i18n) System Overhaul

### 6.1 Current: Duplicated Fields

```typescript
// Everywhere
subject: v.string(),
subjectTh: v.string(),
materials: v.string(),
materialsTh: v.string(),
```

### 6.2 New: i18n Objects

```typescript
// Schema
subject: v.optional(v.object({ en: v.string(), th: v.string() })),
// Or for required fields
name: v.object({ en: v.string(), th: v.string() }),

// TypeScript
type I18nString = { en: string; th: string };

// Hook
function useI18n(value: I18nString, language: 'en' | 'th') {
  return language === 'th' ? value.th : value.en;
}

// Component
<Input
  label={{ en: "Subject", th: "วิชา" }}
  value={subject}
  onChange={(val) => setSubject({...subject, [lang]: val})}
/>
```

### 6.3 Migration

- Write Convex action to transform `field` + `fieldTh` → `{ en: field, th: fieldTh }`
- Update all mutations/queries to read/write i18n objects
- Update all components to use `useI18n` hook

---

## 7. Testing Strategy

### 7.1 Unit/Integration (Vitest)

```
tests/
├── unit/
│   ├── hooks/
│   │   ├── useStudents.test.ts
│   │   ├── useClasses.test.ts
│   │   └── useOptimisticMutation.test.ts
│   ├── utils/
│   │   ├── i18n.test.ts
│   │   ├── date-utils.test.ts
│   │   └── student-id-generator.test.ts
│   └── convex/
│       ├── students.test.ts      # Convex test helpers
│       ├── classes.test.ts
│       └── providers.test.ts
├── integration/
│   ├── mobile-log-flow.test.ts
│   ├── private-student-flow.test.ts
│   └── approval-workflow.test.ts
└── e2e/                         # Playwright (reduced scope)
    ├── auth.spec.ts
    ├── teacher-class-booking.spec.ts
    ├── moderator-approval.spec.ts
    └── mobile-pwa.spec.ts
```

### 7.2 Convex Test Helpers

```typescript
// tests/convex/helpers.ts
import { ConvexTest } from "convex-test";

export function createTestCtx() {
  const ctx = new ConvexTest(schema);
  // Seed test data
  return ctx;
}
```

### 7.3 Target: 80% unit coverage, 100% critical path integration coverage

---

## 8. Performance & Real-Time

### 8.1 Query Optimization

- **Composite indexes** for all common filter combinations (already started)
- **Pagination** everywhere — no unbounded queries
- **Selective fields** — `db.query().select({ id: true, name: true })`
- **Denormalization** — Cache `teacherName`, `studentName`, `schoolName` on classes

### 8.2 Real-Time Subscriptions

Only subscribe to:
- `pendingApprovalsCount` (moderator badge)
- `unreadNotificationsCount` (header badge)
- `activeUsers` (presence in messaging)

Everything else: React Query with 30s stale time.

### 8.3 Optimistic Updates

```typescript
// Pattern for all mutations
const mutation = useMutation(api.classes.updateStatus);
const optimistic = useOptimisticMutation(mutation, {
  onMutate: ({ classId, status }) => {
    queryClient.setQueryData(['class', classId], (old) => ({
      ...old,
      status,
      isOptimistic: true,
    }));
  },
  onSuccess: (data, vars) => {
    queryClient.invalidateQueries(['classes']);
  },
});
```

---

## 9. Accessibility & Thai Localization

### 9.1 Accessibility (WCAG 2.1 AA)

- Semantic HTML, ARIA labels on all interactive elements
- Focus management in modals/wizards
- Keyboard navigation for all workflows
- Color contrast ratios (Tailwind config)
- Screen reader tested (NVDA, VoiceOver)

### 9.2 Thai Localization

- **Buddhist Era dates:** `DatePicker` shows BE, stores UTC
- **Thai numerals:** Option to display numbers in Thai digits
- **Line breaking:** `word-break: keep-all` for Thai text
- **Font:** Sarabun / Noto Sans Thai (already in Tailwind)
- **RTL-ready:** Structure supports future RTL languages

---

## 10. Migration & Deployment Plan

### 10.1 Phased Rollout

| Phase | Scope | Duration | Risk |
|-------|-------|----------|------|
| 1 | Schema v2 + migration scripts | 1 week | Medium |
| 2 | Core hooks + query layer | 3 days | Low |
| 3 | Component primitives + layout | 1 week | Low |
| 4 | Teacher desktop pages | 1 week | Medium |
| 5 | Moderator/Admin pages | 1 week | Medium |
| 6 | Mobile PWA (`/mobile`) | 1 week | High (new) |
| 7 | Private student integration | 3 days | Medium |
| 8 | i18n migration | 2 days | Medium |
| 9 | Testing + bug fix | 1 week | Low |
| 10 | Staging deploy + UAT | 3 days | Low |
| 11 | Production deploy | 1 day | Low |

**Total: ~6 weeks**

### 10.2 Rollback Strategy

- Each phase behind feature flag (`NEXT_PUBLIC_REVAMP_PHASE`)
- Old routes remain accessible at `/legacy/*`
- Database migration reversible via Convex snapshots
- Canary deploy to 10% users first

---

## 11. Success Criteria

| Metric | Target |
|--------|--------|
| Class booking flow (desktop) | < 3 clicks, < 10s |
| Class logging (mobile) | < 15s end-to-end |
| Page load (teacher dashboard) | < 1.5s FCP, < 2.5s TTI |
| Bundle size (mobile) | < 150KB gzipped |
| Test coverage (unit) | > 80% |
| E2E test runtime | < 3 minutes |
| Convex function cost | < 50% of current |
| Thai teacher satisfaction | > 4.5/5 (survey) |

---

## 12. Out of Scope (YAGNI)

- Guardian role (deprecated → provider)
- YouTube downloader (removed)
- Complex wizard flows (replaced by inline editing)
- Multi-school teacher dashboards (simplify to single school + providers)
- Advanced reporting engine (keep CSV export, add later)
- Real-time collaborative editing (not needed)

---

## 13. Open Questions for Implementation

1. **Authentication:** Keep custom auth or migrate to Convex Auth?
2. **File storage:** Keep Convex storage or move to S3/R2?
3. **Push notifications:** Convex + Web Push or third-party (OneSignal)?
4. **Analytics events:** Keep custom `teacherLogs` or use PostHog/Amplitude?
5. **Offline sync strategy:** IndexedDB + background sync vs. Service Worker only?

---

*Design approved: _______________*  
*Next: Writing implementation plan (`docs/plans/2026-06-13-complete-revamp-plan.md`)*