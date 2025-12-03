## Non-Negotiable Patterns

### 1. Bilingual-First Development

**Developer-created UI needs English + Thai** - Bilingual applies to **developer-created headings and UI labels only**, NOT user-entered content. Users should NEVER be forced to enter data in both languages.

**What needs bilingual**:
- UI headings and labels (buttons, tabs, menu items)
- System-generated content (notifications, error messages)
- Schema fields like `title`/`titleTh` for admin/developer forms

**What does NOT need bilingual**:
- User-entered notes, reasons, descriptions
- Student names, teacher comments
- Free-form text inputs

Schema has `title` AND `titleTh` for system content. User content uses single-language fields.

```tsx
const { t } = useLanguage(); // Helper from lib/language-context.tsx
<h1>{t("Book Class", "จองคลาส")}</h1>

// For forms - use BilingualInput component (NEW Oct 2025)
import { BilingualInput } from "@/components/bilingual-input";

<BilingualInput
  labelEn="Location Name"
  labelTh="ชื่อสถานที่"
  valueEn={nameEn}
  valueTh={nameTh}
  onChangeEn={setNameEn}
  onChangeTh={setNameTh}
  type="text"
  required
/>
```

**BilingualInput benefits**:

- Automatic 300ms debouncing (50% fewer re-renders)
- Consistent dark mode styling
- Type-safe props
- Reduces 200+ lines of duplicate code across components

**Example**: `components/notification-form.tsx` and `components/bilingual-input.tsx`

### 2. Bilingual Validation Pattern (CRITICAL - Updated Oct 2025)

**NEW STANDARD**: Use `&&` (AND) for optional bilingual inputs, not `||` (OR)

```typescript
// ✅ CORRECT - Requires AT LEAST ONE language
if (!nameEn.trim() && !nameTh.trim()) {
  toast.error("Please provide name in at least one language", 
              "กรุณากรอกชื่อในอย่างน้อยหนึ่งภาษา");
  return;
}

// ❌ WRONG - Requires BOTH languages (too strict!)
if (!nameEn.trim() || !nameTh.trim()) {
  // This forces users to fill both fields
  return;
}
```

**Logic explanation**:

- `||` (OR): True if EITHER empty → Requires BOTH filled
- `&&` (AND): True if BOTH empty → Requires AT LEAST ONE filled

**When to use**:

- **Use `&&`**: Location names, cancel reasons, postpone reasons, notification messages
- **Use `||`**: Only when backend absolutely requires both (check schema first!)

**Related**: See `IMPLEMENTATION_SUMMARY_UX_FIXES_OCT_25_2025.md` for validation pattern migration

### 3. Index-First Queries (Performance Critical)

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

### 4. Avoid N+1 Query Problems

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

**Performance Best Practices**:

1. **Always use indexed queries** - check schema for `.index()` definitions
2. **Batch data fetching** - use `Promise.all()` for parallel queries
3. **Use Map for lookups** - `Map` is O(1), array `.find()` is O(n)
4. **Debounce user input** - see `BilingualInput` (300ms debounce)
5. **Memoize expensive calculations** - use `useMemo` for derived data
6. **Paginate large lists** - see `convex/pagination.ts` pattern
7. **Use "skip" for conditional queries** - prevents unnecessary queries
8. **Profile with React DevTools** - identify unnecessary re-renders

**Example: Optimized Data Flow**

```typescript
// ❌ BAD - N+1 queries (100 iterations = 100 queries)
const classes = await ctx.db.query("classes").collect();
for (const c of classes) {
  const student = await ctx.db.get(c.studentId); // N+1!
  const school = await ctx.db.get(c.schoolId);   // N+1!
}

// ✅ GOOD - Batch fetch with Map lookup (3 queries total)
const classes = await ctx.db.query("classes").collect();

// Batch fetch students
const studentIds = [...new Set(classes.map(c => c.studentId))];
const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
const studentMap = new Map(students.map(s => [s._id, s]));

// Batch fetch schools
const schoolIds = [...new Set(classes.map(c => c.schoolId))];
const schools = await Promise.all(schoolIds.map(id => ctx.db.get(id)));
const schoolMap = new Map(schools.map(s => [s._id, s]));

// O(1) lookups
for (const c of classes) {
  const student = studentMap.get(c.studentId);
  const school = schoolMap.get(c.schoolId);
}
```

### 5. Toast Notifications (Replace alert/confirm)

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

### 6. Rate Limiting on Mutations

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

### 7. Unique Student IDs (Do Not Replace)

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

**Special cases** (Oct 2025 updates):

- **Empty lastName**: Allowed for Thai students with single names/nicknames
- **Duplicate prevention**: Backend blocks students with same firstName + lastName + grade + class + school
- **Name validation**: Max 100 characters per field (prevents overflow)

### 8. Class Booking State Machine

```
Teacher books → "pending"
  ↓
Moderator acknowledges → "acknowledged"
  ↓
Moderator approves/rejects → "approved"/"rejected"

EXCEPTION: isGuardianLinked: true → auto-approve (bypasses moderator)
```

See `convex/classes.ts` for state transitions and validation.

### 9. Soft Deletes (No Hard Deletes)

Use `isActive` boolean instead of deleting records.

```typescript
// Query only active records
ctx.db.query("teacherResources")
  .withIndex("by_active", q => q.eq("isActive", true))
  .collect()

// Soft delete
await ctx.db.patch(resourceId, { isActive: false });
```

### 10. Image Upload Pattern (Convex Storage)

**For image uploads**, use the `useMutation` hook with `api.files.generateUploadUrl` to get a short-lived upload URL.

```tsx
// 1. Get the upload URL from Convex
const generateUploadUrl = useMutation(api.files.generateUploadUrl);
const uploadUrl = await generateUploadUrl();

// 2. Upload the file to the URL
const result = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});

// 3. Get the storage ID from the response
const { storageId } = await result.json();

// 4. Store the storageId in the database
await storeImage({ storageId, ... });
```

