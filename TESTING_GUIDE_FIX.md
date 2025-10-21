# Testing Guide: Admin/Moderator Class Management Fix

## Prerequisites
- Application deployed and running
- At least one admin or moderator account created
- At least one teacher account with scheduled classes
- Test data: students, schools, locations

## Test Case 1: Delete Class (Admin)

### Steps:
1. Login as admin user
2. Navigate to the Classes tab
3. Find any class in the list
4. Click the Delete button (trash icon)
5. Confirm deletion in the dialog

### Expected Results:
- ✅ No "Server Error" displayed
- ✅ Success alert: "Class deleted successfully" / "ลบคลาสสำเร็จแล้ว"
- ✅ Class removed from the list immediately
- ✅ Teacher receives notification about deletion

### Before Fix:
- ❌ Error dialog: `[CONVEX M(classes:deleteClass)] Server Error - Called by client`
- ❌ Class not deleted
- ❌ No notification sent

## Test Case 2: Update Class (Moderator)

### Steps:
1. Login as moderator user
2. Navigate to the Classes tab
3. Find a class and click Edit button (pencil icon)
4. Change one or more fields:
   - Scheduled date
   - Student
   - Location
   - Status
5. Click Save/Update

### Expected Results:
- ✅ No "Server Error" displayed
- ✅ Success alert: "Class updated successfully" / "อัปเดตคลาสสำเร็จแล้ว"
- ✅ Updated values reflected in the class list
- ✅ Teacher receives notification about the update

### Before Fix:
- ❌ Error dialog: `[CONVEX M(classes:updateClass)] Server Error - Called by client`
- ❌ Class not updated
- ❌ No notification sent

## Test Case 3: Authorization Check (Teacher)

### Steps:
1. Login as teacher user (NOT admin/moderator)
2. Navigate to the Classes tab
3. Try to access delete or edit functionality

### Expected Results:
- ❌ Delete button should NOT be visible for teachers
- ❌ Edit button should NOT be visible for teachers
- Note: Authorization is enforced at UI level for teachers

### Rationale:
- Only admin and moderator users should see these buttons
- Backend still enforces role check even if UI is bypassed

## Test Case 4: Notification Verification

### Steps:
1. Login as admin/moderator
2. Delete or update a class belonging to a specific teacher
3. Logout
4. Login as that teacher
5. Navigate to Notifications tab

### Expected Results:
- ✅ Notification appears with details:
  - For deletion: "Class Deleted" with student name and admin username
  - For update: "Class Updated" with student name and admin username
- ✅ Notification includes both English and Thai text
- ✅ Notification type correct (warning for delete, info for update)

## Test Case 5: Multiple Operations

### Steps:
1. Login as admin
2. Perform multiple operations in sequence:
   - Update class A
   - Delete class B
   - Update class C status
3. Check each operation completes successfully

### Expected Results:
- ✅ All operations complete without errors
- ✅ All affected teachers receive appropriate notifications
- ✅ Database reflects all changes

## Verification in Convex Dashboard

### Check Logs:
1. Go to Convex Dashboard → Functions → Logs
2. Filter for `classes:updateClass` and `classes:deleteClass`
3. Should see successful executions with no errors

### Check Data:
1. Go to Convex Dashboard → Data → classes table
2. Verify updated/deleted records
3. Go to notifications table
4. Verify notification records created for affected teachers

## Edge Cases to Test

### Invalid User:
- Manually call mutation with invalid userId (via Convex dashboard)
- Expected: "User not found" error

### Wrong Role:
- Manually call mutation with teacher userId (via Convex dashboard)
- Expected: "Unauthorized: Only admins and moderators can..." error

### Non-existent Class:
- Try to update/delete a class that doesn't exist
- Expected: "Class not found" error

## Performance Check

### Before Fix:
- Request would fail immediately with authentication error
- ~100-200ms before error response

### After Fix:
- Successful operations should complete in ~200-500ms
- Includes: user fetch + authorization + operation + notification creation

## Rollback Plan (If Needed)

If issues are found:
1. The old code pattern was documented in FIX_SUMMARY.md
2. Revert commits: `git revert 83d8b3c 1a80365`
3. The issue can be re-investigated with more context

## Success Criteria Summary

✅ Both mutations execute without "Server Error"
✅ Admin and moderator users can update classes
✅ Admin and moderator users can delete classes
✅ Teachers cannot access these functions (UI restriction)
✅ All operations create appropriate notifications
✅ Bilingual notifications work correctly
✅ Authorization properly enforced (role checks work)
