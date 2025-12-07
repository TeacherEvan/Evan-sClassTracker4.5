# Moderator Ghost Role & Analytics Implementation Summary

**Date**: December 6, 2025  
**Issue**: Moderator Ghost Role & Analytics: School Connection + Bilingual Flagging  
**Branch**: `copilot/enhance-moderator-role-analytics`

## Overview

This implementation enhances the moderator role with strict school-scoped permissions, teacher connection management, analytics filtering, and class review capabilities. All features include bilingual support (English/Thai) and comprehensive audit logging.

## Key Features Implemented

### 1. Teacher-School Connection Management

- **New Table**: `teacherSchools` junction table for many-to-many relationships
- **Mutations**:
  - `connect` - Connect teacher to school (moderator-scoped)
  - `disconnect` - Disconnect teacher from school (moderator-scoped)
- **Queries**:
  - `getTeachersForSchool` - List teachers connected to a school
  - `getSchoolsForTeacher` - List schools a teacher is connected to
- **Security**: Moderators can ONLY manage connections for their assigned school

### 2. Class Flagging and Review System

- **New Fields on classes table**:
  - `flaggedForReview` - Boolean flag for classes requiring attention
  - `reviewNotes` / `reviewNotesTh` - Bilingual moderator notes
  - `flaggedBy` / `flaggedAt` - Audit trail
- **Mutations**:
  - `flagForReview` - Flag a class with optional bilingual notes
  - `unflagClass` - Remove flag from a class
- **Query**:
  - `getFlaggedClasses` - Get all flagged classes for a school (moderator-scoped)

### 3. Report Inclusion Management

- **New Field**: `includeInReports` on classes table (default: true)
- **Mutation**: `toggleIncludeInReports` - Include/exclude classes from analytics reports
- **Analytics Integration**: All analytics queries filter by `includeInReports` flag

### 4. Geographic Filtering

- **New Fields on schools table**:
  - `district` / `districtTh` - District names (bilingual)
  - `province` / `provinceTh` - Province names (bilingual)
- **Indexes**: Added for district and province filtering
- **UI**: Dropdown filters in analytics views (when multiple districts/provinces exist)

### 5. Enhanced Analytics

- **Updated Queries**: `getSummaryAnalytics`, `getStudentPerformance`, `getTeacherComparison`
- **Filtering**: All queries now filter by `includeInReports` flag
- **School Scoping**: Moderators automatically filtered to their assigned school

## Database Schema Changes

### New Table: teacherSchools

```typescript
{
  teacherId: v.id("users"),
  schoolId: v.id("schools"),
  connectedBy: v.id("users"),
  connectedAt: v.number(),
  isActive: v.boolean(),
  disconnectedBy: v.optional(v.id("users")),
  disconnectedAt: v.optional(v.number())
}
```

**Indexes**: by_teacher, by_school, by_teacher_and_school, by_active, by_teacher_and_active, by_school_and_active

### Updated Table: classes

**New Fields**:

- `flaggedForReview: v.optional(v.boolean())`
- `includeInReports: v.optional(v.boolean())` (default: true)
- `reviewNotes: v.optional(v.string())`
- `reviewNotesTh: v.optional(v.string())`
- `flaggedBy: v.optional(v.id("users"))`
- `flaggedAt: v.optional(v.number())`

**New Indexes**: by_flagged, by_school_and_flagged

### Updated Table: schools

**New Fields**:

- `district: v.optional(v.string())`
- `districtTh: v.optional(v.string())`
- `province: v.optional(v.string())`
- `provinceTh: v.optional(v.string())`

**New Indexes**: by_province, by_district

## Backend Files Created/Modified

### New Files

1. **convex/teacherSchools.ts** (404 lines)
   - Teacher-school connection management
   - School-scoped authorization
   - Audit logging integration

2. **convex/classReview.ts** (388 lines)
   - Class flagging/unflagging
   - Report inclusion toggling
   - Flagged classes query

### Modified Files

1. **convex/schema.ts**
   - Added teacherSchools table
   - Updated classes table with review fields
   - Updated schools table with geographic fields
   - Added new indexes

2. **convex/analytics.ts**
   - Updated all 3 queries to filter by `includeInReports`
   - Maintained school-scoped access for moderators

3. **convex/auditHelpers.ts**
   - Added `TEACHER_SCHOOLS` to AuditTargetTypes

## Frontend Components

### 1. TeacherConnectionManager Component

**File**: `components/teacher-connection-manager.tsx` (320 lines)

**Features**:

- Connect/disconnect teachers to schools
- List connected teachers with connection dates
- Admin: Select any school
- Moderator: Restricted to assigned school only
- Bilingual UI (English/Thai)

**Key UI Elements**:

- School selector (admins only)
- Teacher dropdown (available teachers)
- Connected teachers list with disconnect buttons
- Real-time updates via Convex queries

### 2. FlaggedClassesReview Component

**File**: `components/flagged-classes-review.tsx` (360 lines)

**Features**:

- View all flagged classes grouped by status (approved/pending/rejected)
- Display bilingual review notes
- Unflag classes
- Show class details (teacher, student, location, date/time)
- Indicate report inclusion status

**Key UI Elements**:

- Status badges (color-coded)
- Review notes display (bilingual)
- Unflag button
- Class detail cards with icons
- Empty state when no flagged classes

### 3. ModeratorAnalyticsView Component

**File**: `components/moderator-analytics-view.tsx` (416 lines)

**Features**:

- School-scoped analytics dashboard
- Date range filtering
- Summary metrics (total classes, attendance rate, active students, avg ClassCount)
- Class list with management controls
- Teacher comparison table
- Flag/unflag classes inline
- Include/exclude from reports inline
- Geographic information display (district/province)

**Key UI Elements**:

- Summary metrics cards
- Date range picker
- Class management list with action buttons
- Teacher comparison table
- Bilingual labels and content

## Security Implementation

### Authorization Model

All moderator mutations follow strict school-scoping:

```typescript
// Example authorization check
if (user.role === "moderator") {
  if (!user.schoolId) {
    throw new Error("Moderator must be assigned to a school");
  }
  if (user.schoolId !== args.schoolId) {
    throw new Error("Unauthorized: Moderators can only access their assigned school");
  }
}
```

### Audit Logging

All mutations include comprehensive audit logging:

- Teacher connections/disconnections
- Class flagging/unflagging
- Report inclusion toggles
- Captures: userId, action, targetType, targetId, details, timestamp

### Rate Limiting

Applied to all mutations:

- Teacher connections: 20/minute
- Class flagging: 50/minute
- Report toggles: 100/minute (bulk operations)

## Bilingual Support

### Pattern Used

- **System Labels**: Bilingual (e.g., column headers, buttons)
- **User Content**: Single language (e.g., notes, reasons)
- **Schema Fields**: Separate fields for bilingual content (`reviewNotes` / `reviewNotesTh`)

### Implementation

```typescript
// Display logic
const reviewNotesDisplay = language === "th"
    ? (cls.reviewNotesTh || cls.reviewNotes)
    : (cls.reviewNotes || cls.reviewNotesTh);
```

## Testing Checklist

### Backend Tests

- [ ] Moderators can only connect teachers to their school
- [ ] Moderators cannot connect teachers to other schools
- [ ] Admins can connect teachers to any school
- [ ] Audit logs are created for all operations
- [ ] Rate limiting is enforced
- [ ] Invalid schoolId/teacherId are rejected

### Frontend Tests

- [ ] Teacher connection UI only shows moderator's school
- [ ] Connect/disconnect buttons work correctly
- [ ] Flagged classes display with correct bilingual content
- [ ] Include/exclude toggles update correctly
- [ ] Analytics respect school boundaries
- [ ] Date range filter works correctly

### Integration Tests

- [ ] Connected teachers can book classes at the school
- [ ] Flagged classes appear in review list
- [ ] Excluded classes don't appear in analytics
- [ ] District/province filters work (when available)

## Breaking Changes

**None** - All changes are additive. Existing functionality remains unchanged.

## Migration Notes

### For Existing Data

1. **teacherSchools table**: Empty initially - moderators must connect teachers
2. **classes.includeInReports**: Defaults to true (existing classes included)
3. **classes.flaggedForReview**: Defaults to false/undefined
4. **schools district/province**: Optional fields (can be added later)

### For Existing Code

No breaking changes. All new fields are optional and have sensible defaults.

## Future Enhancements

1. **Bulk Operations**
   - Bulk connect multiple teachers
   - Bulk flag/unflag classes
   - Bulk include/exclude from reports

2. **Advanced Filtering**
   - Filter by teacher in analytics
   - Filter by grade/class
   - Filter by flag status

3. **Reporting**
   - Export flagged classes to CSV
   - Generate school performance reports
   - Compare schools within district/province

4. **Notifications**
   - Notify moderators when classes are flagged
   - Notify teachers when connected to school
   - Notify admins of teacher connection changes

## Documentation Updates Needed

1. **Architecture Documentation**
   - Add teacherSchools table to schema documentation
   - Document moderator authorization model
   - Add security section on school-scoping

2. **Moderator Workflow Documentation**
   - How to connect teachers to schools
   - How to review and flag classes
   - How to use analytics filters
   - How to manage report inclusion

3. **API Documentation**
   - Document new mutations and queries
   - Add examples for each operation
   - Document error messages and rate limits

## Deployment Checklist

- [x] Database schema updated (Convex deploy)
- [x] Backend mutations implemented
- [x] Frontend components created
- [x] Audit logging integrated
- [x] Security checks implemented
- [ ] E2E tests written
- [ ] Documentation updated
- [ ] Admin notified of new features
- [ ] Moderators trained on new UI

## Known Limitations

1. **District/Province Filtering**: Only shows when multiple schools have these fields populated
2. **Class List Limit**: Shows first 20 classes in moderator analytics (performance optimization)
3. **Teacher Selection**: Teachers must exist before they can be connected to schools

## Performance Considerations

1. **Indexed Queries**: All new queries use appropriate indexes
2. **Batch Fetching**: Teacher details fetched in parallel
3. **Pagination**: Class lists limited to 20 items
4. **Conditional Queries**: Skip queries when schoolId is not available

## Security Considerations

1. **School Boundaries**: Strictly enforced for all moderator operations
2. **Input Validation**: Length limits on review notes (1000 characters)
3. **Rate Limiting**: Prevents abuse of mutation endpoints
4. **Audit Logging**: Complete audit trail for all operations
5. **Authorization**: Role-based access checks on every mutation

## Conclusion

This implementation provides moderators with powerful tools to manage their school's teachers and classes while maintaining strict security boundaries. The bilingual support ensures accessibility for both English and Thai users, and the comprehensive audit logging provides full accountability for all actions.

The modular architecture allows for easy extension and maintenance, and the use of Convex's real-time updates ensures users always see the latest data without manual refreshes.