**Key points**:

- The upload URL is valid for a short period.
- The `storageId` is the reference to the uploaded file in Convex's `_storage` table.
- This pattern is used in `components/image-upload/index.tsx`.

### 11. File Upload Pattern (Convex Storage)

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

### 12. Login Security Pattern (Account Lockout)

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

### 13. Bulk Deletion Pattern (Security-Critical)

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

### 14. Audit Logging Pattern

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

### 15. Teacher Cycle Editor Pattern (NEW Oct 2025)

**Nested modal with confirmation flow** for moderators/admins to edit teacher ClassCount cycles:

```tsx
// Parent modal (teacher-class-count-modal.tsx)
const [showCycleEditor, setShowCycleEditor] = useState(false);

// Escape key handler - prevents conflicts with parent modal
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" && showCycleEditor) {
      setShowCycleEditor(false); // Only closes nested modal
    }
  };
  if (showCycleEditor) {
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }
}, [showCycleEditor]);

// Nested modal with higher z-index (z-60 > z-50)
{showCycleEditor && (
  <div className="fixed inset-0 z-[60]" role="dialog">
    <TeacherCycleEditor
      teacherId={teacherId}
      moderatorId={moderatorId}
      onComplete={() => setShowCycleEditor(false)}
    />
  </div>
)}
```

**Backend confirmation pattern** (teacherClassCount.ts):

```typescript
export const setTeacherCycle = mutation({
  args: {
    teacherId: v.id("users"),
    cycleStartDate: v.number(),
    cycleEndDate: v.number(),
    confirmed: v.optional(v.boolean()), // For override confirmation
    moderatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check for existing active cycle
    const existingCycle = await ctx.db
      .query("teacherClassCountCycles")
      .withIndex("by_teacher_and_active", q => 
        q.eq("teacherId", args.teacherId).eq("isActive", true))
      .first();

    // Require confirmation if replacing existing cycle
    if (existingCycle && !args.confirmed) {
      return {
        requiresConfirmation: true,
        existingCycle: {
          startDate: existingCycle.cycleStartDate,
          endDate: existingCycle.cycleEndDate,
        },
      };
    }

    // Deactivate existing cycle (soft delete)
    if (existingCycle) {
      await ctx.db.patch(existingCycle._id, { isActive: false });
    }

    // Create new cycle
    await ctx.db.insert("teacherClassCountCycles", { ... });
  }
});
```

**Key features**:

- **Auto-focus**: First input field auto-focused on mount (accessibility)
- **Confirmation flow**: Warns before replacing existing cycle
- **Role-based access**: Only moderators/admins see "Edit Cycle" button
- **Visual indicator**: Active cycle shown with gradient UI banner
- **Accessibility**: ARIA labels, escape key handling, keyboard navigation

**Example**: See `components/teacher-cycle-editor.tsx` and `IMPLEMENTATION_SUMMARY_CYCLE_EDITOR.md`

### 16. Guardian Student Booking Pattern (NEW Oct 2025) ⚠️ DEPRECATED

**⚠️ DEPRECATED**: Guardian role migrated to Provider system (Oct 2025). Use `providers` table instead of guardian role for new implementations. This pattern remains documented for legacy data support.

**Guardian-linked students bypass moderator approval** - auto-approved bookings for private tutoring.

```typescript
// Guardian student ID format: {AREA}-{NAME}-{BIRTHDATE}-{RANDOM}
// Example: BKK01-JATH-19920115-X7Y2

// ID generation routing (convex/students.ts)
if (args.dateOfBirth && args.area) {
  // Guardian student - requires birthDate and area
  studentId = generateGuardianStudentId(firstName, lastName, dateOfBirth, area);
} else {
  // School student - timestamp-based
  studentId = generateStudentId(firstName, lastName, schoolId);
}
```

**Key differences** from school students:

- **Auto-approval**: Classes with `isGuardianLinked: true` bypass moderator workflow
- **Required fields**: `dateOfBirth` and `area` (teaching location)
- **Optional schoolId**: Guardian students can exist without school association
- **Unique validation**: Prevents duplicates by name + birthDate + area combination
- **Visual distinction**: Purple badges in UI, separate selector section

**Duplicate prevention pattern**:

```typescript
// Check for existing guardian student (convex/students.ts)
const existingGuardianStudent = await ctx.db
  .query("students")
  .withIndex("by_area", q => q.eq("area", args.area))
  .filter(q => 
    q.and(
      q.eq(q.field("firstName"), args.firstName),
      q.eq(q.field("lastName"), args.lastName),
      q.eq(q.field("dateOfBirth"), args.dateOfBirth)
    )
  )
  .first();
```

**Class booking with guardian**:

```typescript
// Guardian-linked booking auto-approves
await ctx.db.insert("classes", {
  teacherId,
  studentId,
  isGuardianLinked: true,
  guardianTitle: "Parent", // Relationship description
  status: "approved", // Skip pending/acknowledged states
  // ... other fields
});
```

**Example**: See `IMPLEMENTATION_SUMMARY_GUARDIAN_BOOKING_OCT_28_2025.md` for full implementation

### 17. Recurring Weekly Bookings Pattern (NEW Oct 2025)

**Teachers can book the same class weekly** for up to 52 weeks (full school year).

```tsx
// Component state (components/class-booking.tsx)
const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);

<Checkbox
  labelEn="Repeat weekly"
  labelTh="ทำซ้ำรายสัปดาห์"
  checked={isRecurringWeekly}
  onCheckedChange={setIsRecurringWeekly}
/>

{isRecurringWeekly && (
  <div className="space-y-4">
    <Input
      labelEn="Number of weeks"
      labelTh="จำนวนสัปดาห์"
      type="number"
      min={1}
      max={52}
      {...register("weekCount", { valueAsNumber: true })}
    />
    <Select
      labelEn="Select day(s)"
      labelTh="เลือกวัน"
      multiple
      options={[
        { value: "mon", labelEn: "Monday", labelTh: "วันจันทร์" },
        { value: "tue", labelEn: "Tuesday", labelTh: "วันอังคาร" },
        // ... other days
      ]}
      {...register("repeatDays")}
    />
  </div>
)}
```

