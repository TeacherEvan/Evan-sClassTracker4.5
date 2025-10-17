# Role-Based Class Booking Implementation

## Overview

Updated the class booking system to differentiate between teacher requests and moderator/admin direct bookings.

## Key Changes

### Behavior by Role

#### **Teachers**

- **Button**: "Request Class" / "ขอชั้นเรียน"
- **Action**: Creates a class with `status: "pending"`
- **Workflow**:
  1. Teacher fills out form and clicks "Request Class"
  2. Class is created with `pending` status
  3. Notification sent to school moderator
  4. Moderator must acknowledge/approve the request
  5. Class appears on information boards only after moderator approval

#### **Moderators & Admins**

- **Button**: "Book Class" / "จองชั้นเรียน"
- **Action**: Creates a class with `status: "approved"`
- **Workflow**:
  1. Moderator/Admin fills out form and clicks "Book Class"
  2. Class is **immediately created with `approved` status**
  3. **No notification sent** (no approval needed)
  4. Class **immediately appears** on calendar and information boards
  5. Ready for use right away

### Technical Implementation

#### Backend Changes (`convex/classes.ts`)

**Modified `book` mutation**:

```typescript
args: {
  teacherId: v.id("users"),
  schoolId: v.id("schools"),
  studentId: v.id("students"),
  locationId: v.id("locations"),
  scheduledDate: v.number(),
  bookedByUserId: v.id("users"), // NEW: ID of user creating the booking
}
```

**Logic**:

1. Checks the role of `bookedByUserId`
2. If moderator/admin: `status = "approved"`
3. If teacher: `status = "pending"`
4. Only sends notification to moderator if teacher request (pending)

#### Frontend Changes (`components/class-booking.tsx`)

**Dynamic UI Text**:

- Page title changes based on role:
  - Teacher: "Class Requests" / "คำขอชั้นเรียน"
  - Moderator/Admin: "Class Bookings" / "การจองชั้นเรียน"

- Button text changes based on role:
  - Teacher: "Request Class" / "ขอชั้นเรียน"
  - Moderator/Admin: "Book Class" / "จองชั้นเรียน"

- Form title changes based on role:
  - Teacher: "Request a New Class" / "ขอชั้นเรียนใหม่"
  - Moderator/Admin: "Book a New Class" / "จองชั้นเรียนใหม่"

- Loading state text changes:
  - Teacher: "Requesting..." / "กำลังขอ..."
  - Moderator/Admin: "Booking..." / "กำลังจอง..."

- Empty state message changes:
  - Teacher: "No class requests found" / "ไม่พบคำขอชั้นเรียน"
  - Moderator/Admin: "No classes found" / "ไม่พบชั้นเรียน"

**Form Behavior**:

- All users (teachers, moderators, admins) see the Book/Request button
- All users can fill out the same form
- The system automatically determines the status based on who is booking
- `bookedByUserId` is passed to backend to check role

#### Main Page Changes (`app/page.tsx`)

**Tab Label**:

- Teacher tab shows: "Class Requests" / "คำขอชั้นเรียน"
- Moderator/Admin tab shows: "Class Bookings" / "การจองชั้นเรียน"

### User Experience Flow

#### Teacher Requesting a Class

1. Navigate to "Class Requests" tab
2. Click "Request Class" button
3. Fill out form (student, school, location, date)
4. Click "Request Class" button in form
5. **Wait for moderator to acknowledge/approve**
6. Receive notification when moderator responds
7. Class appears on calendar after approval

#### Moderator Booking a Class

1. Navigate to "Class Bookings" tab
2. Click "Book Class" button
3. Fill out form (student, school, location, date)
4. Click "Book Class" button in form
5. **Class is immediately booked and approved**
6. No waiting, no notifications needed
7. Class appears immediately on calendar
8. Teachers can see the class right away

### Moderator Notification Workflow (for Teacher Requests)

When a **teacher** requests a class:

1. Notification sent to school moderator
2. Notification type: "warning" (yellow)
3. Title: "New Class Request" / "คำขอชั้นเรียนใหม่"
4. Message shows:
   - Teacher name
   - Student name
   - Location
   - Request to acknowledge

When a **moderator/admin** books a class:

- **No notification sent**
- Class is immediately approved
- Appears directly on all boards

### Files Modified

1. **`convex/classes.ts`**
   - Added `bookedByUserId` parameter to `book` mutation
   - Added role check logic
   - Conditional status assignment (pending vs approved)
   - Conditional notification sending

2. **`components/class-booking.tsx`**
   - Pass `bookedByUserId` in booking mutation call
   - Dynamic button text based on `userRole`
   - Dynamic page title based on `userRole`
   - Dynamic form title based on `userRole`
   - Dynamic loading states based on `userRole`
   - Dynamic empty state messages based on `userRole`
   - Show button for all roles (not just teachers)

3. **`app/page.tsx`**
   - Dynamic tab label based on user role

### Benefits

1. **Efficiency**: Moderators can quickly book classes without waiting for approval
2. **Control**: Teachers still require moderator oversight
3. **Clarity**: Different terminology makes the workflow clear
4. **Immediate Availability**: Moderator bookings appear instantly on information boards
5. **Reduced Notifications**: No unnecessary notifications for moderator bookings
6. **Bilingual Support**: All changes maintain full English/Thai support

### Testing Checklist

- [ ] Teacher can request a class (status: pending)
- [ ] Teacher request sends notification to moderator
- [ ] Moderator can book a class (status: approved immediately)
- [ ] Moderator booking does NOT send notification
- [ ] Moderator booking appears immediately on calendar
- [ ] Teacher booking appears only after moderator approval
- [ ] UI shows "Request Class" for teachers
- [ ] UI shows "Book Class" for moderators/admins
- [ ] Tab label shows "Class Requests" for teachers
- [ ] Tab label shows "Class Bookings" for moderators/admins
- [ ] All text displays correctly in both English and Thai

## Summary

The system now intelligently handles class creation based on user role:

- **Teachers** make requests that need approval
- **Moderators/Admins** make direct bookings that are immediately active

This provides efficiency for moderators while maintaining oversight of teacher activities.
