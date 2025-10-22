# AI Agent Instructions — Evan's Class Tracker 4.5# AI Agent Instructions â€” Evan's Class Tracker 4.5



Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. Recent optimizations (Oct 2025) achieved 40-50% faster loads, 10-100x faster queries via N+1 elimination, and native database pagination.Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. This guide covers critical patterns, workflows, and rules specific to this codebase.



------



## 🗃️ Architecture Essentials## ðŸ—ï¸ Architecture Essentials



### Provider Hierarchy (Load-Bearing — DO NOT REORDER)### Provider Hierarchy (Load-Bearing â€” DO NOT REORDER)

```tsx```tsx

// app/layout.tsx - This exact order is required// app/layout.tsx - This exact order is required

<ErrorBoundary>              // 1. Catches all errors<ErrorBoundary>              // 1. Catches all errors

  <ConvexClientProvider>     // 2. DB connection (throws if no NEXT_PUBLIC_CONVEX_URL)  <ConvexClientProvider>     // 2. DB connection (throws if no NEXT_PUBLIC_CONVEX_URL)

    <DeviceProvider>         // 3. Depends on Convex    <DeviceProvider>         // 3. Depends on Convex

      <DataProvider>         // 4. Shared data layer      <DataProvider>         // 4. Shared data layer

        <LanguageProvider>   // 5. UI-only state (innermost)        <LanguageProvider>   // 5. UI-only state (innermost)

``````

**Why:** Each layer depends on outer layers. Reordering causes runtime failures. All components need `"use client"` directive.**Why:** Each layer depends on outer layers. Reordering causes runtime failures. All components need `"use client"` directive.



### Convex Backend Architecture### Convex Backend Architecture

- **Backend lives in `convex/`** - TypeScript functions compile to edge functions- **Backend lives in `convex/`** - TypeScript functions that compile to edge functions

- **Schema is source of truth:** `convex/schema.ts` defines tables, indexes, and types- **Schema is source of truth:** `convex/schema.ts` defines tables, indexes, and types

- **Never edit `convex/_generated/`** - auto-regenerated from schema- **Never edit `convex/_generated/`** - auto-regenerated from schema

- **Client pattern:**- **Client pattern:**

  ```tsx  ```tsx

  import { useQuery, useMutation } from "convex/react";  import { useQuery, useMutation } from "convex/react";

  import { api } from "@/convex/_generated/api";  import { api } from "@/convex/_generated/api";

    

  const data = useQuery(api.users.getCurrentUser);        // Real-time query  const data = useQuery(api.users.getCurrentUser);        // Real-time query

  const create = useMutation(api.students.create);        // Write operation  const create = useMutation(api.students.create);        // Write operation

  await create({ firstName, lastName, schoolId, ... });  await create({ firstName, lastName, schoolId, ... });

  ```  ```



------



## 🔒 Non-Negotiable Patterns## ðŸ”’ Non-Negotiable Patterns



### 1. Bilingual-First Development### 1. Bilingual-First Development

**Every user-facing string requires English + Thai:****Every user-facing string requires English + Thai:**



**Schema pattern:****Schema pattern:**

```typescript```typescript

// convex/schema.ts// convex/schema.ts

title: v.string(),      // Englishtitle: v.string(),      // English

titleTh: v.string(),    // ThaititleTh: v.string(),    // Thai

``````



**Component usage:****Component usage:**

```tsx```tsx

// Import helper// Import helper

const { t } = useLanguage();const { t } = useLanguage();



// Forms need parallel inputs// Forms need parallel inputs

<label>{t("Title (English)", "หัวข้อ (อังกฤษ)")}</label><label>{t("Title (English)", "à¸«à¸±à¸§à¸‚à¹‰à¸­ (à¸­à¸±à¸‡à¸à¸¤à¸©)")}</label>

<input value={title} onChange={e => setTitle(e.target.value)} /><input value={title} onChange={e => setTitle(e.target.value)} />

<input value={titleTh} onChange={e => setTitleTh(e.target.value)} /><input value={titleTh} onChange={e => setTitleTh(e.target.value)} />

``````



