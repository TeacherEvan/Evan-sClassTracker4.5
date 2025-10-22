# Moderator ClassCount Viewing Feature

**Status**: 🚧 In Progress  
**Date**: October 23, 2025  
**Feature**: Moderators can view detailed teacher ClassCount breakdowns with transparency notifications

---

## Feature Requirements

### Core Functionality

1. **Moderator Access Only**
   - Only moderators and admins can view detailed teacher ClassCounts
   - Moderators can only view teachers from their assigned school
   - Admins can view all teachers

2. **ClassCount Details View**
   - Click on teacher name → View their ClassCount
   - Select date range (start/end dates)
   - View breakdown by student:
     - Student name
     - Number of classes with that student
     - ClassCount contribution (weighted by duration)
   - View complete class information
   - Export/Print/Download capability

3. **Transparency Notifications**
   - When moderator views ClassCount → Teacher receives notification
   - When moderator exports ClassCount → Teacher receives notification
   - Notification includes date range viewed
   - Purpose: Transparency on how funds are calculated

4. **Integration Points**
   - Available in moderator analytics toolbar
   - Show ClassCount when viewing teacher analytics
   - Link to detailed breakdown from analytics

---

## Implementation Plan

### Backend (Convex)

#### ✅ Completed

1. **Schema Updates** (`convex/schema.ts`)
   - Added `classCountAuditLogs` table
   - Indexes: by_teacher, by_moderator, by_timestamp, by_teacher_and_timestamp

2. **Queries** (`convex/teacherClassCount.ts`)
   - ✅ `getTeacherClassCount` - Basic count for teacher badge
   - ✅ `getTeacherClassCountDetailed` - Detailed breakdown with date range
   - ✅ `logClassCountView` - Audit log + transparency notification

#### Detailed Query Structure

```typescript
getTeacherClassCountDetailed({
  teacherId: Id<"users">,
  startDate: number,
  endDate: number,
  moderatorId: Id<"users">
})

Returns:
{
  teacher: { id, username, role },
  dateRange: { start, end },
  summary: {
    totalClassCount: number,
    totalApprovedClasses: number,
    totalStudents: number
  },
  studentBreakdown: [{
    studentId: string,
    studentName: string,
    studentNameTh: string,
    classCount: number, // Weighted total for this student
    numberOfClasses: number, // Actual number of classes
    classes: [{
      classId: string,
      scheduledDate: number,
      duration: number,
      studentCount: number,
      contributedCount: number,
      location?: string,
      locationTh?: string
    }]
  }]
}
```

### Frontend (React Components)

#### 🚧 To Do

1. **TeacherClassCountModal Component**
   - Modal dialog showing detailed breakdown
   - Date range picker (start/end)
   - Student list with counts
   - Expandable class details per student
   - Export buttons (CSV, Print)
   - Bilingual support

2. **Integration with Analytics**
   - Add "View ClassCount" button in teacher analytics
   - Add ClassCount column in teacher performance table
   - Click teacher name → Open ClassCount modal

3. **Moderator Dashboard Enhancement**
   - Add ClassCount overview card
   - Quick access to top teachers by ClassCount
   - Period-to-date summary

---

## UI Design

### Teacher ClassCount Modal

```
┌─────────────────────────────────────────────────────┐
│ Teacher ClassCount - Evan                      [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Date Range: [Jan 1, 2025] to [Jan 31, 2025]      │
│                                          [Apply]    │
│                                                     │
│  Summary:                                          │
│  • Total ClassCount: 45.5                          │
│  • Approved Classes: 42                            │
│  • Students Taught: 15                             │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Student Breakdown                         │    │
│  ├───────────────────────────────────────────┤    │
│  │ 1. John Smith (จอห์น สมิธ)               │    │
│  │    ClassCount: 8.5  |  Classes: 7        │ [▼]│
│  │                                           │    │
│  │ 2. Sarah Johnson (ซาราห์ จอห์นสัน)        │    │
│  │    ClassCount: 6.0  |  Classes: 6        │ [▶]│
│  │                                           │    │
│  │ 3. Mike Davis (ไมค์ เดวิส)                │    │
│  │    ClassCount: 5.5  |  Classes: 5        │ [▶]│
│  │                                           │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  [📥 Export CSV]  [🖨️ Print]  [💾 Save PDF]       │
│                                                     │
│  Note: Teacher will be notified of this view       │
└─────────────────────────────────────────────────────┘
```

### Expanded Student Details

```
│  │ 1. John Smith (จอห์น สมิธ)               │    │
│  │    ClassCount: 8.5  |  Classes: 7        │ [▼]│
│  │    ┌─────────────────────────────────────┐│    │
│  │    │ Jan 5  • 90min • 2 students • 1.5  ││    │
│  │    │ Jan 8  • 60min • 1 student  • 1.0  ││    │
│  │    │ Jan 12 • 120min • 3 students • 2.0 ││    │
│  │    │ ...                                 ││    │
│  │    └─────────────────────────────────────┘│    │
```

---

## Transparency Notification

### When Moderator Views ClassCount

**English**:
> **Class Count Viewed**  
> John (Moderator) viewed your class count for Jan 1, 2025 - Jan 31, 2025

**Thai**:
> **การดูจำนวนชั้นเรียน**  
> John (ผู้ดูแล) ดูจำนวนชั้นเรียนของคุณสำหรับ 1 ม.ค. 2568 - 31 ม.ค. 2568

