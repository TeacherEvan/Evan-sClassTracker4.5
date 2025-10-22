# Duplicate Class Booking Prevention - Implementation Guide

## Overview
This feature prevents teachers and moderators from accidentally booking duplicate classes at the same time. When a time conflict is detected, the user is prompted to either merge the classes or create them separately.

## How It Works

### 1. Conflict Detection (Server-Side)
**Location**: `convex/classes.ts`

The system uses a new mutation `bookWithConflictCheck` that:
- Checks for existing classes within ±5 minutes of the requested time
- Filters by teacher, school, and optionally location
- Only considers active classes (approved, pending, or acknowledged status)
- Returns conflict information if duplicates are found

```typescript
// Time tolerance for conflict detection
const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes
```

**Key Query**: Uses indexed query on `teacherId` and `scheduledDate` for efficient lookups:
```typescript
.withIndex("by_teacher_and_date", (q) =>
  q.eq("teacherId", args.teacherId)
    .gte("scheduledDate", startRange)
    .lte("scheduledDate", endRange)
)
```

### 2. Conflict Resolution UI
**Location**: `components/class-conflict-modal.tsx`

When conflicts are detected, a modal appears with:
- **New Class Info**: Shows the class being booked
- **Existing Classes**: Lists all conflicting classes with student names, locations, and times
- **Two Options**:
  1. **Merge**: Adds the new student to an existing class (if multiple conflicts, user selects which one)
  2. **Create Separate**: Creates the class anyway (with a warning about overlapping times)

### 3. Integration with Booking Flow
**Location**: `components/class-booking.tsx`

The booking flow now:
1. For **single-date bookings**: Uses `bookWithConflictCheck` mutation
2. For **multi-date bookings**: Skips conflict checking (simpler UX, less interruption)
3. Handles the response:
   - **No conflicts**: Books the class normally
   - **Conflicts found**: Shows conflict modal
   - **User confirms merge**: Adds student to existing class via `addStudentToClass`
   - **User confirms separate**: Creates with `forceCreate: true` flag

## User Experience Flow

### Scenario 1: No Conflicts
```
User books class → No conflicts found → Class created → Success message
```

### Scenario 2: Conflict Detected - User Chooses Merge
```
User books class 
→ Conflict detected 
→ Modal shows: "Existing class at 02:30 PM with student A"
→ User selects "Merge into existing class"
→ New student added to existing class
→ Success: "Student added to existing class!"
```

### Scenario 3: Conflict Detected - User Chooses Separate
```
User books class 
→ Conflict detected 
→ Modal shows warning: "You will have multiple classes at the same time"
→ User selects "Create as separate class"
→ New class created
→ Success: "Class created separately!"
```

## Technical Details

### Type Safety
All conflict-related data uses proper TypeScript types:
```typescript
type ConflictClass = {
  _id: Id<"classes">;
  studentId: Id<"students">;
  student: Partial<Doc<"students">> & { 
    _id: Id<"students">; 
    firstName: string; 
    lastName: string 
  } | null;
  // ... other fields
};
```

### Performance Considerations
- **Indexed Queries**: Uses compound indexes for O(log n) lookups
- **Batch Loading**: Fetches student and location data in batches
- **Tolerance Window**: ±5 minutes reduces false positives while catching real conflicts

### Edge Cases Handled
1. **Multi-student classes**: Displays all students in the conflict list
2. **Pending location names**: Shows pending location when no approved location exists
3. **Different locations**: Only flags conflicts if at the same location (when specified)
4. **Multi-date bookings**: Skips conflict check to avoid complex UX

## Configuration

### Adjusting Time Tolerance
To change the conflict detection window, modify the constant in `convex/classes.ts`:
```typescript
const TIME_TOLERANCE = 5 * 60 * 1000; // Change from 5 minutes to desired value
```

### Enabling/Disabling for Multi-Date Bookings
Currently disabled for simplicity. To enable, modify the condition in `components/class-booking.tsx`:
```typescript
if (datesToBook.length > 1) {
  // Add conflict checking logic here
}
```

## Bilingual Support
All messages support English and Thai:
- Modal title: "Time Conflict Detected" / "พบความขัดแย้งของเวลา"
- Options: "Merge into existing class" / "รวมเข้ากับคลาสที่มีอยู่"
- Warnings: "You will have multiple classes at the same time" / "คุณจะมีหลายคลาสในเวลาเดียวกัน"

## Testing

### Manual Testing Checklist
- [ ] Book a class at 10:00 AM
- [ ] Try to book another class at 10:02 AM (within 5 min) → Should show conflict modal
- [ ] Try to book another class at 10:10 AM (outside 5 min) → Should succeed without modal
- [ ] In conflict modal, select "Merge" → Verify student added to existing class
- [ ] In conflict modal, select "Create Separate" → Verify new class created
- [ ] Book multiple dates at once → Should skip conflict detection

### Database Verification
Check that:
- Merged classes have `additionalStudentIds` populated
- Separate classes exist with identical timestamps
- No duplicate classes when merge option is chosen

## Troubleshooting

### Issue: Conflict modal not appearing
- Check that `bookWithConflictCheck` mutation is being used (not `book`)
- Verify TIME_TOLERANCE is set correctly
- Check browser console for errors

### Issue: Merge not working
- Verify `addStudentToClass` mutation has proper permissions
- Check that the target class ID is being passed correctly
- Ensure the student isn't already in the class

### Issue: False positives (conflicts when there shouldn't be)
- Reduce TIME_TOLERANCE value
- Add location-specific filtering if needed
- Check timezone handling in date comparisons

## Future Enhancements
- [ ] Allow configurable time tolerance per user/role
- [ ] Add conflict detection for multi-date bookings with batch conflict resolution
- [ ] Show calendar view of conflicts in the modal
- [ ] Add "Reschedule" option to suggest alternative times
- [ ] Track and log conflict resolution decisions for analytics
