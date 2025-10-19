# Evan's Class Tracker 4.5 - AI Coding Instructions

## Project Overview
Bilingual (English/Thai) class tracking system with user authentication, class booking, student management, and real-time notifications for teachers and schools. Built with Next.js 15, React 19, and Convex real-time backend. This is a full-stack TypeScript application using App Router and client-side rendering.

## Critical Architecture Patterns

### Four-Layer Provider Hierarchy (Non-Negotiable)
The app uses a strict nested provider pattern in `app/layout.tsx`:
```tsx
<ErrorBoundary>
  <ConvexClientProvider>
    <DeviceProvider>
      <LanguageProvider>{children}</LanguageProvider>
    </DeviceProvider>
  </ConvexClientProvider>
</ErrorBoundary>
```

**Why this order matters:**
1. **ErrorBoundary** (outermost) - Must catch errors from all inner providers
2. **ConvexClientProvider** - Real-time database connection; throws runtime error if `NEXT_PUBLIC_CONVEX_URL` missing
3. **DeviceProvider** - Reads/writes to Convex database, so needs ConvexClient
4. **LanguageProvider** (innermost) - Pure UI state, no external dependencies

**Breaking this order will cause runtime failures.** All child components require `"use client"` directive.

### Bilingual-First Development (Mandatory)
Every piece of user-facing content requires dual English/Thai implementation:

**Database schema pattern** (`convex/schema.ts`):
```typescript
title: v.string(),      // English version
titleTh: v.string(),    // Thai version
```

**Component usage** (from `components/notification-form.tsx`):
```tsx
const { t } = useLanguage();
// Always provide both languages
<label>{t("Title (English)", "หัวข้อ (อังกฤษ)")}</label>
<input value={title} ... />
<input value={titleTh} ... />
```

**Never ship single-language content.** Forms need parallel input fields for both languages.

### Convex Backend Architecture
**Backend lives in `convex/` directory** - TypeScript functions that compile to edge functions.

**Schema-first design** (`convex/schema.ts`):
```typescript
users: defineTable({
  username: v.string(),
  passwordHash: v.string(),
  role: v.union(v.literal("teacher"), v.literal("moderator"), v.literal("admin")),
  // ...indexes define query performance
}).index("by_username", ["username"])
```

**Client usage pattern**:
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const currentUser = useQuery(api.users.getCurrentUser); // Real-time query
const login = useMutation(api.users.login); // Write operation
await login({ username, password });
```

**Never edit `convex/_generated/` files** - they auto-regenerate on schema changes.

## Database Design Principles

### Index-First Queries (Performance Critical)
Always use `.withIndex()` for queries - table scans are slow at scale:

```typescript
// CORRECT: Uses compound index for date range
const classes = await ctx.db
  .query("classes")
  .withIndex("by_school_and_date", (q) =>
    q.eq("schoolId", schoolId)
      .gte("scheduledDate", startDate)
      .lte("scheduledDate", endDate)
  )
  .collect();

// WRONG: Table scan without index
const classes = await ctx.db.query("classes").collect();
// Then filtering in memory - slow!
```

See `convex/classes.ts` `getByDateRange` for compound index usage.

### Soft Deletes Only
Never hard delete records - use `isActive: false` flag:
```typescript
// locations and teacherResources tables use this pattern
isActive: v.boolean(),

// To "delete"
await ctx.db.patch(locationId, { isActive: false });

// Query only active records
.withIndex("by_active", (q) => q.eq("isActive", true))
```

Maintains data integrity and audit trails.

### Unique ID Generation Pattern
Students use deterministic collision-resistant IDs (`convex/students.ts`):
```typescript
// Format: {SchoolHash}-{NameHash}-{Timestamp}-{Random}
// Example: AB12-JOSR-k9x2tz-X4J2
function generateStudentId(firstName, lastName, schoolId) {
  const schoolHash = schoolId.substring(0, 4).toUpperCase();
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}
```

System retries on collision (max 10 attempts). Never use auto-increment or UUID.

## Workflow State Machines

### Class Booking State Flow
Three-step approval workflow in `convex/classes.ts`:

```
Teacher books → pending → Moderator acknowledges → acknowledged 
                                                  ↓
                                    Moderator decides → approved/rejected
