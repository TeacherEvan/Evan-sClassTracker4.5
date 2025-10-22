# Migration Guide: Adding Class Field to Students

This document describes how to migrate existing student records to include the new `class` field.

## Overview

The `class` field has been added to the students schema to support class designations (K1, K2, K3). This field is:
- **Optional** for backward compatibility
- **Required** for students linked to schools (validated in mutations)
- **Not required** for guardian-only students

## Changes Made

### 1. Schema Update
- Added `class: v.optional(v.string())` to the students table
- Field is placed after `grade` field for logical grouping

### 2. Mutation Updates
- `create` mutation: Added `class` parameter and validation
- `update` mutation: Added `class` parameter and validation
- Both mutations enforce: class is required when `schoolId` is present

### 3. UI Updates
- Student Management form: Added class dropdown with K1, K2, K3 options
- Class Booking inline creation: Added class dropdown
- Student list table: Added class column

### 4. Migration Function
Created `migrateClassField` mutation in `convex/students.ts` that:
- Scans all existing students
- Looks for "K1", "K2", or "K3" patterns in:
  - `grade` field
  - `firstName` field
  - `lastName` field
  - `nickname` field (if present)
  - `notes` field (if present)
- Automatically assigns the detected class
- Only processes students linked to schools without existing class values

## Running the Migration

### Prerequisites
1. Ensure Convex is running: `npx convex dev`
2. Verify all code changes are deployed

### Execute Migration

Run the migration mutation using Convex CLI:

```bash
npx convex run students:migrateClassField
```

### Expected Output

The mutation will return:
```json
{
  "success": true,
  "message": "Successfully updated X student(s) with detected class",
  "updatedCount": X
}
```

### Verification

After migration, verify the results:

1. **Check via Dashboard:**
   ```bash
   npx convex dashboard
   ```
   Navigate to "Data" → "students" table and verify class assignments

2. **Check via CLI:**
   ```bash
   npx convex data students
   ```

3. **Check via UI:**
   - Log into the application
   - Go to Student Management
   - Verify the "Class" column shows K1, K2, or K3 for migrated students

## Post-Migration

### Manual Assignment
For students that weren't auto-detected:
1. Go to Student Management
2. Click "Edit" on the student
3. Select the appropriate class from the dropdown
4. Save changes

### New Students
All new students linked to schools will require class selection during creation.

## Detection Patterns

The migration function detects these patterns (case-insensitive):
- `K1`, `K 1` (with space)
- `K2`, `K 2` (with space)
- `K3`, `K 3` (with space)

Examples of detected values:
- Grade: "K1", "K2", "K3"
- Name: "John K1", "Jane K2"
- Notes: "Student is in K3 class"

## Rollback (If Needed)

If you need to remove class assignments:

```bash
# This would need to be implemented as a separate mutation
npx convex run students:clearClassField
```

Note: A rollback mutation is not included. If needed, contact support or manually edit via the dashboard.

## Support

For issues or questions:
1. Check TypeScript compilation: `npx tsc --noEmit`
2. Check linting: `npm run lint`
3. Review Convex logs: `npx convex logs`
4. Check the migration function in `convex/students.ts`

## Technical Details

### Migration Function Location
`convex/students.ts` - `migrateClassField` mutation

### Detection Algorithm
1. Concatenates searchable fields into single string
2. Converts to uppercase for case-insensitive matching
3. Uses regex patterns: `/\bK1\b/`, `/\bK\s*1\b/`, etc.
4. Word boundaries (`\b`) prevent false matches
5. Patches student record with detected class

### Performance
- Processes all students in a single transaction
- Skips students with existing class or no school link
- Returns count of updated records
