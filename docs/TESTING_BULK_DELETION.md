# Testing Guide: Bulk Deletion and Student Creation Fix

## Overview
This document provides step-by-step testing instructions for the new bulk deletion features and the student creation bug fix.

## Test Environment Setup

### Prerequisites
1. Local development environment running
2. Convex dev server running (`npx convex dev`)
3. Next.js dev server running (`npm run dev`)
4. Test accounts available:
   - Admin account
   - Moderator account (with assigned school)
   - Teacher accounts (at least 3)
   - Guardian account (optional)

### Test Data Requirements
- At least 1 school configured
- At least 5 students (some with classes, some without)
- At least 5 teacher users
- At least 1 location configured for each school

---

## Test Suite 1: Weekly Calendar Student Creation Fix

### Test 1.1: Inline Student Creation with All Fields
**Goal**: Verify that the student creation form now requires grade and class.

**Steps**:
1. Log in as a teacher
2. Navigate to Weekly Calendar
3. Click the "+" button on any day
4. Select a school from the dropdown
5. Click "Add New Student" link below the student dropdown
6. Observe the inline form

**Expected Result**:
- ✅ Form shows 3 fields: Nickname, Grade, Class
- ✅ All fields have placeholders/labels
- ✅ Grade dropdown shows options: K1, K2, K3, P1, P2, P3, P4, P5, P6
- ✅ Class dropdown shows options: /1, /2, /3, /4, /5, /6, /7, /8, /9, /10

### Test 1.2: Validation - Empty Fields
**Steps**:
1. Continue from Test 1.1
2. Click "Create Student" button without filling any fields

**Expected Result**:
- ✅ Error message appears: "Please enter a nickname" (or Thai equivalent)

### Test 1.3: Validation - Missing Grade
**Steps**:
1. Enter nickname: "TestStudent"
2. Leave grade empty
3. Select class: "/1"
4. Click "Create Student"

**Expected Result**:
- ✅ Error message appears: "Please select a grade"

### Test 1.4: Validation - Missing Class
**Steps**:
1. Enter nickname: "TestStudent"
2. Select grade: "K1"
3. Leave class empty
4. Click "Create Student"

**Expected Result**:
- ✅ Error message appears: "Please select a class"

### Test 1.5: Successful Creation
**Steps**:
1. Enter nickname: "TestStudent"
2. Select grade: "K1"
3. Select class: "/1"
4. Click "Create Student"

**Expected Result**:
- ✅ Student is created successfully
- ✅ Student appears in the dropdown with format: "TestStudent  (K1/1)"
- ✅ Form closes and student is auto-selected
- ✅ No error messages

### Test 1.6: Form Reset on Cancel
**Steps**:
1. Open inline student form
2. Fill in partial data
3. Click the X button to close the form

**Expected Result**:
- ✅ Form closes
- ✅ All fields are cleared
- ✅ No data is saved

---

## Test Suite 2: User Bulk Deletion (Admin)

### Test 2.1: Admin View - Bulk Controls Visible
**Goal**: Verify admin sees bulk deletion controls.

**Steps**:
1. Log in as admin
2. Navigate to User Management page
3. Observe the user list

**Expected Result**:
- ✅ Checkbox appears next to each user (except current admin)
- ✅ "Select All" button visible at top
- ✅ No users selected by default

### Test 2.2: Select Single User
**Steps**:
1. Click checkbox next to a teacher user

**Expected Result**:
- ✅ Checkbox becomes checked
- ✅ User row highlights (blue background)
- ✅ Selection count appears: "1 selected"
- ✅ "Delete Selected" button appears

### Test 2.3: Select All Users
**Steps**:
1. Click "Select All" button

**Expected Result**:
- ✅ All selectable users become checked
- ✅ All rows highlight
- ✅ Button changes to "Deselect All"
- ✅ Selection count shows total: "X selected"
- ✅ Current admin is NOT selected (no checkbox)
- ✅ Other admin accounts are NOT selected (no checkbox)

### Test 2.4: Deselect All Users
**Steps**:
1. With users selected, click "Deselect All"

**Expected Result**:
- ✅ All checkboxes become unchecked
- ✅ Highlights removed
- ✅ Selection count disappears
- ✅ "Delete Selected" button disappears
- ✅ Button changes back to "Select All"

### Test 2.5: Bulk Delete Confirmation Modal
**Steps**:
1. Select 3 teacher users
2. Click "Delete Selected" button

**Expected Result**:
- ✅ Modal appears with warning
- ✅ Modal shows correct count: "delete 3 user(s)"
- ✅ Modal has warning icon ⚠️
- ✅ Two buttons: "Cancel" and "Delete All"
- ✅ Text warns about permanent action

### Test 2.6: Cancel Bulk Delete
**Steps**:
1. In confirmation modal, click "Cancel"

**Expected Result**:
- ✅ Modal closes
- ✅ No users deleted
- ✅ Selection remains (users still checked)

