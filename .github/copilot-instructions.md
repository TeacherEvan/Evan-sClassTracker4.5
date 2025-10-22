# Copilot / AI Agent Instructions — Evan's Class Tracker 4.5

Short, practical guidance for an AI agent editing this repo. Keep changes minimal and follow the project's non-negotiable patterns.

## High level
- Frontend: Next.js 15 + React 19 (app/ directory). Backend: Convex server functions (convex/).
- Bilingual-first: every user-facing string has English + Thai fields (title / titleTh, message / messageTh).
- Convex schema is the source of truth: `convex/schema.ts`. Do not edit `convex/_generated/`.

## Critical constraints (must follow)
- Provider order in `app/layout.tsx` is load-bearing. NEVER reorder or remove providers; it will break runtime behaviour. See `app/layout.tsx`.
- Always use index-based queries with `.withIndex(...)` in Convex functions to avoid table scans. See examples in `convex/*.ts` and indexes defined in `convex/schema.ts`.
- Avoid N+1 queries: batch fetch related records and build lookup maps (examples in docs/ and convex code).
- Use toast-based notifications instead of alert/confirm. See `lib/toast.ts` and `components/desktop-notification-toast.tsx`.
- Soft deletes: use `isActive` booleans; do not hard-delete records. Schema contains `isActive` on tables where applicable.

## YouTube Downloader Pattern (yt-dlp integration)
- **NO external website redirects** (no y2mate, yt5s, savefrom, etc.) — everything stays in-app
- **Server-side download**: Next.js API route (`app/api/download/route.ts`) runs yt-dlp on server
- **Client triggers download**: Frontend calls API, receives file blob, triggers browser download to user's Downloads folder
- **Files stored locally**: Downloads go directly to user's device via browser download (NOT uploaded to cloud/Convex)
- **Implementation**: 
  - API route runs `yt-dlp` command in temp directory
  - Extracts video title for proper filename
  - Streams file buffer to client with Content-Disposition header
  - Cleans up temp file after sending
  - Client uses `window.URL.createObjectURL(blob)` to trigger download
- **Never**: Copy commands to clipboard, open external sites, or ask user to run terminal commands

## Authentication & security notes (observed in repo)
- Authentication is custom (not Convex built-in). Sessions are stored in localStorage and passwords are currently encoded with `btoa()` (see `convex/users.ts`) — this is not production secure. Do not change auth assumptions without asking.
- Login attempts currently lack rate-limiting; add `checkRateLimit` for mutations when implementing auth changes.

## Developer workflows / commands
- Local dev (PowerShell):
  - `npm install`
  - `npx convex dev`  (start Convex first — Next.js needs NEXT_PUBLIC_CONVEX_URL)
  - `npm run dev`     (Next.js with Turbopack)
- Build:
  - `npm run build`
  - `npx convex deploy` (to deploy Convex functions)
  - `npx tsc --noEmit` (typecheck)

## Code patterns & examples to follow
- Bilingual UI: `lib/language-context.tsx` provides `t(en, th)`. Mirror both languages when adding UI strings.
- Convex read/write: use `useQuery(api.xxx.list, {})` and `useMutation(api.xxx.action)`. Pass userId explicitly to mutations.
- Rate limiting: reuse `convex/rateLimit.ts` and `checkRateLimit(...)` when adding mutations (bookings/messages are rate-limited).
- Unique student ID generation: use the existing pattern in `convex/students.ts` — do not change the format.

## Files to inspect before making changes
- `app/layout.tsx` (provider order)
- `convex/schema.ts` (indexes, fields — source of truth)
- `convex/classes.ts`, `convex/users.ts`, `convex/students.ts` (state machines, ID generation, auth)
- `lib/language-context.tsx`, `lib/toast.ts` (i18n + notifications)
- `components/notification-form.tsx`, `components/database-init.tsx` (bilingual examples)

## When to ask before changing
- Reordering/removing providers in `app/layout.tsx`.
- Changing schema indexes or student ID generation format.
- Replacing custom auth or session storage approach.
- Any change that affects cross-cutting behavior (rate limits, notification delivery, provider dependency order).

## Quick examples (copy patterns)
- Indexed Convex query:
  - `ctx.db.query('classes').withIndex('by_school_and_date', q => q.eq('schoolId', schoolId).gte('scheduledDate', start)).collect()`
- Batch fetch pattern:
  - `const ids = [...new Set(items.map(i => i.studentId))]; const students = await Promise.all(ids.map(id => ctx.db.get(id))); const map = new Map(students.map(s => [s._id, s]));`

