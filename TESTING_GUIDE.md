# Testing Guide for Logo and Student Request Features

## Overview
This guide outlines how to test the new logo design and teacher student request features implemented in this PR.

## Prerequisites
- Convex backend must be deployed and running
- Next.js app must be running locally or deployed
- Test accounts for all three roles: admin, moderator, and teacher

## Feature 1: Logo Design

### Visual Verification
1. **Login Page**
   - Navigate to the login page
   - Verify the logo displays "Evan's ClassTracker" in Playfair Display font
   - Verify the slogan "Built by teachers - for Teachers" appears below in gold
   - Observe the slogan animation (pulsating effect over 2 seconds)
   - Test in both light and dark mode
   - Test on mobile, tablet, and desktop

2. **Main Application Header**
   - Log in as any user
   - Verify the compact logo appears in the header (without slogan)
   - Verify it displays correctly on all screen sizes
   - Test in both light and dark mode

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Language Switching
- [ ] Switch to Thai language and verify logo displays correctly
- [ ] Verify slogan appears in Thai: "สร้างโดยครู - เพื่อครู"
- [ ] Switch back to English

## Feature 2: Teacher Student Request Workflow

### Setup
Create test users if not already available:
- Admin: username `admin`
- Moderator: username `moderator1` (assigned to a school)
- Teacher: username `teacher1` (assigned to the same school as moderator1)

### Test Case 1: Teacher Submits Student Request
1. Log in as teacher
2. Navigate to "Add Student" tab (should be visible in main navigation)
3. Click "Request Student" button
4. Fill out the form:
   - First Name: John
   - Last Name: Doe
   - Grade: 5
   - Notes (English): This student needs extra support in math
   - Notes (Thai): นักเรียนคนนี้ต้องการความช่วยเหลือเพิ่มเติมในวิชาคณิตศาสตร์
5. Submit the form
6. Verify success message appears
7. Verify request appears in the list with "pending" status
8. Verify timestamp is correct

### Test Case 2: Moderator Receives Notification
1. Log in as moderator
2. Navigate to "Notifications" tab
3. Verify notification appears: "New Student Request"
4. Verify notification details mention the teacher and student name
5. Click notification to mark as read

### Test Case 3: Moderator Approves Request
1. As moderator, navigate to "Student Approvals" tab
2. Verify the pending request from Test Case 1 appears
3. Verify all details are correct (name, grade, notes)
4. Click "Approve" button
5. Verify success message appears
6. Verify request status changes to "approved"
7. Verify request moves from "Pending" to "All Requests" tab

### Test Case 4: Teacher Receives Approval Notification
1. Log back in as teacher
2. Navigate to "Notifications" tab
3. Verify notification appears: "Student Request Approved"
4. Verify notification details mention the approved student
5. Navigate to "Add Student" tab
6. Verify the request shows "approved" status

### Test Case 5: Verify Student Created
1. Log in as admin
2. Navigate to "Students" tab
3. Verify student "John Doe" appears in the list
4. Verify student has correct grade (5)
5. Verify student has correct school assignment
6. Verify student has unique ID in format: XXXX-XXXX-XXXXXXX-XXXX

### Test Case 6: Moderator Rejects Request
1. As teacher, submit another student request:
   - First Name: Jane
   - Last Name: Smith
   - Grade: 3
   - Notes: (fill in bilingual)
2. As moderator, navigate to "Student Approvals" tab
3. Click "Reject" button for Jane Smith
4. Fill in rejection reasons:
   - English: This student is already enrolled
   - Thai: นักเรียนคนนี้ลงทะเบียนแล้ว
5. Submit rejection
6. Verify success message appears
7. Verify request status changes to "rejected"

### Test Case 7: Teacher Receives Rejection Notification
1. As teacher, check notifications
2. Verify notification appears: "Student Request Rejected"
3. Verify rejection reason is displayed
4. Navigate to "Add Student" tab
5. Verify request shows "rejected" status
6. Verify rejection reason appears in red box

### Test Case 8: Activity Logging (Moderator Only)
1. As moderator, navigate to "Activity" tab
2. Verify logs appear for:
   - Student requested (by teacher)
   - Student approved (by moderator)
   - Student rejected (by moderator)
3. Verify timestamps are correct
4. Verify bilingual descriptions appear correctly

### Test Case 9: Bilingual Support
1. Switch to Thai language
2. Repeat Test Cases 1-7
3. Verify all UI text appears in Thai
4. Verify form labels, buttons, status badges are in Thai
5. Verify notifications display Thai text
6. Verify error messages appear in Thai

### Test Case 10: Validation
1. As teacher, try to submit request without filling all fields
2. Verify validation errors appear
3. Try to submit with only English notes (no Thai)
4. Verify error: "Please provide notes in both languages"
5. As moderator, try to reject without providing reason
6. Verify error: "Please provide rejection reason in both languages"

### Test Case 11: Multiple Schools
1. Create a second moderator with a different school
2. As teacher assigned to school 1, submit a request
3. As moderator 2 (school 2), navigate to "Student Approvals"
4. Verify moderator 2 cannot see requests from school 1
5. As moderator 1 (school 1), verify they see the request

## Performance Testing
- [ ] Submit 10 student requests rapidly
- [ ] Verify all requests appear correctly
- [ ] Verify no duplicate IDs are generated
- [ ] Verify UI remains responsive

## Regression Testing
- [ ] Verify existing student management still works (admin only)
- [ ] Verify class booking workflow still works
- [ ] Verify messaging still works
- [ ] Verify notifications still work for other events

## Edge Cases
- [ ] Submit request with very long names (>100 characters)
- [ ] Submit request with special characters in names
- [ ] Submit request with emoji in notes
- [ ] Rapidly approve/reject multiple requests
- [ ] Switch languages while viewing a request

## Known Limitations
1. Teachers can only request students for schools they are assigned to
2. Moderators can only approve/reject requests for their assigned school
3. Admins do not have access to the student request workflow (they can add students directly)

## Bug Report Template
If you find issues, please report them with:
- User role (admin/moderator/teacher)
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if UI issue)
- Browser/device information
- Language setting (English/Thai)

## Success Criteria
All test cases should pass with:
- ✅ Correct functionality
- ✅ Bilingual support working
- ✅ Notifications sent appropriately
- ✅ Activity logs recorded
- ✅ No console errors
- ✅ Responsive UI on all devices
- ✅ Dark mode compatible
