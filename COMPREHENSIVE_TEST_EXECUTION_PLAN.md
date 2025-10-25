# Comprehensive Test Execution Plan
**Date Created:** October 25, 2025  
**Purpose:** Test all functionality, create Piglet student in 1/6 Sangsom, fix all errors  
**Test Accounts:** Admin, Moderator, Teacher

---

## Prerequisites

### 1. Start Development Environment

```bash
# Terminal 1 - Start Convex backend
cd /path/to/Evan-sClassTracker4.5
npx convex dev

# Terminal 2 - Start Next.js (AFTER Convex is running)
npm run dev
```

### 2. Initialize Database

1. Open browser: http://localhost:3001
2. Click "Initialize Database" button
3. Note the default credentials displayed

### 3. Set Up Sangsom School (Required for Piglet Student)

```bash
# In Convex dashboard or via mutation call
# Run: seedSangsomProject mutation
# This creates:
# - Sangsom School (โรงเรียนสังสม)
# - Teacher: sangsom_teacher / TeacherPongsak
# - Moderator: sangsom_moderator / TeacherSangsomModerator
# - Location: Sangsom Classroom
```

### 4. Create Piglet Student

```bash
# Run the testPigletStudent mutation: createPigletStudent
# This creates:
# - Student: Piglet Pooh
# - Grade: 1
# - Class: /6
# - School: Sangsom School
```

---

## Test Execution Matrix

### Account 1: Admin Testing (`admin` / `TeacherAdmin`)

#### Phase 1A: Authentication & Security
- [ ] **Login**
  - [ ] Login with correct password → Success
  - [ ] Login with wrong password → Error message
  - [ ] Check session persistence (refresh page)
  - [ ] Check 24-hour session expiration
  - [ ] Test password change requirement on first login
  
- [ ] **Password Management**
  - [ ] Change password → New password works
  - [ ] Try weak password (optional - should work per docs)
  - [ ] Reset another user's password → Password reset to default pattern
  - [ ] Verify admin cannot view passwords (only reset)

#### Phase 1B: User Management
- [ ] **Create Users**
  - [ ] Create new teacher → Auto-generates password `Teacher{username}`
  - [ ] Create new moderator → Assign to school
  - [ ] Create new admin → Full access granted
  - [ ] Try duplicate username → Error
  
- [ ] **User List & Search**
  - [ ] View all users
  - [ ] Filter by role (teacher/moderator/admin)
  - [ ] Filter by school
  - [ ] Search by username
  
- [ ] **User Actions**
  - [ ] Edit user details
  - [ ] Reset user password
  - [ ] Delete user (if applicable)

#### Phase 1C: School Management
- [ ] **View Schools**
  - [ ] List all schools
  - [ ] Verify Sangsom School exists
  - [ ] Check Bangkok International School
  - [ ] Check Chiang Mai Academy
  
- [ ] **School Operations**
  - [ ] Create new school (bilingual name)
  - [ ] Assign moderator to school
  - [ ] Edit school details
  - [ ] Check school-linked data integrity

#### Phase 1D: Student Management (Admin God Mode)
- [ ] **View Students**
  - [ ] List all students (all schools)
  - [ ] Filter by school
  - [ ] Filter by grade
  - [ ] Search by name
  - [ ] **VERIFY: Piglet appears in Sangsom School, Grade 1, Class /6**
  
