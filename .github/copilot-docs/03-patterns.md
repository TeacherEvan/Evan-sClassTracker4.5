## Non-Negotiable Patterns

### 1. Bilingual-First Development

**Every user-facing string needs English + Thai**. Schema has `title` AND `titleTh`. Forms need parallel inputs.

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

### 10. File Upload Pattern (Convex Storage)

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

### 11. Login Security Pattern (Account Lockout)

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

### 12. Bulk Deletion Pattern (Security-Critical)

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

### 13. Audit Logging Pattern

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

### 14. Teacher Cycle Editor Pattern (NEW Oct 2025)

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

### 15. Guardian Student Booking Pattern (NEW Oct 2025)

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

### 16. Recurring Weekly Bookings Pattern (NEW Oct 2025)

**Teachers can book the same class weekly** for up to 52 weeks (full school year).

```tsx
// Component state (components/class-booking.tsx)
const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);

### 17. Modal Accordion Pattern (NEW Oct 2025)

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

### 18. Modal Flex Layout Pattern (NEW Oct 2025)

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

### 19. Pagination Pattern (NEW Oct 2025)

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

### 20. Collapsible Section Pattern (NEW Oct 2025)

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
