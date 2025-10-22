# AI Agent Instructions - Evan's Class Tracker 4.5

Bilingual (English/Thai) class tracking system built with Next.js 15, React 19, Convex real-time backend, and Tailwind v4. Recent optimizations (Oct 2025) achieved 40-50% faster loads and 10-100x faster queries via N+1 elimination.

## Architecture Essentials

### Provider Hierarchy (Load-Bearing - DO NOT REORDER)

Provider order in app/layout.tsx is CRITICAL:
1. ErrorBoundary - catches all errors
2. ConvexClientProvider - DB connection
3. DeviceProvider - depends on Convex
4. DataProvider - shared data layer
5. LanguageProvider - UI-only state (innermost)

Reordering causes runtime failures. All components need "use client" directive.

### Convex Backend

- Backend lives in convex/ - TypeScript functions that compile to edge functions
- Schema is source of truth: convex/schema.ts defines tables, indexes, and types
- Never edit convex/_generated/ - auto-regenerated from schema
- Client pattern: useQuery(api.users.getCurrentUser) for reads, useMutation(api.students.create) for writes

## Non-Negotiable Patterns

### 1. Bilingual-First Development

Every user-facing string requires English + Thai. Schema has title AND titleTh. Forms need parallel inputs.
See: components/notification-form.tsx, lib/language-context.tsx

### 2. Index-First Queries (Performance Critical)

Always use .withIndex() to avoid table scans. Check convex/schema.ts for .index() definitions.
CORRECT: ctx.db.query("classes").withIndex("by_school_and_date", q => q.eq("schoolId", schoolId).gte("scheduledDate", startDate)).collect()
WRONG: Load all then filter in-memory

### 3. Avoid N+1 Query Problems

NEVER query inside loops. Use batch fetch + lookup map pattern.
See: docs/OPTIMIZATION_ANALYSIS_2025.md for identified bottlenecks and fixes.

### 4. Use Native Pagination

Use Convex .paginate() for efficient database-level pagination. See: convex/pagination.ts

### 5. Soft Deletes Only

Use isActive boolean flag instead of deleting records. Query with .withIndex("by_active", q => q.eq("isActive", true))

### 6. Unique Student IDs

Deterministic format: {SchoolHash}-{NameHash}-{Timestamp}-{Random}
Example: AB12-JOSR-k9x2tz-X4J2
See: convex/students.ts generateStudentId() - do not replace with UUID.

## Development Workflow

### Local Development (PowerShell)

npm install              # Install dependencies
npx convex dev           # Start Convex FIRST (required!)
npm run dev              # Start Next.js with Turbopack
npx tsc --noEmit         # Typecheck

CRITICAL: Convex must be running before Next.js starts.

### Build System

Turbopack is required - do not remove --turbopack flags from package.json scripts.

### Environment Setup

- .env.local contains NEXT_PUBLIC_CONVEX_URL (auto-created by npx convex dev)
- Already in .gitignore - never commit
- Production: Set in Vercel dashboard

## Common Patterns & Examples

### Toast Notification Pattern (Replaces alert())

Import: import { toast } from "@/lib/toast";
Never use alert() or confirm() - always use toast notifications.
See: lib/toast.ts, components/desktop-notification-toast.tsx

### Rate Limiting Pattern

Protect mutations from abuse with checkRateLimit(ctx, { key, limit, windowMs }).
See: convex/rateLimit.ts, convex/classes.ts (30 bookings/min), convex/messages.ts (20 msgs/min)

### Form Submission Pattern

No loading states needed - Convex provides optimistic updates.
Always wrap in try/catch, show toast on success/error, clear form after success.

### Authentication Pattern

CRITICAL: This project uses custom session-based authentication, NOT Convex built-in auth (ctx.auth.getUserIdentity()).
Always pass userId from client as parameter. Session stored in sessionStorage (not localStorage).
Default password: Teacher{username}, first login requires password change.

### Class Booking State Machine

Teacher books -> "pending" -> Moderator acknowledges -> "acknowledged" -> Moderator approves/rejects -> "approved"/"rejected"
Exception: Guardian-linked classes (isGuardianLinked: true) auto-approve.
See: convex/classes.ts

## Forbidden Changes

1. Do not reorder providers in app/layout.tsx
2. Do not edit convex/_generated/ files
3. Do not remove --turbopack from npm scripts
4. Do not remove bilingual support - every feature needs both languages
5. Do not replace Convex with REST/direct DB drivers
6. Do not commit .env.local or secrets
7. Do not use alert() or confirm() - use toast notifications
8. Do not query in loops - use batch fetching patterns

## Key Files for Reference

- convex/schema.ts - Database schema, indexes (source of truth)
- app/layout.tsx - Provider hierarchy (critical order)
- lib/language-context.tsx - Bilingual helper (t() function)
- lib/toast.ts - Toast notification manager
- convex/classes.ts - State machine, workflow, edit audit trail
- convex/students.ts - Unique ID generation pattern
- convex/pagination.ts - Native database pagination
- convex/rateLimit.ts - Rate limiting and input validation
- components/class-booking.tsx - Multi-date booking, optional fields
- components/edit-class-modal.tsx - Full edit modal with audit trail
- docs/OPTIMIZATION_ANALYSIS_2025.md - N+1 fixes, performance improvements
- docs/ARCHITECTURE.md - System diagrams, data flows

## Safe Tasks for Agents

- Add bilingual fields to UI forms (parallel inputs + update mutation)
- Implement indexed Convex queries (match .withIndex() pattern)
- Fix N+1 queries using batch fetch pattern
- Add soft delete logic to tables
- Add collapsible optional fields sections
- Implement edit audit trails
- Add rate limiting to mutations
- Convert alert()/confirm() calls to toast notifications
- Implement pagination for large datasets

## Risky Changes (Ask First)

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries
- Changing authentication system
- Modifying rate limit values

---

For clarification on patterns, index names, or implementation examples, reference the files above or ask for specific file excerpts.