### Test 2.7: Confirm Bulk Delete
**Steps**:
1. Select 2 teacher users (with no associated data)
2. Click "Delete Selected"
3. In modal, click "Delete All"

**Expected Result**:
- ✅ Modal closes
- ✅ Success toast appears: "Successfully deleted 2 user(s)"
- ✅ Users disappear from list
- ✅ Selection cleared
- ✅ Remaining users still visible

### Test 2.8: Admin Cannot Delete Other Admins
**Steps**:
1. Create a second admin account (if not exists)
2. Try to select the other admin account

**Expected Result**:
- ✅ Other admin has NO checkbox
- ✅ Other admin cannot be selected
- ✅ Only teachers and moderators have checkboxes

### Test 2.9: Admin Cannot Delete Self
**Steps**:
1. Find current logged-in admin in the list

**Expected Result**:
- ✅ Current admin has NO checkbox
- ✅ Current admin cannot be selected

---

## Test Suite 3: User Bulk Deletion (Moderator)

### Test 3.1: Moderator View - Limited Selection
**Goal**: Verify moderator can only delete teachers.

**Steps**:
1. Log in as moderator
2. Navigate to User Management page
3. Observe the user list

**Expected Result**:
- ✅ Only teacher users have checkboxes
- ✅ Moderator users have NO checkbox
- ✅ Admin users have NO checkbox
- ✅ Current moderator has NO checkbox

### Test 3.2: Moderator Select All
**Steps**:
1. Click "Select All" button

**Expected Result**:
- ✅ Only teachers become selected
- ✅ Non-teachers remain unselectable

### Test 3.3: Moderator Bulk Delete Teachers
**Steps**:
1. Select 2 teachers
2. Click "Delete Selected"
3. Confirm deletion

**Expected Result**:
- ✅ Teachers are deleted
- ✅ Success message appears
- ✅ No errors

### Test 3.4: Moderator Cannot Delete Moderators
**Steps**:
1. Try to find checkboxes on moderator accounts

**Expected Result**:
- ✅ No checkboxes visible on moderator accounts

---

## Test Suite 4: Student Bulk Deletion

### Test 4.1: Student List - Bulk Controls
**Goal**: Verify bulk deletion UI in student management.

**Steps**:
1. Log in as any user with access to Student Management
2. Navigate to Student Management page

**Expected Result**:
- ✅ Checkbox column appears as first column
- ✅ "Select All" button visible
- ✅ All students have checkboxes

### Test 4.2: Select Students
**Steps**:
1. Click checkbox on 3 students

**Expected Result**:
- ✅ Rows highlight (blue background)
- ✅ Selection count appears: "3 selected"
- ✅ "Delete Selected" button appears

### Test 4.3: Bulk Delete Students Without Classes
**Steps**:
1. Select 2 students that have NO classes
2. Click "Delete Selected"
3. Read confirmation modal
4. Click "Delete All"

**Expected Result**:
- ✅ Success message: "Successfully deleted 2 student(s)"
- ✅ Students removed from list
- ✅ Selection cleared

### Test 4.4: Bulk Delete Students With Classes (Partial Failure)
**Steps**:
1. Select 3 students:
   - 1 with associated classes
   - 2 without classes
2. Click "Delete Selected"
3. Confirm deletion

**Expected Result**:
- ✅ Partial success message appears
- ✅ Message mentions failed deletions
- ✅ Error displayed: "Students with classes cannot be deleted"
- ✅ 2 students deleted (those without classes)
- ✅ 1 student remains (the one with classes)
- ✅ Console shows detailed error info

### Test 4.5: Filter and Bulk Delete
**Steps**:
1. Filter students by school: "School A"
2. Click "Select All"
3. Delete selected

**Expected Result**:
- ✅ Only students from School A are selected
- ✅ Only those students are deleted
- ✅ Students from other schools remain

---

## Test Suite 5: Rate Limiting

### Test 5.1: User Bulk Deletion Rate Limit
**Goal**: Verify rate limiting prevents abuse.

**Steps**:
1. Log in as admin
2. Perform 5 bulk delete operations quickly:
   - Select 1 user, delete
   - Select 1 user, delete
   - Repeat 3 more times
3. Attempt 6th bulk deletion immediately

**Expected Result**:
- ✅ First 5 deletions succeed
- ✅ 6th deletion fails with error
- ✅ Error message mentions rate limit
- ✅ Error indicates "10 deletions per minute"

### Test 5.2: Student Bulk Deletion Rate Limit
**Goal**: Verify student deletion rate limiting.

**Steps**:
1. Perform 10 bulk delete operations on students quickly
2. Attempt 11th operation

**Expected Result**:
- ✅ First 10 deletions succeed
- ✅ 11th deletion fails with rate limit error
- ✅ Error mentions "10 operations per minute"

### Test 5.3: Rate Limit Reset After Window
**Steps**:
1. Trigger rate limit (from Test 5.1 or 5.2)
2. Wait 61 seconds
3. Attempt another bulk deletion

