# Cancellation Request & Teacher Activity Features

## Overview

Two new administrative features have been added to enhance moderator oversight and teacher workflow management:

1. **Cancellation Request System** - Teachers can request cancellation of approved classes
2. **Teacher Activity Dashboard** - Moderators can monitor all teacher actions and approve/reject cancellations

## 1. Cancellation Request System

### For Teachers

**Location**: Class Bookings tab → Approved classes

**How to Use**:

1. Navigate to an **Approved** class in your Class Bookings list
2. Click the **"Request Cancellation"** button (orange)
3. Fill in the cancellation form:
   - Reason (English) - required
   - Reason (Thai) - required
4. Click **"Submit Request"**
5. Wait for moderator approval/rejection

**Features**:

- Only approved classes show the cancellation button
- Cannot submit duplicate requests (one pending request per class)
- Once submitted, the class shows "Cancellation request pending moderator approval" status
- Bilingual reason required for clear communication

### For Moderators

**Location**: Activity tab → Cancellation Requests

**Workflow**:

1. Navigate to the **Activity** tab
2. Select **"Cancellation Requests"** sub-tab
3. Review pending requests showing:
   - Teacher name
   - Student name
   - Location
   - Scheduled date
   - Request submission date
   - Teacher's cancellation reason (bilingual)
4. Take action:
   - **Approve Cancellation** - Changes class status to `rejected` and notifies teacher
   - **Reject** - Denies the cancellation request

### Backend Implementation

**Database Table**: `cancellationRequests`

```typescript
{
  classId: Id<"classes">,
  teacherId: Id<"users">,
  reason: string,           // English reason
  reasonTh: string,         // Thai reason
  status: "pending" | "approved" | "rejected",
  moderatorId?: Id<"users">, // Set when processed
  createdAt: number,
  processedAt?: number
}
```

**Indexes**:

- `by_class` - Quick lookup for pending requests on a class
- `by_teacher` - List all requests by a teacher
- `by_school` - List all requests for a school
- `by_status` - Filter by status (pending/approved/rejected)

**API Functions** (`convex/cancellationRequests.ts`):

- `create` - Submit new cancellation request
- `approve` - Moderator approves cancellation
- `reject` - Moderator rejects cancellation
- `list` - Query requests with filters
- `hasPendingRequest` - Check if class has pending request

**Validation Rules**:

- Only approved classes can be cancelled
- Only one pending request per class at a time
- Teacher must be the class owner
- Moderator must be from same school

**Automatic Actions**:

- On approval: Class status → `rejected`, notification sent to teacher
- On rejection: Request status → `rejected`, no class status change
- Teacher log created for both approve and reject actions

## 2. Teacher Activity Dashboard

### Purpose

Provides moderators with comprehensive oversight of all teacher actions in their school, including:

- Class bookings/requests
- Cancellation requests
- Other teacher activities

### Location

**Moderators only**: Activity tab (Shield icon)

### Features

#### A. Cancellation Requests View

- Real-time list of pending cancellation requests
- Badge showing count of pending requests
- Full class details with teacher's reason
- Quick approve/reject actions

#### B. Activity Logs View

- Paginated table of all teacher actions (last 50 by default)
- Columns:
  - Date/Time
  - Teacher
  - Action (color-coded badge)
  - Details (bilingual)

**Log Types**:

- `class_booked` - Moderator directly booked a class
- `class_requested` - Teacher requested a class
- `cancellation_requested` - Teacher requested cancellation
- `cancellation_approved` - Moderator approved cancellation
- `cancellation_rejected` - Moderator rejected cancellation

### Backend Implementation

**Database Table**: `teacherLogs`

```typescript
{
  teacherId: Id<"users">,
  schoolId: Id<"schools">,
  action: string,           // English action name
  actionTh: string,         // Thai action name
  details: string,          // English details
  detailsTh: string,        // Thai details
  classId?: Id<"classes">,  // Related class if applicable
  createdAt: number
}
```

**Indexes**:

- `by_teacher` - Get all logs for a teacher
- `by_school` - Get all logs for a school
- `by_school_and_date` - Compound index for date-range queries
- `by_created_at` - Chronological sorting

**API Functions** (`convex/teacherLogs.ts`):

- `create` - Create new log entry (auto-called by mutations)
- `list` - Query logs with filters (school, teacher, date range, limit)
- `getTeacherSummary` - Aggregated stats for a teacher
- `getSchoolSummary` - Aggregated stats for all teachers in a school

**Automatic Logging**:
Teacher logs are automatically created when:

1. Class is booked (by teacher or moderator)
2. Cancellation request is submitted
3. Cancellation request is approved/rejected

### UI Components

**TeacherActivityDashboard** (`components/teacher-activity-dashboard.tsx`):

- Main container with tab navigation
- Props:
  - `schoolId` - Current moderator's school
  - `moderatorId` - Current moderator's user ID
- Two sub-views: Cancellation Requests and Activity Logs

**CancellationRequestItem**:

- Displays individual cancellation request
- Shows all relevant class and teacher information
- Approve/Reject action buttons

**TeacherLogRow**:

- Table row for a single activity log entry
- Color-coded action badges
- Bilingual support

## Integration Points

### Class Booking Component (`components/class-booking.tsx`)

**Teacher View**:

- Shows "Request Cancellation" button on approved classes
- Inline cancellation form with bilingual fields
- Shows pending status if request submitted

**Moderator View**:

- No changes to existing acknowledge/approve/reject workflow

### Main App (`app/page.tsx`)

**New Tab**:

- **Activity** tab (moderators only)
- Positioned between Analytics and Locations tabs
- Shield icon for visual identification

### Automatic Notifications

**Cancellation Approved**:

```
Title: "Cancellation Approved" / "การยกเลิกได้รับการอนุมัติ"
Message: "Your cancellation request for [Student] at [Location] has been approved"
Type: success
```

**Cancellation Rejected**:

```
Title: "Cancellation Rejected" / "การยกเลิกถูกปฏิเสธ"
Message: "Your cancellation request for [Student] at [Location] has been rejected"
Type: warning
```

## Usage Scenarios

### Scenario 1: Teacher Needs to Cancel an Approved Class

1. Teacher navigates to Class Bookings tab
2. Finds the approved class to cancel
3. Clicks "Request Cancellation"
4. Fills in both English and Thai reasons
5. Submits request
6. Class shows "pending cancellation" status
7. Teacher receives notification when moderator processes request

### Scenario 2: Moderator Reviews Cancellation Requests

1. Moderator opens Activity tab
2. Sees badge with pending request count
3. Reviews cancellation details
4. Approves or rejects based on validity
5. Teacher receives automatic notification
6. Action logged in Activity Logs

### Scenario 3: Moderator Audits Teacher Activity

1. Moderator opens Activity tab
2. Switches to Activity Logs view
3. Reviews recent teacher actions
4. Identifies patterns or issues
5. Takes appropriate action if needed

## Technical Notes

### Performance Optimizations

- Compound indexes for efficient date-range queries
- Pagination on activity logs (50 limit default)
- Lazy loading of class/student/location data in cancellation requests

### Data Retention

- Teacher logs: No automatic cleanup (permanent audit trail)
- Cancellation requests: Retained permanently with processed/rejected requests
- Status field allows filtering to show only pending requests

### Security

- All mutations validate user roles
- Teachers can only request cancellation for their own classes
- Moderators can only process requests in their school
- Admin has no special access (moderator-only feature)

### Bilingual Support

All user-facing text fully bilingual:

- Cancellation reasons (required in both languages)
- Log actions and details
- UI labels and messages
- Notifications

## Future Enhancements

### Potential Improvements

1. **Email notifications** for cancellation requests
2. **Bulk approve/reject** for multiple requests
3. **Export activity logs** to CSV/PDF
4. **Advanced filtering** on activity logs (date picker, action type filter)
5. **Cancellation history** view on class details
6. **Automatic approval rules** (e.g., >24 hours notice)
7. **Cancellation deadlines** (prevent late cancellations)
8. **Statistics dashboard** showing cancellation trends

## Testing Checklist

### Teacher Cancellation Workflow

- [ ] Request cancellation button appears only on approved classes
- [ ] Form requires both English and Thai reasons
- [ ] Cannot submit empty reasons
- [ ] Pending status displays after submission
- [ ] Cannot submit duplicate requests
- [ ] Receives notification on approval
- [ ] Receives notification on rejection

### Moderator Dashboard

- [ ] Activity tab visible only to moderators
- [ ] Cancellation requests tab shows pending count badge
- [ ] Can approve cancellation (changes class to rejected)
- [ ] Can reject cancellation (keeps class approved)
- [ ] Activity logs display with correct data
- [ ] Logs show actions from all school teachers
- [ ] Bilingual content displays correctly based on language setting

### Data Integrity

- [ ] Logs created automatically on class booking
- [ ] Logs created on cancellation request submission
- [ ] Logs created on cancellation approval/rejection
- [ ] Class status updates correctly on approval
- [ ] Notifications sent to correct recipients
- [ ] School filtering works correctly

## Files Modified/Created

### New Files

- `components/teacher-activity-dashboard.tsx` - Main dashboard component
- `convex/cancellationRequests.ts` - Cancellation backend logic
- `convex/teacherLogs.ts` - Activity logging backend
- `CANCELLATION_AND_ACTIVITY_FEATURES.md` - This documentation

### Modified Files

- `convex/schema.ts` - Added cancellationRequests and teacherLogs tables
- `convex/classes.ts` - Added automatic logging to book mutation
- `components/class-booking.tsx` - Added cancellation request UI for teachers
- `app/page.tsx` - Added Activity tab for moderators

## Summary

These features significantly enhance moderator oversight while providing teachers with a professional cancellation workflow. The automatic logging creates a complete audit trail, and the bilingual approach maintains consistency with the rest of the application.

**Key Benefits**:
✅ Professional cancellation workflow with oversight
✅ Complete audit trail of all teacher actions
✅ Real-time notifications and updates
✅ Bilingual support throughout
✅ Role-based access control
✅ Efficient database queries with proper indexing