**Key features**:

- **Repeat toggle**: Checkbox to enable/disable weekly repetition
- **Week count input**: Number input for total weeks (1-52)
- **Day selector**: Multi-select for choosing days of the week
- **Validation**: Ensure at least one day is selected, week count > 0

**Example**: See `components/class-booking.tsx` for implementation

### 18. Modal Accordion Pattern (NEW Oct 2025)

**Use accordions for optional form sections** to prevent UI bloat and scrolling issues.

```tsx
import { ChevronDown, ChevronUp } from "lucide-react";

// State
const [showSection, setShowSection] = useState(false);

// UI Pattern
<div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
  <button
    type="button"
    onClick={() => setShowSection(!showSection)}
    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
  >
    <span className="font-medium flex items-center gap-2">
      {t("Section Title (Optional)", "หวขอ (ไมบงคบ)")}
      <span className="text-xs text-gray-500">{t("Click to expand", "คลกเพอขยาย")}</span>
    </span>
    {showSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
  </button>
  {showSection && (
    <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
      {/* Collapsed content */}
    </div>
  )}
</div>
```

**When to use**:

- Optional form fields (Notes, Homework, Additional Info)
- Sections users don't need 80% of the time
- Mobile forms with many fields
- Any content that creates scrolling issues

**Benefits**:

- Reduces form height by 50-70%
- Improves mobile UX dramatically
- Decreases cognitive load
- Maintains all functionality

**Example**: `components/post-class-notes-modal.tsx` - Notes and Homework sections

### 19. Modal Flex Layout Pattern (NEW Oct 2025)

**Avoid nested scrolling and fixed heights** in modals using flex layout with sticky sections.

```tsx
//  WRONG - Nested scrolling
<div className="fixed inset-0 overflow-y-auto"> {/* Backdrop scrolls */}
  <div className="max-h-[90vh] overflow-y-auto"> {/* Modal scrolls */}
    <div className="max-h-96 overflow-y-auto"> {/* Content scrolls! */}
      {content}
    </div>
  </div>
</div>

//  CORRECT - Flex layout with single scroll
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[95vh]">
    {/* Sticky Header */}
    <div className="p-6 border-b bg-white dark:bg-gray-800">
      <h2>Modal Title</h2>
    </div>
    
    {/* Scrollable Content - SINGLE scroll area */}
    <div className="overflow-y-auto flex-grow p-6">
      {content}
    </div>
    
    {/* Sticky Footer */}
    <div className="p-6 border-t bg-white dark:bg-gray-800">
      <button>Submit</button>
    </div>
  </div>
</div>
```

**Key principles**:

- ONE scroll area per modal (`overflow-y-auto` on content only)
- Use `flex flex-col` on modal container
- Use `flex-grow` on scrollable content
- Use `max-h-[95vh]` instead of `max-h-[90vh]` (more space)
- Sticky header/footer with explicit background colors
- NEVER `overflow-y-auto` on backdrop/overlay
- NEVER nest multiple `overflow-y-auto` containers
- NEVER use fixed pixel heights like `max-h-[500px]`

**Examples**:

- `components/post-class-notes-modal.tsx`
- `components/teacher-class-count-modal.tsx`

**Related**: See `UI_SCROLL_FIX_VISUAL_GUIDE.md` for before/after visual comparisons

### 20. Pagination Pattern (NEW Oct 2025)

**Replace vertical scrolling with horizontal pagination** for large datasets to dramatically reduce DOM complexity.

```tsx
import { PaginatedList } from "@/components/paginated-list";

// Usage
<PaginatedList
  items={students}
  itemsPerPage={15}
  renderItem={(student) => (
    <StudentCard key={student._id} student={student} />
  )}
  emptyMessageEn="No students found"
  emptyMessageTh="ไม่พบนักเรียน"
  showPageInfo={true}
  showJumpButtons={true}
/>
```

**Features**:

- **85-96% DOM reduction** (2,847 → 412 nodes for 100 items)
- **64% less memory** (87.3 MB → 31.2 MB)
- **33% faster loads** on mobile (4.2s → 2.8s)
- Keyboard navigation (Arrow keys, Home, End)
- ARIA labels for screen readers
- Bilingual support (EN/TH)
- Responsive design
- Customizable items per page

**When to use**:

- Lists with 20+ items (students, audit logs, notifications)
- Tables with heavy DOM (many columns/rows)
- Mobile-heavy applications
- Performance-critical views
- Any component with vertical scroll

**Performance Impact**:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| DOM Nodes (100 items) | 2,847 | 412 | -85.5% |
| Memory Usage | 87.3 MB | 31.2 MB | -64.3% |
| Page Load (3G) | 4.2s | 2.8s | -33% |
| Scroll FPS | 42 | 60 | +42.9% |

**Example**: `components/student-management.tsx`, `components/audit-logs.tsx`

**Component**: `components/paginated-list.tsx` (228 lines, fully reusable)

### 21. Collapsible Section Pattern (NEW Oct 2025)

**Reduce form height and cognitive load** by collapsing optional fields into expandable sections.

```tsx
import { CollapsibleSection } from "@/components/collapsible-section";

// Usage
<CollapsibleSection
  titleEn="Additional Information (Optional)"
  titleTh="ข้อมูลเพิ่มเติม (ไม่บังคับ)"
  defaultOpen={false}
>
  <div className="space-y-4">
    <input name="nickname" placeholder="Nickname" />
    <input name="parentPhone" placeholder="Parent Phone" />
    <textarea name="notes" placeholder="Additional Notes" />
  </div>
</CollapsibleSection>
```