```

Each transition triggers notifications automatically. Status is union type - never use strings directly:
```typescript
status: v.union(
  v.literal("pending"),
  v.literal("acknowledged"),
  v.literal("approved"),
  v.literal("rejected")
)
```

### Notification Type System
Strict union with UI color mapping:
```typescript
type: "info" | "success" | "warning" | "error"
// Maps to: blue / green / yellow / red
```

Always validate against this union, never free-form strings.

## Development Workflow

### Local Development Commands (PowerShell)
```powershell
npm install          # Install dependencies
npx convex dev       # Start Convex backend FIRST (required for Next.js)
npm run dev          # Start Next.js with Turbopack
```

**Critical:** Convex must be running before Next.js starts, or the app throws runtime errors.

### Turbopack Requirement (Build System)
All npm scripts use `--turbopack` flag:
```json
"dev": "next dev --turbopack",
"build": "next build --turbopack"  // Builds FAIL without this
```

**Never remove `--turbopack`** - this is non-negotiable for this project.

### Environment Variables
- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (created by `npx convex dev`)
- Already in `.gitignore` - never commit
- Production: Set in Vercel dashboard, Convex runs as persistent cloud service

## Component Development Patterns

### Form Submission Pattern
Standard approach from `components/notification-form.tsx`:

```tsx
const [title, setTitle] = useState("");
const [titleTh, setTitleTh] = useState("");
const createNotification = useMutation(api.notifications.create);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await createNotification({ title, titleTh, ... });
  // Clear form after success
  setTitle(""); setTitleTh("");
};
```

**No loading states needed** - Convex provides optimistic updates automatically.

### Authentication Pattern
Session stored in `sessionStorage` (not localStorage):

```tsx
const currentUser = useQuery(api.users.getCurrentUser);
const login = useMutation(api.users.login);

// Default password: Teacher{username}
// First login requires password change
if (currentUser?.requirePasswordChange) {
  // Show PasswordChangeDialog component
}
```

See `components/password-change-dialog.tsx` for implementation.

### Messaging System Dual Mode
`components/messaging-hub.tsx` supports two distinct patterns:

1. **Direct messaging**: `sendDirectMessage({ recipientId, ... })`
2. **Group messaging**: `sendGroupMessage({ schoolId or groupId, ... })`

Messages auto-expire after 14 days via `convex/crons.ts` daily job at 2:00 AM UTC.

## Styling Conventions

### Tailwind v4 (New Major Version)
- Uses `@tailwindcss/postcss` package (not v3 config file)
- Dark mode: `dark:` variant auto-detects system preference
- Responsive: `md:` prefix for tablet/desktop (mobile-first default)

**Standard form input pattern**:
```tsx
className="w-full px-3 py-2 border border-gray-300 rounded-lg 
           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
           dark:bg-gray-800 dark:border-gray-600"
```

### Notification Color Mapping
```
info    → bg-blue-50 border-blue-200    (light mode)
success → bg-green-50 border-green-200
warning → bg-yellow-50 border-yellow-200
error   → bg-red-50 border-red-200
```

## Critical Dependencies

### Key Packages (from `package.json`)
- **Next.js 15.5.4** - App Router with Turbopack
- **React 19.1.0** - Latest version (requires `@types/react@19`)
- **Convex 1.28.0** - Real-time backend with edge functions
- **Tailwind CSS v4** - New postcss-based architecture
- **Lucide React** - Icon library

### TypeScript Config
- Strict mode enabled
- Path alias: `@/` → project root
- `convex/_generated/` excluded from git

## Deployment Architecture

**Production Stack**: Vercel (frontend) + Convex (backend cloud service)

**Convex**: Persistent cloud service at `https://resolute-basilisk-801.convex.cloud`
- No manual deployment needed
- Handles real-time database, queries, mutations, cron jobs
- Auto-scales, always running

**Vercel**: Auto-deploys on git push
- Requires env var: `NEXT_PUBLIC_CONVEX_URL`
- Turbopack used for production builds

**First deployment**: Navigate to deployed URL → Click "Initialize Database" → Creates admin account

See `DEPLOYMENT.md` for complete guide.

## Common Debugging Scenarios

### Convex Connection Issues
1. Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
2. Verify `npx convex dev` is running
3. Browser console shows WebSocket connection status
4. Convex dashboard shows function logs and errors

### Build Failures
1. Ensure `--turbopack` flag is present in build script
2. Check TypeScript errors: `npx tsc --noEmit`
3. Verify all `convex/` imports use `@/convex/_generated/api`

### Missing Bilingual Content
1. Check schema has both `field` and `fieldTh`
2. Forms have parallel inputs for both languages
3. `t()` helper used consistently in UI

## Project-Specific Rules