### When Moderator Exports ClassCount

**English**:
> **Class Count Exported**  
> John (Moderator) exported your class count for Jan 1, 2025 - Jan 31, 2025

**Thai**:
> **การส่งออกจำนวนชั้นเรียน**  
> John (ผู้ดูแล) ส่งออกจำนวนชั้นเรียนของคุณสำหรับ 1 ม.ค. 2568 - 31 ม.ค. 2568

---

## Export Formats

### CSV Export

```csv
Teacher,Evan
Period,2025-01-01 to 2025-01-31
Total ClassCount,45.5
Approved Classes,42
Students Taught,15

Student Name,Student Name (Thai),ClassCount,Number of Classes
John Smith,จอห์น สมิธ,8.5,7
Sarah Johnson,ซาราห์ จอห์นสัน,6.0,6
Mike Davis,ไมค์ เดวิส,5.5,5
...
```

### Detailed CSV with Class Info

```csv
Student Name,Student Name (Thai),Class Date,Duration (min),Student Count,Class Contribution
John Smith,จอห์น สมิธ,2025-01-05,90,2,1.5
John Smith,จอห์น สมิธ,2025-01-08,60,1,1.0
...
```

---

## Security & Authorization

### Authorization Matrix

| Role      | Can View Own | Can View School | Can View All | Can Export |
|-----------|--------------|-----------------|--------------|------------|
| Teacher   | ✅ Yes       | ❌ No           | ❌ No        | ✅ Yes     |
| Moderator | ✅ Yes       | ✅ Yes          | ❌ No        | ✅ Yes     |
| Admin     | ✅ Yes       | ✅ Yes          | ✅ Yes       | ✅ Yes     |

### Verification Logic

```typescript
// In getTeacherClassCountDetailed query
const moderator = await ctx.db.get(args.moderatorId);

// Check role
if (moderator.role !== "moderator" && moderator.role !== "admin") {
  throw new Error("Unauthorized");
}

// Moderators can only view their school's teachers
if (moderator.role === "moderator") {
  const teacherSchool = /* get teacher's school */;
  if (teacherSchool !== moderator.schoolId) {
    throw new Error("Unauthorized: Different school");
  }
}
```

---

## Performance Considerations

### Query Optimization

1. ✅ Uses indexed queries (`by_teacher_and_date`)
2. ✅ Batch fetches students (no N+1)
3. ✅ Filters at database level
4. ✅ Single pass through classes

### Expected Performance

- **Small dataset** (50 classes): <50ms
- **Medium dataset** (500 classes): <200ms
- **Large dataset** (5000 classes): <1s

### Caching Strategy

- ClassCount totals cached in memory (reactive updates)
- Detailed breakdowns fetched on-demand
- Export generates fresh data (no cache)

---

## Testing Scenarios

### Scenario 1: Moderator Views Own School Teacher

```
Given: Moderator "John" at "Bangkok School"
When: Views teacher "Evan" ClassCount (also Bangkok School)
Then: ✅ Shows detailed breakdown
And: ✅ Teacher receives notification
```

### Scenario 2: Moderator Tries Different School

```
Given: Moderator "John" at "Bangkok School"
When: Tries to view teacher "Sarah" (Chiang Mai School)
Then: ❌ Error: "Unauthorized: Different school"
And: ❌ No notification sent
```

### Scenario 3: Admin Views Any Teacher

```
Given: Admin "Alex"
When: Views any teacher ClassCount
Then: ✅ Shows detailed breakdown
And: ✅ Teacher receives notification
```

### Scenario 4: Export CSV

```
Given: Moderator viewing teacher ClassCount
When: Clicks "Export CSV"
Then: ✅ Downloads CSV file
And: ✅ Teacher receives "exported" notification
And: ✅ Audit log created
```

---

## Implementation Checklist

### Backend ✅

- [x] Schema update (classCountAuditLogs table)
- [x] getTeacherClassCountDetailed query
- [x] logClassCountView mutation
- [x] Authorization checks
- [x] Batch fetching optimization

### Frontend 🚧

- [ ] TeacherClassCountModal component
- [ ] Date range picker integration
- [ ] Student breakdown list
- [ ] Expandable class details
- [ ] Export CSV functionality
- [ ] Export PDF functionality
- [ ] Print functionality
- [ ] Bilingual support
- [ ] Integration with analytics dashboard

### Testing 🚧

- [ ] Unit tests for queries
- [ ] Authorization tests
- [ ] UI component tests
- [ ] Export format tests
- [ ] Notification delivery tests

---

## Next Steps

1. **Create TeacherClassCountModal component**
2. **Add to moderator analytics dashboard**
3. **Implement export functionality**
4. **Add date range picker**
5. **Test notification delivery**
6. **Add print stylesheet**
7. **User acceptance testing**

---

## Future Enhancements

1. **Payment Integration**
   - Mark periods as "paid"
   - Payment history tracking
   - Generate payment reports

2. **Advanced Filtering**
   - Filter by student
   - Filter by location
   - Filter by class type

3. **Comparative Analytics**
   - Compare periods (month-over-month)
   - Compare teachers (peer benchmarking)
   - Trend analysis

4. **Automated Reporting**
   - Schedule monthly reports
   - Email delivery
   - Auto-generate payment summaries

---

**Status**: Backend complete, Frontend next ✅➡️🚧