**See:** `components/notification-form.tsx`, `lib/language-context.tsx`**See:** `components/notification-form.tsx`, `lib/language-context.tsx`



### 2. Index-First Queries (Performance Critical)### 2. Index-First Queries (Performance Critical)

**Always use `.withIndex()` to avoid table scans:****Always use `.withIndex()` to avoid table scans:**



```typescript```typescript

// ✅ CORRECT: Indexed query// âœ… CORRECT: Indexed query

const classes = await ctx.dbconst classes = await ctx.db

  .query("classes")  .query("classes")

  .withIndex("by_school_and_date", q =>  .withIndex("by_school_and_date", q =>

    q.eq("schoolId", schoolId)    q.eq("schoolId", schoolId)

     .gte("scheduledDate", startDate)     .gte("scheduledDate", startDate)

  )  )

  .collect();  .collect();



// ❌ WRONG: Table scan + in-memory filter// âŒ WRONG: Table scan + in-memory filter

const all = await ctx.db.query("classes").collect();const all = await ctx.db.query("classes").collect();

return all.filter(c => c.schoolId === schoolId);return all.filter(c => c.schoolId === schoolId);

``````



**Available indexes:** Check `convex/schema.ts` for `.index()` definitions.  **Available indexes:** Check `convex/schema.ts` for `.index()` definitions.  

**See:** `convex/classes.ts` for compound index examples.**See:** `convex/classes.ts` for compound index examples.



### 3. Avoid N+1 Query Problems### 3. Avoid N+1 Query Problems

**NEVER query inside loops:****NEVER query inside loops:**



```typescript```typescript

// ❌ BAD: DB call per iteration// âŒ BAD: DB call per iteration

for (const msg of messages) {for (const msg of messages) {

  const user = await ctx.db.get(msg.senderId);  // 100 messages = 100 queries!  const user = await ctx.db.get(msg.senderId);  // 100 messages = 100 queries!

}}



// ✅ GOOD: Batch fetch + lookup map// âœ… GOOD: Batch fetch + lookup map

const userIds = new Set(messages.map(m => m.senderId));const userIds = new Set(messages.map(m => m.senderId));

const users = await Promise.all([...userIds].map(id => ctx.db.get(id)));const users = await Promise.all([...userIds].map(id => ctx.db.get(id)));

const userMap = new Map(users.map(u => [u._id, u]));const userMap = new Map(users.map(u => [u._id, u]));

// Now use userMap for instant lookups// Now use userMap for instant lookups

``````



**See:** `docs/OPTIMIZATION_ANALYSIS_2025.md` for identified bottlenecks and fixes.**See:** `PERFORMANCE_AUDIT.md` for identified bottlenecks and fixes.



### 4. Use Native Pagination for Large Datasets### 4. Soft Deletes Only

**Use Convex's `.paginate()` for efficient database-level pagination:**```typescript

// Schema pattern

```typescriptisActive: v.boolean(),

// ✅ CORRECT: Database pagination

export const listPaginated = query({// "Delete" operation

  args: {await ctx.db.patch(locationId, { isActive: false });

    schoolId: v.optional(v.id("schools")),

    paginationOpts: paginationOptsValidator,// Query active records

  },.withIndex("by_active", q => q.eq("isActive", true))

  handler: async (ctx, args) => {```

    return await ctx.db

      .query("students")### 5. Unique Student IDs

      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))Deterministic format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`  

      .order("desc")Example: `AB12-JOSR-k9x2tz-X4J2`

      .paginate(args.paginationOpts);

  },**See:** `convex/students.ts` `generateStudentId()` â€” do not replace with UUID.

});

---

// Client usage

const { results, continueCursor, status } = usePaginatedQuery(## âš™ï¸ Development Workflow

  api.pagination.listPaginated,

  { schoolId },### Local Development (PowerShell)

  { initialNumItems: 50 }```powershell

);npm install              # Install dependencies

```npx convex dev           # Start Convex FIRST (required!)

npm run dev              # Start Next.js with Turbopack

**See:** `convex/pagination.ts` for implementation patterns.npx tsc --noEmit         # Typecheck

```