1. **Never remove bilingual support** - Every feature must work in both languages
2. **Always use indexes** - No table scans without `.withIndex()`
3. **Soft delete only** - Use `isActive: false`, never hard delete
4. **Client components only** - All components need `"use client"` directive
5. **Turbopack is required** - Don't remove `--turbopack` from npm scripts
6. **Respect provider hierarchy** - Order in `app/layout.tsx` is load-bearing
7. **No REST APIs** - All data operations go through Convex queries/mutations

## Performance Optimization Guidelines

### CRITICAL: Avoid N+1 Query Problems

**Never do this:**
```typescript
// ❌ BAD: Database call inside loop
for (const message of allMessages) {
  const partner = await ctx.db.get(message.senderId); // DB call per iteration!
}
```

**Always do this:**
```typescript
// ✅ GOOD: Batch fetch first, then use lookup
const partnerIds = new Set(allMessages.map(m => m.senderId));
const partners = await Promise.all(
  Array.from(partnerIds).map(id => ctx.db.get(id))
);
const partnerMap = new Map(partners.map(p => [p._id, p]));
// Now use map for instant lookups
```

See `PERFORMANCE_AUDIT.md` for identified bottlenecks and fixes.

### Pagination Best Practices

**Use Convex native pagination:**
```typescript
// ✅ Efficient: Uses database-level pagination
export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

// Frontend usage
const { results, status, loadMore } = usePaginatedQuery(
  api.students.list,
  {},
  { initialNumItems: 20 }
);
```

**Don't do this:**
```typescript
// ❌ Inefficient: Loads everything, then slices
const all = await ctx.db.query("students").collect();
return all.slice(cursor, cursor + pageSize);
```

### Query Optimization Rules

1. **Filter server-side, not client-side:**
```typescript
// ❌ BAD: Loads all, filters in memory
const allUsers = useQuery(api.users.list, {});
const teachers = allUsers?.filter(u => u.role === "teacher");

// ✅ GOOD: Filter at database level
const teachers = useQuery(api.users.list, { role: "teacher" });
```

2. **Batch related queries:**
```typescript
// ❌ BAD: Separate query per item in list
{classes.map(c => {
  const student = useQuery(api.students.getById, { id: c.studentId });
  // Creates N queries for N classes!
})}

// ✅ GOOD: Single compound query
const classesWithDetails = useQuery(api.classes.listWithDetails, { teacherId });
```

3. **Use compound indexes for multi-field queries:**
```typescript
// Schema must have compound index
.index("by_school_and_date", ["schoolId", "scheduledDate"])

// Query uses both fields efficiently
await ctx.db
  .query("classes")
  .withIndex("by_school_and_date", (q) =>
    q.eq("schoolId", schoolId)
     .gte("scheduledDate", startDate)
  )
  .collect();
```

## Known Issues & Incomplete Features

### YouTube Downloader
- **Status:** ✅ **Fully functional as helper tool**
- Component at `components/youtube-downloader.tsx` validates YouTube URLs
- Opens Y2Mate website for download assistance (pragmatic solution)
- **Why not full backend:** YouTube downloading requires external service (yt-dlp cannot run in Convex edge functions)
- **Design decision:** Current approach is legal-safe and works well for educational purposes
- Integrated in `teacher-helper.tsx` with tab interface

### Push Notifications
- **Status:** Schema fields exist but system not implemented
- `pushSubscription` field in users table is placeholder
- Service worker registration exists but no actual worker file
- Requires `public/sw.js` and subscription flow

### Pagination
- **Status:** ✅ **Backend fixed with native Convex API**
- `convex/pagination.ts` now uses efficient `.paginate()` method
- **Action needed:** Components need migration to `usePaginatedQuery` hook
- See `OPTIMIZATION_CHANGELOG.md` for implementation guide

## Key Files for Reference

- `convex/schema.ts` - Database schema with all indexes
- `app/layout.tsx` - Provider hierarchy (critical ordering)
- `lib/language-context.tsx` - Bilingual translation pattern
- `lib/data-context.tsx` - Shared data provider (reduces duplicate queries)
- `components/notification-form.tsx` - Standard form pattern
- `convex/classes.ts` - State machine, workflow, and compound queries
- `convex/messages.ts` - Batch fetching pattern (N+1 fix)
- `convex/pagination.ts` - Native Convex pagination
- `convex/students.ts` - Unique ID generation pattern
- `convex/crons.ts` - Scheduled job implementation
- `DEPLOYMENT.md` - Production deployment guide
- `ARCHITECTURE.md` - System diagrams and data flows
- `PERFORMANCE_AUDIT.md` - Bottlenecks, optimizations, and incomplete features
- `OPTIMIZATION_CHANGELOG.md` - Complete optimization history
