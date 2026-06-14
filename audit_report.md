# Audit Report: Evan's Class Tracker (v4.5.33)

**Generated:** 2026-06-13  
**Scope:** Full codebase review  
**Project:** Next.js 15 + TypeScript + Convex Backend + React 19

---

## 1. File Inventory & Language Breakdown

| Category                        | Files   | Lines       |
| ------------------------------- | ------- | ----------- |
| **TypeScript (.ts)**            | ~150    | ~45,000     |
| **TSX React Components (.tsx)** | ~106    | ~24,773     |
| **Total Source**                | **256** | **~69,773** |
| Tests (unit + e2e)              | 42      | ~8,000      |
| Scripts                         | 10      | ~3,500      |
| Config/Docs                     | 30+     | ~15,000     |

**Largest Files (>500 lines):**

- `components/class-booking/index.tsx` — 2,495 lines
- `components/student-management.old.tsx` — 1,504 lines **(DEPRECATED)**
- `components/class-detail-modal.tsx` — 1,192 lines
- `convex/schema.ts` — 773 lines
- `convex/users.ts` — 829 lines
- `convex/students.ts` — 767 lines
- `convex/teacherClassCount.ts` — 769 lines
- `lib/thailand-locations.ts` — 562 lines

---

## 2. Dependency Mapping

### Core Dependencies (package.json)

```json
{
  "runtime": ["next@15.5.7", "react@19.1.0", "react-dom@19.1.0", "convex@1.31.2", "@tanstack/react-query@5"],
  "ui": ["lucide-react@0.556.0", "date-fns@4.1.0", "react-resizable-panels@3.0.6"],
  "db": ["mongodb@6.21.0"],
  "dev": ["typescript@5.9.3", "eslint@9.39.1", "vitest@4.0.10", "@playwright/test@1.56.1", "tailwindcss@4.1.17"]
}
```

### Convex Tables (28 tables)

Users, Schools, Providers, Classes, Students, Locations, Notifications, Messages, Groups, TeacherResources, TeacherLogs, PostClassNotes, AppUpdates, UserUpdateViews, AdminContactRequests, CancellationRequests, TeacherClassCountCycles, Events, Images, AuditLogs, ErrorReports, DuplicateWatchlist, TeacherSchools, NotificationWindows, NotificationWindowViews, ClassCountAuditLogs

### External Services

- **Convex** — Real-time backend (primary DB + functions)
- **MongoDB** — Backup/restore only (scripts)
- **Figma** — Asset sync (scripts)

---

## 3. Test Coverage Baseline

**Test Runner:** Vitest (unit) + Playwright (e2e)

| Suite            | Files | Tests | Status          |
| ---------------- | ----- | ----- | --------------- |
| Unit (Vitest)    | 13    | 83    | ✅ **All Pass** |
| E2E (Playwright) | 15    | ~60+  | Configured      |

**Commands:**

```bash
npm test              # vitest - 83 tests pass in ~7s
npm run test:e2e      # playwright (requires running dev server)
npm run test:coverage # vitest --coverage
```

---

## 4. Lint Baseline

### ESLint (TypeScript/React)

```bash
npm run lint
```

**Result:** ✅ **0 errors, 10 warnings**

- 5x `@typescript-eslint/no-unused-vars` in `lib/convex/hooks.ts` (auto-generated file)
- 1x `no-unused-vars` in `components/class-booking/ClassItemDisplay.tsx`
- 1x `no-unused-vars` in `components/line-contact-button.tsx`
- 1x `@next/next/no-img-element` in `components/line-contact-button.tsx`
- 1x `no-unused-vars` in `scripts/generate-hooks.ts`
- 1x `no-unused-vars` in `tests/unit/hooks/useOptimisticMutation.test.ts`

### TypeScript (tsc --noEmit)

```bash
npx tsc --noEmit
```

**Result:** ❌ **2 errors** in `tests/convex/helpers.test.ts`

- Line 35: Element implicitly has 'any' type (schema.tables[table])
- Lines 79, 82: Property 'indexes' is private on TableDefinition

### Prettier

```bash
npx prettier --check .
```

**Result:** ❌ **444 files** need formatting

### Markdownlint

```bash
npm run lint:md
```

**Result:** ❌ **17 errors** across 9 files

- Trailing spaces (4 files)
- Table column count mismatch (6 rows in one archived doc)
- Invalid link fragment (1 doc)
- Missing trailing newline (2 plan docs)
- Ordered list prefix mismatch (4 lines in one implementation summary)

---

## 5. TODOs / FIXMEs / XXXs

| File                   | Line | Comment                                                                               |
| ---------------------- | ---- | ------------------------------------------------------------------------------------- |
| `tests/e2e/helpers.ts` | 493  | `// TODO: Implement in Phase 2 after UI migration`                                    |
| `convex/pagination.ts` | 114  | `// TODO: Consider splitting into separate queries for direct vs group messages`      |
| `lib/types.ts`         | 12   | `// TODO: Remove "guardian" after all guardian users have been migrated to providers` |
| `lib/logger.ts`        | 52   | `// TODO: Send to error tracking service`                                             |

---

## 6. Identified Issues Summary

### CRITICAL

1. **TypeScript compilation fails** — `tests/convex/helpers.test.ts` accesses private Convex schema properties
2. **Prettier formatting** — 444 files unformatted (affects CI consistency)

### HIGH

1. **Deprecated file** — `components/student-management.old.tsx` (91KB, 1,504 lines) should be deleted
2. **Auto-generated hooks file has unused imports** — `lib/convex/hooks.ts` lines 8-13, 69 define types/variables never used

### MEDIUM

1. **Markdown lint errors** — 17 errors in docs (trailing spaces, table issues, list numbering)
2. **Test file uses console.log extensively** — `tests/e2e/location-system.spec.ts` has 40+ console.log statements (acceptable for e2e debugging but noisy)

### LOW / STYLE

1. **Unused variable warnings** — 10 ESLint warnings (mostly auto-generated or test files)
2. **`<img>` element warning** — `components/line-contact-button.tsx` should use Next.js `<Image />`
3. **Migration TODOs** — Guardian → Provider migration incomplete (lib/types.ts TODO)

---

## 7. Architecture Observations

### ✅ Strengths

- **Clean separation**: Convex backend (queries/mutations) separated from React frontend
- **Schema-driven**: Single source of truth in `convex/schema.ts` with comprehensive indexes
- **Type safety**: Full TypeScript with strict mode, Convex generated types
- **Testing**: Unit + E2E coverage with Vitest + Playwright
- **i18n**: Built-in English/Thai bilingual support throughout
- **Security**: PBKDF2 password hashing, rate limiting, audit logging

### ⚠️ Areas for Improvement

- **Large components** — Several >600 line components (class-booking, class-detail-modal, etc.) could benefit from decomposition
- **Auto-generated file quality** — `lib/convex/hooks.ts` has unused type definitions
- **Documentation debt** — 9 implementation summary files + archived plans + active plans in docs/plans/
- **Format consistency** — Prettier not enforced in CI (lint-staged only on commit)

---

## 8. Gate Status

| Phase                    | Status                                  |
| ------------------------ | --------------------------------------- |
| **Phase 1: Audit**       | ✅ Complete — `audit_report.md` created |
| **Phase 2: Review**      | ⏳ Awaiting user prioritization         |
| **Phase 3: Investigate** | ⏳ Pending                              |
| **Phase 4: Fix**         | ⏳ Pending                              |

---

**Next Step:** User to prioritize fixes from the identified issues above, then proceed to Phase 2 (Structural Review).