**Expected Result**:
- ✅ Deletion succeeds after wait period
- ✅ Rate limit counter has reset

---

## Test Suite 6: Edge Cases and Error Handling

### Test 6.1: Delete Non-Existent User
**Steps**:
1. Use browser dev tools to manually trigger mutation with invalid user ID

**Expected Result**:
- ✅ Error: "User not found"
- ✅ No crash
- ✅ Other users in batch still processed

### Test 6.2: Network Interruption During Bulk Delete
**Steps**:
1. Start bulk deletion
2. Immediately disable network (dev tools)

**Expected Result**:
- ✅ Error message appears
- ✅ UI remains functional
- ✅ Can retry after re-enabling network

### Test 6.3: Empty Selection
**Steps**:
1. Don't select any users/students
2. Observe UI

**Expected Result**:
- ✅ "Delete Selected" button is NOT visible
- ✅ Selection count is NOT visible

### Test 6.4: School Moderator Cleanup
**Goal**: Verify moderator-school relationship is cleaned up.

**Steps**:
1. Assign a moderator to a school
2. As admin, delete that moderator
3. Check the school's moderator field

**Expected Result**:
- ✅ Moderator deleted successfully
- ✅ School's `moderatorId` field is set to `undefined`
- ✅ No orphaned references

---

## Test Suite 7: UI/UX Verification

### Test 7.1: Visual Feedback
**Steps**:
1. Select multiple items
2. Observe visual changes

**Expected Result**:
- ✅ Selected rows have distinct background color
- ✅ Checkboxes are clearly checked
- ✅ Selection count is visible and accurate
- ✅ Buttons are clearly labeled

### Test 7.2: Bilingual Support
**Steps**:
1. Switch language to Thai
2. Perform bulk deletion workflow

**Expected Result**:
- ✅ All labels in Thai
- ✅ Error messages in Thai
- ✅ Confirmation modal in Thai
- ✅ Toast notifications in Thai

### Test 7.3: Mobile Responsiveness
**Steps**:
1. Resize browser to mobile width
2. Test bulk deletion features

**Expected Result**:
- ✅ Checkboxes are touch-friendly
- ✅ Buttons are properly sized
- ✅ Modal fits screen
- ✅ Text is readable

---

## Test Suite 8: Regression Testing

### Test 8.1: Single User Deletion Still Works
**Steps**:
1. Use the individual "Delete" button (not bulk)
2. Complete deletion flow

**Expected Result**:
- ✅ Double confirmation appears
- ✅ User is deleted
- ✅ No interference from bulk features

### Test 8.2: Single Student Deletion Still Works
**Steps**:
1. Use trash icon on individual student
2. Confirm deletion

**Expected Result**:
- ✅ Student deleted successfully
- ✅ Existing UI flow unchanged

### Test 8.3: Student Creation (Non-Calendar) Unaffected
**Steps**:
1. Navigate to Student Management
2. Click "Add Student" button
3. Create student with full form

**Expected Result**:
- ✅ Full form still works
- ✅ All fields available
- ✅ No changes to existing behavior

---

## Performance Testing

### Test P1: Large Selection Performance
**Steps**:
1. Select 50+ users/students
2. Measure UI responsiveness

**Expected Result**:
- ✅ UI remains responsive
- ✅ Selection happens within 1 second
- ✅ No lag or freezing

### Test P2: Bulk Deletion Speed
**Steps**:
1. Delete 20 items at once
2. Measure time to completion

**Expected Result**:
- ✅ Completes within reasonable time (< 5 seconds)
- ✅ UI provides feedback during operation
- ✅ Success/failure results are accurate

---

## Summary Checklist

### Critical Tests (Must Pass)
- [ ] Weekly calendar requires all fields for student creation
- [ ] Admin can bulk delete teachers and moderators
- [ ] Admin cannot bulk delete other admins
- [ ] Moderators can only bulk delete teachers
- [ ] Users cannot delete themselves
- [ ] Rate limiting works for both users and students
- [ ] Confirmation modals prevent accidental deletion
- [ ] Students with classes cannot be deleted

### Important Tests (Should Pass)
- [ ] Visual feedback is clear and consistent
- [ ] Bilingual support works correctly
- [ ] Error messages are helpful
- [ ] Selection state management works
- [ ] School-moderator cleanup happens

### Nice to Have (Recommended)
- [ ] Mobile experience is good
- [ ] Performance is acceptable
- [ ] Regression tests pass
- [ ] Edge cases handled gracefully

---

## Reporting Issues

If any test fails, report with:
1. Test number (e.g., "Test 2.5")
2. Steps to reproduce
3. Expected vs actual result
4. Screenshots/console errors
5. Browser and environment info

---

**Last Updated**: 2025-10-23  
**Version**: 1.0  
**Related**: SECURITY_REVIEW_BULK_DELETION.md