### 5. Soft Deletes Only

```typescript**Critical:** Convex must be running before Next.js starts.

// Schema pattern

isActive: v.boolean(),### Build System

**Turbopack is required** - do not remove `--turbopack` flags:

// "Delete" operation```json

await ctx.db.patch(locationId, { isActive: false });"dev": "next dev --turbopack",

"build": "next build --turbopack"

// Query active records```

.withIndex("by_active", q => q.eq("isActive", true))

```### Environment Setup

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)

### 6. Unique Student IDs- Already in `.gitignore` â€” never commit

Deterministic format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`  - Production: Set in Vercel dashboard

Example: `AB12-JOSR-k9x2tz-X4J2`

---

**See:** `convex/students.ts` `generateStudentId()` — do not replace with UUID.

## ðŸ"‹ Common Patterns & Examples

---

### Form Submission Pattern

## ⚙️ Development Workflow```tsx

const [title, setTitle] = useState("");

### Local Development (PowerShell)const [titleTh, setTitleTh] = useState("");

```powershellconst create = useMutation(api.notifications.create);

npm install              # Install dependencies

npx convex dev           # Start Convex FIRST (required!)const handleSubmit = async (e: React.FormEvent) => {

npm run dev              # Start Next.js with Turbopack  e.preventDefault();

npx tsc --noEmit         # Typecheck  await create({ title, titleTh, type: "info", ... });

```  setTitle(""); setTitleTh(""); // Clear form

};

**Critical:** Convex must be running before Next.js starts.```

**No loading states needed** - Convex provides optimistic updates.

### Build System

**Turbopack is required** - do not remove `--turbopack` flags:### Collapsible Optional Fields Pattern

```json**For forms with many optional fields, use collapsible sections:**

"dev": "next dev --turbopack",```tsx

"build": "next build --turbopack"const [showOptionalFields, setShowOptionalFields] = useState(false);

```

// Button to toggle

### Environment Setup<button onClick={() => setShowOptionalFields(!showOptionalFields)}>

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)  {showOptionalFields ? <ChevronUp /> : <ChevronDown />}

- Already in `.gitignore` — never commit  {t("Optional Fields", "à¸Ÿà¸µà¸¥à¸"à¹Œà¹€à¸žà¸´à¹ˆà¸¡à¹€à¸•à¸´à¸¡")}

- Production: Set in Vercel dashboard</button>



---// Collapsible section

{showOptionalFields && (

## 📋 Common Patterns & Examples  <div className="space-y-4">

    {/* Optional fields here */}

### Toast Notification Pattern (Replaces alert())  </div>

**Custom toast system for bilingual, non-blocking notifications:**)}

```

```tsx**See:** `components/student-management.tsx` (11 optional fields), `components/class-booking.tsx` (10 optional fields)

import { toast } from "@/lib/toast";

### Authentication Pattern

// Success notification```tsx

toast.success("Class booked successfully", "จองคลาสสำเร็จ");const currentUser = useQuery(api.users.getCurrentUser);

const login = useMutation(api.users.login);

// Error with custom titles

toast.error(// Default password: Teacher{username}

  "Failed to delete class",// First login requires password change

  "ลบคลาสไม่สำเร็จ",if (currentUser?.requirePasswordChange) {

  "Delete Failed",  // Show PasswordChangeDialog

  "ลบไม่สำเร็จ"}

);```

Session stored in `sessionStorage` (not localStorage).

// Custom duration (default: 5000ms)

toast.show({**CRITICAL:** This project uses **custom session-based authentication**, NOT Convex's built-in auth (`ctx.auth.getUserIdentity()`).

  title: "Processing",

  titleTh: "กำลังดำเนินการ",**Mutation pattern** - Always pass `userId` from client:

  message: "Please wait...",```tsx

  messageTh: "โปรดรอสักครู่...",// ❌ WRONG: Using Convex auth (will fail)

  type: "info",const identity = await ctx.auth.getUserIdentity();

  duration: 10000,

});// ✅ CORRECT: Accept userId as parameter

