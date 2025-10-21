# Multi-Student Classes & Admin Authorization Update

## Summary

This update implements two major features:

1. **Multi-student classes** - Ability to add multiple students to a single class
2. **Merge classes** - Combine multiple classes scheduled at the same time/location
3. **Enhanced authorization** - Admins can now manage classes from any school, while moderators are restricted to their assigned school

## Changes Made

### 1. Schema Updates (`convex/schema.ts`)

Added support for multiple students per class:

```typescript
additionalStudentIds: v.optional(v.array(v.id("students"))), // For multi-student classes
```

### 2. New Mutations (`convex/classes.ts`)

#### `addStudentToClass`

- Allows any user to add a student to an existing class
- Authorization: Teachers can only add to their own classes, moderators to their school's classes, admins to any class
- Prevents duplicate students
- Sends notification to teacher
- Logs the action

#### `removeStudentFromClass`

- Allows removal of additional students from a class
- Cannot remove the primary student
- Same authorization as adding students

#### `mergeClasses`

- Combines multiple classes into one
- Validation: Classes must have same teacher, school, location, and scheduled date/time
- Target class is kept, source classes are deleted
- All students are consolidated into the target class
- Logs and notifies about the merge

### 3. Authorization Enhancements

Updated the following mutations to distinguish between admin and moderator permissions:

#### Modified Mutations

- `acknowledge` - Acknowledge class booking requests
- `approve` - Approve class booking requests
- `reject` - Reject class booking requests
- `deleteClass` - Delete a class
- `updateClass` - Update class details
- `editClass` - Full edit with audit trail

#### Authorization Logic

```typescript
// Moderators: Only their assigned school
if (user.role === "moderator") {
  const school = await ctx.db.get(classData.schoolId);
  if (!school || school.moderatorId !== args.userId) {
    throw new Error("Unauthorized: Moderators can only [action] classes from their assigned school");
  }
}

// Admins: Any school (no additional check needed)
```

### 4. Query Updates (`convex/classes.ts`)

#### `listWithDetails`

Updated to fetch and return additional students:

- Collects all additional student IDs from classes
- Batch fetches all students (primary + additional)
- Returns enriched data with `additionalStudents` array

### 5. UI Components

#### `class-booking.tsx`

- Added student count badge showing total students
- Display list of additional students with remove buttons
- "Add Student to Class" button and form (available to all users)
- Individual student removal functionality
- "Merge Classes" button in header (when 2+ classes exist)
- Integrated merge modal

#### `merge-classes-modal.tsx` (NEW)

Full-featured modal for merging classes:

- Groups classes by teacher, school, location, and date/time
- Shows only groups with 2+ mergeable classes
- Two-step process:
  1. Select target class (to keep)
  2. Select source classes (to merge and delete)
- Preview of all students in each class
- Informative messaging in both English and Thai

### 6. Icon Updates

Added new Lucide React icons:

- `Users` - Multi-student indicator
- `UserPlus` - Add student button
- `UserMinus` - Remove student button

## User Experience

### For All Users

**Adding Students to Classes:**

1. Click "Add Student to Class" button on any class card
2. Select a student from the dropdown (shows only students not already in the class)
3. Click "Add" to add the student
4. The class now shows a badge with total student count
5. Additional students are listed below the primary student

**Removing Additional Students:**

1. Click the "−" button next to any additional student's name
2. Confirm the removal
3. Student is removed from the class

### For Admins/Moderators

**Merging Classes:**

1. Click "Merge Classes" button in the header
2. Modal shows groups of mergeable classes
3. Select the target class (the one to keep)
4. Check the source classes to merge into the target
5. Click "Merge Classes"
6. Source classes are deleted, all students moved to target class

### Authorization Differences

**Moderators:**

- Can only acknowledge/approve/reject classes from their assigned school
- Can only edit/delete classes from their assigned school
- Can add students to classes in their school
- Can merge classes within their school

**Admins:**

- Can acknowledge/approve/reject classes from ANY school
- Can edit/delete classes from ANY school
- Can add students to any class
- Can merge classes from any school

**Teachers:**

- Can add students to their own classes
- Can remove additional students from their own classes
- Cannot merge classes (only view)

## Technical Implementation Details

### Rate Limiting

All new mutations include rate limiting:

- `addStudentToClass`: 100 requests per minute
- `removeStudentFromClass`: 100 requests per minute
- `mergeClasses`: 50 requests per minute

### Performance Optimization

- Batch fetching of students in `listWithDetails` query
- Efficient Set operations for deduplication
- Compound queries using existing indexes

### Data Integrity

- Validation prevents duplicate students
- Cannot remove primary student
- Merge validation ensures data consistency
- Proper cleanup of deleted classes

### Audit Trail

- All operations logged in `teacherLogs` table
- Notifications sent to affected teachers
- Edit history maintained for all changes

## Backward Compatibility

✅ **Fully backward compatible**

- Existing classes work without changes
- `additionalStudentIds` is optional
- Queries handle both single and multi-student classes
- No migration required

## Build Status

✅ **Build successful** - All TypeScript compilation passed
✅ **No linting errors** - Clean build
✅ **Tests passed** - All functionality verified

## Files Modified

1. `convex/schema.ts` - Added `additionalStudentIds` field
2. `convex/classes.ts` - Added 3 new mutations, updated 6 mutations, enhanced 1 query
3. `components/class-booking.tsx` - Added multi-student UI and merge button
4. `components/merge-classes-modal.tsx` - New component (303 lines)

## Total Lines Changed

- **Added:** ~600 lines
- **Modified:** ~100 lines
- **New files:** 1
