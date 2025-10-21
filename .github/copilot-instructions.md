# AI Agent Instructions â€” Evan's Class Tracker 4.5

Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. This guide covers critical patterns, workflows, and rules specific to this codebase.

---

## ðŸ—ï¸ Architecture Essentials

### Provider Hierarchy (Load-Bearing â€” DO NOT REORDER)
```tsx
// app/layout.tsx - This exact order is required
<ErrorBoundary>              // 1. Catches all errors
  <ConvexClientProvider>     // 2. DB connection (throws if no NEXT_PUBLIC_CONVEX_URL)
    <DeviceProvider>         // 3. Depends on Convex
      <DataProvider>         // 4. Shared data layer
        <LanguageProvider>   // 5. UI-only state (innermost)
```
**Why:** Each layer depends on outer layers. Reordering causes runtime failures. All components need `"use client"` directive.

### Convex Backend Architecture
- **Backend lives in `convex/`** - TypeScript functions that compile to edge functions
- **Schema is source of truth:** `convex/schema.ts` defines tables, indexes, and types
- **Never edit `convex/_generated/`** - auto-regenerated from schema
- **Client pattern:**
  ```tsx
  import { useQuery, useMutation } from "convex/react";
  import { api } from "@/convex/_generated/api";
  
  const data = useQuery(api.users.getCurrentUser);        // Real-time query
  const create = useMutation(api.students.create);        // Write operation
  await create({ firstName, lastName, schoolId, ... });
  ```

---

## ðŸ”’ Non-Negotiable Patterns

### 1. Bilingual-First Development
**Every user-facing string requires English + Thai:**

**Schema pattern:**
```typescript
// convex/schema.ts
title: v.string(),      // English
titleTh: v.string(),    // Thai
```

**Component usage:**
```tsx
// Import helper
const { t } = useLanguage();

// Forms need parallel inputs
<label>{t("Title (English)", "à¸«à¸±à¸§à¸‚à¹‰à¸­ (à¸­à¸±à¸‡à¸à¸¤à¸©)")}</label>
<input value={title} onChange={e => setTitle(e.target.value)} />
<input value={titleTh} onChange={e => setTitleTh(e.target.value)} />
```

**See:** `components/notification-form.tsx`, `lib/language-context.tsx`

### 2. Index-First Queries (Performance Critical)
**Always use `.withIndex()` to avoid table scans:**

```typescript
// âœ… CORRECT: Indexed query
const classes = await ctx.db
  .query("classes")
  .withIndex("by_school_and_date", q =>
    q.eq("schoolId", schoolId)
     .gte("scheduledDate", startDate)
  )
  .collect();

// âŒ WRONG: Table scan + in-memory filter
const all = await ctx.db.query("classes").collect();
return all.filter(c => c.schoolId === schoolId);
```

**Available indexes:** Check `convex/schema.ts` for `.index()` definitions.  
**See:** `convex/classes.ts` for compound index examples.

### 3. Avoid N+1 Query Problems
**NEVER query inside loops:**

```typescript
// âŒ BAD: DB call per iteration
for (const msg of messages) {
  const user = await ctx.db.get(msg.senderId);  // 100 messages = 100 queries!
}

// âœ… GOOD: Batch fetch + lookup map
const userIds = new Set(messages.map(m => m.senderId));
const users = await Promise.all([...userIds].map(id => ctx.db.get(id)));
const userMap = new Map(users.map(u => [u._id, u]));
// Now use userMap for instant lookups
```

**See:** `PERFORMANCE_AUDIT.md` for identified bottlenecks and fixes.

### 4. Soft Deletes Only
```typescript
// Schema pattern
isActive: v.boolean(),

// "Delete" operation
await ctx.db.patch(locationId, { isActive: false });

// Query active records
.withIndex("by_active", q => q.eq("isActive", true))
```

