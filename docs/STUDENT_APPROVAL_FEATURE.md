# Student Approval Workflow Feature

## Overview
This feature implements a moderator approval workflow for students created by teachers at schools. Students must be approved by school moderators before they become available for class booking.

## Problem Statement
Previously, teachers could create students directly during class booking without any approval process. This created potential issues with data quality and administrative oversight.

## Solution
Implemented a two-stage approval workflow:
1. **Teacher creates student** → Student marked as `acknowledged: false`
2. **Moderator reviews and approves/rejects** → Student becomes available or deleted

## Implementation Details

### Database Schema Changes
**File:** `convex/schema.ts`

Added indexes to support efficient querying of pending students:
```typescript
students: defineTable({
  // ... existing fields ...
  acknowledged: v.optional(v.boolean()),
  createdBy: v.optional(v.id("users")),
  // ...
})
  .index("by_acknowledged", ["acknowledged"])
  .index("by_school_and_acknowledged", ["schoolId", "acknowledged"])
```

### Backend Logic
**File:** `convex/students.ts`

#### Modified `create` Mutation
- Detects if creator is a teacher creating a student at a school
- Sets `acknowledged: false` for teacher-created students
- Sends notification to school moderator
- Auto-acknowledges for admin/moderator created students

```typescript
const creator = await ctx.db.get(args.createdBy);
const needsAcknowledgment = args.guardianId || 
                             (creator?.role === "teacher" && args.schoolId);

acknowledged: !needsAcknowledgment
```

#### Updated `list` Query
- Added `acknowledgedOnly` parameter
- Teachers filter to only see approved students
- Moderators/admins see all students

```typescript
export const list = query({
  args: {
    schoolId: v.optional(v.id("schools")),
    acknowledgedOnly: v.optional(v.boolean()),
  },
  // ... filters students by acknowledgment status
})
```

#### New Queries
**`getPendingBySchool`** - Fetches unacknowledged students for a school:
```typescript
await ctx.db
  .query("students")
  .withIndex("by_school_and_acknowledged", (q) => 
    q.eq("schoolId", args.schoolId).eq("acknowledged", false)
  )
  .collect()
```

#### New Mutations
**`approveStudent`** - Moderator approves student:
- Sets `acknowledged: true`
- Notifies teacher of approval
- Student becomes available for class booking

**`rejectStudent`** - Moderator rejects student:
- Deletes student record
- Notifies teacher with rejection reason (bilingual)
- Permanent removal (not soft delete)

### Frontend Components

#### Updated: `components/class-booking.tsx`
- Modified student query to use `acknowledgedOnly: true` for teachers
- Moderators/admins see all students
- Inline student creation still available

```typescript
const students = useQuery(api.students.list, { 
  acknowledgedOnly: userRole === "teacher" 
});
```

#### New: `components/pending-students-approval.tsx`
Moderator-facing UI component that:
- Displays all pending students for the moderator's school
- Shows student details (name, ID, grade, guardian info)
- Provides Approve/Reject buttons with confirmation
- Shows visual feedback (orange border for pending status)
- Handles loading and error states

**Key Features:**
- Empty state when no pending students
- Inline student details display
- Approve button (green) with confirmation
- Reject button (red) with reason prompt
- Bilingual support for all text

#### Updated: `app/page.tsx`
- Added "Students" tab to moderator navigation
- Integrated `PendingStudentsApproval` component for moderators
- Separate views for admins (full student management) and moderators (pending approvals)

## User Workflows

### Teacher Workflow
1. Navigate to "Class Requests" tab
2. Click "Request Class" button
3. Click "+ Create New" to create student inline
4. Fill student details (first name, last name, grade, school)
5. Submit → Student created with `acknowledged: false`
6. Receive notification when moderator approves/rejects
7. Approved students appear in class booking dropdown

### Moderator Workflow
1. Navigate to "Students" tab
2. See list of pending students (orange boxes)
3. Review student details
4. Click "Approve" to accept → Student becomes available
5. Click "Reject" and provide reason → Student deleted, teacher notified

### Admin Workflow
- Admins see full student management interface (unchanged)
- Admin-created students are auto-approved
- No approval workflow for admin actions

## Notifications

