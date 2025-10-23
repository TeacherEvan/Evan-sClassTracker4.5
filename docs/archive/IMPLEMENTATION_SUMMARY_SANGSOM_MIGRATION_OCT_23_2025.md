# Sangsom Student to Events Migration - Implementation Summary

**Date:** October 23, 2025  
**Issue:** Sangsom School has a bunch of students that should be events instead

## Problem

The Sangsom seeding script previously created students AND classes, but we only want EVENTS. Now we have a database full of Sangsom students that need to be converted or deleted.

## Solution Implemented

### 1. Migration Backend (`convex/migrateSangsomStudentsToEvents.ts`)

Created two mutation functions:

#### `migrateSangsomStudentsToEvents`

- Finds all students from Sangsom School
- Converts each student to an event (reminder type)
- Event title: "Student: [First] [Last]"
- Uses student's grade as location
- School-wide visibility
- Deletes student records after conversion

#### `deleteSangsomStudents`

- Simply deletes all Sangsom students without conversion
- Faster if you don't want to keep any record
- Double confirmation required

### 2. Migration UI (`components/sangsom-migration-button.tsx`)

Admin-only component with two buttons:

- **"Convert to Events"** (Blue) - Converts students to events then deletes them
- **"Delete All"** (Red) - Just deletes all students

**Features:**

- Double confirmation dialogs
- Bilingual (English/Thai)
- Loading states
- Toast notifications with results
- Warning about permanent actions

### 3. Integration (`app/page.tsx`)

Added migration button to the Testing tab alongside the Sangsom seed button

## How to Use

### Option 1: Convert Students to Events (Recommended)

1. Login as admin
2. Go to "Testing" tab
3. Click "Convert to Events" button
4. Confirm twice
5. All Sangsom students become events, student records deleted

**Result:** You'll have event records showing who the students were

### Option 2: Just Delete Everything

1. Login as admin
2. Go to "Testing" tab  
3. Click "Delete All" button
4. Confirm THREE times (it's permanent!)
5. All Sangsom students deleted, no conversion

**Result:** Clean slate, no student or event records

## Safety Features

- ✅ Admin-only (role check)
- ✅ Double/triple confirmation dialogs
- ✅ Clear warning messages in both languages
- ✅ Cannot undo once executed
- ✅ Returns detailed results (how many converted/deleted)
- ✅ Toast notifications for success/failure

## Technical Details

**Schema Compatibility:**

- Events require `createdAt` field (added)
- Student `grade` field maps to event `location`
- Event type set to "reminder" for former students
- Visibility set to "school" (all school members see them)

**Authorization:**

- Only admins can run migrations
- Passes admin user ID for audit trail

**Error Handling:**

- Try-catch around each student conversion
- Continues if one student fails
- Reports detailed results

## Files Changed

- ✅ `convex/migrateSangsomStudentsToEvents.ts` - New migration backend
- ✅ `components/sangsom-migration-button.tsx` - New migration UI
- ✅ `app/page.tsx` - Added lazy-loaded migration button to Testing tab

## Deployment Status

✅ **Deployed successfully to Convex cloud**

## Next Steps

1. Login as admin
2. Choose your migration path (convert or delete)
3. Run the migration once
4. Verify results in the Events tab
5. (Optional) Re-run Sangsom seed button to create event-based schedule

---

**⚠️ WARNING:** These actions are PERMANENT and cannot be undone!  
**💡 TIP:** The "Convert to Events" option preserves a record of students as events