**Features**:

- **50-70% form height reduction**
- **61 lines of code eliminated** (replaced with reusable component)
- Smooth expand/collapse toggle
- Custom icons and badges support
- Bilingual titles
- Dark mode support
- ARIA expanded state
- Keyboard accessible

**When to use**:

- Optional form fields (birthdate, phone, email, notes)
- Secondary information (homework, materials, preparation)
- Advanced settings
- Mobile forms with many fields
- Any section users don't need 80% of the time

**Benefits**:

- Cleaner initial view (focus on required fields)
- Less scrolling (especially mobile)
- Reduced cognitive load
- Better UX for optional vs required distinction
- Maintains all functionality when expanded

**Code Reduction**:

- **Before**: 45 lines of custom collapsible logic per component
- **After**: 12 lines using CollapsibleSection
- **Net savings**: 33 lines per usage × 2 components = 66 lines eliminated

**Examples**:

- `components/student-management.tsx` - Optional student fields
- `components/class-booking.tsx` - Optional class fields

**Component**: `components/collapsible-section.tsx` (109 lines, fully reusable)

### 22. Visual Bloat Fix Pattern (NEW Oct 2025)

**Critical UX fix: Prevent Windows taskbar from hiding modal buttons**

**Problem**: Modals using `max-h-[95vh]` exceeded available viewport on 1080p displays after accounting for browser chrome (40px) + Windows taskbar (48px), resulting in buttons being cut off below the taskbar.

**Solution**: Multi-phase emergency initiative that standardized modal heights and responsive padding across all 20+ modal components.

```tsx
// ❌ WRONG - Causes taskbar cutoff on 1080p
<div className="max-w-2xl w-full max-h-[95vh] overflow-y-auto p-6">
  {/* Modal content */}
</div>

// ✅ CORRECT - Visual Bloat Fix Pattern
<div className="max-w-2xl w-full flex flex-col max-h-[85vh]">
  {/* Sticky Header */}
  <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800">
    <h2>Modal Title</h2>
  </div>
  
  {/* Scrollable Content */}
  <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-4 md:space-y-6">
    {content}
  </div>
  
  {/* Sticky Footer */}
  <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800">
    <button>Submit</button>
  </div>
</div>
```

**Key Changes** (4-phase implementation):

1. **Phase 1 - Height Fix**: `max-h-[95vh]` → `max-h-[85vh]` (108px reclaimed)
2. **Phase 2 - Responsive Padding**: `p-6` → `p-4 md:p-6` (16-32px saved on mobile)
3. **Phase 3 - Flex Layout**: Verify sticky header/footer with single scroll area
4. **Phase 4 - Spacing Optimization**: `space-y-6` → `space-y-4 md:space-y-6`, `gap-6` → `gap-3 md:gap-4`

**Space Reclaimed Per Modal**:

- **Mobile**: 156-212px vertical space
- **Desktop**: 108px vertical space
- **Taskbar Safety Margin**: +74px to +236px across resolutions (1080p to 4K)

**Critical Rules**:

- ✅ Use `max-h-[85vh]` for ALL modals (never 90vh or 95vh)
- ✅ Use responsive padding: `p-4 md:p-6` (not fixed `p-6`)
- ✅ Use responsive spacing: `space-y-4 md:space-y-6`, `gap-3 md:gap-4`
- ✅ Use `flex flex-col` layout with sticky header/footer
- ✅ Single scroll area on content only (`overflow-y-auto flex-grow`)
- ❌ NEVER use `max-h-[95vh]` or `max-h-[90vh]`
- ❌ NEVER use fixed padding on modals (`p-6` without responsive variant)
- ❌ NEVER nest multiple `overflow-y-auto` containers

**Performance Impact**:

| Resolution | Available Space | Modal Height | Safety Margin | Status |
|------------|-----------------|--------------|---------------|--------|
| 1080p      | 992px           | 918px        | +74px         | ✅ SAFE |
| 1440p      | 1352px          | 1224px       | +128px        | ✅ SAFE |
| 4K (2160p) | 2072px          | 1836px       | +236px        | ✅ SAFE |
| Mobile     | 844px           | 717px        | +127px        | ✅ SAFE |

**Files Modified** (20+ components):

- edit-class-modal.tsx
- merge-classes-modal.tsx
- post-class-notes-modal.tsx
- help-detail-modal.tsx
- class-conflict-modal.tsx
- teacher-class-count-modal.tsx
- class-detail-modal.tsx
- password-change-dialog.tsx
- location-proposal-form.tsx
- weekly-calendar.tsx
- student-management.tsx
- help-window.tsx
- startup-window.tsx
- update-announcement-modal.tsx
- desktop-notification-window.tsx
- admin-notification-windows.tsx
- admin-error-reports.tsx
- admin-contact-requests.tsx
- admin-contact-button.tsx
- class-count-modal.tsx

**Documentation**:

- `FINAL_IMPLEMENTATION_SUMMARY_BLOAT_FIX_OCT_29_2025.md` - Complete 4-phase summary
- `IMPLEMENTATION_SUMMARY_BLOAT_FIX_OCT_29_2025.md` - Phase 1 details
- `IMPLEMENTATION_SUMMARY_BLOAT_FIX_PHASE_2_OCT_29_2025.md` - Phase 2 details
- `IMPLEMENTATION_SUMMARY_BLOAT_FIX_PHASE_4_OCT_29_2025.md` - Phase 4 details

**User Impact**: Resolved critical UX complaint - "taskbar cuts off buttons and features and I can't complete tasks" ✅ **FIXED**

### 23. Provider System Pattern (NEW Oct 2025)

**Multi-Provider Architecture** replaces school-only model with flexible entity management.

