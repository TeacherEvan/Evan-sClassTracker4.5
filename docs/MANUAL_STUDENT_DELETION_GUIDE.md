# Manual Student Deletion Guide

## Problem
The following 8 students need to be deleted from the database but have associated classes preventing deletion:

1. SANG-K1-mh2wk612-UDKS
2. SANG-K1-mh2wk612-V1O1
3. SANG-K2-mh2wk612-KVQL
4. SANG-K1-mh2wk612-ZPL0
5. SANG-K2-mh2wk612-HJKR
6. SANG-K1-mh2wk612-JE2B
7. SANG-K1-mh2wk612-YW8P
8. SANG-K1-mh2wk612-S5IJ

## Solution: Force Delete Feature (Admin Only)

A new "Force Delete" option has been added to the Student Management bulk deletion dialog.

### How to Use Force Delete:

1. **Login as Admin**
   - Only administrators can use force delete
   - Force delete checkbox only appears for admin users

2. **Navigate to Student Management**
   - Click on "Students" tab in the main navigation

3. **Filter Students** (Optional)
   - Use the school filter dropdown to show only Sangsom students
   - Select "Sangsom School" from the dropdown

4. **Select Students to Delete**
   - Find and check the checkbox next to each student:
     - SANG-K1-mh2wk612-UDKS
     - SANG-K1-mh2wk612-V1O1
     - SANG-K2-mh2wk612-KVQL
     - SANG-K1-mh2wk612-ZPL0
     - SANG-K2-mh2wk612-HJKR
     - SANG-K1-mh2wk612-JE2B
     - SANG-K1-mh2wk612-YW8P
     - SANG-K1-mh2wk612-S5IJ
   - You should see "8 selected" displayed

5. **Click "Delete Selected"**
   - A confirmation dialog will appear

6. **Check "Force Delete (Admin God Mode)"**
   - ⚠️ **IMPORTANT**: Check the yellow warning box that says "Force Delete (Admin God Mode)"
   - This bypasses class checks and allows deletion of students with associated classes
   - Read the warning carefully!

7. **Confirm and Provide Reason**
   - Click "Delete All" button
   - When prompted, enter a reason (suggested):
     ```
     Manual cleanup per issue #XX - removing students with orphaned class references
     ```

8. **Verify Deletion**
   - You should see a success message showing how many students were deleted
   - The students should disappear from the list
   - Check the audit logs to verify the deletion was logged

## What Happens to Associated Classes?

When using force delete:
- Students are deleted even if they have associated classes
- The associated classes remain in the database
- Classes will show "Student Data Missing" warning (see fix in class-booking.tsx)
- Admins/moderators can then clean up these orphaned classes manually

## Audit Trail

All bulk deletions are automatically logged in the audit system with:
- Who performed the deletion (admin user)
- When it was performed (timestamp)
- How many students were deleted
- Which students failed (if any)
- The reason provided
- Whether force mode was used
- Execution time and performance metrics

To view audit logs:
- Login as admin
- Navigate to Admin panel
- Click "Audit Logs" tab
- Filter by action: "bulk_delete_students"

## Alternative: Convex Dashboard Method

If you prefer direct database access:

1. Open Convex Dashboard: https://dashboard.convex.dev
2. Navigate to your project
3. Go to "Data" tab
4. Open "students" table
5. Search for each student by `studentId` field
6. Delete each student record manually
7. (Optional) Open "classes" table and delete orphaned class records

## Security Note

Force delete is a powerful feature that:
- Only admins can use
- Bypasses all safety checks
- Cannot be undone
- Is fully audited

Use with caution and only when necessary!

## Troubleshooting

**If force delete still fails:**
1. Check rate limiting - you're limited to 5 bulk operations per minute
2. Wait 60 seconds and try again
3. If still failing, check Convex dashboard for errors
4. Contact support if issue persists

**If classes still show loading spinner:**
- This has been fixed in the latest update
- Classes with deleted students now show a "Student Data Missing" warning card
- Admins can delete these orphaned classes from the warning card