---
If any section is unclear or you'd like richer examples (tests, migrations, or a task-specific checklist), tell me which area to expand and I'll iterate.

Changelog: trimmed and merged original longer guidance into a concise 40-line agent guide (2025-10-23).
# AI Agent Instructions - Evan's Class Tracker 4.5

Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. Recent optimizations (Oct 2025) achieved **40-50% faster loads** and **10-100x faster queries** via N+1 elimination.

## Architecture Essentials

### Provider Hierarchy (Load-Bearing - DO NOT REORDER)

Provider order in `app/layout.tsx` is **CRITICAL** - reordering causes runtime failures:

```tsx
<ErrorBoundary>              // 1. Catches all errors
  <ConvexClientProvider>     // 2. DB connection
    <DeviceProvider>         // 3. Device detection (depends on Convex)
      <DataProvider>         // 4. Shared data layer (schools, users)
        <LanguageProvider>   // 5. UI-only state (innermost)
```

All components need `"use client"` directive. Never reorder or remove these providers.

### Convex Backend Pattern

- **Schema is source of truth**: `convex/schema.ts` defines tables, indexes, and validation
- **Never edit** `convex/_generated/` - auto-regenerated from schema
- **Client pattern**: `useQuery(api.users.list, {})` for reads, `useMutation(api.classes.book)` for writes
- **Pass userId explicitly** - no built-in `ctx.auth.getUserIdentity()`, uses custom session auth

### Authentication (Custom, Not Built-In)

```tsx
// Session stored in localStorage (not sessionStorage as docs claim)
const savedUser = localStorage.getItem("currentUser");
```

- **Default password**: `Teacher{username}` (e.g., `TeacherEvan`)
- **First login**: Forced password change via `requirePasswordChange` flag
- **Admin powers**: Create/reset passwords, cannot view existing passwords
- **Password hashing**: Uses `btoa()` (⚠️ NOT production-secure, noted in `convex/users.ts`)

## Non-Negotiable Patterns

### 1. Bilingual-First Development

**Every user-facing string needs English + Thai**. Schema has `title` AND `titleTh`. Forms need parallel inputs.

```tsx
const { t } = useLanguage(); // Helper from lib/language-context.tsx
<h1>{t("Book Class", "จองคลาส")}</h1>
```

**Example**: `components/notification-form.tsx` shows parallel input fields for both languages.

### 2. Index-First Queries (Performance Critical)

**Always use `.withIndex()`** to avoid table scans. Check `convex/schema.ts` for `.index()` definitions.

```typescript
// ✅ CORRECT - Uses index
ctx.db.query("classes")
  .withIndex("by_school_and_date", q => 
    q.eq("schoolId", schoolId).gte("scheduledDate", startDate))
  .collect()

// ❌ WRONG - Full table scan then filter
const all = await ctx.db.query("classes").collect();
return all.filter(c => c.schoolId === schoolId);
```

**Available indexes** (from `convex/schema.ts`):
- `users`: `by_username`, `by_school`, `by_role`, `by_device_type`
- `classes`: `by_teacher`, `by_school`, `by_student`, `by_status`, `by_scheduled_date`, `by_school_and_date`, `by_teacher_and_date`
- `students`: `by_student_id`, `by_school`, `by_guardian`, `by_guardian_id`

### 3. Avoid N+1 Query Problems

**NEVER query inside loops**. Use batch fetch + lookup map pattern.

```typescript
// ❌ BAD - N+1 queries (100 classes = 100 student queries)
for (const classItem of classes) {
  const student = await ctx.db.get(classItem.studentId);
}

// ✅ GOOD - Batch fetch pattern
const studentIds = [...new Set(classes.map(c => c.studentId))];
const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
const studentMap = new Map(students.map(s => [s._id, s]));
// Then lookup: studentMap.get(classItem.studentId)
```

See `docs/OPTIMIZATION_ANALYSIS_2025.md` for identified bottlenecks and fixes.

### 4. Toast Notifications (Replace alert/confirm)

```tsx
import { toast } from "@/lib/toast";

// ✅ CORRECT
toast.success("Class booked!", "จองคลาสสำเร็จ!");
toast.error("Failed to save", "บันทึกไม่สำเร็จ");

// ❌ WRONG - Never use
alert("Class booked!");
confirm("Are you sure?");
```

See `lib/toast.ts` for implementation, `components/desktop-notification-toast.tsx` for UI.

### 5. Rate Limiting on Mutations

