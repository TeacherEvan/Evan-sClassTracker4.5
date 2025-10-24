# Manual Test Plan - UI Deployment Verification

## Prerequisites

### Test Users
Create test accounts for each role:
1. **Admin User**
   - Username: `admin`
   - Password: `TeacherAdmin` (default)

2. **Moderator User**
   - Username: `moderator1`
   - School: Bangkok International School
   - Password: `TeacherModerator1` (default)

3. **Teacher User**
   - Username: `Evan`
   - Password: `TeacherEvan` (default)

### Test Data
Ensure database has:
- At least 2 schools
- At least 3 students per school
- At least 2 locations per school
- At least 5 classes in various states (pending, acknowledged, approved)

---

## Test 1: Class Details Modal Spacing (Desktop)

### Objective
Verify modal looks professional on desktop resolutions

### Steps

#### On 1920x1080 Display
1. Open browser in full screen (1920x1080)
2. Login as any user
3. Navigate to Weekly Calendar
4. Click on any class card
5. Verify Class Details modal appears

**Expected Results:**
- [ ] Modal is centered on screen
- [ ] Modal width is reasonable (not too wide or narrow)
- [ ] Header has clear title and status badge
- [ ] Content sections have consistent spacing
- [ ] Info cards in 2-column grid
- [ ] Footer buttons are properly aligned
- [ ] No text overflow or cutting
- [ ] Rounded corners visible
- [ ] Dark mode works properly

#### On 1366x768 Display
1. Resize browser to 1366x768
2. Repeat steps 3-5 above

**Expected Results:**
- [ ] Same as above
- [ ] Modal adjusts to smaller width appropriately
- [ ] Scrollbar appears if content is long
- [ ] All content still readable

**Screenshot Checklist:**
- [ ] Take screenshot at 1920x1080
- [ ] Take screenshot at 1366x768
- [ ] Compare spacing consistency

---

## Test 2: Delete Button Visibility & Authorization

### Objective
Verify delete button appears only for authorized users

### Test 2A: Admin User
1. Login as `admin`
2. Navigate to Weekly Calendar
3. Click on any class (from any teacher, any school)
4. Verify Class Details modal opens

**Expected Results:**
- [ ] Delete button visible in footer
- [ ] Button is red with trash icon
- [ ] Button shows "Delete" (EN) or "ลบ" (TH) text
- [ ] Button is enabled (not grayed out)

### Test 2B: Moderator User
1. Login as `moderator1` (assigned to School A)
2. Click on class from School A
3. Verify delete button appears
4. Click on class from School B (if filter allows)
5. Verify delete button appears (authorization check happens on click)

**Expected Results:**
- [ ] Delete button visible for School A classes
- [ ] Delete button visible for School B classes (UI shows, backend blocks)

### Test 2C: Teacher User - Own Class
1. Login as `Evan`
2. Click on class where Evan is the teacher

**Expected Results:**
- [ ] Delete button visible
- [ ] Button is enabled

### Test 2D: Teacher User - Other's Class
1. Still logged in as `Evan`
2. If viewing all classes, click on class by another teacher

**Expected Results:**
- [ ] Delete button NOT visible (hidden by UI authorization check)

