# Moderator and Admin Event Booking Feature

## Overview
Moderators and administrators can now add events (classes) directly to the calendar with automatic approval, bypassing the normal teacher approval workflow.

## Feature Status: ✅ **IMPLEMENTED AND VERIFIED**

## How It Works

### For Moderators & Admins
When moderators or admins book a class:
1. **Immediate Approval**: Classes are created with "approved" status automatically
2. **Teacher Selection**: Must select which teacher the class is for
3. **Full Permissions**: Can book for any teacher at their assigned school (moderators) or any school (admins)

### For Teachers  
When teachers book a class:
1. **Pending Status**: Classes start with "pending" status
2. **Approval Required**: Moderator must acknowledge and approve
3. **Own Classes Only**: Teachers can only create requests for themselves

## UI Enhancements

### Weekly Calendar Component (`components/weekly-calendar.tsx`)
The calendar view now shows role-appropriate language:

| User Role | Button Tooltip | Dialog Title | Submit Button |
|-----------|---------------|--------------|---------------|
| Moderator/Admin | "Book class" / "จองคลาส" | "Book Class" / "จองคลาส" | "Book Class" / "จองคลาส" |
| Teacher | "Request class" / "ขอจองคลาส" | "Request Class" / "ขอจองคลาส" | "Request Class" / "ขอจองคลาส" |

### Class Booking Component (`components/class-booking.tsx`)
Already implements role-based UI with:
- "Book Class" button for moderators/admins
- "Request Class" button for teachers
- Teacher selection dropdown for moderators/admins

## Backend Implementation

### Auto-Approval Logic (`convex/classes.ts:354-355`)
```typescript
const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
const status = isGuardianLinked || isModerator ? "approved" : "pending";
```

### Permission Checks
- **Admins**: Can book for any teacher at any school
- **Moderators**: Can book for any teacher at their assigned school only
- **Teachers**: Can only create requests for themselves

### Rate Limiting
- Maximum 30 class bookings per minute per user
- Input validation on all fields

## Access Points

### 1. Weekly Calendar View
- Click the "+" button on any calendar day
- Form includes teacher selection for moderators/admins
- Moderators auto-select their school; admins can select any school

### 2. Classes Tab
- "Book Class" button prominently displayed
- Multi-date booking support
- Optional fields (duration, subject, materials, etc.)

## Workflow Comparison

### Teacher Workflow
```
Teacher → Request Class → Pending → Moderator Acknowledges → 
Moderator Approves → Approved
```

### Moderator/Admin Workflow
```
Moderator/Admin → Book Class → Approved ✓
```

## Bilingual Support
All UI elements support English and Thai:
- English: "Book class", "Request class", "Book Class", "Request Class"
- Thai: "จองคลาส", "ขอจองคลาส"

## Testing Recommendations

1. **As Admin**:
   - Navigate to Calendar tab
   - Click "+" on any day
   - Select a school, teacher, student, location, and time
   - Click "Book Class" - should be immediately approved

2. **As Moderator**:
   - Navigate to Calendar tab  
   - Click "+" on any day (school pre-selected)
   - Select teacher, student, location, and time
   - Click "Book Class" - should be immediately approved

3. **As Teacher**:
   - Navigate to Calendar tab
   - Click "+" on any day
   - Select school, student, location, and time
   - Click "Request Class" - should show as "pending"

## Related Files
- `components/weekly-calendar.tsx` - Calendar view with booking dialog
- `components/class-booking.tsx` - Dedicated booking interface
- `convex/classes.ts` - Backend booking logic and auto-approval
- `convex/schema.ts` - Database schema for classes

## Summary
✅ Moderators and admins can now add events to the calendar with immediate approval
✅ UI clearly distinguishes between "booking" (mods/admins) and "requesting" (teachers)
✅ Backend enforces proper authorization and auto-approval logic
✅ Bilingual support for English and Thai throughout
