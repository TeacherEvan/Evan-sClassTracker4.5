# Student Approval Workflow - Quick Reference

## Overview
Teachers can create students during class booking, but moderators must approve them before they become available.

## Visual Flow Diagram

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                    TEACHER WORKFLOW                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    [Teacher opens Class Booking form]
                ↓
    [Clicks "+ Create New" student]
                ↓
    ┌─────────────────────────────┐
    │  First Name:  [John      ]  │
    │  Last Name:   [Doe       ]  │
    │  Grade:       [5         ]  │
    │  School:      [ABC High  ]  │
    └─────────────────────────────┘
                ↓
           [Submit]
                ↓
    ┌─────────────────────────────┐
    │  ✓ Student Created!         │
    │  Awaiting moderator         │
    │  approval...                │
    └─────────────────────────────┘
                ↓
    Student NOT in dropdown yet
                ↓
    [Wait for notification...]
                ↓
    ┌─────────────────────────────┐
    │  🔔 Student Approved!       │
    │  John Doe is now available  │
    │  for class bookings         │
    └─────────────────────────────┘
                ↓
    Student NOW in dropdown ✓


┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                  MODERATOR WORKFLOW                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

    [Receives notification]
                ↓
    ┌─────────────────────────────┐
    │  🔔 New Student Pending     │
    │  Teacher added: John Doe    │
    │  Grade 5                    │
    └─────────────────────────────┘
                ↓
    [Clicks on "Students" tab]
                ↓
    ╔═════════════════════════════════════════════╗
    ║  👨‍🎓 Pending Student Approvals              ║
    ║  2 student(s) waiting                       ║
    ╠═════════════════════════════════════════════╣
    ║  ┌───────────────────────────────────────┐ ║
    ║  │ 🟠 John Doe          [✓ Approve] [✗] │ ║
    ║  │    ID: ABCH-JODO-k9x2tz-X4J2         │ ║
    ║  │    Grade: 5                          │ ║
    ║  │    Guardian: Jane Doe (555-1234)     │ ║
    ║  │    Requested: Oct 20, 2024           │ ║
    ║  └───────────────────────────────────────┘ ║
    ║  ┌───────────────────────────────────────┐ ║
    ║  │ 🟠 Sarah Smith       [✓ Approve] [✗] │ ║
    ║  │    ID: ABCH-SASM-l8y3wa-Y5K3         │ ║
    ║  │    Grade: 3                          │ ║
    ║  │    Requested: Oct 19, 2024           │ ║
    ║  └───────────────────────────────────────┘ ║
    ╚═════════════════════════════════════════════╝
                ↓
         [Decision Point]
                ↓
    ┌───────────┴────────────┐
    ▼                        ▼
[Approve]               [Reject]
    │                        │
    │                        ▼
    │              [Enter reason: "Duplicate"]
    │                        │
    ▼                        ▼
┌───────────┐          ┌─────────────┐
│ Student   │          │ Student     │
│ Available │          │ Deleted     │
└───────────┘          └─────────────┘
    │                        │
    ▼                        ▼