**Screenshot Checklist:**
- [ ] Admin viewing delete button
- [ ] Moderator viewing delete button
- [ ] Teacher viewing delete button (own class)
- [ ] Teacher NOT seeing delete button (other's class)

---

## Test 3: Bilingual Delete Confirmation

### Objective
Verify delete confirmation modal displays correct messages in both languages

### Test 3A: English Language
1. Login as any authorized user
2. Ensure language is set to English (🇬🇧 flag)
3. Open class details modal
4. Click "Delete" button

**Expected Results:**
- [ ] Confirmation modal appears (overlaying detail modal)
- [ ] Modal has z-index higher than detail modal
- [ ] Title reads "Delete Class"
- [ ] Warning message: "Are you sure you want to delete this class? This action cannot be undone."
- [ ] Student name and date shown in preview box
- [ ] "Cancel" button on left (gray)
- [ ] "Delete" button on right (red)

### Test 3B: Thai Language
1. Switch language to Thai (🇹🇭 flag)
2. Repeat steps 3-4 above

**Expected Results:**
- [ ] Title reads "ลบคลาส"
- [ ] Warning message: "คุณแน่ใจหรือไม่ว่าต้องการลบคลาสนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้"
- [ ] "ยกเลิก" button on left
- [ ] "ลบ" button on right

### Test 3C: Modal Interaction
1. Click "Cancel" / "ยกเลิก"
   - [ ] Confirmation modal closes
   - [ ] Detail modal still open
   - [ ] Class not deleted

2. Click outside confirmation modal
   - [ ] Confirmation modal stays open (no backdrop dismiss)

3. Click "Delete" / "ลบ"
   - [ ] Modal closes
   - [ ] Toast notification appears
   - [ ] Class removed from calendar

**Screenshot Checklist:**
- [ ] English confirmation modal
- [ ] Thai confirmation modal
- [ ] Success toast notification

---

## Test 4: Time Display After Class Creation

### Objective
Verify times display immediately without need to re-edit

### Steps
1. Login as `moderator1` or `Evan`
2. Navigate to Weekly Calendar
3. Click "+" button on any future date
4. Fill in booking form:
   - School: Bangkok International School
   - Student: Select any student
   - Location: Select any location
   - Teacher: Select Evan (if moderator)
   - **Time: 14:30** (important!)
5. Click "Book Class" / "จองคลาส"
6. Wait for form to close

**Expected Results:**
- [ ] Toast notification appears (success)
- [ ] Calendar refreshes automatically
- [ ] New class appears on the selected date
- [ ] **Class card shows "14:30" or "02:30 PM"** (depending on locale)
- [ ] No need to open/edit class to see time

### Verification
1. Click on the newly created class
2. Open Class Details modal

**Expected Results:**
- [ ] Time field shows "14:30" or "02:30 PM"
- [ ] Date is correct
- [ ] All other fields are correct

**Screenshot Checklist:**
- [ ] Calendar view showing new class with time
- [ ] Detail modal showing correct time

---

## Test 5: Time Persistence When Editing

### Objective
Verify times remain correct when editing a class

### Steps
1. Login as `moderator1`
2. Click on any existing class showing time "09:00"
3. Click "Edit Class" / "แก้ไขคลาส" button
4. Verify Edit Class modal opens

**Expected Results:**
- [ ] "Date & Time" field is pre-filled
- [ ] Shows current date and time (e.g., "2024-01-15T09:00")
- [ ] Time matches what was shown in calendar

### Test 5A: Change Time Only
1. Change time to "15:30"
2. Leave all other fields unchanged
3. Click "Save Changes" / "บันทึกการเปลี่ยนแปลง"

**Expected Results:**
- [ ] Toast notification appears (success)
- [ ] Modal closes
- [ ] Calendar refreshes
- [ ] Class card now shows "15:30" or "03:30 PM"
- [ ] Time persisted correctly

### Test 5B: Change Date and Time
1. Edit the same class again
2. Change date to tomorrow
3. Change time to "11:00"
4. Save changes

**Expected Results:**
- [ ] Class moves to tomorrow's column
- [ ] Time shows "11:00" or "11:00 AM"
- [ ] All other details unchanged

### Test 5C: Verify No Time Drift
1. Edit the class again
2. Don't change anything
3. Just click "Save Changes"

**Expected Results:**
- [ ] Time remains "11:00" (no drift to current time)
- [ ] Date unchanged
- [ ] No unexpected modifications

**Screenshot Checklist:**
- [ ] Edit modal with pre-filled time
- [ ] Calendar after time change
- [ ] Detail modal showing new time

---

## Test 6: Quick Edit Button (Desktop Hover)

### Objective
Verify quick edit button appears on hover (desktop only)

### Steps
1. Login as any user
2. Ensure browser width is > 768px (desktop mode)
3. Navigate to Weekly Calendar
4. Move mouse over a class card (don't click)

**Expected Results:**
- [ ] Quick action buttons appear in top-right corner
- [ ] Blue "Edit" button visible
- [ ] Red "Delete" button visible (if authorized)
- [ ] Buttons have smooth fade-in animation
- [ ] Icons are clear (Edit2 pencil, Trash2)
- [ ] Buttons have tooltips on hover

### Interaction Tests
1. Click "Edit" button
   - [ ] Edit Class modal opens immediately
   - [ ] Class detail modal does NOT open
   - [ ] `e.stopPropagation()` working

2. Click somewhere on card (not on buttons)
   - [ ] Class Detail modal opens
   - [ ] Edit modal does NOT open

### Mobile Test (Regression)
1. Resize browser to < 768px width (mobile)
2. Hover over class card

**Expected Results:**
- [ ] Quick action buttons NOT visible
- [ ] Only way to edit is through detail modal
- [ ] Card is still clickable

**Screenshot Checklist:**
- [ ] Desktop hover showing quick buttons
- [ ] Mobile view without quick buttons

---

## Test 7: Quick Delete Button (Desktop Hover)

### Objective
Verify quick delete button works and respects authorization

### Test 7A: Authorized User (Admin)
1. Login as `admin`
2. Hover over any class card
3. Click red "Delete" button

**Expected Results:**
- [ ] Browser confirmation dialog appears
- [ ] Message in current language (EN or TH)
- [ ] "OK" confirms, "Cancel" cancels

4. Click "Cancel"
   - [ ] Dialog closes
   - [ ] Class not deleted

5. Hover and click "Delete" again
6. Click "OK"

**Expected Results:**
- [ ] Toast notification appears (success)
- [ ] Class disappears from calendar
- [ ] Other classes unaffected

### Test 7B: Authorized User (Teacher - Own Class)
1. Login as `Evan`
2. Find class where Evan is teacher
3. Hover over card

**Expected Results:**
- [ ] Both Edit and Delete buttons visible
- [ ] Delete button works same as above

### Test 7C: Unauthorized Attempt (Teacher - Other's Class)
1. Still logged in as `Evan`
2. Find class by another teacher
3. Hover over card

**Expected Results:**
- [ ] Only Edit button visible (if at all)
- [ ] No Delete button
- [ ] No way to quick-delete other's classes

### Test 7D: Backend Authorization Test
1. Login as `Evan`
2. Open browser DevTools → Network tab
3. Try to delete another teacher's class via detail modal

**Expected Results:**
- [ ] Backend returns authorization error
- [ ] Toast notification shows error message
- [ ] Class not deleted

**Screenshot Checklist:**
- [ ] Quick delete confirmation dialog (EN)
- [ ] Quick delete confirmation dialog (TH)
- [ ] Success toast after deletion

---

## Test 8: Mobile Layout Verification

### Objective
Ensure mobile layout is unchanged and functional

### Steps
1. Open browser DevTools
2. Switch to mobile device emulation (e.g., iPhone 12)
3. Login as any user
4. Navigate to Weekly Calendar

**Expected Results:**
- [ ] Calendar displays in mobile-optimized layout
- [ ] Day headers abbreviated (Mon, Tue, etc.)
- [ ] Class cards are larger, touch-friendly
- [ ] Text sizes appropriate for mobile
- [ ] No horizontal scrolling

### Mobile Interaction Tests

#### Test 8A: Class Card Tap
1. Tap on any class card

**Expected Results:**
- [ ] Class Detail modal opens full-screen
- [ ] Modal is scrollable
- [ ] All buttons are touch-friendly (44x44px minimum)
- [ ] Close button easily accessible

#### Test 8B: Quick Actions Not Visible
1. Try to trigger hover on class card (impossible on touch)

**Expected Results:**
- [ ] No quick Edit/Delete buttons appear
- [ ] No way to access quick actions
- [ ] Must use detail modal for all actions

#### Test 8C: Delete via Detail Modal
1. Open class detail modal
2. Scroll to footer
3. Tap "Delete" button

**Expected Results:**
- [ ] Confirmation modal appears
- [ ] Modal is properly sized for mobile
- [ ] Buttons are touch-friendly
- [ ] Can tap Cancel or Delete easily

#### Test 8D: Edit via Detail Modal
1. Open class detail modal
2. Tap "Edit Class" button
3. Edit Class modal opens

**Expected Results:**
- [ ] Edit modal is full-screen on mobile
- [ ] Form inputs are touch-friendly
- [ ] Date/time pickers use native mobile controls
- [ ] Keyboard doesn't obscure inputs

**Screenshot Checklist:**
- [ ] Mobile calendar view
- [ ] Mobile class detail modal
- [ ] Mobile edit modal
- [ ] Mobile confirmation dialog

---

## Test 9: Toast Notifications

### Objective
Verify toast notifications appear for all actions

### Test 9A: Delete Success
1. Delete any class successfully

**Expected Results:**
- [ ] Toast appears in bottom-right corner
- [ ] Shows "Class deleted successfully" (EN) or "ลบคลาสสำเร็จ" (TH)
- [ ] Green/success styling
- [ ] Auto-dismisses after ~5 seconds
- [ ] Can manually dismiss with X button

### Test 9B: Delete Error
1. Try to delete a past class (as non-admin)

**Expected Results:**
- [ ] Toast appears with error styling (red)
- [ ] Shows error message (e.g., "Cannot delete classes whose dates have already passed")
- [ ] Auto-dismisses or stays until dismissed

### Test 9C: Edit Success
1. Edit any class and save changes

**Expected Results:**
- [ ] Toast shows "Changes saved" or similar
- [ ] Success styling

### Test 9D: Add Dates Success
1. Edit class
2. Use "Add More Dates" feature
3. Add 3 dates and save

**Expected Results:**
- [ ] Toast shows "Successfully added 3 date(s)!" (EN) or "เพิ่ม 3 วันสำเร็จแล้ว!" (TH)
- [ ] Success styling

### Test 9E: Multiple Toasts
1. Perform multiple actions quickly (e.g., delete 3 classes)

**Expected Results:**
- [ ] Toasts stack vertically
- [ ] Each toast has unique message
- [ ] Older toasts dismiss first
- [ ] No overlap or collision

**Screenshot Checklist:**
- [ ] Success toast (EN)
- [ ] Success toast (TH)
- [ ] Error toast
- [ ] Multiple toasts stacked

---

## Test 10: Authorization Backend Checks

### Objective
Verify backend prevents unauthorized deletes even if UI is bypassed

### Test 10A: Admin God Mode
1. Login as `admin`
2. Create a class in the past (via database or API)
3. Delete the past class

**Expected Results:**
- [ ] Deletion succeeds (admin can delete past classes)
- [ ] Toast notification shows success

### Test 10B: Moderator School Boundary
1. Login as `moderator1` (School A)
2. Find class from School B
3. Try to delete via detail modal

**Expected Results:**
- [ ] Backend returns authorization error
- [ ] Error message: "Unauthorized: Moderators can only manage classes from their assigned school"
- [ ] Toast shows error
- [ ] Class not deleted

### Test 10C: Moderator Past Date Restriction
1. Still logged in as `moderator1`
2. Find past class from School A
3. Try to delete

**Expected Results:**
- [ ] Backend returns date error
- [ ] Error message: "Cannot delete classes whose dates have already passed"
- [ ] Toast shows error
- [ ] Class not deleted

### Test 10D: Teacher Own Class (Future)
1. Login as `Evan`
2. Find Evan's future class
3. Delete via detail modal

**Expected Results:**
- [ ] Deletion succeeds
- [ ] Toast shows success
- [ ] Class removed

### Test 10E: Teacher Own Class (Past)
1. Still logged in as `Evan`
2. Find Evan's past class
3. Try to delete

**Expected Results:**
- [ ] Backend returns date error
- [ ] Error message about past dates
- [ ] Class not deleted

### Test 10F: Teacher Other's Class
1. Still logged in as `Evan`
2. Try to access delete endpoint for another teacher's class (via DevTools/API)

**Expected Results:**
- [ ] Backend returns authorization error
- [ ] Error message: "Unauthorized: You can only manage your own classes"
- [ ] Class not deleted

### Test 10G: Direct API Manipulation
1. Login as `Evan`
2. Open DevTools → Console
3. Get current user ID from localStorage
4. Try to call deleteClass mutation with another teacher's classId

```javascript
// Example test
const userId = JSON.parse(localStorage.getItem('currentUser'))._id;
const otherClassId = "<some-other-class-id>";
// Try to call mutation (this should fail)
```

**Expected Results:**
- [ ] Backend rejects request
- [ ] Authorization error returned
- [ ] Audit log may record attempt (optional)

**Test Matrix:**

| User | Class Owner | Class Date | Expected Result |
|------|-------------|-----------|----------------|
| Admin | Any | Any | ✅ Success |
| Moderator | Any in school | Future | ✅ Success |
| Moderator | Any in school | Past | ❌ Date error |
| Moderator | Other school | Any | ❌ Auth error |
| Teacher | Self | Future | ✅ Success |
| Teacher | Self | Past | ❌ Date error |
| Teacher | Other | Any | ❌ Auth error |

**Screenshot Checklist:**
- [ ] Admin deleting past class (success)
- [ ] Moderator cross-school error
- [ ] Teacher deleting own class (success)
- [ ] Teacher attempting other's class (error)

---

## Regression Tests

### Test R1: Existing Features Still Work
- [ ] Class creation still works
- [ ] Class editing (non-delete) still works
- [ ] Acknowledge workflow still works
- [ ] Approve/Reject still works
- [ ] Calendar navigation still works
- [ ] School filter still works

### Test R2: No New Bugs Introduced
- [ ] No console errors in DevTools
- [ ] No visual glitches
- [ ] No performance degradation
- [ ] No memory leaks (check DevTools Memory)

### Test R3: Dark Mode
- [ ] All tested modals work in dark mode
- [ ] Text is readable
- [ ] Colors are appropriate
- [ ] No white flashes

---

## Test Summary Report

**Date:** _____________

**Tester:** _____________

**Environment:**
- Browser: _____________
- OS: _____________
- Screen Resolution: _____________

### Results

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Modal Spacing (1920x1080) | ⬜ Pass / ⬜ Fail | |
| 1 | Modal Spacing (1366x768) | ⬜ Pass / ⬜ Fail | |
| 2A | Delete Button - Admin | ⬜ Pass / ⬜ Fail | |
| 2B | Delete Button - Moderator | ⬜ Pass / ⬜ Fail | |
| 2C | Delete Button - Teacher Own | ⬜ Pass / ⬜ Fail | |
| 2D | Delete Button - Teacher Other | ⬜ Pass / ⬜ Fail | |
| 3A | Confirmation - English | ⬜ Pass / ⬜ Fail | |
| 3B | Confirmation - Thai | ⬜ Pass / ⬜ Fail | |
| 3C | Confirmation - Interaction | ⬜ Pass / ⬜ Fail | |
| 4 | Time Display After Creation | ⬜ Pass / ⬜ Fail | |
| 5A | Time Persistence - Change Time | ⬜ Pass / ⬜ Fail | |
| 5B | Time Persistence - Change Date | ⬜ Pass / ⬜ Fail | |
| 5C | Time Persistence - No Drift | ⬜ Pass / ⬜ Fail | |
| 6 | Quick Edit Button - Desktop | ⬜ Pass / ⬜ Fail | |
| 6 | Quick Edit Button - Mobile | ⬜ Pass / ⬜ Fail | |
| 7A | Quick Delete - Admin | ⬜ Pass / ⬜ Fail | |
| 7B | Quick Delete - Teacher Own | ⬜ Pass / ⬜ Fail | |
| 7C | Quick Delete - Authorization | ⬜ Pass / ⬜ Fail | |
| 7D | Quick Delete - Backend Check | ⬜ Pass / ⬜ Fail | |
| 8A | Mobile - Class Card Tap | ⬜ Pass / ⬜ Fail | |
| 8B | Mobile - No Quick Actions | ⬜ Pass / ⬜ Fail | |
| 8C | Mobile - Delete via Modal | ⬜ Pass / ⬜ Fail | |
| 8D | Mobile - Edit via Modal | ⬜ Pass / ⬜ Fail | |
| 9A | Toast - Delete Success | ⬜ Pass / ⬜ Fail | |
| 9B | Toast - Delete Error | ⬜ Pass / ⬜ Fail | |
| 9C | Toast - Edit Success | ⬜ Pass / ⬜ Fail | |
| 9D | Toast - Add Dates | ⬜ Pass / ⬜ Fail | |
| 9E | Toast - Multiple Stack | ⬜ Pass / ⬜ Fail | |
| 10A | Auth - Admin God Mode | ⬜ Pass / ⬜ Fail | |
| 10B | Auth - Moderator School | ⬜ Pass / ⬜ Fail | |
| 10C | Auth - Moderator Past Date | ⬜ Pass / ⬜ Fail | |
| 10D | Auth - Teacher Own Future | ⬜ Pass / ⬜ Fail | |
| 10E | Auth - Teacher Own Past | ⬜ Pass / ⬜ Fail | |
| 10F | Auth - Teacher Other's Class | ⬜ Pass / ⬜ Fail | |
| 10G | Auth - API Manipulation | ⬜ Pass / ⬜ Fail | |
| R1 | Regression - Existing Features | ⬜ Pass / ⬜ Fail | |
| R2 | Regression - No New Bugs | ⬜ Pass / ⬜ Fail | |
| R3 | Regression - Dark Mode | ⬜ Pass / ⬜ Fail | |

### Critical Issues Found:
_____________________________________________________________
_____________________________________________________________

### Minor Issues Found:
_____________________________________________________________
_____________________________________________________________

### Overall Assessment:
⬜ **APPROVED FOR DEPLOYMENT**
⬜ **NEEDS FIXES BEFORE DEPLOYMENT**
⬜ **MAJOR ISSUES - DO NOT DEPLOY**

**Tester Signature:** _______________ **Date:** _______________