```typescript
import { checkRateLimit } from "./rateLimit";

export const book = mutation({
  handler: async (ctx, args) => {
    await checkRateLimit(ctx, {
      key: `book-${args.userId}`,
      limit: 30,      // 30 requests
      windowMs: 60000 // per minute
    });
    // ... mutation logic
  }
});
```

**Existing limits** (from `convex/classes.ts`, `convex/messages.ts`):
- Class bookings: 30/min
- Messages: 20/min

### 6. Unique Student IDs (Do Not Replace)

**Deterministic format**: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`

```typescript
// From convex/students.ts - DO NOT modify this pattern
function generateStudentId(firstName: string, lastName: string, schoolId: string): string {
  const timestamp = Date.now().toString(36);
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const schoolHash = schoolId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}
```

**Example**: `BANG-EVTH-abc123-XY4Z`

### 7. Class Booking State Machine

```
Teacher books → "pending"
  ↓
Moderator acknowledges → "acknowledged"
  ↓
Moderator approves/rejects → "approved"/"rejected"

EXCEPTION: isGuardianLinked: true → auto-approve (bypasses moderator)
```

See `convex/classes.ts` for state transitions and validation.

### 8. Soft Deletes (No Hard Deletes)

Use `isActive` boolean instead of deleting records.

```typescript
// Query only active records
ctx.db.query("teacherResources")
  .withIndex("by_active", q => q.eq("isActive", true))
  .collect()