```export const deleteClass = mutation({

  args: {

**Never use `alert()` or `confirm()`** - always use toast notifications.      userId: v.id("users"), // User performing the operation

**See:** `lib/toast.ts`, `components/desktop-notification-toast.tsx`, `app/page.tsx`    classId: v.id("classes"),

  },

### Rate Limiting Pattern  handler: async (ctx, args) => {

**Protect mutations from abuse:**    const user = await ctx.db.get(args.userId);

    if (!user || !["admin", "moderator"].includes(user.role)) {

```tsx      throw new Error("Unauthorized");

import { checkRateLimit, validateLength } from "./rateLimit";    }

    // ... rest of logic

export const createMessage = mutation({  }

  args: { /* ... */ },});

  handler: async (ctx, args) => {

    // Rate limit: 20 messages per minute// Client usage

    await checkRateLimit(ctx, {await deleteClass({ userId, classId });

      key: `message:${args.senderId}`,```

      limit: 20,

      windowMs: 60_000,**Query pattern** - Pass `userId` for access control:

    });```tsx

// Queries that need auth also accept userId

    // Validate input lengthconst data = useQuery(api.exports.exportTeacherLogs, {

    validateLength(args.content, 1, 1000, "Message");  userId: currentUser._id,

      teacherId: selectedTeacherId

    // ... rest of logic});

  }```

});

```### Class Booking State Machine

```

**See:** `convex/rateLimit.ts`, `convex/classes.ts` (30 bookings/min), `convex/messages.ts` (20 msgs/min)Teacher books â†' "pending" 

  â†' Moderator acknowledges â†' "acknowledged" 

### Form Submission Pattern    â†' Moderator approves/rejects â†' "approved"/"rejected"

```tsx```

const [title, setTitle] = useState("");

const [titleTh, setTitleTh] = useState("");**Exception:** Guardian-linked classes (`isGuardianLinked: true`) auto-approve, skip moderator notification.

const create = useMutation(api.notifications.create);

**See:** `convex/classes.ts` for workflow implementation.

const handleSubmit = async (e: React.FormEvent) => {

  e.preventDefault();### Multi-Date Booking Pattern

  try {```tsx

    await create({ title, titleTh, type: "info", ... });// State for multi-date selection

    toast.success("Created successfully", "สร้างสำเร็จ");const [useMultiDate, setUseMultiDate] = useState(false);

    setTitle(""); setTitleTh(""); // Clear formconst [selectedDates, setSelectedDates] = useState<number[]>([]);

  } catch (error) {

    toast.error("Failed to create", "สร้างไม่สำเร็จ");// Toggle between single and multi-date mode

  }<button onClick={() => {

};  setUseMultiDate(!useMultiDate);

```  if (!useMultiDate) {

**No loading states needed** - Convex provides optimistic updates.    setSelectedDateTimestamp(null);

    setShowCalendar(true);

### Collapsible Optional Fields Pattern  } else {

**For forms with many optional fields, use collapsible sections:**    setSelectedDates([]);

```tsx  }

const [showOptionalFields, setShowOptionalFields] = useState(false);}}>

  {useMultiDate ? t("← Single Date", "← วันเดียว") : t("+ Multiple Dates", "+ หลายวัน")}

// Button to toggle</button>

<button onClick={() => setShowOptionalFields(!showOptionalFields)}>

  {showOptionalFields ? <ChevronUp /> : <ChevronDown />}// Batch booking for all selected dates

  {t("Optional Fields", "ฟีลด์เพิ่มเติม")}const bookingPromises = selectedDates.map(timestamp =>

</button>  bookClass({ /* args */, scheduledDate: timestamp })

);

// Collapsible sectionawait Promise.all(bookingPromises);

