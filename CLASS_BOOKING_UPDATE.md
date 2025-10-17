# Class Booking System Update - Implementation Summary

## Overview

Updated the class booking/request system to simplify the workflow and add location-based class scheduling. The button text has been changed from "Book Class" to "Request Class" and the form fields have been restructured.

## Key Changes

### 1. Database Schema Changes (`convex/schema.ts`)

- **Modified `classes` table**:
  - ✅ **Removed fields**: `title`, `titleTh`, `description`, `descriptionTh`
  - ✅ **Added fields**: `studentId` (reference to students table), `locationId` (reference to locations table)
  - ✅ **Added index**: `by_student` for efficient student-based queries

- **Added `locations` table**:

  ```typescript
  locations: {
    name: string
    nameTh: string
    schoolId: Id<"schools">
    isActive: boolean
    createdAt: number
    createdBy: Id<"users">
  }
  ```

  - Indexes: `by_school`, `by_active`, `by_created_at`

### 2. Backend Changes

#### New File: `convex/locations.ts`

- ✅ `list` - Query locations by school with optional active-only filter
- ✅ `getById` - Get single location
- ✅ `create` - Create new location (moderator/admin only)
- ✅ `update` - Update location name
- ✅ `toggleActive` - Enable/disable locations without deleting
- ✅ `remove` - Delete location (only if not used in any classes)

#### Updated: `convex/classes.ts`

- ✅ **Modified `book` mutation**:
  - Now requires: `studentId`, `locationId` instead of title/description fields
  - Validates student and location exist
  - Checks location is active before booking
  - Updated notifications to show student name and location

- ✅ **Modified `acknowledge` mutation**:
  - Fetches student and location info for notification
  - Shows student name and location in notification message

- ✅ **Modified `approve` mutation**:
  - Fetches student and location info for notification
  - Shows student name and location in notification message

- ✅ **Modified `reject` mutation**:
  - Fetches student and location info for notification
  - Shows student name and location in notification message

### 3. Frontend Changes

#### Updated: `components/class-booking.tsx`

- ✅ **Button text changed**: "Book Class" → "Request Class" (English & Thai)
- ✅ **Page title changed**: "Class Bookings" → "Class Requests"
- ✅ **Form redesigned**:
  - Removed: Title (English/Thai), Description (English/Thai)
  - Added: Student Name dropdown, Location dropdown
  - Location dropdown is disabled until school is selected
  - Location dropdown only shows active locations for the selected school
  
- ✅ **Created `ClassItemDisplay` component**:
  - Separate component to display class items
  - Fetches and displays student and location data
  - Shows student name and location instead of title/description
  - Maintains all approval workflow buttons

#### New File: `components/location-management.tsx`

- ✅ Full CRUD interface for managing locations
- ✅ School selector for admins (moderators auto-locked to their school)
- ✅ Add/Edit/Delete locations
- ✅ Toggle active/inactive status
- ✅ Bilingual input fields (English & Thai)
- ✅ Visual indicators for inactive locations
- ✅ Protection: Cannot delete locations used in class bookings

#### Updated: `app/page.tsx`

- ✅ Added "Locations" tab for both admins and moderators
- ✅ Admins can manage locations for all schools
- ✅ Moderators can manage locations for their assigned school only
- ✅ Tab appears after Analytics tab for moderators
- ✅ Tab appears after Schools tab for admins

## User Experience Changes

### For Teachers

1. Click "Request Class" button (instead of "Book Class")
2. Select student from dropdown (from students database)
3. Select school
4. Select location from available locations at that school
5. Choose date/time
6. Submit request

### For Moderators

1. Can now manage locations for their school via new "Locations" tab
2. Can add locations with bilingual names
3. Can enable/disable locations without deleting them
4. Receive notifications showing student name and location
5. See student name and location in class request lists

### For Admins

1. Can manage locations for all schools
2. Full location CRUD operations
3. Can view which locations are in use

## Database Migration Notes

⚠️ **Important**: Existing class bookings in the database will need to be handled:

- Old classes have `title`, `titleTh`, `description`, `descriptionTh` fields
- New classes require `studentId` and `locationId`
- Consider running a migration script or clearing old data

## Bilingual Support

All new features maintain full bilingual support:

- Location names (English & Thai)
- Form labels and buttons
- Notifications
- Error messages

## Testing Checklist

- [ ] Teacher can request a class with student and location
- [ ] Location dropdown only shows after school is selected
- [ ] Location dropdown only shows active locations
- [ ] Moderator can manage locations for their school
- [ ] Admin can manage locations for all schools
- [ ] Cannot delete location that's used in a class booking
- [ ] Notifications show correct student name and location
- [ ] All text displays in both English and Thai

## Files Modified

1. `convex/schema.ts` - Database schema
2. `convex/classes.ts` - Class booking mutations
3. `convex/locations.ts` - **NEW** Location management
4. `components/class-booking.tsx` - Class request UI
5. `components/location-management.tsx` - **NEW** Location CRUD UI
6. `app/page.tsx` - Added locations tab

## Next Steps

1. Test the new workflow thoroughly
2. Consider adding default locations for existing schools
3. Update user documentation/training materials
4. Deploy and monitor for issues