### Teacher Creates Student
**To:** School moderator
```
Title: "New Student Pending Approval: John Doe"
Message: "Teacher username has added a new student: John Doe (Grade 5). 
         Please review and approve."
Type: info (blue)
```

### Moderator Approves
**To:** Teacher who created student
```
Title: "Student Approved: John Doe"
Message: "Your student John Doe has been approved by moderator_username 
         and is now available for class bookings."
Type: success (green)
```

### Moderator Rejects
**To:** Teacher who created student
```
Title: "Student Rejected: John Doe"
Message: "Your student John Doe was rejected by moderator_username. 
         Reason: [rejection reason]"
Type: warning (yellow)
```

## Edge Cases Handled

1. **Guardian-linked students:** Still use guardian acknowledgment workflow (unchanged)
2. **Admin/moderator created students:** Auto-approved, no workflow needed
3. **Multiple pending students:** All displayed in moderator view
4. **Rejection reasons:** Bilingual support (simplified to use same text for both languages)
5. **No moderator assigned:** Notification not sent if school has no moderator
6. **Database query performance:** Uses compound index for efficient filtering

## Testing Scenarios

### Scenario 1: Teacher Creates Student
1. Login as teacher
2. Create student via class booking form
3. Verify student not visible in dropdown
4. Login as moderator
5. Verify student appears in "Students" tab as pending

### Scenario 2: Moderator Approves Student
1. Login as moderator
2. Navigate to "Students" tab
3. Approve pending student
4. Login as teacher
5. Verify student now appears in class booking dropdown
6. Verify teacher received approval notification

### Scenario 3: Moderator Rejects Student
1. Login as moderator
2. Navigate to "Students" tab
3. Reject pending student with reason
4. Login as teacher
5. Verify student does NOT appear in dropdown
6. Verify teacher received rejection notification with reason

### Scenario 4: Admin Creates Student
1. Login as admin
2. Create student via student management
3. Login as teacher at same school
4. Verify student immediately appears in dropdown (no approval needed)

## Performance Considerations

- **Index usage:** All queries use compound indexes (`by_school_and_acknowledged`)
- **Real-time updates:** Convex automatically updates UI when acknowledgment status changes
- **Notification batching:** Each approval/rejection sends single notification
- **No N+1 queries:** Single query fetches all pending students per school

## Security & Permissions

- Only moderators/admins can approve/reject students
- Backend validates user role before processing approval/rejection
- Students scoped by school - moderators only see their school's pending students
- Teachers cannot bypass approval by manually setting `acknowledged: true`

## Future Enhancements

1. **Bulk approval:** Allow moderators to approve multiple students at once
2. **Edit before approval:** Allow moderators to edit student details during approval
3. **Approval history:** Track who approved/rejected and when
4. **Configurable auto-approval:** Settings to disable workflow for specific schools
5. **Mobile optimization:** Improve pending students UI for mobile devices

## Files Modified/Created

### Modified
- `convex/schema.ts` - Added student acknowledgment indexes
- `convex/students.ts` - Updated create mutation, added approval mutations and queries
- `components/class-booking.tsx` - Added acknowledgedOnly filter
- `app/page.tsx` - Added Students tab for moderators, integrated approval component
- `.github/copilot-instructions.md` - Documented new workflow

### Created
- `components/pending-students-approval.tsx` - Moderator approval UI
- `docs/STUDENT_APPROVAL_FEATURE.md` - This documentation

## Logo Feature (Already Implemented)

The issue also requested a logo with:
- Stoic, intellectual font display of "Evan's ClassTracker"
- Pulsating gold slogan "Built by teachers - for Teachers"

**Status:** ✅ Already implemented in `components/logo.tsx`
- Uses Playfair Display serif font for intellectual aesthetic
- Gold color (#D4AF37) with pulsating animation
- Bilingual support (English/Thai)
- Responsive sizing (sm/md/lg)
- Used in login form

## Conclusion

This feature successfully implements a moderator approval workflow for teacher-created students, improving data quality and administrative oversight while maintaining the existing inline student creation convenience for teachers. The implementation follows all project patterns (bilingual support, index-first queries, real-time notifications) and integrates seamlessly with existing workflows.