// Soft delete
await ctx.db.patch(resourceId, { isActive: false });
```

## Security Considerations ⚠️

### Known Limitations (NOT Production-Ready)

This project has **known security issues** suitable for development/testing only:

1. **Password Hashing: `btoa()` is NOT SECURE**
   - Location: `convex/users.ts`
   - Issue: Base64 encoding is reversible - `atob(hash)` reveals password
   - **TODO**: Migrate to bcrypt before production deployment
   - Impact: Database compromise = all passwords exposed

2. **No Authentication Rate Limiting**
   - Issue: Login endpoint unprotected against brute force
   - Default password pattern `Teacher{username}` is predictable
   - **TODO**: Add `checkRateLimit` to login mutation (5 attempts per 5min)

3. **localStorage for Sessions (XSS Risk)**
   - Issue: Accessible to any JavaScript, no HttpOnly protection
   - Sessions never expire (no timeout)
   - **TODO**: Add session expiration or migrate to secure cookies

4. **Missing Rate Limits**
   - ✅ Class bookings: 30/min (protected)
   - ✅ Messages: 20/min (protected)
   - ❌ Login attempts: unlimited (vulnerable)
   - ❌ Password changes: unlimited (DoS risk)

**⚠️ Do NOT deploy to production without addressing items 1-3**

For detailed security analysis, see `COPILOT_INSTRUCTIONS_REVIEW.md`.

## Development Workflow

### Local Development (PowerShell)

```powershell
npm install          # Install dependencies
npx convex dev       # Start Convex FIRST (required!)
npm run dev          # Start Next.js with Turbopack (after Convex is running)
```

**CRITICAL**: Convex must be running before Next.js starts (Next.js needs `NEXT_PUBLIC_CONVEX_URL`).

### Build & Deploy

```powershell
npm run build        # Next.js build with --turbopack flag
npx convex deploy    # Deploy Convex functions to production
npx tsc --noEmit     # Typecheck without emitting files
```

**Turbopack is required** - do not remove `--turbopack` flags from `package.json` scripts.

### Environment Setup

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)
- Already in `.gitignore` - never commit
- Production: Set `NEXT_PUBLIC_CONVEX_URL` in Vercel dashboard

## Common Pitfalls

### ❌ DO NOT DO

1. **Reorder providers** in `app/layout.tsx` - breaks data flow
2. **Edit `convex/_generated/`** - regenerated on every schema change
3. **Remove `--turbopack`** from build scripts - required for this project
4. **Remove bilingual support** - every feature needs both languages
5. **Use `alert()`/`confirm()`** - use toast notifications instead
6. **Query in loops** - use batch fetching patterns
7. **Commit `.env.local`** - contains sensitive Convex URL
8. **Use Convex built-in auth** - this project uses custom session auth

### ✅ SAFE CHANGES

- Add bilingual fields to UI forms (parallel inputs + update mutation)
- Implement indexed Convex queries (match `.withIndex()` pattern)
- Fix N+1 queries using batch fetch pattern
- Add soft delete logic to tables
- Implement edit audit trails
- Add rate limiting to mutations
- Convert `alert()`/`confirm()` calls to toast notifications

### ⚠️ ASK FIRST

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries
- Changing authentication system
- Modifying rate limit values

## Post-Implementation Procedures

### ⚠️ CRITICAL: Update Notification After Each Feature Implementation

**REQUIRED STEP** - After completing ANY significant feature or improvement:

1. **Update App Updates Log** (`convex/appUpdates.ts`)
   - Add new entry with version number, bilingual title/description, feature list
   - Mark as active to show in notification windows
   - Example format:
     ```typescript
     await ctx.db.insert("appUpdates", {
       version: "4.5.3",
       title: "Feature Name",
       titleTh: "ชื่อฟีเจอร์",
       description: "Brief description",
       descriptionTh: "คำอธิบายสั้น ๆ",
       features: ["Feature 1", "Feature 2"],
       featuresTh: ["ฟีเจอร์ 1", "ฟีเจอร์ 2"],
       releaseDate: Date.now(),
       isActive: true,
       showInWindow: true
     });
     ```

2. **Create/Update Notification Window** (if user-facing change)
   - Use admin notification window form or backend mutation
   - Set appropriate `targetRole` (all, teacher, moderator, admin) OR `targetSchool`
   - Set `showUpdateSummary: true` to display latest updates
   - Priority: 100 (highest) for critical updates, 50 for minor features

3. **Document in Implementation Summary**
   - Update project README or create `IMPLEMENTATION_SUMMARY_[DATE].md`
   - List all changed files, new features, breaking changes
   - Include testing checklist and verification steps

**Why This Matters:**
- Users won't know about new features unless notified
- Gold Tablet notification window shows app updates automatically when `showUpdateSummary: true`
- Maintains feature visibility and adoption
- Creates audit trail for version history

### School-Specific and Broadcast Notifications

The notification window system supports targeted distribution:

**Target Options:**
1. **By Role:** `targetRole: "teacher" | "moderator" | "admin" | "all"`
2. **By School:** `targetSchool: Id<"schools">` - NEW REQUIREMENT
3. **Everyone:** `targetSchool: "everyone"` - Broadcast to all schools

**Schema Update Required:**
```typescript
// convex/schema.ts - notificationWindows table
notificationWindows: defineTable({
  // ... existing fields
  targetRole: v.optional(v.union(
    v.literal("all"),
    v.literal("teacher"),
    v.literal("moderator"),
    v.literal("admin")
  )),
  targetSchool: v.optional(v.union(
    v.id("schools"),
    v.literal("everyone") // Broadcast to all schools
  )),
  // ... rest of fields
})
.index("by_school", ["targetSchool"]) // Add index for school filtering
```

**Query Logic Update:**
```typescript
// convex/notificationWindows.ts - getActiveForUser
// Check school targeting
if (window.targetSchool) {
  if (window.targetSchool === "everyone") {
    // Show to all users regardless of school
  } else if (user.schoolId !== window.targetSchool) {
    continue; // Skip if user's school doesn't match
  }
}
```

**Use Cases:**
- School-specific announcements (maintenance, events)
- Role-specific updates (new moderator tools)
- System-wide broadcasts (major version updates)
- Emergency notifications to specific schools

## Key Files for Reference

### Architecture & Schema
- `convex/schema.ts` - Database schema, indexes (source of truth)
- `app/layout.tsx` - Provider hierarchy (critical order)
- `docs/ARCHITECTURE.md` - System diagrams, data flows
- `docs/OPTIMIZATION_ANALYSIS_2025.md` - N+1 fixes, performance improvements

### Core Patterns
- `lib/language-context.tsx` - Bilingual helper (`t()` function)
- `lib/toast.ts` - Toast notification manager
- `convex/rateLimit.ts` - Rate limiting and input validation
- `convex/pagination.ts` - Native database pagination

### Backend Logic
- `convex/classes.ts` - State machine, workflow, edit audit trail, authorization helpers
- `convex/students.ts` - Unique ID generation pattern
- `convex/users.ts` - Authentication, password hashing

### UI Components
- `components/class-booking.tsx` - Multi-date booking, optional fields, conflict detection
- `components/edit-class-modal.tsx` - Full edit modal with audit trail
- `components/desktop-notification-toast.tsx` - Toast notification UI

### Feature Documentation
- `GOLD_TABLET_NOTIFICATION_WINDOW.md` - Notification window implementation guide
- `convex/notificationWindows.ts` - One-time notification window system
- `convex/appUpdates.ts` - Feature update logging and changelog

---

**For clarification** on patterns, index names, or implementation examples, reference the files above or grep for usage examples.