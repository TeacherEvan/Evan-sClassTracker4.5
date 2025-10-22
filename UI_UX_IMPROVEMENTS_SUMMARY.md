# UI/UX Improvements Summary - Complete ✅

**Date:** January 2025  
**Status:** Complete

## Improvements Implemented

### 1. ✅ Enhanced Heading Styles

**Changed Files:**

- `components/weekly-calendar.tsx`
- `components/class-booking.tsx`

**Updates:**

- Main headings now use `text-2xl md:text-3xl` (from `text-xl md:text-2xl`)
- Added `font-bold` (from `font-semibold`)
- Added `text-gray-900 dark:text-white tracking-tight` for better contrast
- Modal headings have `border-b-2` underline for visual separation
- Added `pb-3` and `pb-4` padding below headings

**Before:**

```tsx
<h2 className="text-xl md:text-2xl font-semibold">
```

**After:**

```tsx
<h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
```

---

### 2. ✅ Add Time Picker to Weekly Calendar "Add Class" Dialog

**Changed Files:**

- `components/weekly-calendar.tsx` (Lines 76, 207-211, 648-658)

**Problem:** Users couldn't book today's upcoming classes because time was missing - scheduled date defaulted to midnight.

**Solution:**

- Added `selectedTime` state with default "09:00"
- Added time input field in the form UI
- Combined selected date with selected time before booking
- Reset time to "09:00" when form closes

**Code Added:**

```tsx
// State
const [selectedTime, setSelectedTime] = useState("09:00");

// In form
<div>
  <label htmlFor="timeSelect" className="block text-sm font-medium mb-2">
    {t("Time", "เวลา")}
  </label>
  <input
    type="time"
    id="timeSelect"
    value={selectedTime}
    onChange={(e) => setSelectedTime(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
    required
  />
</div>

// In submission handler
const dateWithTime = new Date(selectedDate);
const [hours, minutes] = selectedTime.split(":");
dateWithTime.setHours(Number.parseInt(hours), Number.parseInt(minutes));
```

---

### 3. ✅ Cancel/Postpone Feature - Backend Schema

**Changed Files:**

- `convex/schema.ts` (Lines 233-255)

**Added Fields to Existing `cancellationRequests` Table:**

- `requestType`: "cancel" | "postpone" (NEW)
- `newScheduledDate`: optional number for postponement target date (NEW)
- `reviewNotes`: optional string for moderator feedback (NEW)
- `reviewNotesTh`: optional string (NEW)
- Updated indexes to include `by_class_and_status`

**Schema Definition:**

```typescript
cancellationRequests: defineTable({
  classId: v.id("classes"),
  teacherId: v.id("users"),
  schoolId: v.id("schools"),
  requestType: v.union(
    v.literal("cancel"),
    v.literal("postpone")
  ),
  reason: v.string(),
  reasonTh: v.string(),
  newScheduledDate: v.optional(v.number()), // For postponement
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected")
  ),
  createdAt: v.number(),
  resolvedAt: v.optional(v.number()),
  resolvedBy: v.optional(v.id("users")),
  reviewNotes: v.optional(v.string()),
  reviewNotesTh: v.optional(v.string()),
})
.index("by_class", ["classId"])
.index("by_teacher", ["teacherId"])
.index("by_school", ["schoolId"])
.index("by_status", ["status"])
.index("by_created_at", ["createdAt"])
.index("by_class_and_status", ["classId", "status"])
```

---

## Next Steps (To Complete Cancel/Postpone Feature)

### 4. ⏳ Update Backend Mutations (convex/cancellationRequests.ts)

**Required Updates:**

1. Update `create` mutation to accept `requestType` parameter
2. Add `newScheduledDate` parameter for postponement
3. Update `approve` mutation to handle postponement (update scheduledDate instead of rejecting)
4. Add validation: postponement new date must be in future
5. Update notifications to differentiate cancel vs postpone

**Example:**

```typescript
export const create = mutation({
  args: {
    classId: v.id("classes"),
    teacherId: v.id("users"),
    requestType: v.union(v.literal("cancel"), v.literal("postpone")),
    reason: v.string(),
    reasonTh: v.string(),
    newScheduledDate: v.optional(v.number()), // Required for postpone
  },
  handler: async (ctx, args) => {
    // Validation
    if (args.requestType === "postpone" && !args.newScheduledDate) {
      throw new Error("New date required for postponement");
    }
    if (args.newScheduledDate && args.newScheduledDate < Date.now()) {
      throw new Error("New date must be in the future");
    }
    
    // Create request with requestType
    await ctx.db.insert("cancellationRequests", {
      ...args,
      schoolId: classData.schoolId,
      status: "pending",
      createdAt: Date.now(),
    });
  }
});
```

