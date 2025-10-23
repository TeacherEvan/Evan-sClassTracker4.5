# AI Agent Instructions - Evan's Class Tracker 4.5

Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. Recent optimizations (Oct 2025) achieved **40-50% faster loads** and **10-100x faster queries** via N+1 elimination.

---

## Quick Start Context

### Tech Stack
- **Frontend**: Next.js 15 + React 19 (App Router)
- **Backend**: Convex (real-time serverless)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript + bilingual UI (English/Thai)

### Critical Files
- `convex/schema.ts` - Database schema (source of truth)
- `app/layout.tsx` - Provider hierarchy (DO NOT reorder)
- `.github/copilot-instructions.md` - This file

---
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

### 9. File Upload Pattern (Convex Storage)

**For file attachments** (messages, contact requests), use Convex `_storage`:

```typescript
// Generate upload URL (frontend calls this first)
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Store attachment metadata after upload
await ctx.db.insert("messages", {
  attachmentStorageId: storageId,  // From upload response
  attachmentName: "document.pdf",
  attachmentType: "application/pdf",
  attachmentSize: 102400, // bytes
  // ... other fields
});

// Retrieve download URL
const url = await ctx.storage.getUrl(storageId);
```

**Storage limits**: Convex free tier = 1GB storage, 5GB bandwidth/month

**Pattern location**: See `convex/messages.ts` and `convex/adminContactRequests.ts`

### 10. Login Security Pattern (Account Lockout)

**Automatic 24-hour lockout** after 5 failed login attempts:

```typescript
// In login mutation (convex/users.ts)
const user = await ctx.db.query("users")
  .withIndex("by_username", q => q.eq("username", username))
  .first();

// Check if account is locked
if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
  throw new Error("Account locked. Try again later or contact admin.");
}

// Increment failed attempts on wrong password
await ctx.db.patch(user._id, {
  failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
  accountLockedUntil: attempts >= 4 ? Date.now() + 86400000 : undefined // 24hrs
});

// Reset on successful login
await ctx.db.patch(user._id, {
  failedLoginAttempts: 0,
  accountLockedUntil: undefined,
  lastSuccessfulLogin: Date.now()
});
```

**Admin bypass**: Reset password to `Teacher{username}` to unlock account early

### 11. Bulk Deletion Pattern (Security-Critical)

**Admin-only bulk operations** require strict authorization checks:

```typescript
export const bulkDelete = mutation({
  handler: async (ctx, { ids, adminId, reason }) => {
    // 1. Verify admin role
    const admin = await ctx.db.get(adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    // 2. Validate reasonable batch size
    if (ids.length > 100) {
      throw new Error("Maximum 100 deletions per request");
    }

    // 3. Log the operation (audit trail)
    await ctx.db.insert("auditLog", {
      action: "bulk_delete",
      performedBy: adminId,
      affectedCount: ids.length,
      reason,
      timestamp: Date.now()
    });

    // 4. Soft delete (preserve data)
    await Promise.all(ids.map(id => 
      ctx.db.patch(id, { isActive: false, deletedAt: Date.now() })
    ));
  }
});
```

**Key safeguards** (from `SECURITY_REVIEW_BULK_DELETION.md`):
- Admin role verification (no bypass)
- Batch size limits (prevent DoS)
- Audit logging (track who deleted what)
- Soft deletes (data recovery possible)
- Confirmation UI (requires reason + double-check)

**Example**: See `convex/classes.ts` `bulkDelete` mutation and `components/sangsom-delete-button.tsx`

### 12. Audit Logging Pattern

**All significant administrative actions** should be logged for compliance:

```typescript
import { logAudit, AuditActions, AuditTargetTypes } from "./auditHelpers";

export const deleteUser = mutation({
  handler: async (ctx, args) => {
    // Perform action
    await ctx.db.delete(userId);
    
    // Log for audit trail
    await logAudit(ctx, {
      userId: args.adminId,
      action: AuditActions.DELETE_USER,
      targetType: AuditTargetTypes.USERS,
      targetId: userId,
      targetName: user.username,
      reason: args.reason,
      schoolId: user.schoolId,
    });
  }
});
```