┌───────────┐          ┌─────────────┐
│ Notify    │          │ Notify      │
│ Teacher   │          │ Teacher     │
│ (Success) │          │ (Warning)   │
└───────────┘          └─────────────┘
```

## Database State Changes

### When Teacher Creates Student
```sql
-- Before (student doesn't exist)
SELECT * FROM students WHERE firstName = 'John' AND lastName = 'Doe';
-- Result: (empty)

-- After Create
INSERT INTO students (
  firstName: "John",
  lastName: "Doe",
  studentId: "ABCH-JODO-k9x2tz-X4J2",
  schoolId: "...",
  grade: "5",
  acknowledged: false,  ← KEY: Pending approval
  createdBy: "teacher123",
  createdAt: 1697884800000
);
```

### When Moderator Approves
```sql
-- Before
acknowledged: false

-- After Approve
UPDATE students 
SET acknowledged = true
WHERE _id = "student123";

-- Result
acknowledged: true  ← Now visible to teachers
```

### When Moderator Rejects
```sql
-- Before
Student exists with acknowledged: false

-- After Reject
DELETE FROM students WHERE _id = "student123";

-- Result
Student completely removed from database
```

## Query Behavior

### Teachers Query (Class Booking)
```typescript
// Query with filter
const students = useQuery(api.students.list, { 
  acknowledgedOnly: true 
});

// Returns only approved students
[
  { firstName: "Alice", acknowledged: true },
  { firstName: "Bob", acknowledged: true }
]
// John Doe NOT included (acknowledged: false)
```

### Moderators Query (Students Tab)
```typescript
// Query pending students
const pending = useQuery(api.students.getPendingBySchool, {
  schoolId: "school123"
});

// Returns only unacknowledged students for this school
[
  { firstName: "John", acknowledged: false, schoolId: "school123" },
  { firstName: "Sarah", acknowledged: false, schoolId: "school123" }
]
```

## Notification Timeline

```
Time    Actor       Action              Notification
──────  ──────────  ──────────────────  ─────────────────────────────
10:00   Teacher     Creates student     → Moderator receives "Pending"
10:05   Moderator   Views Students tab  (No notification)
10:10   Moderator   Clicks Approve      → Teacher receives "Approved"
10:11   Teacher     Opens Class Booking Student now in dropdown
```

## Component Hierarchy

```
app/page.tsx
├── [Navigation Tabs]
│   ├── Calendar
│   ├── Classes
│   ├── Messages
│   └── Students ← NEW TAB (Moderators only)
│
└── [Tab Content]
    ├── activeTab === "classes"
    │   └── ClassBooking
    │       ├── Student Dropdown (acknowledgedOnly=true)
    │       └── "+ Create New" Form
    │
    └── activeTab === "students" (Moderators)
        └── PendingStudentsApproval ← NEW COMPONENT
            ├── Pending Student List
            ├── [Approve] Button
            └── [Reject] Button
```

## Security & Permissions

| Action                  | Teacher | Moderator | Admin |
|-------------------------|---------|-----------|-------|
| Create student          | ✓       | ✓         | ✓     |
| Student needs approval? | YES     | NO        | NO    |
| View pending students   | ✗       | ✓         | ✓     |
| Approve student         | ✗       | ✓         | ✓     |
| Reject student          | ✗       | ✓         | ✓     |
| View all students       | ✗       | ✗         | ✓     |

## Edge Cases

### Case 1: No Moderator Assigned
```
Teacher creates student → acknowledged: false
                       → No notification sent (no moderator)
                       → Student stays pending forever
Solution: Admin must assign moderator to school
```

### Case 2: Admin Creates Student
```
Admin creates student → acknowledged: true (auto-approved)
                     → No notification sent
                     → Immediately available
```

### Case 3: Guardian-Linked Student
```
Teacher creates with guardianId → acknowledged: false
                                → Notification to GUARDIAN (not moderator)
                                → Different workflow
```

## Performance Notes

### Index Usage
```typescript
// Efficient: Uses compound index
.withIndex("by_school_and_acknowledged", (q) => 
  q.eq("schoolId", "school123").eq("acknowledged", false)
)

// Inefficient: Table scan
.query("students").filter(s => !s.acknowledged)  // NEVER DO THIS
```

### Query Counts
- Teacher opening class booking: 1 query (filtered list)
- Moderator opening Students tab: 1 query (pending only)
- Approve action: 1 update + 1 notification insert
- Reject action: 1 delete + 1 notification insert

## Testing Checklist

- [ ] Teacher creates student → Not in dropdown
- [ ] Moderator receives notification
- [ ] Moderator sees student in Students tab
- [ ] Moderator approves → Teacher notified
- [ ] Student appears in teacher's dropdown
- [ ] Moderator rejects with reason → Teacher notified
- [ ] Student deleted from database
- [ ] Admin creates student → Auto-approved
- [ ] Admin-created student immediately available

## Quick Command Reference

### Check Pending Students (Convex Dashboard)
```typescript
// Run in Convex dashboard
await ctx.db
  .query("students")
  .filter(q => q.eq(q.field("acknowledged"), false))
  .collect()
```

### Manual Approval (Convex Dashboard)
```typescript
// Run in Convex dashboard
await ctx.db.patch("student_id_here", {
  acknowledged: true
})
```

### Find Students by Creator (Convex Dashboard)
```typescript
await ctx.db
  .query("students")
  .withIndex("by_created_by", q => q.eq("createdBy", "teacher_id"))
  .collect()
```

---

**Last Updated:** October 20, 2024
**Status:** Implemented and Ready for Deployment
