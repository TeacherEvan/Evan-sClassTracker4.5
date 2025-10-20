# Teacher Logs Management Feature

## Overview

This feature enables teachers to log their completed classes and allows admins/moderators to acknowledge these logs. All users can download their relevant logs in CSV format with role-based access control.

## Implementation Summary

### 1. Database Schema Updates (`convex/schema.ts`)

Added acknowledgment fields to the `teacherLogs` table:

```typescript
teacherLogs: defineTable({
  // ... existing fields
  acknowledged: v.optional(v.boolean()),      // Whether admin/moderator acknowledged this log
  acknowledgedBy: v.optional(v.id("users")),  // Admin/moderator who acknowledged
  acknowledgedAt: v.optional(v.number()),     // When it was acknowledged
  // ... existing fields
})
  // ... existing indexes
  .index("by_acknowledged", ["acknowledged"]), // New index for filtering pending logs
```

### 2. Backend Functions (`convex/teacherLogs.ts`)

#### New Mutations

**`acknowledgeLog`**: Allows admins/moderators to acknowledge teacher logs

- Validates user role (admin or moderator only)
- Updates log with acknowledgment details
- Sends notification to the teacher

**Enhanced `create`**: Updated to set `acknowledged: false` by default

#### New Query

**`listPendingLogs`**: Returns unacknowledged logs for admins/moderators

- Filters by acknowledgment status
- Respects school boundaries for moderators
- Returns empty array for non-authorized users

### 3. Export Enhancement (`convex/exports.ts`)

**Updated `exportTeacherLogs`**: Added role-based access control

- **Teachers**: Can only export their own logs
- **Moderators**: Can export logs from their school only
- **Admins**: Can export any teacher's logs
- Added acknowledgment details to export:
  - `acknowledged`: Yes/No
  - `acknowledgedBy`: Username of acknowledger
  - `acknowledgedAt`: Timestamp of acknowledgment

### 4. Frontend Component (`components/teacher-logs-manager.tsx`)

New comprehensive component with:

#### Features

- **Bilingual UI**: Full English/Thai support
- **Filter System**:
  - Teacher selection (admin/moderator only)
  - Date range (start/end dates)
  - Show pending logs only toggle
- **Real-time Data**: Uses Convex queries for live updates
- **Download Functionality**: Export logs to CSV
- **Acknowledgment Actions**: One-click log approval

#### UI Elements

- Table view with sortable columns
- Status badges (Pending/Acknowledged)
- Filter panel with dropdown and date inputs
- Download button with CSV export
- Acknowledge button for pending logs

#### Props

```typescript
interface TeacherLogsManagerProps {
    currentUser: User;
}
```

### 5. Main App Integration (`app/page.tsx`)

Added "Teacher Logs" tab:

- Visible to teachers, moderators, and admins
- Icon: `FileText`
- Positioned after activity tab for moderators
- Positioned before notifications for all users
- Tab state: `"logs"`

## User Workflows

### Teacher Workflow

1. Navigate to "Teacher Logs" tab
2. View their own logs with acknowledgment status
3. Filter by date range
4. Download their logs as CSV

### Admin/Moderator Workflow

1. Navigate to "Teacher Logs" tab
2. View all logs or filter by teacher/date
3. Toggle "Show pending logs only" to see unacknowledged logs
4. Click "Acknowledge" button on pending logs
5. Download logs for any teacher (admins) or their school (moderators)

## Technical Details

### Role-Based Access Control

| Feature | Teacher | Moderator | Admin |
|---------|---------|-----------|-------|
| View own logs | ✅ | ✅ | ✅ |
| View all logs | ❌ | ✅ (school only) | ✅ |
| Acknowledge logs | ❌ | ✅ | ✅ |
| Download own logs | ✅ | ✅ | ✅ |
| Download any logs | ❌ | ✅ (school only) | ✅ |

### Database Queries

**Indexes Used:**

- `by_acknowledged`: Fast lookup of pending logs
- `by_teacher`: Filter logs by teacher
- `by_school`: Filter logs by school
- `by_teacher_and_date`: Date range queries per teacher
- `by_school_and_date`: Date range queries per school

### CSV Export Format

Exported CSV includes these columns:

- `logId`: Log identifier
- `teacherUsername`: Teacher's username
- `schoolName`: School name (English)
- `schoolNameTh`: School name (Thai)
- `action`: Action performed (English)
- `actionTh`: Action performed (Thai)
- `details`: Action details (English)
- `detailsTh`: Action details (Thai)
- `acknowledged`: Acknowledgment status (Yes/No)
- `acknowledgedBy`: Username of acknowledger
- `acknowledgedAt`: Acknowledgment timestamp
- `createdAt`: Log creation timestamp

## Notifications

When a log is acknowledged, the system automatically sends a notification to the teacher:

- **Title (EN)**: "Class Log Acknowledged"
- **Title (TH)**: "ยืนยันบันทึกคลาสแล้ว"
- **Type**: Success
- **Content**: Includes acknowledger's username

## Future Enhancements

Potential improvements:

1. Bulk acknowledgment feature
2. Export with custom column selection
3. Advanced filtering (by action type, student)
4. Analytics dashboard for log patterns
5. Automatic log creation from completed classes
6. Email notifications for acknowledgments

## Testing Checklist

- [ ] Teacher can view only their logs
- [ ] Moderator can view school logs
- [ ] Admin can view all logs
- [ ] Pending logs filter works correctly
- [ ] Acknowledge button updates status
- [ ] Notification sent on acknowledgment
- [ ] CSV download includes correct data
- [ ] Role-based access enforced in exports
- [ ] Date filters work correctly
- [ ] Bilingual labels display properly

## Related Files

**Backend:**

- `convex/schema.ts` - Database schema
- `convex/teacherLogs.ts` - Log queries and mutations
- `convex/exports.ts` - Export functionality

**Frontend:**

- `components/teacher-logs-manager.tsx` - Main component
- `app/page.tsx` - Tab integration

**Icons:**

- `FileText` - Tab icon
- `CheckCircle` - Acknowledged status
- `Clock` - Pending status
- `Download` - Export button
- `Filter` - Filter panel

## Deployment Notes

1. **Database Migration**: Schema changes are backward compatible (optional fields)
2. **No Breaking Changes**: Existing logs will have `acknowledged: undefined` (treated as `false`)
3. **Performance**: Indexed queries ensure fast lookups even with large datasets
4. **Security**: Role checks in both frontend and backend prevent unauthorized access
