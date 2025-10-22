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

## ðŸ"‹ Common Patterns & Examples

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

### Collapsible Optional Fields Pattern
**For forms with many optional fields, use collapsible sections:**
```tsx
const [showOptionalFields, setShowOptionalFields] = useState(false);

// Button to toggle
<button onClick={() => setShowOptionalFields(!showOptionalFields)}>
  {showOptionalFields ? <ChevronUp /> : <ChevronDown />}
  {t("Optional Fields", "à¸Ÿà¸µà¸¥à¸"à¹Œà¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡")}
</button>

// Collapsible section
{showOptionalFields && (
  <div className="space-y-4">
    {/* Optional fields here */}
  </div>
)}
```
**See:** `components/student-management.tsx` (11 optional fields), `components/class-booking.tsx` (10 optional fields)

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
Teacher books â†' "pending" 
  â†' Moderator acknowledges â†' "acknowledged" 
    â†' Moderator approves/rejects â†' "approved"/"rejected"
```

**Exception:** Guardian-linked classes (`isGuardianLinked: true`) auto-approve, skip moderator notification.

**See:** `convex/classes.ts` for workflow implementation.

### Multi-Date Booking Pattern
```tsx
// State for multi-date selection
const [useMultiDate, setUseMultiDate] = useState(false);
const [selectedDates, setSelectedDates] = useState<number[]>([]);

// Toggle between single and multi-date mode
<button onClick={() => {
  setUseMultiDate(!useMultiDate);
  if (!useMultiDate) {
    setSelectedDateTimestamp(null);
    setShowCalendar(true);
  } else {
    setSelectedDates([]);
  }
}}>
  {useMultiDate ? t("← Single Date", "← วันเดียว") : t("+ Multiple Dates", "+ หลายวัน")}
</button>

// Batch booking for all selected dates
const bookingPromises = selectedDates.map(timestamp =>
  bookClass({ /* args */, scheduledDate: timestamp })
);
await Promise.all(bookingPromises);
```
**See:** `components/class-booking.tsx`, `components/multi-date-calendar.tsx`

### Edit Audit Trail Pattern
**Track all changes with full edit history:**
```tsx
// Schema fields
isEdited: v.optional(v.boolean()),
lastEditedAt: v.optional(v.number()),
lastEditedBy: v.optional(v.id("users")),
editHistory: v.optional(v.array(v.object({
  editedAt: v.number(),
  editedBy: v.id("users"),
  editedByName: v.string(),
  editedByRole: v.string(),
  changes: v.array(v.object({
    field: v.string(),
    oldValue: v.string(),
    newValue: v.string(),
  })),
}))),

// Mutation pattern
const changes = [];
if (args.updates.studentId !== classData.studentId) {
  changes.push({
    field: "student",
    oldValue: formatValue(classData.studentId),
    newValue: formatValue(args.updates.studentId),
  });
}
// ... track all changes

await ctx.db.patch(classId, {
  ...args.updates,
  isEdited: true,
  lastEditedAt: Date.now(),
  lastEditedBy: userId,
  editHistory: [...existing, { editedAt, editedBy, changes }],
});
```
**See:** `convex/classes.ts` editClass mutation, `components/edit-class-modal.tsx`

### Login Modal Triggers Pattern
**Automatically show modals on login based on conditions:**
```tsx
// State
const [showPostClassNotes, setShowPostClassNotes] = useState(false);
const [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);

// Queries
const classesNeedingFeedback = useQuery(api.postClassNotes.getClassesNeedingFeedback, 
  user?.role === "teacher" ? { userId: user._id } : "skip"
);
const activeUpdate = useQuery(api.appUpdates.getActive);
const hasViewedUpdate = useQuery(api.appUpdates.hasUserViewed, 
  user && activeUpdate ? { userId: user._id, updateId: activeUpdate._id } : "skip"
);

// Auto-trigger after login
useEffect(() => {
  if (user?.role === "teacher" && classesNeedingFeedback?.length > 0 && !showPasswordChange) {
    const timer = setTimeout(() => setShowPostClassNotes(true), 1000);
    return () => clearTimeout(timer);
  }
}, [user, classesNeedingFeedback, showPasswordChange]);

// Render modals
{showPostClassNotes && (
  <Suspense fallback={null}>
    <PostClassNotesModal 
      classes={classesNeedingFeedback} 
      onComplete={() => setShowPostClassNotes(false)}
    />
  </Suspense>
)}
```
**See:** `app/page.tsx` modal integration, `components/post-class-notes-modal.tsx`, `components/update-announcement-modal.tsx`

---
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
| `convex/classes.ts` | State machine, workflow, edit audit trail |
| `convex/students.ts` | Unique ID generation pattern |
| `convex/postClassNotes.ts` | Post-class feedback system |
| `convex/appUpdates.ts` | Update announcement system |
| `components/notification-form.tsx` | Standard form pattern |
| `components/class-booking.tsx` | Multi-date booking, optional fields, inline creation |
| `components/edit-class-modal.tsx` | Full edit modal with audit trail |
| `components/student-management.tsx` | Collapsible optional fields (11 fields) |
| `components/post-class-notes-modal.tsx` | Multi-class wizard pattern |
| `components/update-announcement-modal.tsx` | One-time view tracking pattern |
| `components/multi-date-calendar.tsx` | Multi-date selection component |
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
- Add collapsible optional fields sections (see `student-management.tsx`)
- Implement edit audit trails (see `classes.editClass` mutation)
- Add login-triggered modals (see `app/page.tsx`)

## âš ï¸ Risky Changes (Ask First)

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries

---

**For clarification on patterns, index names, or implementation examples, reference the files above or ask for specific file excerpts.**