{showOptionalFields && (```

  <div className="space-y-4">**See:** `components/class-booking.tsx`, `components/multi-date-calendar.tsx`

    {/* Optional fields here */}

  </div>### Edit Audit Trail Pattern

)}**Track all changes with full edit history:**

``````tsx

**See:** `components/student-management.tsx` (11 optional fields), `components/class-booking.tsx` (10 optional fields)// Schema fields

isEdited: v.optional(v.boolean()),

### Authentication PatternlastEditedAt: v.optional(v.number()),

```tsxlastEditedBy: v.optional(v.id("users")),

const currentUser = useQuery(api.users.getCurrentUser);editHistory: v.optional(v.array(v.object({

const login = useMutation(api.users.login);  editedAt: v.number(),

  editedBy: v.id("users"),

// Default password: Teacher{username}  editedByName: v.string(),

// First login requires password change  editedByRole: v.string(),

if (currentUser?.requirePasswordChange) {  changes: v.array(v.object({

  // Show PasswordChangeDialog    field: v.string(),

}    oldValue: v.string(),

```    newValue: v.string(),

Session stored in `sessionStorage` (not localStorage).  })),

}))),

**CRITICAL:** This project uses **custom session-based authentication**, NOT Convex's built-in auth (`ctx.auth.getUserIdentity()`).

// Mutation pattern

**Mutation pattern** - Always pass `userId` from client:const changes = [];

```tsxif (args.updates.studentId !== classData.studentId) {

// ❌ WRONG: Using Convex auth (will fail)  changes.push({

const identity = await ctx.auth.getUserIdentity();    field: "student",

    oldValue: formatValue(classData.studentId),

// ✅ CORRECT: Accept userId as parameter    newValue: formatValue(args.updates.studentId),

export const deleteClass = mutation({  });

  args: {}

    userId: v.id("users"), // User performing the operation// ... track all changes

    classId: v.id("classes"),

  },await ctx.db.patch(classId, {

  handler: async (ctx, args) => {  ...args.updates,

    const user = await ctx.db.get(args.userId);  isEdited: true,

    if (!user || !["admin", "moderator"].includes(user.role)) {  lastEditedAt: Date.now(),

      throw new Error("Unauthorized");  lastEditedBy: userId,

    }  editHistory: [...existing, { editedAt, editedBy, changes }],

    // ... rest of logic});

  }```

});**See:** `convex/classes.ts` editClass mutation, `components/edit-class-modal.tsx`



// Client usage### Login Modal Triggers Pattern

await deleteClass({ userId, classId });**Automatically show modals on login based on conditions:**

``````tsx

// State

**Query pattern** - Pass `userId` for access control:const [showPostClassNotes, setShowPostClassNotes] = useState(false);

```tsxconst [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);

// Queries that need auth also accept userId

const data = useQuery(api.exports.exportTeacherLogs, {// Queries

  userId: currentUser._id,const classesNeedingFeedback = useQuery(api.postClassNotes.getClassesNeedingFeedback, 

  teacherId: selectedTeacherId  user?.role === "teacher" ? { userId: user._id } : "skip"

}););

```const activeUpdate = useQuery(api.appUpdates.getActive);

const hasViewedUpdate = useQuery(api.appUpdates.hasUserViewed, 

### Class Booking State Machine  user && activeUpdate ? { userId: user._id, updateId: activeUpdate._id } : "skip"

```);

Teacher books → "pending" 

  → Moderator acknowledges → "acknowledged" // Auto-trigger after login

    → Moderator approves/rejects → "approved"/"rejected"useEffect(() => {

```  if (user?.role === "teacher" && classesNeedingFeedback?.length > 0 && !showPasswordChange) {

    const timer = setTimeout(() => setShowPostClassNotes(true), 1000);

**Exception:** Guardian-linked classes (`isGuardianLinked: true`) auto-approve, skip moderator notification.    return () => clearTimeout(timer);

  }

**See:** `convex/classes.ts` for workflow implementation.}, [user, classesNeedingFeedback, showPasswordChange]);



### Multi-Date Booking Pattern// Render modals

```tsx{showPostClassNotes && (

// State for multi-date selection  <Suspense fallback={null}>

const [useMultiDate, setUseMultiDate] = useState(false);    <PostClassNotesModal 

const [selectedDates, setSelectedDates] = useState<number[]>([]);      classes={classesNeedingFeedback} 

      onComplete={() => setShowPostClassNotes(false)}

// Toggle between single and multi-date mode    />

<button onClick={() => {  </Suspense>

  setUseMultiDate(!useMultiDate);)}

  if (!useMultiDate) {```

    setSelectedDateTimestamp(null);**See:** `app/page.tsx` modal integration, `components/post-class-notes-modal.tsx`, `components/update-announcement-modal.tsx`

    setShowCalendar(true);

  } else {---

    setSelectedDates([]);```

  }Teacher books â†’ "pending" 

}}>  â†’ Moderator acknowledges â†’ "acknowledged" 

  {useMultiDate ? t("← Single Date", "← วันเดียว") : t("+ Multiple Dates", "+ หลายวัน")}    â†’ Moderator approves/rejects â†’ "approved"/"rejected"

</button>```



// Batch booking for all selected dates**Exception:** Guardian-linked classes (`isGuardianLinked: true`) auto-approve, skip moderator notification.

const bookingPromises = selectedDates.map(timestamp =>

  bookClass({ /* args */, scheduledDate: timestamp })**See:** `convex/classes.ts` for workflow implementation.

);

await Promise.all(bookingPromises);---

```

**See:** `components/class-booking.tsx`, `components/multi-date-calendar.tsx`## ðŸš¨ Forbidden Changes



### Edit Audit Trail Pattern1. **Do not reorder providers** in `app/layout.tsx`

**Track all changes with full edit history:**2. **Do not edit** `convex/_generated/` files

```tsx3. **Do not remove `--turbopack`** from npm scripts

// Schema fields4. **Do not remove bilingual support** - every feature needs both languages

isEdited: v.optional(v.boolean()),5. **Do not replace Convex** with REST/direct DB drivers

lastEditedAt: v.optional(v.number()),6. **Do not commit** `.env.local` or secrets

lastEditedBy: v.optional(v.id("users")),

editHistory: v.optional(v.array(v.object({---

  editedAt: v.number(),

  editedBy: v.id("users"),## ðŸ“‚ Key Files for Reference

  editedByName: v.string(),

  editedByRole: v.string(),| File | Purpose |

  changes: v.array(v.object({|------|---------|

    field: v.string(),| `convex/schema.ts` | Database schema, indexes (source of truth) |

    oldValue: v.string(),| `app/layout.tsx` | Provider hierarchy (critical order) |

    newValue: v.string(),| `lib/language-context.tsx` | Bilingual helper (`t()` function) |

  })),| `convex/classes.ts` | State machine, workflow, edit audit trail |

}))),| `convex/students.ts` | Unique ID generation pattern |

| `convex/postClassNotes.ts` | Post-class feedback system |

// Mutation pattern| `convex/appUpdates.ts` | Update announcement system |

const changes = [];| `components/notification-form.tsx` | Standard form pattern |

if (args.updates.studentId !== classData.studentId) {| `components/class-booking.tsx` | Multi-date booking, optional fields, inline creation |

  changes.push({| `components/edit-class-modal.tsx` | Full edit modal with audit trail |

    field: "student",| `components/student-management.tsx` | Collapsible optional fields (11 fields) |

    oldValue: formatValue(classData.studentId),| `components/post-class-notes-modal.tsx` | Multi-class wizard pattern |

    newValue: formatValue(args.updates.studentId),| `components/update-announcement-modal.tsx` | One-time view tracking pattern |

  });| `components/multi-date-calendar.tsx` | Multi-date selection component |

}| `PERFORMANCE_AUDIT.md` | N+1 fixes, bottlenecks |

// ... track all changes| `DEPLOYMENT.md` | Production deployment guide |

| `ARCHITECTURE.md` | System diagrams, data flows |

await ctx.db.patch(classId, {

  ...args.updates,---

  isEdited: true,

  lastEditedAt: Date.now(),## ðŸŽ¯ Safe Tasks for Agents

  lastEditedBy: userId,

  editHistory: [...existing, { editedAt, editedBy, changes }],- Add bilingual fields to UI forms (parallel inputs + update mutation)

});- Implement indexed Convex queries (match `.withIndex()` pattern)

```- Create inline entity creation flows (see `class-booking.tsx`)

**See:** `convex/classes.ts` editClass mutation, `components/edit-class-modal.tsx`- Fix N+1 queries using batch fetch pattern

- Add soft delete logic to tables

### Login Modal Triggers Pattern- Add collapsible optional fields sections (see `student-management.tsx`)

**Automatically show modals on login based on conditions:**- Implement edit audit trails (see `classes.editClass` mutation)

```tsx- Add login-triggered modals (see `app/page.tsx`)

// State

const [showPostClassNotes, setShowPostClassNotes] = useState(false);## âš ï¸ Risky Changes (Ask First)

const [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);

- Changing provider order or removing ErrorBoundary

// Queries- Modifying schema indexes or student ID generation

const classesNeedingFeedback = useQuery(api.postClassNotes.getClassesNeedingFeedback, - Removing bilingual requirements

  user?.role === "teacher" ? { userId: user._id } : "skip"- Large-scale refactoring of Convex queries

);

const activeUpdate = useQuery(api.appUpdates.getActive);---

const hasViewedUpdate = useQuery(api.appUpdates.hasUserViewed, 

  user && activeUpdate ? { userId: user._id, updateId: activeUpdate._id } : "skip"**For clarification on patterns, index names, or implementation examples, reference the files above or ask for specific file excerpts.**

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

## 🚨 Forbidden Changes

1. **Do not reorder providers** in `app/layout.tsx`
2. **Do not edit** `convex/_generated/` files
3. **Do not remove `--turbopack`** from npm scripts
4. **Do not remove bilingual support** - every feature needs both languages
5. **Do not replace Convex** with REST/direct DB drivers
6. **Do not commit** `.env.local` or secrets
7. **Do not use `alert()` or `confirm()`** - use toast notifications
8. **Do not query in loops** - use batch fetching patterns

---

## 📂 Key Files for Reference

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Database schema, indexes (source of truth) |
| `app/layout.tsx` | Provider hierarchy (critical order) |
| `lib/language-context.tsx` | Bilingual helper (`t()` function) |
| `lib/toast.ts` | Toast notification manager (replaces alert) |
| `convex/classes.ts` | State machine, workflow, edit audit trail |
| `convex/students.ts` | Unique ID generation pattern |
| `convex/pagination.ts` | Native database pagination patterns |
| `convex/rateLimit.ts` | Rate limiting and input validation |
| `convex/postClassNotes.ts` | Post-class feedback system |
| `convex/appUpdates.ts` | Update announcement system |
| `components/notification-form.tsx` | Standard form pattern |
| `components/class-booking.tsx` | Multi-date booking, optional fields, inline creation |
| `components/edit-class-modal.tsx` | Full edit modal with audit trail |
| `components/student-management.tsx` | Collapsible optional fields (11 fields) |
| `components/post-class-notes-modal.tsx` | Multi-class wizard pattern |
| `components/update-announcement-modal.tsx` | One-time view tracking pattern |
| `components/multi-date-calendar.tsx` | Multi-date selection component |
| `components/desktop-notification-toast.tsx` | Toast UI component |
| `docs/OPTIMIZATION_ANALYSIS_2025.md` | N+1 fixes, performance improvements |
| `docs/ARCHITECTURE.md` | System diagrams, data flows |
| `README.md` | Setup, features, and quick start guide |

---

## 🎯 Safe Tasks for Agents

- Add bilingual fields to UI forms (parallel inputs + update mutation)
- Implement indexed Convex queries (match `.withIndex()` pattern)
- Create inline entity creation flows (see `class-booking.tsx`)
- Fix N+1 queries using batch fetch pattern
- Add soft delete logic to tables
- Add collapsible optional fields sections (see `student-management.tsx`)
- Implement edit audit trails (see `classes.editClass` mutation)
- Add login-triggered modals (see `app/page.tsx`)
- Add rate limiting to mutations (see `convex/rateLimit.ts`)
- Convert `alert()`/`confirm()` calls to toast notifications
- Implement pagination for large datasets (see `convex/pagination.ts`)

## ⚠️ Risky Changes (Ask First)

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries
- Changing authentication system
- Modifying rate limit values

---

**For clarification on patterns, index names, or implementation examples, reference the files above or ask for specific file excerpts.**
