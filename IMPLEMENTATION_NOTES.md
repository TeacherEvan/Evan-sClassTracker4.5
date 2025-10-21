# Implementation Notes: Class Booking Features

## Issue Summary

**Original Request:**
1. "When moderators or teachers would like to book a class, and it comes to the select student dropdown. Have an option for them to add students if they need to in that same tab."
2. "Give moderator the ability to edit logged classes and edit times."

## Implementation Status

### ✅ Feature 1: Inline Student Creation (ALREADY COMPLETE)

**Status:** This feature was already fully implemented in the codebase.

**Location:** `components/class-booking.tsx` (lines 52-238, 271-352)

**How It Works:**
- Toggle button labeled "+ Create New" / "← Select Existing" appears next to Student dropdown
- Clicking toggle shows/hides an inline student creation form
- Form fields (in blue highlighted box):
  - First Name
  - Last Name
  - Grade
  - School (dropdown)
- "Create & Select Student" button creates student and auto-selects them
- Form automatically returns to "Select Existing" mode after creation
- Fully bilingual (English/Thai)

**Code Pattern:**
```tsx
const [creatingStudent, setCreatingStudent] = useState(false);

// Toggle button
<button onClick={() => setCreatingStudent(!creatingStudent)}>
  {creatingStudent ? t("← Select Existing", "...") : t("+ Create New", "...")}
</button>

// Conditional rendering
{creatingStudent ? (
  <div className="bg-blue-50 p-4 rounded-lg">
    {/* Student creation form */}
  </div>
) : (
  <select>{/* Existing students */}</select>
)}
```

**No Changes Required** - Feature fully functional as-is.

---

### ✅ Feature 2: Moderator Edit Classes (NEWLY IMPLEMENTED)

**Status:** Backend was complete, UI implementation added in this PR.

**Backend:** `convex/classes.ts` - `updateClass` mutation (lines 418-487)
- Role verification (admin/moderator only)
- Updates: scheduledDate, studentId, locationId, status
- Auto-notification to teacher with student name and admin username

**Frontend Implementation:**

#### Location
`components/class-booking.tsx` - `ClassItemDisplay` component

#### New State Variables
```tsx
const [showEditForm, setShowEditForm] = useState(false);
const [editStudentId, setEditStudentId] = useState<Id<"students"> | "">(classItem.studentId);
const [editScheduledDate, setEditScheduledDate] = useState(
  new Date(classItem.scheduledDate).toISOString().slice(0, 16)
);
const [editStatus, setEditStatus] = useState<"pending" | "acknowledged" | "approved" | "rejected">(classItem.status);
const [editSchoolId, setEditSchoolId] = useState<Id<"schools"> | "">(classItem.student?.schoolId || "");
const [editLocationId, setEditLocationId] = useState<Id<"locations"> | "">(classItem.locationId || "");
```

#### UI Components Added

**1. Edit Button (appears for admin/moderator only)**
```tsx
<button
  onClick={() => setShowEditForm(true)}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
>
  <Edit2 className="w-4 h-4" />
  {t("Edit Class", "แก้ไขคลาส")}
</button>
```

**2. Inline Edit Form (blue background, matches existing patterns)**
```tsx
<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
  <h4 className="font-semibold mb-4 flex items-center gap-2">
    <Edit2 className="w-4 h-4 text-blue-500" />
    {t("Edit Class Details", "แก้ไขรายละเอียดคลาส")}
  </h4>
  <div className="space-y-4">
    {/* Student dropdown */}
    {/* School dropdown */}
    {/* Location dropdown (school-dependent) */}
    {/* Date/Time picker */}
    {/* Status dropdown */}
    {/* Save/Cancel buttons */}
  </div>
</div>
```

#### Form Fields

1. **Student** - Dropdown with all students
2. **School** - Dropdown with all schools (resets location when changed)
3. **Location** - Dropdown with school-specific locations (disabled until school selected)
4. **Scheduled Date & Time** - `datetime-local` input
5. **Status** - Dropdown with 4 options:
   - Pending (รอดำเนินการ)
   - Acknowledged (รับทราบแล้ว)
   - Approved (อนุมัติแล้ว)
   - Rejected (ปฏิเสธแล้ว)

#### Smart Update Logic
```tsx
const handleEditClass = async () => {
  const updates = { classId: classItem._id };
  
  // Only include changed fields
  const newDate = new Date(editScheduledDate).getTime();
  if (newDate !== classItem.scheduledDate) {
    updates.scheduledDate = newDate;
  }
  if (editStudentId && editStudentId !== classItem.studentId) {
    updates.studentId = editStudentId as Id<"students">;
  }
  // ... similar checks for location and status
  
  await updateClassMutation(updates);
  setShowEditForm(false);
  alert(t("Class updated successfully", "อัปเดตคลาสสำเร็จแล้ว"));
};
```

#### Cancel Behavior
- Clicking "Cancel" closes form
- All fields reset to original values
- No changes persisted to database

---

## Design Patterns Followed

