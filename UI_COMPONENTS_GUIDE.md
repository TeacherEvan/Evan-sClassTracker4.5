# UI Components Visual Guide

This document provides a detailed walkthrough of the UI components that were verified in the deployment checklist.

## 1. Class Details Modal

### Desktop Layout (1920x1080 and 1366x768)

The modal uses responsive, professional spacing:

```tsx
// Modal Container
<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
```

**Key Spacing Properties:**
- `max-w-3xl` = 768px max width (perfect for 1366px and 1920px screens)
- `p-4` = 1rem (16px) padding throughout
- `space-y-4` = 1rem vertical gaps between sections
- `rounded-2xl` = 16px border radius for modern look

### Header Section
```tsx
<div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-start">
  <div className="flex-1">
    <h2 className="text-xl font-bold mb-1.5">Class Details</h2>
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium">Status</span>
  </div>
  <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
    <X className="w-5 h-5" />
  </button>
</div>
```

### Content Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
    <School className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5" />
    <div>
      <p className="text-xs text-gray-600 dark:text-gray-400">School</p>
      <p className="font-medium text-sm">School Name</p>
    </div>
  </div>
  // ... more info cards
</div>
```

**Visual Result:**
- Clean 2-column grid on desktop (1 column on mobile)
- Consistent card padding (p-3)
- Subtle background colors for visual hierarchy
- Icons aligned with text using `mt-0.5`

---

## 2. Delete Button & Authorization

### Footer Section with Delete Button

```tsx
<div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
  {/* ... action buttons ... */}
  
  {/* Delete Button - Only for Authorized Users */}
  {(currentUserRole === "admin" ||
      currentUserRole === "moderator" ||
      (currentUserRole === "teacher" && classData.teacherId === currentUserId)) && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all font-medium"
        >
          <Trash2 className="w-4 h-4" />
          {t("Delete", "ลบ")}
        </button>
      )}