**XOR Validation** - Entities must have EITHER `schoolId` OR `providerId` (not both, not neither):

```typescript
// Backend validation (students.ts, classes.ts)
const hasSchool = args.schoolId !== undefined;
const hasProvider = args.providerId !== undefined;

if (hasSchool && hasProvider) {
  throw new Error("Cannot link to both school and provider - choose one");
}
if (!hasSchool && !hasProvider) {
  throw new Error("Must link to either a school or a provider");
}
```

**Provider Categories**:

- `personal` - Teacher's private students
- `private` - Private tutoring companies
- `language_school` - Language learning centers
- `educational_camp` - Workshops, summer camps

**Role-Based Access**:

```typescript
// Teachers can create own providers
if (user.role === "teacher" && provider.createdBy !== user._id) {
  throw new Error("Teachers can only use their own providers");
}

// Moderators are school-scoped only (blocked from providers)
if (user.role === "moderator") {
  throw new Error("Moderators cannot create providers");
}

// Admins have full access
if (user.role === "admin") {
  // Can create/view/update any provider
}
```

**Auto-Approval Workflow**:

```typescript
// Provider classes skip moderator approval
const isProviderLinked = args.providerId !== undefined;
const status = isProviderLinked || isGuardianLinked || isModerator 
  ? "approved" 
  : "pending";

// Skip moderator notifications for provider classes
if (!isProviderLinked && !isGuardianLinked && !isModerator && school) {
  await createNotificationForModerator(school.moderatorId);
}
```

**Conditional Schema Fields**:

```typescript
// Use conditional spread for optional schoolId
await ctx.db.insert("classes", {
  teacherId: args.teacherId,
  ...(args.schoolId && { schoolId: args.schoolId }),
  ...(args.providerId && { providerId: args.providerId }),
  studentId: args.studentId,
  status,
  // ... other fields
});
```

**Conditional Database Queries**:

```typescript
// Handle optional schoolId in queries
const school = classData.schoolId 
  ? await ctx.db.get(classData.schoolId) 
  : null;

// Conditional logging (teacherLogs are school-scoped)
if (classData.schoolId) {
  await ctx.db.insert("teacherLogs", {
    teacherId: args.teacherId,
    schoolId: classData.schoolId, // Safe here
    action: "action_name",
    // ...
  });
}
```

**Student ID Generation**:

```typescript
// School students: SCHOOLHASH-NAMEHASH-TIMESTAMP-RANDOM
if (args.schoolId) {
  studentId = generateStudentId(firstName, lastName, args.schoolId);
}
// Provider students: NOSCHOOL-NAMEHASH-TIMESTAMP-RANDOM
else if (args.providerId) {
  studentId = generateStudentId(firstName, lastName, "NOSCHOOL");
}
// Guardian students: AREA-NAMEHASH-BIRTHDATE-RANDOM
else if (args.dateOfBirth && args.area) {
  studentId = generateGuardianStudentId(firstName, lastName, dateOfBirth, area);
}
```

**Batch Fetching Pattern** (Performance):

```typescript
// Collect unique provider IDs
const providerIds = [...new Set(classes.map(c => c.providerId).filter(Boolean))];

// Batch fetch (1 query instead of N)
const providers = await Promise.all(providerIds.map(id => ctx.db.get(id)));

// Create lookup map (O(1) access)
const providerMap = new Map(
  providers.filter(p => p !== null).map(p => [p!._id, p!])
);

// Use in aggregation
classes.forEach(c => {
  const provider = c.providerId ? providerMap.get(c.providerId) : null;
  const school = c.schoolId ? schoolMap.get(c.schoolId) : null;
  // Use provider?.name || school?.name for display
});
```

**Key Files**:

- `convex/providers.ts` - Full CRUD (~280 lines)
- `convex/schema.ts` - providers table, optional schoolId in 4 tables
- `convex/students.ts` - XOR validation, provider duplicate checks
- `convex/classes.ts` - XOR validation, auto-approval logic
- `convex/teacherClassCount.ts` - Provider aggregation

**Example**: See `IMPLEMENTATION_SUMMARY_PROVIDER_SYSTEM_OCT_30_2025.md` for full implementation

### 24. Ephemeral Calculator Pattern (NEW Oct 2025)

Security-first pattern for temporary calculations in the UI with zero database persistence. Used by the Class Payment Calculator.

```tsx
// ❌ WRONG - Never persist calculator data
// const saveCalculation = useMutation(api.calculations.save);

// ✅ CORRECT - All state is component-local and discarded on close
const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false);
const [rate, setRate] = useState<number>(0);
const [startDate, setStartDate] = useState<number>(Date.now());
const [endDate, setEndDate] = useState<number>(Date.now());

// Read-only query gated by disclaimer + selection
const classData = useQuery(
  api.teacherClassCount.getClassCountForPrint,
  acceptedDisclaimer ? { teacherId, startDate, endDate } : "skip"
);
```

Key rules:

- Show a mandatory disclaimer before any calculation begins.
- Never call mutations from the calculator; use read-only queries only when necessary.
- Keep all inputs in local React state; unmounting the component must clear all data.
- Provide a print-to-PDF option so users can export results without saving to DB.
- Validate dates (start <= end) and numeric inputs (rate >= 0).
- Bilingual UI for all strings (EN/TH), using `useLanguage()` and `BilingualInput` when applicable.

Recommended UI structure:

- Flex modal layout with single scroll area (see Pattern #18) and height cap from Pattern #21.
- Header: Title + close; Content: disclaimer or calculator; Footer: Print and Close buttons.

Related files:

- `components/class-payment-calculator.tsx` – Payment calculator modal implementation
- `convex/teacherClassCount.ts` – Read-only query used for class data (no persistence)

### 25. Analytics Dashboard Pattern (NEW Nov 2025)

Performance metrics and reporting system with role-based access, optimized queries, and data export capabilities. Used by the Class Analytics Dashboard.

```tsx
// ✅ CORRECT - Role-based analytics with performance optimization
export const getSummaryAnalytics = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Get user to determine role
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    // 2. Date range defaults to last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const startDate = args.startDate || thirtyDaysAgo;
    const endDate = args.endDate || now;

    // 3. Query classes based on role with index
    let classes: Doc<"classes">[];
    if (user.role === "teacher") {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", q => q.eq("teacherId", args.userId))
        .filter(q => 
          q.and(
            q.gte(q.field("scheduledDate"), startDate),
            q.lte(q.field("scheduledDate"), endDate)
          )
        )
        .collect();
    } else if (user.role === "moderator" && user.schoolId) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_school_and_date", q =>
          q.eq("schoolId", user.schoolId).gte("scheduledDate", startDate)
        )
        .filter(q => q.lte(q.field("scheduledDate"), endDate))
        .collect();
    } else {
      // Admin sees all
      classes = await ctx.db
        .query("classes")
        .withIndex("by_scheduled_date", q => q.gte("scheduledDate", startDate))
        .filter(q => q.lte(q.field("scheduledDate"), endDate))
        .collect();
    }

    // 4. Batch fetch related data (prevents N+1)
    const studentIds = [...new Set(classes.map(c => c.studentId))];
    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const studentMap = new Map(students.map(s => [s._id, s]));

    // 5. Calculate metrics
    const totalClasses = classes.length;
    const attendedClasses = classes.filter(c => c.attended).length;
    const attendanceRate = totalClasses > 0 
      ? Math.round((attendedClasses / totalClasses) * 100) 
      : 0;
    
    return {
      totalClasses,
      attendanceRate,
      activeStudents: studentIds.length,
      avgClassCount: /* calculation */
    };
  }
});
```

**Frontend Pattern:**

```tsx
// ✅ CORRECT - Analytics modal with summary cards and data table
export function ClassAnalytics({ userId, onClose }: ClassAnalyticsProps) {
  const { t, language } = useLanguage();
  
  // Date range state (defaults to last 30 days)
  const [startDate, setStartDate] = useState<number>(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  const [endDate, setEndDate] = useState<number>(Date.now());

  // Fetch analytics data
  const summaryData = useQuery(api.analytics.getSummaryAnalytics, {
    userId,
    startDate,
    endDate,
  });

  const studentPerformanceData = useQuery(api.analytics.getStudentPerformance, {
    userId,
    startDate,
    endDate,
  });

  // CSV Export
  const handleExportCSV = () => {
    if (!studentPerformanceData) return;
    
    const headers = [
      language === "en" ? "Student Name" : "ชื่อนักเรียน",
      language === "en" ? "Total Classes" : "คลาสทั้งหมด",
      language === "en" ? "Attended" : "เข้าเรียน",
      language === "en" ? "Attendance Rate" : "อัตราเข้าเรียน",
      language === "en" ? "Avg ClassCount" : "ClassCount เฉลี่ย",
      language === "en" ? "Rating" : "การประเมิน"
    ];

    const rows = studentPerformanceData.map((student) => [
      student.studentName,
      student.totalClasses,
      student.attendedClasses,
      `${student.attendanceRate}%`,
      student.avgClassCount.toFixed(2),
      getRatingText(student.performanceRating)[language]
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `class-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-6xl w-full flex flex-col max-h-[85vh]">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Classes, Attendance Rate, Active Students, Avg ClassCount */}
        </div>
        
        {/* Student Performance Table */}
        <div className="overflow-y-auto flex-grow">
          <table className="w-full">
            {/* Color-coded ratings */}
          </table>
        </div>
        
        {/* Export Button */}
        <button onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          {t("Export CSV", "ส่งออก CSV")}
        </button>
      </div>
    </div>
  );
}
```

**Key Rules:**

1. **Role-Based Access**: Query only data user is authorized to see (teacher/moderator/admin)
2. **Index-Based Queries**: ALWAYS use `.withIndex()` to avoid table scans
3. **Batch Fetching**: Use `Promise.all()` and Map lookups to prevent N+1 queries
4. **Type Safety**: Use explicit `Doc<"classes">[]` type annotations
5. **Date Range Filtering**: Default to reasonable period (e.g., last 30 days)
6. **Performance Ratings**: Color-code metrics (green/blue/yellow) for quick insights
7. **CSV Export**: Provide bilingual headers and proper data formatting
8. **Empty States**: Handle zero data gracefully with user-friendly messages
9. **Loading States**: Show loading indicators during data fetch
10. **Responsive Design**: Mobile-friendly cards and tables

**Performance Optimizations**:

- Index-based queries reduce query time from seconds to milliseconds
- Batch fetching prevents N+1 problems (1 query instead of N queries)
- Map lookups provide O(1) access instead of O(n) array `.find()`
- Duration-based calculations (minutes / 60) computed server-side

**Related Files**:

- `components/class-analytics.tsx` – Analytics modal with summary cards and table
- `convex/analytics.ts` – Backend queries with role-based access control
- `components/class-booking.tsx` – Integration point (Analytics button)

**Integration Example**:

```tsx
// In class-booking.tsx
const [showAnalytics, setShowAnalytics] = useState(false);

<button onClick={() => setShowAnalytics(true)}>
  <BarChart3 className="w-5 h-5" />
  {t("Analytics", "การวิเคราะห์")}
</button>

{showAnalytics && (
  <ClassAnalytics 
    userId={currentUser._id} 
    onClose={() => setShowAnalytics(false)} 
  />
)}
```

**User Benefits**:

- Teachers: Track individual student performance and attendance
- Moderators: Monitor school-wide trends and teacher effectiveness
- Admins: System-wide insights for strategic decision-making

### 26. Wizard-Based Onboarding Pattern (NEW Nov 2025)

Multi-step guided workflows for feature discovery and onboarding. Used in the startup window for moderators/teachers.

**Purpose**: Reduce cognitive load and onboarding time by guiding users through complex workflows step-by-step.

**Structure**:

```tsx
type WizardStep = "step1" | "step2" | "step3" | "complete";