### 1. Bilingual First
Every user-facing string uses the `t()` helper:
```tsx
{t("Edit Class", "แก้ไขคลาส")}
{t("Save Changes", "บันทึกการเปลี่ยนแปลง")}
```

### 2. Blue Form Highlighting
Consistent with inline student creation:
```css
bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
```

### 3. Mobile-First Responsive
All buttons and forms use responsive classes:
```tsx
className="flex flex-wrap gap-2"  // Wraps on mobile
className="px-3 py-2 text-sm"      // Appropriate sizing
```

### 4. Dark Mode Support
All color classes include dark mode variants:
```css
dark:bg-gray-800 dark:border-gray-600
```

### 5. Icon Consistency
Uses Lucide React icons already imported:
- `Edit2` for edit button/header
- `Trash2` for delete button

### 6. Conditional Rendering
Forms only appear for authorized roles:
```tsx
{(userRole === "admin" || userRole === "moderator") && (
  <div>{/* Edit/Delete buttons */}</div>
)}
```

---

## Technical Details

### Dependencies Added to Component
```tsx
const { schools } = useDataContext();
const students = useQuery(api.students.list, {});
const updateClassMutation = useMutation(api.classes.updateClass);

// Query locations for selected school in edit form
const editLocations = useQuery(
  api.locations.list,
  editSchoolId ? { schoolId: editSchoolId as Id<"schools">, activeOnly: true } : "skip"
);
```

### Removed Unused Variable
Cleaned up duplicate `updateClass` declaration in parent component to avoid linting warnings.

---

## Testing Checklist

### Manual Testing Steps

#### Test Inline Student Creation (Already Working)
1. ✅ Login as teacher
2. ✅ Navigate to "Book Class" tab
3. ✅ Click "+ Create New" toggle
4. ✅ Verify blue form appears
5. ✅ Fill in student details
6. ✅ Click "Create & Select Student"
7. ✅ Verify student auto-selected
8. ✅ Complete booking normally

#### Test Class Editing (New Feature)
1. Login as moderator or admin
2. Navigate to existing class
3. Verify "Edit Class" button appears (blue)
4. Click "Edit Class"
5. Verify inline form appears with current values
6. Change one or more fields:
   - Student
   - School (verify location resets)
   - Location (verify school dependency)
   - Date/Time
   - Status
7. Click "Save Changes"
8. Verify success alert
9. Verify form closes
10. Verify changes reflected in class display
11. Login as teacher of that class
12. Verify notification received about update

#### Test Cancel Behavior
1. Open edit form
2. Change several fields
3. Click "Cancel"
4. Reopen edit form
5. Verify all fields reset to original values

#### Test Role Restrictions
1. Login as teacher (not admin/moderator)
2. View class list
3. Verify "Edit Class" and "Delete Class" buttons DO NOT appear

---

## Build Verification

```bash
✓ TypeScript compilation: No errors
✓ Next.js build with Turbopack: Success
✓ ESLint: No warnings in modified files
✓ Code follows existing patterns
```

---

## Files Modified

1. `components/class-booking.tsx` (+201 lines, -10 lines)
   - Removed duplicate `updateClass` variable
   - Added edit form state variables
   - Added `handleEditClass` function
   - Added edit button UI
   - Added inline edit form UI
   - Updated help text for admin actions

---

## Backend Already Complete

The `updateClass` mutation in `convex/classes.ts` handles:
- ✅ Authentication check
- ✅ Role verification (admin/moderator only)
- ✅ Class existence validation
- ✅ Partial updates (only changed fields)
- ✅ Teacher notification with details
- ✅ Bilingual notification messages

Example notification sent to teacher:
```typescript
await ctx.db.insert("notifications", {
  userId: classData.teacherId,
  title: "Class Updated",
  titleTh: "มีการอัปเดตคลาส",
  message: `Your class with ${student.firstName} ${student.lastName} has been updated by ${user.username}`,
  messageTh: `คลาสของคุณกับ ${student.firstName} ${student.lastName} ถูกอัปเดตโดย ${user.username}`,
  type: "info",
  read: false,
  createdAt: Date.now(),
});
```

---

## Future Enhancements (Not Required)

While the issue is now complete, potential future improvements could include:

1. **Audit Trail** - Log all edits with before/after values
2. **Bulk Edit** - Edit multiple classes at once
3. **Validation** - Prevent scheduling in the past
4. **Conflict Detection** - Warn if teacher has overlapping classes
5. **Edit History** - Show who edited when

---

## Summary

Both features requested in the issue are now complete:

1. ✅ **Inline Student Creation** - Already working, no changes needed
2. ✅ **Moderator Class Editing** - UI implemented, fully functional

The implementation follows all existing design patterns:
- Bilingual support (English/Thai)
- Blue form highlighting for inline operations
- Role-based access control
- Mobile-responsive design
- Dark mode support
- Teacher notifications
- Smart updates (only changed fields)

Total changes: **1 file modified** with surgical precision, maintaining the existing codebase architecture.