**Actions to audit** (see `docs/AUDIT_LOGGING_IMPLEMENTATION.md`):
- User management (create, delete, update, password reset)
- Bulk operations (bulk delete, bulk import)
- Administrative changes (schools, locations, notifications)
- Security-sensitive actions (role changes, account unlocks)

**Helpers available**:
- `logAudit()` - Quick logging function
- `AuditActions` - Standard action constants
- `AuditTargetTypes` - Standard target type constants

**Admin UI**: `components/audit-logs.tsx` provides full audit log viewer with filters, statistics, and CSV export.

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
   - **UPDATED Oct 2025**: 24-hour account lockout after 5 failed attempts (see "Login Security Pattern")
   - **TODO**: Consider shorter lockout (e.g., 1-hour) with progressive delays

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

### CI/CD Pipeline (Automated)

**GitHub Actions workflows** are configured for automated testing and deployment:

```yaml
.github/workflows/
├── ci.yml                    # TypeScript + ESLint checks on PRs
├── deploy-staging.yml        # Auto-deploy develop branch
└── deploy-production.yml     # Auto-deploy main branch
```

**Workflow triggers**:
- CI checks run on all PRs and pushes
- Staging deploys automatically on push to `develop`
- Production deploys automatically on push to `main`
- Manual deployments available via Actions tab

**Setup required**: See `docs/CI_CD_SETUP_GUIDE.md` for:
- GitHub Secrets configuration (Convex, Vercel)
- Environment protection rules
- Deployment testing procedures

### Environment Setup

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)
- Already in `.gitignore` - never commit
- Production: Set `NEXT_PUBLIC_CONVEX_URL` in Vercel dashboard

### Testing New Features

**Quick test workflow** (see `docs/TESTING_GUIDE.md` for comprehensive guide):

1. **Start services**: `npx convex dev` + `npm run dev`
2. **Login with test users**:
   - Admin: `admin` / `TeacherAdmin`
   - Moderator: `moderator1` / `TeacherModerator1`
   - Teacher: `Evan` / `TeacherEvan`
3. **Test bilingual behavior**: Use language switcher (🇬🇧/🇹🇭 icon)
4. **Verify toast notifications**: Check bottom-right corner for feedback
5. **Check role-based access**: Features should appear/hide based on role
6. **Test real-time updates**: Open two browser windows with different users

**Common test scenarios**:
- Class booking → moderator notification → approval/rejection
- Message sending → unread badge → read status update
- Student creation → auto-generated ID → appears in dropdown
- Location proposal → moderator approval → available for booking

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

#### Automated Method (Recommended for AI Agents)

```bash
npm run create-update
```

This script automatically:
- ✅ Reads recent implementation summaries
- ✅ Extracts user-friendly features
- ✅ Creates bilingual app update in database
- ✅ Deactivates old updates
- ✅ Notifies users of improvements

**See:** `.github/AI_AGENT_WORKFLOW.md` for detailed integration guide

#### Manual Method (Admin UI)

1. **Use Admin "App Updates" Tab**
   - Login as admin
   - Go to "App Updates" tab
   - Click "Create New Update"
   - Fill in version, title, description, features (bilingual)
   - Click "Create Update"

2. **Or Use Convex Mutation Directly**
   ```typescript
   await ctx.db.insert("appUpdates", {
     version: "4.5.3",
     title: "Feature Name",
     titleTh: "ชื่อฟีเจอร์",
     description: "Brief description",
     descriptionTh: "คำอธิบายสั้น ๆ",
     features: [{ icon: "CheckCircle2", title: "...", titleTh: "...", description: "...", descriptionTh: "..." }],
     releaseDate: Date.now(),
     isActive: true,
     showInWindow: true
   });
   ```

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