### 5. ⏳ Add UI to Class Detail Modal (components/class-detail-modal.tsx)

**Required UI Elements:**

1. **Cancel Button** - Red button visible for upcoming approved classes
2. **Postpone Button** - Yellow/Orange button next to Cancel
3. **Cancel Modal:**
   - Text area for reason (English)
   - Text area for reason (Thai)
   - Confirm/Cancel buttons
4. **Postpone Modal:**
   - Date picker for new date (future only)
   - Time picker for new time
   - Text area for reason (English)
   - Text area for reason (Thai)
   - Confirm/Cancel buttons

**Mockup:**

```tsx
// In class detail modal, for approved upcoming classes only
{classData.status === "approved" && classData.scheduledDate > Date.now() && (
  <div className="flex gap-2">
    <button
      onClick={() => setShowCancelModal(true)}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
    >
      {t("Cancel Class", "ยกเลิกคลาส")}
    </button>
    <button
      onClick={() => setShowPostponeModal(true)}
      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
    >
      {t("Postpone Class", "เลื่อนคลาส")}
    </button>
  </div>
)}

// Cancel/Postpone modals with forms...
```

### 6. ⏳ Add Moderator Review UI

**Location:** `components/moderator-list-view.tsx` or new `components/cancellation-requests-list.tsx`

**Features:**

- List of pending cancel/postpone requests
- Show class details, student, teacher, reason
- Approve/Reject buttons with optional review notes
- Filter by school (for moderators)

---

## Testing Checklist

### Heading Improvements

- ✅ Headers are now larger and bolder
- ✅ Better contrast in dark mode
- ✅ Visual separation with border underline

### Time Picker

- ✅ Time field appears in Add Class dialog
- ✅ Default time is 09:00
- ✅ Time combines with date correctly
- ✅ Can book today's classes with proper time

### Cancel/Postpone (When Complete)

- ⏳ Cancel button visible for approved upcoming classes
- ⏳ Postpone button visible for approved upcoming classes
- ⏳ Cannot cancel/postpone past classes
- ⏳ Cannot cancel/postpone pending/rejected classes
- ⏳ Reason fields validate (min 1 char)
- ⏳ Postpone date validates (must be future)
- ⏳ Moderator receives notification
- ⏳ Teacher receives notification when approved/rejected
- ⏳ Cancel sets class status to "rejected"
- ⏳ Postpone updates scheduledDate
- ⏳ Teacher logs record the action

---

## Files Modified

| File | Lines | Purpose |
|------|-------|---------|
| `components/weekly-calendar.tsx` | 5 sections | Time picker + heading styles |
| `components/class-booking.tsx` | 2 sections | Heading styles |
| `convex/schema.ts` | 1 table update | Added postponement fields |

## Files To Modify (Next Steps)

| File | Purpose |
|------|---------|
| `convex/cancellationRequests.ts` | Add postponement mutations |
| `components/class-detail-modal.tsx` | Add Cancel/Postpone buttons and forms |
| `components/moderator-list-view.tsx` | Add request review interface |

---

## Usage Examples

### Booking Today's Class

1. Open Weekly Calendar
2. Click on today's date
3. Fill in School, Student, Location
4. **Set Time to 14:00** (afternoon class)
5. Click "Create Class"
6. ✅ Class is booked for today at 2:00 PM

### Canceling a Class (When Complete)

1. Open class detail modal for approved upcoming class
2. Click "Cancel Class" (red button)
3. Enter reason in English and Thai
4. Click "Submit Request"
5. Moderator receives notification
6. Moderator approves → class status becomes "rejected"

### Postponing a Class (When Complete)

1. Open class detail modal for approved upcoming class
2. Click "Postpone Class" (yellow button)
3. Select new date and time
4. Enter reason in English and Thai
5. Click "Submit Request"
6. Moderator receives notification
7. Moderator approves → class `scheduledDate` updates

---

**Status:**

- ✅ Headings Enhanced
- ✅ Time Picker Added
- ✅ Schema Updated for Cancel/Postpone
- ⏳ Backend Mutations (Needs Update)
- ⏳ UI Components (Not Started)