export function ExampleWizard({
  userId,
  userRole,
  userSchoolId,
  onComplete,
  onClose,
}: WizardProps) {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<WizardStep>("step1");
  const [selectedData, setSelectedData] = useState({});

  const handleNext = () => {
    if (currentStep === "step1" && isStep1Valid()) {
      setCurrentStep("step2");
    } else if (currentStep === "step2" && isStep2Valid()) {
      setCurrentStep("step3");
    } else if (currentStep === "step3" && isStep3Valid()) {
      onComplete(selectedData); // Pass collected data
    }
  };

  const handleBack = () => {
    if (currentStep === "step2") setCurrentStep("step1");
    else if (currentStep === "step3") setCurrentStep("step2");
  };

  const canProceed = () => {
    // Validation logic for current step
    return selectedData[currentStep] !== undefined;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 md:p-6 border-b">
          <h2>{t("Wizard Title", "ชื่อวิซาร์ด")}</h2>
          <p className="text-sm text-gray-600">{getStepTitle()}</p>
        </div>

        {/* Content - Single scroll area */}
        <div className="overflow-y-auto flex-grow p-4 md:p-6">
          {renderStepContent()}
        </div>

        {/* Footer - Sticky */}
        <div className="p-4 md:p-6 border-t flex justify-between">
          <button onClick={handleBack} disabled={currentStep === "step1"}>
            <ChevronLeft /> {t("Back", "ย้อนกลับ")}
          </button>
          <button onClick={handleNext} disabled={!canProceed()}>
            {t("Next", "ถัดไป")} <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Key Rules**:

1. **Single scroll area**: Only content section has `overflow-y-auto`
2. **Visual feedback**: Disable Next button until step is valid
3. **Bilingual throughout**: All text uses `t()` function
4. **Back navigation**: Always allow going back (except from first step)
5. **Progress indication**: Show current step in header subtitle
6. **Keyboard support**: Escape to close, Enter to proceed
7. **Role-based filtering**: Filter data based on user role/school
8. **Auto-complete**: Call `onComplete()` with collected data on final step

**Example Wizards** (Nov 2025):

1. **BookingWizard** (`components/booking-wizard.tsx`)
   - Select Teacher → Grade → Class → Booking Type
   - Once-off: 30-day calendar
   - Recurring: Week count + day/time selector
   - Completes to class booking form

2. **ClassCountReportWizard** (`components/class-count-report-wizard.tsx`)
   - Select Teacher → Date Range → View/Print
   - Completes to analytics modal

3. **MessageWizard** (`components/message-wizard.tsx`)
   - Select Recipients → Compose Message → Auto-send
   - Shows "Pending → Sent" animation
   - Auto-redirects to dashboard after 1.5s

**Integration in Startup Window**:

```tsx
const [showWizard, setShowWizard] = useState(false);

// In menu options
{
  id: "wizard-action",
  tab: "wizard-trigger",
  icon: Sparkles,
  title: t("Guided Action", "การดำเนินการแบบมีคำแนะนำ"),
  description: t("Step-by-step workflow", "ขั้นตอนการทำงานทีละขั้น"),
  roles: ["moderator", "teacher"],
}

// In handleOptionClick
if (tab === "wizard-trigger") {
  setShowWizard(true);
  return;
}

// In render
{showWizard && (
  <ExampleWizard
    userId={user._id}
    userRole={user.role}
    userSchoolId={user.schoolId}
    onComplete={(data) => {
      setShowWizard(false);
      handleClose(false);
      onNavigate("target-tab"); // Navigate after completion
    }}
    onClose={() => setShowWizard(false)}
  />
)}
```

**User Benefits**:

- ✅ Reduced onboarding time (30min → <10min)
- ✅ Lower error rates (validation at each step)
- ✅ Faster feature discovery (guided workflows)
- ✅ Consistent UX across all wizards
- ✅ Mobile-friendly (responsive design)

**Performance Considerations**:

- Lazy-load wizard data (use "skip" for conditional queries)
- Batch fetch lookups (teachers, students, etc.)
- Debounce text inputs in compose steps
- Use `useMemo` for expensive filtering

**Related Files**:

- `components/booking-wizard.tsx` - Full booking wizard (410 lines)
- `components/class-count-report-wizard.tsx` - Report wizard (217 lines)
- `components/message-wizard.tsx` - Messaging wizard (307 lines)
- `components/startup-window.tsx` - Wizard integration point

**Example**: See `IMPLEMENTATION_SUMMARY_WIZARD_STARTUP_NOV_1_2025.md` for full implementation details

### 27. Database Seeding Pattern (NEW Nov 2025)

**Automated data population** for development and testing environments.

```typescript
// convex/seed.ts
export const seedDatabase = mutation({
  args: { 
    clearExisting: v.optional(v.boolean()),
    count: v.optional(v.number()) 
  },
  handler: async (ctx, args) => {
    // 1. Optional cleanup
    if (args.clearExisting) {
      const existing = await ctx.db.query("images").collect();
      await Promise.all(existing.map(doc => ctx.db.delete(doc._id)));
    }

    // 2. Generate and insert data
    const images = generateTestImages(args.count || 10);
    await Promise.all(images.map(img => ctx.db.insert("images", img)));
    
    return { success: true, count: images.length };
  }
});
```

**Key features**:

- **Idempotent**: Can be run multiple times safely
- **Cleanup option**: `clearExisting` flag to reset state
- **Configurable**: `count` parameter to control data volume
- **Development only**: Should be restricted or careful in production

**Example**: `convex/seed.ts`

### 28. Lazy Loading Pattern (NEW Dec 2025)

**Code-split large components** to reduce initial bundle size and improve Time to Interactive.

```tsx
// app/page.tsx or layout component
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const ClassAnalytics = lazy(() => 
  import('@/components/class-analytics').then(m => ({ 
    default: m.ClassAnalytics 
  }))
);

const StudentManagement = lazy(() => 
  import('@/components/student-management').then(m => ({ 
    default: m.StudentManagement 
  }))
);

// Usage with loading fallback
<Suspense fallback={<LoadingSpinner />}>
  {activeTab === 'analytics' && <ClassAnalytics />}
  {activeTab === 'students' && <StudentManagement />}
</Suspense>
```

**When to lazy load**:

- ✅ Admin-only features (not all users need them)
- ✅ Components not visible on first render (modals, tabs)
- ✅ Large components (>200 lines or >20KB)
- ✅ Heavy dependencies (chart libraries, PDF generators)
- ❌ Small utilities (<50 lines)
- ❌ Components always visible on page load
- ❌ Components needed for initial render

**Performance impact**:

- Initial bundle: 350KB → 150KB (57% reduction)
- Time to Interactive: 3-4s → 1.5-2s (50% improvement)
- Lazy chunks load on-demand: 50-100KB each

**Example**: See `app/page.tsx` workspace layout with 5 lazy-loaded views

### 29. Modular Component Decomposition (NEW Dec 2025)

**Split monolithic components** into focused, maintainable modules.

**Before** (class-booking.tsx - 2,930 lines):
```tsx
// Single massive file with everything
export function ClassBooking() {
  // 300 lines of state
  // 400 lines of handlers
  // 400 lines of multi-date logic
  // 400 lines of recurring logic
  // 400 lines of conflict detection
  // 530 lines of UI rendering
}
```

**After** (modular structure):
```
components/class-booking/
├── index.tsx                    # Main orchestrator (126KB)
├── types.ts                     # Shared TypeScript interfaces
├── constants.ts                 # Shared constants (defaults, limits)
├── class-booking-state.ts       # State management hook (9KB)
└── ClassItemDisplay.tsx         # Reusable class card (30KB)
```

**Orchestrator pattern** (index.tsx):
```tsx
import { useClassBookingState } from './class-booking-state';
import { ClassItemDisplay } from './ClassItemDisplay';
import { DEFAULT_START_TIME, DEFAULT_END_TIME } from './constants';
import type { BookingFormData } from './types';

export function ClassBooking() {
  // Use shared state hook
  const {
    selectedSchool,
    selectedTeacher,
    selectedStudent,
    // ... all state
  } = useClassBookingState(userId);

  // Render with modular components
  return (
    <div>
      {classes.map(cls => (
        <ClassItemDisplay key={cls._id} classData={cls} />
      ))}
    </div>
  );
}
```

**Benefits**:

- **Easier navigation**: Find specific logic quickly
- **Reduced cognitive load**: Understand one module at a time
- **Better testing**: Test components in isolation
- **Reusable hooks**: Share state logic across components
- **Type safety**: Shared interfaces prevent drift
- **Parallel development**: Multiple devs can work on different modules

**When to split**:

- Component exceeds 1,000 lines
- Multiple distinct responsibilities (state, UI, logic)
- Repeated patterns that can be extracted
- Shared state needed across components
- Component has >5 complex functions

**Example**: PR #97 - class-booking.tsx decomposition

### 30. Backend Module Split Pattern (NEW Dec 2025)

**Modularize backend logic** for better organization and maintainability.

**Before** (classes.ts - 2,213 lines):
```typescript
// Single massive file with all queries, mutations, helpers
export const list = query({ /* ... */ });
export const book = mutation({ /* ... */ });
export const approve = mutation({ /* ... */ });
export const verifyClassAccess = (ctx, classId, userId) => { /* ... */ };
// ... 24 more functions
```

**After** (modular structure):
```
convex/classes/
├── index.ts                     # Re-exports (public API)
├── queries.ts                   # 9 query functions
├── mutations.ts                 # 16 mutation functions
├── helpers.ts                   # Authorization helpers
└── README.md                    # Module documentation
```

**Re-export pattern** (index.ts):
```typescript
// Public API - maintains backward compatibility
export * from './queries';
export * from './mutations';
export * from './helpers';

// All existing imports still work:
// import { book, list, verifyClassAccess } from './classes'
```

**Organized by purpose**:

**queries.ts** - Read operations:
```typescript
export const list = query({ /* ... */ });
export const get = query({ /* ... */ });
export const getByStatus = query({ /* ... */ });
export const getByTeacher = query({ /* ... */ });
// ... 5 more queries
```

**mutations.ts** - Write operations:
```typescript
export const book = mutation({ /* ... */ });
export const update = mutation({ /* ... */ });
export const approve = mutation({ /* ... */ });
export const delete = mutation({ /* ... */ });
// ... 12 more mutations
```

**helpers.ts** - Shared utilities:
```typescript
export const verifyClassAccess = async (ctx, classId, userId) => { /* ... */ };
export const canModifyClass = async (ctx, classId, userId) => { /* ... */ };
export const isClassOwner = (classData, userId) => { /* ... */ };
```

**Benefits**:

- **Logical grouping**: Related functions together
- **Easier code review**: Review specific module, not entire file
- **Reduced merge conflicts**: Changes isolated to specific modules
- **Better documentation**: README per module
- **Maintains compatibility**: Re-exports preserve existing imports
- **Clearer intent**: Separate queries from mutations

**When to split**:

- Backend file exceeds 1,500 lines
- Multiple distinct operation types (CRUD, bulk, reports)
- Shared helper functions across operations
- Clear logical boundaries (queries vs mutations)
- Growing merge conflict frequency

**Example**: PR #98 - classes.ts module split

---

[← Back to Index](../copilot-instructions.md)