### 5. Unique Student IDs
Deterministic format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`  
Example: `AB12-JOSR-k9x2tz-X4J2`

**See:** `convex/students.ts` `generateStudentId()` â€” do not replace with UUID.

---

## âš™ï¸ Development Workflow

### Local Development (PowerShell)
```powershell
npm install              # Install dependencies
npx convex dev           # Start Convex FIRST (required!)
npm run dev              # Start Next.js with Turbopack
npx tsc --noEmit         # Typecheck
```

**Critical:** Convex must be running before Next.js starts.

### Build System
**Turbopack is required** - do not remove `--turbopack` flags:
```json
"dev": "next dev --turbopack",
"build": "next build --turbopack"
```

### Environment Setup
- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)
- Already in `.gitignore` â€” never commit
- Production: Set in Vercel dashboard

---

## ðŸ“‹ Common Patterns & Examples

### Form Submission Pattern
```tsx
const [title, setTitle] = useState("");
const [titleTh, setTitleTh] = useState("");
const create = useMutation(api.notifications.create);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await create({ title, titleTh, type: "info", ... });
  setTitle(""); setTitleTh(""); // Clear form
};
```
**No loading states needed** - Convex provides optimistic updates.

### Authentication Pattern
```tsx
const currentUser = useQuery(api.users.getCurrentUser);
const login = useMutation(api.users.login);

// Default password: Teacher{username}
// First login requires password change
if (currentUser?.requirePasswordChange) {
  // Show PasswordChangeDialog
}
```
Session stored in `sessionStorage` (not localStorage).

**CRITICAL:** This project uses **custom session-based authentication**, NOT Convex's built-in auth (`ctx.auth.getUserIdentity()`).

**Mutation pattern** - Always pass `userId` from client:
```tsx
// ❌ WRONG: Using Convex auth (will fail)
const identity = await ctx.auth.getUserIdentity();

// ✅ CORRECT: Accept userId as parameter
export const deleteClass = mutation({
  args: {
    userId: v.id("users"), // User performing the operation
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized");
    }
    // ... rest of logic
  }
});

// Client usage
await deleteClass({ userId, classId });
```

**Query pattern** - Pass `userId` for access control:
```tsx
// Queries that need auth also accept userId
const data = useQuery(api.exports.exportTeacherLogs, {
  userId: currentUser._id,
  teacherId: selectedTeacherId
});
```

### Class Booking State Machine
```
Teacher books â†’ "pending" 
  â†’ Moderator acknowledges â†’ "acknowledged" 
    â†’ Moderator approves/rejects â†’ "approved"/"rejected"
```

**Exception:** Guardian-linked classes (`isGuardianLinked: true`) auto-approve, skip moderator notification.

**See:** `convex/classes.ts` for workflow implementation.

---

## ðŸš¨ Forbidden Changes

1. **Do not reorder providers** in `app/layout.tsx`
2. **Do not edit** `convex/_generated/` files
3. **Do not remove `--turbopack`** from npm scripts
4. **Do not remove bilingual support** - every feature needs both languages
5. **Do not replace Convex** with REST/direct DB drivers
6. **Do not commit** `.env.local` or secrets

---

## ðŸ“‚ Key Files for Reference

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema, indexes (source of truth) |
| `app/layout.tsx` | Provider hierarchy (critical order) |
| `lib/language-context.tsx` | Bilingual helper (`t()` function) |
| `convex/classes.ts` | State machine, workflow, compound queries |
| `convex/students.ts` | Unique ID generation pattern |
| `components/notification-form.tsx` | Standard form pattern |
| `components/class-booking.tsx` | Inline creation, guardian logic |
| `PERFORMANCE_AUDIT.md` | N+1 fixes, bottlenecks |
| `DEPLOYMENT.md` | Production deployment guide |
| `ARCHITECTURE.md` | System diagrams, data flows |

---

## ðŸŽ¯ Safe Tasks for Agents

- Add bilingual fields to UI forms (parallel inputs + update mutation)
- Implement indexed Convex queries (match `.withIndex()` pattern)
- Create inline entity creation flows (see `class-booking.tsx`)
- Fix N+1 queries using batch fetch pattern
- Add soft delete logic to tables

## âš ï¸ Risky Changes (Ask First)

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries

---

**For clarification on patterns, index names, or implementation examples, reference the files above or ask for specific file excerpts.**

