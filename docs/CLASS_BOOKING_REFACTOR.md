# Class Booking Refactor - Summary

## Overview

Refactored the class booking system to simplify the form and add location management tied to schools.

## Changes Made

### 1. Database Schema (`convex/schema.ts`)

**Classes Table:**

- ✅ Changed `title` + `titleTh` → Single `name` field
- ✅ Changed `description` + `descriptionTh` → Single `location` field
- ⚠️ **Breaking Change**: Removes bilingual support for these specific fields

**Schools Table:**

- ✅ Added `locations` field (optional array of strings)
- Stores all available locations for each school

### 2. Backend - Schools (`convex/schools.ts`)

**New Mutations:**

- `addLocation(schoolId, location)` - Adds a new location to a school
  - Validates location is not empty
  - Prevents duplicate locations (case-insensitive)
  - Returns updated locations array

**New Queries:**

- `getLocations(schoolId)` - Returns all locations for a school

**Updated Mutations:**

- `create()` - Now initializes schools with empty `locations` array

### 3. Backend - Classes (`convex/classes.ts`)

**Updated `book` mutation:**

- Parameters: `name`, `location` (instead of `title`, `titleTh`, `description`, `descriptionTh`)
- Validates `name` and `location` are not empty
- Creates notifications with single name field

**Updated `acknowledge` mutation:**

- Uses `classData.name` instead of `classData.title/titleTh`

**Updated `approve` mutation:**

- Uses `classData.name` instead of `classData.title/titleTh`

**Updated `reject` mutation:**

- Uses `classData.name` instead of `classData.title/titleTh`

### 4. Frontend - Class Booking Component (`components/class-booking.tsx`)

#### State Management

**Removed:**

- `title`, `titleTh`, `description`, `descriptionTh`

**Added:**

- `name` - Single name field
- `location` - Selected location
- `newLocation` - Input for adding new location
- `showAddLocation` - Toggle for add location UI
- `availableLocations` - Computed from selected school

#### Form UI Changes

**Before:**

```
┌─────────────┬─────────────┐
│Title (EN)   │Title (TH)   │
├─────────────┼─────────────┤
│Description  │Description  │
│(EN)         │(TH)         │
├─────────────┼─────────────┤
│School       │Date         │
└─────────────┴─────────────┘
```

**After:**

```
┌─────────────────────────────┐
│Name                         │
├─────────────┬───────────────┤
│School       │Date           │
├─────────────┴───────────────┤
│Location (dropdown)          │
│+ Add new location           │
└─────────────────────────────┘
```

#### New Features

1. **Location Dropdown:**
   - Populated from selected school's locations
   - Disabled until school is selected
   - Shows "Select a school first" when no school selected

2. **Add Location Feature:**
   - Click "+ Add new location" to show input field
   - Enter new location name
   - Click "Add" to save to school and auto-select it
   - Click "Cancel" to hide input
   - Prevents duplicate locations
   - Automatically sets newly added location as selected

3. **Smart School Selection:**
   - Changing school resets location selection
   - Location dropdown updates based on school

#### Form Submission

- Calls `bookClass` with: `teacherId`, `schoolId`, `name`, `location`, `scheduledDate`
- Resets all form fields including new location state

#### Class Display

- Shows `classItem.name` instead of `classItem.title`
- Shows `Location: {classItem.location}` instead of description

## Migration Notes

### Data Migration Required

Since the schema changed from `title/titleTh` to `name` and `description/descriptionTh` to `location`, existing data will need migration:

1. Copy `title` → `name` (or combine `title` + `titleTh` if needed)
2. Copy `description` → `location` (or use a default like "Main Hall")
3. Initialize all schools with empty `locations` array

### Backward Compatibility

⚠️ **Not backward compatible** - Old code expecting `title`, `titleTh`, `description`, `descriptionTh` will fail.

### Testing Checklist

- [ ] Create new class booking with location dropdown
- [ ] Add new location to a school
- [ ] Verify location appears in dropdown immediately
- [ ] Switch schools and verify location dropdown updates
- [ ] Submit class booking form
- [ ] Verify notifications show correct name
- [ ] Check moderator workflow (acknowledge, approve, reject)
- [ ] Verify class list displays name and location correctly

## File Changes Summary

```
Modified:
  convex/schema.ts          - Schema updates
  convex/schools.ts         - Location management
  convex/classes.ts         - Updated mutations
  components/class-booking.tsx - UI refactor

Created:
  docs/CLASS_BOOKING_REFACTOR.md - This file
```

## API Changes

### Before

```typescript
// Booking a class
bookClass({
  teacherId: Id<"users">,
  schoolId: Id<"schools">,
  title: string,
  titleTh: string,
  description: string,
  descriptionTh: string,
  scheduledDate: number
})
```

### After

```typescript
// Booking a class
bookClass({
  teacherId: Id<"users">,
  schoolId: Id<"schools">,
  name: string,
  location: string,
  scheduledDate: number
})

// Adding location to school
addLocation({
  schoolId: Id<"schools">,
  location: string
})
```

## Benefits

1. ✅ Simplified form - fewer fields to fill
2. ✅ Consistent location names within each school
3. ✅ Easy location management via dropdown
4. ✅ Prevents location typos and variations
5. ✅ Better UX with "Add new location" inline feature
6. ✅ Cleaner data model
7. ✅ Reduced form validation complexity

## Future Enhancements

- [ ] Add ability to edit/delete locations
- [ ] Add location capacity/availability tracking
- [ ] Export locations list for admin view
- [ ] Import locations from CSV
- [ ] Add location descriptions/details