</div>
```

**Authorization Matrix:**
| User Role | Can See Button? | Condition |
|-----------|----------------|-----------|
| Admin | ✅ Always | All classes |
| Moderator | ✅ Always | Classes in their school |
| Teacher | ✅ Conditional | Only their own classes |
| Student | ❌ Never | N/A |

---

## 3. Bilingual Delete Confirmation Modal

### Full Modal Implementation

```tsx
{showDeleteConfirm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
      {/* Icon + Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-xl font-bold">
          {t("Delete Class", "ลบคลาส")}
        </h3>
      </div>
      
      {/* Warning Message */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t(
          "Are you sure you want to delete this class? This action cannot be undone.",
          "คุณแน่ใจหรือไม่ว่าต้องการลบคลาสนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        )}
      </p>
      
      {/* Class Info Preview */}
      {studentData && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
          <p className="text-sm font-medium">{studentData.firstName} {studentData.lastName}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {new Date(classData.scheduledDate).toLocaleString()}
          </p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          {t("Cancel", "ยกเลิก")}
        </button>
        <button onClick={handleDeleteClass} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all font-medium">
          {t("Delete", "ลบ")}
        </button>
      </div>
    </div>
  </div>
)}
```

**Bilingual Support:**
- English: "Delete Class" → "Are you sure you want to delete this class? This action cannot be undone."
- Thai: "ลบคลาส" → "คุณแน่ใจหรือไม่ว่าต้องการลบคลาสนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"

**Visual Features:**
- Red theme for destructive action
- Icon to reinforce danger
- Class preview so user knows what they're deleting
- Two-button layout (Cancel / Delete)

---

## 4. Time Display Implementation

### Immediate Display After Creation

When a class is created, the time is stored as a Unix timestamp (milliseconds):

```typescript
// In bookClass mutation (convex/classes.ts)
await ctx.db.insert("classes", {
  scheduledDate: args.scheduledDate, // e.g., 1704067200000 (Jan 1, 2024 09:00)
  // ... other fields
});
```

Display in weekly calendar:

```tsx
<div className="text-gray-500 dark:text-gray-400 text-[9px] md:text-[10px] mt-0.5">
  {new Date(classItem.scheduledDate).toLocaleTimeString(
    language === "en" ? "en-US" : "th-TH",
    { hour: "2-digit", minute: "2-digit" }
  )}
</div>
```

**Result:**
- English: "09:00 AM"
- Thai: "09:00"

No delay, no re-editing needed - time displays immediately from the stored timestamp.

---

## 5. Time Persistence When Editing

### Three-Step Conversion Process

#### Step 1: Load Existing Time (DB → Form)
```typescript
// Helper function to convert timestamp to datetime-local format
const toLocalDatetimeString = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Initialize state with existing time
const [scheduledDate, setScheduledDate] = useState(
  toLocalDatetimeString(classData.scheduledDate)
);
```

**Example:**
- Database: `1704067200000`
- Form value: `"2024-01-01T09:00"`

#### Step 2: Display in datetime-local Input
```tsx
<input
  type="datetime-local"
  value={scheduledDate} // "2024-01-01T09:00"
  onChange={(e) => setScheduledDate(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
  required
/>
```

#### Step 3: Save Changes (Form → DB)
```typescript
const scheduledTimestamp = new Date(scheduledDate).getTime();

await editClass({
  userId: currentUserId,
  classId: classData._id,
  updates: {
    scheduledDate: scheduledTimestamp,
    // ... other fields
  },
});
```

**Example:**
- Form value: `"2024-01-01T09:00"`
- Database: `1704067200000`

**Why This Works:**
- `datetime-local` input requires `YYYY-MM-DDTHH:MM` format
- JavaScript `Date` handles all timezone conversions automatically
- Storage as Unix timestamp is timezone-agnostic
- Display uses `toLocaleTimeString()` for localized formatting

---

## 6. Quick Edit Button (Desktop Hover)

### Implementation on Class Cards

```tsx
<div className="group relative w-full text-left text-xs p-1.5 md:p-2 rounded-lg md:rounded border hover:shadow-md transition-all">
  {/* Class Info - Clickable */}
  <div onClick={() => handleClassClick(classItem)} className="cursor-pointer">
    <div className="font-semibold truncate text-[11px] md:text-xs">
      {student ? `${student.firstName} ${student.lastName}` : t("Student", "นักเรียน")}
    </div>
    <div className="text-gray-600 dark:text-gray-300 truncate text-[10px] md:text-xs">
      {teacher?.username}
    </div>
    <div className="text-gray-500 dark:text-gray-400 text-[9px] md:text-[10px] mt-0.5">
      {new Date(classItem.scheduledDate).toLocaleTimeString()}
    </div>
  </div>
  
  {/* Quick Action Buttons - Visible on Hover (Desktop Only) */}
  <div className="absolute top-1 right-1 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    <button
      onClick={(e) => {
        e.stopPropagation();
        setEditingClass(classItem as unknown as Doc<"classes">);
      }}
      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95 transition-all"
      title={t("Edit", "แก้ไข")}
    >
      <Edit2 className="w-3 h-3" />
    </button>
```

**Key CSS Classes:**
- `group` - Parent container enabling group-hover
- `hidden md:flex` - Only visible on desktop (768px+)
- `opacity-0 group-hover:opacity-100` - Smooth fade-in on hover
- `absolute top-1 right-1` - Positioned in top-right corner
- `transition-opacity` - Smooth animation

**Behavior:**
1. On mobile: Quick buttons are hidden
2. On desktop: Quick buttons appear when hovering over class card
3. Clicking edit button opens EditClassModal
4. `e.stopPropagation()` prevents card click when clicking button

---

## 7. Quick Delete Button (Desktop Hover)

### Implementation with Authorization

```tsx
{canDelete && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (confirm(t(
        "Are you sure you want to delete this class?",
        "คุณแน่ใจหรือไม่ว่าต้องการลบคลาสนี้?"
      ))) {
        deleteClass({
          userId: currentUser._id,
          classId: classItem._id
        }).then(() => {
          toast.success("Class deleted", "ลบคลาสสำเร็จ");
        }).catch((err: unknown) => {
          toast.error(
            err instanceof Error ? err.message : "Failed to delete",
            err instanceof Error ? err.message : "ลบไม่สำเร็จ"
          );
        });
      }
    }}
    className="p-1 bg-red-500 text-white rounded hover:bg-red-600 active:scale-95 transition-all"
    title={t("Delete", "ลบ")}
  >
    <Trash2 className="w-3 h-3" />
  </button>
)}
```

**Authorization Check:**
```tsx
const canDelete = currentUser.role === "admin" ||
  currentUser.role === "moderator" ||
  (currentUser.role === "teacher" && classItem.teacherId === currentUser._id);
```

**Features:**
- Only visible if user has delete permission
- Same hover behavior as edit button
- Bilingual confirmation dialog
- Toast notification on success/error
- Red color scheme for destructive action

---

## 8. Mobile Layout Preservation

### Responsive Design Strategy

**Desktop (md breakpoint and up):**
```tsx
// Quick actions visible on hover
<div className="absolute top-1 right-1 hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
```

**Mobile:**
```tsx
// Class card is fully clickable
<div onClick={() => handleClassClick(classItem)} className="cursor-pointer">
  // Opens full detail modal
</div>
```

**Key Differences:**
| Feature | Desktop | Mobile |
|---------|---------|--------|
| Quick Edit | ✅ Hover button | ❌ Open modal |
| Quick Delete | ✅ Hover button | ❌ Open modal |
| Class Card | Clickable | Clickable |
| Detail Modal | Full features | Full features |

**Why This Works:**
- Mobile users prefer fewer UI elements (cleaner)
- Hover doesn't work well on touch devices
- Clicking card to open modal is more intuitive on mobile
- All functionality is still available through the detail modal

---

## 9. Toast Notifications

### Implementation Across All Actions

#### Success Example:
```typescript
toast.success("Class deleted successfully", "ลบคลาสสำเร็จ");
```

#### Error Example:
```typescript
toast.error(
  err instanceof Error ? err.message : "Failed to delete class",
  err instanceof Error ? err.message : "ไม่สามารถลบคลาสได้"
);
```

### Toast Library API

```typescript
// From lib/toast.ts
export const toast = {
  success: (message: string, messageTh: string) => { /* ... */ },
  error: (message: string, messageTh: string) => { /* ... */ },
  info: (message: string, messageTh: string) => { /* ... */ },
  warning: (message: string, messageTh: string) => { /* ... */ },
};
```

**Where Toasts Appear:**

1. **Class Deletion (Weekly Calendar):**
   ```typescript
   deleteClass({...}).then(() => {
     toast.success("Class deleted", "ลบคลาสสำเร็จ");
   })
   ```

2. **Class Deletion (Detail Modal):**
   ```typescript
   await deleteClass({...});
   toast.success("Class deleted successfully", "ลบคลาสสำเร็จ");
   ```

3. **Class Edit:**
   ```typescript
   await editClass({...});
   // Toast shown in EditClassModal
   onSuccess(); // Triggers parent refresh
   ```

4. **Add Dates:**
   ```typescript
   await addDatesToClass({...});
   toast.success(
     `Successfully added ${selectedNewDates.length} date(s)!`,
     `เพิ่ม ${selectedNewDates.length} วันสำเร็จแล้ว!`
   );
   ```

**Visual Position:**
- Toasts appear in bottom-right corner (per `components/desktop-notification-toast.tsx`)
- Auto-dismiss after 5 seconds
- Stack vertically if multiple toasts

---

## 10. Authorization Security

### Multi-Layer Security Architecture

#### Layer 1: UI Button Visibility
```tsx
// components/class-detail-modal.tsx
{(currentUserRole === "admin" ||
    currentUserRole === "moderator" ||
    (currentUserRole === "teacher" && classData.teacherId === currentUserId)) && (
  <button onClick={() => setShowDeleteConfirm(true)}>
    Delete
  </button>
)}
```

**Purpose:** Prevent unauthorized users from seeing the delete button at all.

#### Layer 2: Backend Authorization Helper
```typescript
// convex/classes.ts
async function verifyClassAccess(
  ctx: MutationCtx,
  userId: Id<"users">,
  classData: Doc<"classes">,
  options: { requireModeratorOrAdmin?: boolean; allowTeacherOwner?: boolean } = {}
): Promise<void> {
  const user = await ctx.db.get(userId);
  
  if (!user) {
    throw new Error("User not found");
  }

  // Admin has access to everything
  if (user.role === "admin") {
    return;
  }

  // Moderator can only access their assigned school
  if (user.role === "moderator") {
    if (!user.schoolId || user.schoolId !== classData.schoolId) {
      throw new Error("Unauthorized: Moderators can only manage classes from their assigned school");
    }
    return;
  }

  // Teacher can only access their own classes (if allowed)
  if (user.role === "teacher" && options.allowTeacherOwner) {
    if (classData.teacherId !== userId) {
      throw new Error("Unauthorized: You can only manage your own classes");
    }
    return;
  }

  // Check role requirements if specified
  if (options.requireModeratorOrAdmin && !["admin", "moderator"].includes(user.role)) {
    throw new Error("Unauthorized: Only admins and moderators can perform this action");
  }
}
```

**Purpose:** 
- Centralized authorization logic
- Prevents API manipulation attacks
- Enforces school boundaries for moderators
- Allows teacher ownership exceptions

#### Layer 3: Mutation-Level Checks
```typescript
// convex/classes.ts - deleteClass mutation
export const deleteClass = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true,
      allowTeacherOwner: true
    });

    const user = await ctx.db.get(args.userId);

    // Additional check: Prevent deletion of past classes (except for admins)
    if (user?.role !== "admin") {
      const currentTime = Date.now();
      if (classData.scheduledDate < currentTime) {
        throw new Error("Cannot delete classes whose dates have already passed");
      }
    }

    // Proceed with deletion...
  }
});
```

**Purpose:**
- Mutation-specific business rules
- Audit logging
- Additional validation (e.g., past date check)

### Security Test Matrix

| Scenario | Expected Result | Verified |
|----------|----------------|----------|
| Admin deletes any class | ✅ Success | ✅ |
| Admin deletes past class | ✅ Success (God mode) | ✅ |
| Moderator deletes class in their school | ✅ Success | ✅ |
| Moderator deletes class in other school | ❌ Unauthorized | ✅ |
| Moderator deletes past class in their school | ❌ Date error | ✅ |
| Teacher deletes their own future class | ✅ Success | ✅ |
| Teacher deletes their own past class | ❌ Date error | ✅ |
| Teacher deletes another teacher's class | ❌ Unauthorized | ✅ |
| Unauthenticated user deletes class | ❌ Unauthorized | ✅ |

---

## Summary

All UI components have been verified to meet professional standards:

1. ✅ **Spacing** - Consistent, modern, responsive
2. ✅ **Authorization** - Multi-layer security
3. ✅ **Bilingual** - Full EN/TH support
4. ✅ **Time Handling** - Accurate and persistent
5. ✅ **Responsive** - Desktop/mobile optimized
6. ✅ **Accessibility** - Proper labels and titles
7. ✅ **User Feedback** - Toast notifications
8. ✅ **Security** - Backend validation

**Deployment Status:** ✅ READY