- [ ] **Student Operations**
  - [ ] View Piglet's details
  - [ ] Edit student information
  - [ ] Check unique student ID format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`
  - [ ] Create new student in any school
  - [ ] Verify bilingual support (EN/TH fields)

#### Phase 1E: Class Management
- [ ] **View Classes**
  - [ ] View all classes (all schools, all teachers)
  - [ ] Filter by school
  - [ ] Filter by teacher
  - [ ] Filter by status (pending/acknowledged/approved/rejected)
  - [ ] Filter by date range
  
- [ ] **Class Actions**
  - [ ] View class details modal
  - [ ] Edit any class (admin god mode)
  - [ ] Delete past classes (admin privilege)
  - [ ] Approve/reject pending classes
  - [ ] Check edit audit trail

#### Phase 1F: Location Management
- [ ] **View Locations**
  - [ ] List all locations (all schools)
  - [ ] Check Sangsom Classroom exists
  - [ ] Filter by school
  
- [ ] **Location Operations**
  - [ ] Create new location (bilingual)
  - [ ] Edit location
  - [ ] Soft delete (isActive = false)
  - [ ] Approve pending location proposals

#### Phase 1G: Notifications & Messages
- [ ] **Notifications**
  - [ ] Create system-wide notification (bilingual)
  - [ ] Create user-specific notification
  - [ ] View notification list
  - [ ] Mark as read/unread
  - [ ] Delete notifications
  - [ ] Check unread badge count
  
- [ ] **Messages**
  - [ ] Send message to teacher
  - [ ] Send message to moderator
  - [ ] View message history
  - [ ] Check unread message count
  - [ ] Attach file (if supported)

#### Phase 1H: Analytics & Reports
- [ ] **Teacher Analytics**
  - [ ] View teacher activity dashboard
  - [ ] Check class count statistics
  - [ ] Export teacher data (CSV/Excel)
  - [ ] View trends and charts
  
- [ ] **System Analytics**
  - [ ] View overall system statistics
  - [ ] Check active users count
  - [ ] View class approval rates
  - [ ] Export system reports

#### Phase 1I: Advanced Features
- [ ] **Audit Logs**
  - [ ] View audit log entries
  - [ ] Filter by user
  - [ ] Filter by action type
  - [ ] Export audit logs
  - [ ] Verify admin actions are logged
  
- [ ] **App Updates**
  - [ ] Create new app update (bilingual)
  - [ ] Set features list
  - [ ] Activate/deactivate updates
  - [ ] Verify update window shows for users
  
- [ ] **Notification Windows**
  - [ ] Create startup notification window
  - [ ] Set target role (teacher/moderator/all)
  - [ ] Include app update summary
  - [ ] Set priority
  - [ ] Activate/deactivate window

#### Phase 1J: Bilingual Testing
- [ ] **Language Switching**
  - [ ] Switch to Thai (🇹🇭)
  - [ ] Verify all UI elements translate
  - [ ] Switch back to English (🇬🇧)
  - [ ] Check language persistence across pages
  - [ ] Verify bilingual data displays correctly

#### Phase 1K: Error Detection
- [ ] **Console Errors**
  - [ ] Open DevTools Console (F12)
  - [ ] Navigate through all tabs
  - [ ] Document any JavaScript errors
  - [ ] Note any warnings
  
- [ ] **Network Errors**
  - [ ] Check Network tab for failed requests
  - [ ] Verify all API calls succeed
  - [ ] Check for rate limiting triggers
  
- [ ] **UI/UX Issues**
  - [ ] Check for visual glitches
  - [ ] Verify dark mode works
  - [ ] Test responsive layout (resize browser)
  - [ ] Check mobile view (DevTools device emulation)

---

### Account 2: Moderator Testing (`moderator1` / `TeacherModerator1`)

#### Phase 2A: Authentication
- [ ] **Login**
  - [ ] Login successfully
  - [ ] Verify session persistence
  - [ ] Test password change
  
- [ ] **School Context**
  - [ ] Verify assigned to Bangkok International School
  - [ ] Check school filter applies automatically

#### Phase 2B: Class Approval Workflow
- [ ] **Receive Booking Notifications**
  - [ ] Create class booking as teacher (use Account 3)
  - [ ] Switch to moderator account
  - [ ] Verify notification received
  - [ ] Check notification badge count
  
- [ ] **Acknowledge Classes**
  - [ ] View pending classes
  - [ ] Click "Acknowledge" button
  - [ ] Verify status changes to "acknowledged"
  - [ ] Check teacher receives notification
  
- [ ] **Approve/Reject Classes**
  - [ ] Approve acknowledged class → Status = "approved"
  - [ ] Reject class with reason (bilingual) → Status = "rejected"
  - [ ] Verify teacher notifications sent
  - [ ] Check audit trail created

#### Phase 2C: Student Management (School-Scoped)
- [ ] **View Students**
  - [ ] List students from assigned school only
  - [ ] Verify cannot see other schools' students
  - [ ] Filter by grade/class
  
- [ ] **Create Student**
  - [ ] Create student in own school → Success
  - [ ] Try to create in other school → Error
  - [ ] Verify unique student ID generated
  - [ ] Check student appears in dropdowns

#### Phase 2D: Location Management
- [ ] **View Locations**
  - [ ] List locations from assigned school
  - [ ] Check pending location proposals
  
- [ ] **Approve Location Proposals**
  - [ ] View teacher-proposed locations
  - [ ] Approve proposal → Location becomes active
  - [ ] Reject proposal with reason (bilingual)
  - [ ] Create new location for school

#### Phase 2E: Teacher Activity Tracking
- [ ] **Teacher ClassCount**
  - [ ] View teacher class count modal
  - [ ] Check active cycle dates
  - [ ] Edit cycle dates (moderator privilege)
  - [ ] Verify confirmation flow for existing cycles
  - [ ] Export teacher data
  
- [ ] **Teacher Logs**
  - [ ] View teacher activity logs
  - [ ] Filter by teacher
  - [ ] Filter by date range
  - [ ] Acknowledge logs

#### Phase 2F: Messaging
- [ ] **Send Messages**
  - [ ] Send to teacher in same school → Success
  - [ ] Send to admin → Success
  - [ ] Create group message (if supported)
  - [ ] Check message delivery notifications

#### Phase 2G: Analytics (School-Scoped)
- [ ] **School Analytics**
  - [ ] View analytics for assigned school
  - [ ] Check class statistics
  - [ ] View teacher performance metrics
  - [ ] Export school reports

#### Phase 2H: Authorization Boundaries
- [ ] **Test Access Restrictions**
  - [ ] Try to manage other school's students → Error
  - [ ] Try to delete past classes → Error (only admin)
  - [ ] Try to create users → Should be blocked
  - [ ] Try to access admin-only features → Hidden/blocked
  
- [ ] **Cross-School Operations**
  - [ ] Verify cannot approve classes from other schools
  - [ ] Check cannot view other schools' data
  - [ ] Confirm school filter is enforced

---

### Account 3: Teacher Testing (`Evan` / `TeacherEvan`)

#### Phase 3A: Authentication
- [ ] **Login**
  - [ ] Login successfully
  - [ ] Test password change
  - [ ] Verify session persistence

#### Phase 3B: Class Booking
- [ ] **Book Class with Piglet**
  - [ ] Navigate to class booking form
  - [ ] Select Sangsom School
  - [ ] **Select Piglet student from dropdown (CRITICAL TEST)**
  - [ ] Select location (or propose new one)
  - [ ] Set date and time
  - [ ] Fill optional fields (subject, topic, materials)
  - [ ] Submit booking
  - [ ] Verify toast notification appears
  - [ ] Check class appears in calendar
  
- [ ] **Multi-Date Booking**
  - [ ] Book class with multiple dates
  - [ ] Verify all dates created
  - [ ] Check toast shows count: "Successfully added X date(s)!"
  
- [ ] **Conflict Detection**
  - [ ] Try to book overlapping time → Warning
  - [ ] Book class in past → Should be prevented (unless admin)

#### Phase 3C: Calendar View
- [ ] **Weekly Calendar**
  - [ ] View current week
  - [ ] Navigate to previous/next week
  - [ ] Check class cards show time correctly
  - [ ] Verify color coding by status
  - [ ] Click on class card → Detail modal opens
  
- [ ] **Class Details Modal**
  - [ ] View student name (should show "Piglet Pooh")
  - [ ] Check date and time display
  - [ ] Verify location shown
  - [ ] Check all optional fields display
  - [ ] View status badge

#### Phase 3D: Edit Own Classes
- [ ] **Edit Future Classes**
  - [ ] Click "Edit Class" button
  - [ ] Change time → Time updates immediately
  - [ ] Change date → Class moves to new date
  - [ ] Edit optional fields
  - [ ] Save changes → Audit trail created
  - [ ] Verify no time drift bug
  
- [ ] **Quick Edit (Desktop)**
  - [ ] Hover over class card
  - [ ] Quick edit button appears
  - [ ] Click edit → Modal opens directly
  - [ ] `e.stopPropagation()` working (detail modal doesn't open)

#### Phase 3E: Delete Own Classes
- [ ] **Delete Future Class**
  - [ ] Open class detail modal
  - [ ] Click "Delete" button → Confirmation modal
  - [ ] Cancel → Modal closes, class not deleted
  - [ ] Delete again → Confirm → Class deleted
  - [ ] Verify toast notification
  
- [ ] **Try to Delete Past Class**
  - [ ] Try to delete past class → Error
  - [ ] Message: "Cannot delete classes whose dates have already passed"
  - [ ] Only admin can delete past classes

#### Phase 3F: Student Management (Limited)
- [ ] **View Students**
  - [ ] List students from assigned school
  - [ ] Verify Piglet appears in list
  - [ ] Search for Piglet by name
  - [ ] Filter by grade (Grade 1)
  - [ ] Filter by class (/6)
  
- [ ] **Create Student**
  - [ ] Create new student in own school → Success
  - [ ] Try to create in other school → Error
  - [ ] Check unique student ID format
  - [ ] Verify bilingual fields supported

#### Phase 3G: Location Proposals
- [ ] **Propose New Location**
  - [ ] During class booking, type new location name
  - [ ] Submit bilingual location proposal
  - [ ] Verify status = "pending approval"
  - [ ] Check moderator receives notification
  - [ ] Use existing location → No proposal needed

#### Phase 3H: Messaging
- [ ] **Send Messages**
  - [ ] Send to moderator → Success
  - [ ] Send to admin → Success
  - [ ] Reply to received messages
  - [ ] Check unread badge updates
  - [ ] Attach file (if supported)

#### Phase 3I: Notifications
- [ ] **View Notifications**
  - [ ] Check for booking acknowledgment
  - [ ] Check for approval/rejection notifications
  - [ ] Mark as read
  - [ ] Delete notifications
  - [ ] Verify badge count updates

#### Phase 3J: Help System
- [ ] **Access Help**
  - [ ] Click green "Help" button in header
  - [ ] Browse help categories
  - [ ] Expand "Class Booking" section
  - [ ] Read step-by-step instructions
  - [ ] Switch language → Help content translates
  - [ ] Close help modal

#### Phase 3K: Teacher's Helper (If Applicable)
- [ ] **Access Tools**
  - [ ] Open teacher's helper dashboard
  - [ ] View teaching resources
  - [ ] Check lesson planning tools
  - [ ] Export class lists

#### Phase 3L: Authorization Boundaries
- [ ] **Test Restrictions**
  - [ ] Try to view other teachers' classes → Should only see own
  - [ ] Try to edit other teacher's class → Edit button hidden
  - [ ] Try to delete other's class → Delete button hidden
  - [ ] Verify cannot access admin/moderator features

---

## Cross-Account Integration Tests

### Integration 1: End-to-End Class Booking Workflow
1. **Teacher (Evan)**: Book class with Piglet
2. **Moderator (moderator1)**: Receive notification → Acknowledge
3. **Teacher (Evan)**: Check status changed to "acknowledged"
4. **Moderator (moderator1)**: Approve class
5. **Teacher (Evan)**: Receive approval notification → Status = "approved"

### Integration 2: Location Proposal Workflow
1. **Teacher (Evan)**: Propose new location "Outdoor Garden"
2. **Moderator (moderator1)**: View proposal → Approve
3. **Teacher (Evan)**: Book class using new location → Success

### Integration 3: Guardian-Linked Student (If Applicable)
1. **Admin**: Create guardian user
2. **Teacher (Evan)**: Create student linked to guardian
3. **Guardian**: Receive notification → Acknowledge student
4. **Teacher (Evan)**: Book class with guardian-linked student → Auto-approve

### Integration 4: Bulk Operations
1. **Admin**: Import multiple students via CSV
2. **Teacher (Evan)**: Verify students appear in dropdown
3. **Moderator (moderator1)**: Verify students in school list

---

## Error Detection & Documentation

### Browser Console Errors
- [ ] Open DevTools (F12) → Console tab
- [ ] Clear console
- [ ] Navigate through all pages/features
- [ ] Document errors:
  ```
  [ERROR] File: ____, Line: ____, Message: ____
  [WARNING] File: ____, Line: ____, Message: ____
  ```

### Network Errors
- [ ] Open DevTools → Network tab
- [ ] Filter: XHR/Fetch
- [ ] Look for failed requests (red status codes)
- [ ] Document:
  ```
  [FAILED REQUEST] Endpoint: ____, Status: ____, Error: ____
  ```

### Visual/UI Issues
- [ ] Screenshot any visual glitches
- [ ] Note layout breaks at different screen sizes
- [ ] Check dark mode inconsistencies
- [ ] Document text overflow/clipping

### Functional Bugs
- [ ] Features that don't work as expected
- [ ] Incorrect data display
- [ ] Missing bilingual translations
- [ ] Performance issues (slow loading)

---

## Bug Severity Classification

### Critical (Fix Immediately)
- Application crashes
- Data loss issues
- Security vulnerabilities
- Login failures

### Major (Fix Before Completion)
- Features completely broken
- Incorrect data calculations
- Authorization bypass
- Major UX issues

### Minor (Fix If Time Permits)
- Visual inconsistencies
- Non-critical missing translations
- Performance optimizations
- Nice-to-have features

---

## Piglet Student Verification Checklist

**CRITICAL REQUIREMENT**: Verify Piglet student exists and works correctly

- [ ] **Existence Check**
  - [ ] Run `verifyPigletStudent` query → `exists: true`
  - [ ] Check database directly for Piglet
  - [ ] Verify student ID format: `SANG-PIPO-{timestamp}-{random}`
  
- [ ] **Data Accuracy**
  - [ ] First Name: "Piglet"
  - [ ] Last Name: "Pooh"
  - [ ] Grade: "1"
  - [ ] Class: "/6"
  - [ ] School: "Sangsom School"
  - [ ] Nickname: "Piglet"
  
- [ ] **Integration Tests**
  - [ ] Piglet appears in student dropdown (class booking)
  - [ ] Can book class with Piglet as student
  - [ ] Can search for Piglet by name
  - [ ] Can filter to show only Grade 1, Class /6
  - [ ] Piglet shows in Sangsom School student list
  
- [ ] **UI Display**
  - [ ] Student name displays correctly in class cards
  - [ ] Grade and class show as "1/6"
  - [ ] Unique student ID visible in student details
  - [ ] All bilingual fields work correctly

---

## Test Execution Log

**Tester Name:** _______________  
**Date:** _______________  
**Environment:** Local Development / Staging / Production

### Account 1: Admin Testing
- Start Time: _______________
- End Time: _______________
- Tests Passed: _____ / _____
- Critical Errors: _____
- Major Errors: _____
- Minor Issues: _____

### Account 2: Moderator Testing
- Start Time: _______________
- End Time: _______________
- Tests Passed: _____ / _____
- Critical Errors: _____
- Major Errors: _____
- Minor Issues: _____

### Account 3: Teacher Testing
- Start Time: _______________
- End Time: _______________
- Tests Passed: _____ / _____
- Critical Errors: _____
- Major Errors: _____
- Minor Issues: _____

### Piglet Student Verification
- [ ] Created Successfully
- [ ] Appears in Dropdowns
- [ ] Can Book Classes With Piglet
- [ ] All Data Correct

---

## Error Summary

### Critical Errors Found
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

### Major Errors Found
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

### Minor Issues Found
1. _______________________________________________________
2. _______________________________________________________
3. _______________________________________________________

---

## Screenshots Required

- [ ] Admin dashboard
- [ ] User management screen
- [ ] Piglet student in student list
- [ ] Class booking with Piglet in dropdown
- [ ] Class card showing Piglet's name
- [ ] Moderator approval workflow
- [ ] Teacher calendar view
- [ ] Help window
- [ ] Bilingual UI (English + Thai)
- [ ] Any error messages encountered

---

## Final Sign-Off

**All Tests Complete:** ⬜ YES / ⬜ NO  
**All Errors Fixed:** ⬜ YES / ⬜ NO  
**Piglet Student Working:** ⬜ YES / ⬜ NO  

**Overall Status:**
- ⬜ PASS - Ready for deployment
- ⬜ CONDITIONAL PASS - Minor issues remain
- ⬜ FAIL - Critical/major errors found

**Tester Signature:** _______________ **Date:** _______________
