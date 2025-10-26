# Staging Environment - Comprehensive Test Plan

Complete testing checklist for verifying all features work correctly before production deployment.

## Test Environment Setup

### Prerequisites
- ✅ Staging deployment successful
- ✅ Staging Convex database initialized
- ✅ Test users created
- ✅ Test schools created
- ✅ Test students created

### Staging URLs
- **App**: Check GitHub Actions output after deployment
- **Convex Dashboard**: https://dashboard.convex.dev (staging deployment)

---

## Phase 1: Database Initialization

### Initial Setup
- [ ] Access staging URL
- [ ] Initialize database (if first time)
- [ ] Verify default users created:
  - Admin: `admin` / `TeacherAdmin`
  - Moderator: `moderator1` / `TeacherModerator1`
  - Teacher: `Evan` / `TeacherEvan`

---

## Phase 2: User Management Testing

### Admin Functions
- [ ] **Login as Admin**
  - Username: `admin`
  - Password: `TeacherAdmin`
  
- [ ] **Create Users**
  - [ ] Create test moderator: `mod_test`
  - [ ] Create test teacher: `teacher_test`
  - [ ] Verify default password pattern works
  - [ ] Check "require password change" flag

- [ ] **Password Management**
  - [ ] Reset user password
  - [ ] Verify cannot view existing passwords
  - [ ] Test password change on first login

- [ ] **Account Security**
  - [ ] Test 5 failed login attempts → account locked
  - [ ] Verify 24-hour lockout message
  - [ ] Test admin password reset unlocks account

- [ ] **User Deletion**
  - [ ] Delete single user
  - [ ] Test bulk user deletion (with reason + confirmation)
  - [ ] Verify audit log records deletion

### User Authentication
- [ ] **Login Flow**
  - [ ] Login with each user type
  - [ ] Test incorrect password
  - [ ] Test non-existent username
  
- [ ] **Password Change**
  - [ ] Forced password change on first login
  - [ ] Voluntary password change
  - [ ] Verify password hashing (check Convex dashboard)

- [ ] **Session Management**
  - [ ] 24-hour session expiration
  - [ ] Session persistence across page reloads
  - [ ] Logout functionality

---

## Phase 3: School Management

### Admin/Moderator Functions
- [ ] **Create Schools**
  - [ ] Create school with English + Thai names
  - [ ] Test validation (requires both languages)
  - [ ] Add address information

- [ ] **Edit Schools**
  - [ ] Update school details
  - [ ] Verify changes reflected everywhere

- [ ] **Delete Schools**
  - [ ] Soft delete (isActive = false)
  - [ ] Verify hidden from lists

---

## Phase 4: Student Management

### Create Students
- [ ] **Standard Student Creation**
  - [ ] First name + Last name (English)
  - [ ] First name + Last name (Thai)
  - [ ] Grade level
  - [ ] Class/section
  - [ ] Linked to school

- [ ] **Thai Single-Name Students**
  - [ ] Create student with only firstName (Thai)
  - [ ] Leave lastName empty
  - [ ] Verify no validation error

- [ ] **Duplicate Prevention**
  - [ ] Try creating duplicate (same name + grade + class + school)
  - [ ] Verify error: "Student already exists"

- [ ] **Student ID Generation**
  - [ ] Verify unique ID format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`
  - [ ] Example: `BANG-EVTH-abc123-XY4Z`

### Student Operations
- [ ] **Edit Students**
  - [ ] Update student information
  - [ ] Change linked school
  - [ ] Link to guardian

- [ ] **Bulk Import**
  - [ ] Import multiple students from CSV/Excel
  - [ ] Verify all imported correctly
  - [ ] Check error handling for invalid data

- [ ] **Delete Students**
  - [ ] Delete single student
  - [ ] Bulk delete students
  - [ ] Verify audit trail

---

## Phase 5: Class Booking Workflow (CRITICAL)

### Teacher Books Class
**Login as Teacher** (`Evan` or `teacher_test`)

- [ ] **Single Date Booking**
  - [ ] Select school
  - [ ] Select student
  - [ ] Choose date/time
  - [ ] Add optional fields:
    - [ ] Subject
    - [ ] Lesson topic
    - [ ] Materials needed
    - [ ] Preparation notes
    - [ ] Class type
  - [ ] Submit booking
  - [ ] Verify success toast notification

- [ ] **Multi-Date Booking**
  - [ ] Select multiple dates
  - [ ] Book same class for all dates
  - [ ] Verify all bookings created

- [ ] **Conflict Detection**
  - [ ] Try booking overlapping time slot
  - [ ] Verify conflict warning

### Moderator Receives Notification
**Login as Moderator** (`moderator1` or `mod_test`)

- [ ] **Notification Received**
  - [ ] Check notification badge (unread count)
  - [ ] Open notification list
  - [ ] Verify class booking notification
  - [ ] Notification in both English + Thai

- [ ] **Acknowledge Booking**
  - [ ] Click on notification
  - [ ] Acknowledge the booking
  - [ ] Verify status changes to "acknowledged"

### Moderator Approves/Rejects
- [ ] **Approve Class**
  - [ ] Open class details
  - [ ] Click "Approve"
  - [ ] Add optional approval note
  - [ ] Verify status → "approved"

- [ ] **Reject Class**
  - [ ] Book another test class
  - [ ] Reject with reason (bilingual)
  - [ ] Verify status → "rejected"

### Teacher Receives Decision Notification
**Switch back to Teacher**

- [ ] **Check Notification**
  - [ ] Unread badge updated
  - [ ] Notification shows approval/rejection
  - [ ] View reason (if rejected)

---

## Phase 6: Post-Class Features ⭐

### Post-Class Notes/Comments
**After class is marked complete:**

- [ ] **Teacher Adds Notes**
  - [ ] Open completed class
  - [ ] Click "Add Post-Class Notes"
  - [ ] Enter notes (bilingual):
    - Student performance
    - Topics covered
    - Homework assigned
    - Recommendations
  - [ ] Save notes
  - [ ] Verify notes saved

- [ ] **Moderator Views Notes**
  - [ ] Login as moderator
  - [ ] View class details
  - [ ] See teacher's post-class notes
  - [ ] Verify both languages display

---

## Phase 7: Messaging System

### Send Messages
- [ ] **Teacher to Moderator**
  - [ ] Compose message (bilingual)
  - [ ] Add file attachment
  - [ ] Send message
  - [ ] Verify sent

- [ ] **Moderator to Teacher**
  - [ ] Reply to message
  - [ ] Test attachment download
  - [ ] Verify real-time delivery

### Message Operations
- [ ] **Mark as Read/Unread**
  - [ ] Click message → marks as read
  - [ ] Unread badge decreases
  - [ ] Manually mark as unread

- [ ] **Delete Messages**
  - [ ] Delete single message
  - [ ] Verify removed from list

---

## Phase 8: Notification System ⭐

### Notification Window (Gold Tablet)
**Login as Admin**

- [ ] **Create App Update Notification**
  - [ ] Go to "App Updates" tab
  - [ ] Create new update:
    - Version number
    - Title (EN + TH)
    - Description (EN + TH)
    - Features list (with icons)
    - Release date
  - [ ] Set `showInWindow: true`
  - [ ] Activate update

- [ ] **Test Notification Display**
  - [ ] Logout
  - [ ] Login as different user
  - [ ] Verify Gold Tablet notification window appears
  - [ ] Click "Mark as Read"
  - [ ] Verify doesn't show again

### System Notifications
- [ ] **Admin Creates Notification**
  - [ ] Go to Notifications tab
  - [ ] Create notification:
    - Type (info/success/warning/error)
    - Title (EN + TH)
    - Message (EN + TH)
    - Target: All users or specific role
  - [ ] Send notification

- [ ] **Users Receive Notification**
  - [ ] Login as different user types
  - [ ] Verify notification received
  - [ ] Check unread badge
  - [ ] Mark as read
  - [ ] Delete notification

---

## Phase 9: Advanced Features

### Teacher's Helper (ClassCount)
**Login as Teacher**

- [ ] **View ClassCount**
  - [ ] Open Teacher's Helper
  - [ ] View current cycle
  - [ ] See class count for current cycle

- [ ] **Moderator Edits Cycle**
  - [ ] Login as moderator
  - [ ] Open Teacher ClassCount modal
  - [ ] Click "Edit Cycle"
  - [ ] Set new cycle dates
  - [ ] Confirm override if existing cycle
  - [ ] Verify new cycle active

### Location Management
- [ ] **Teacher Proposes Location**
  - [ ] Submit location proposal (EN + TH)
  - [ ] Add address/details

- [ ] **Moderator Approves Location**
  - [ ] Review proposals
  - [ ] Approve location
  - [ ] Verify appears in location list

- [ ] **Admin Manages Locations**
  - [ ] Create location directly
  - [ ] Edit existing location
  - [ ] Delete location (soft delete)

### Event Management
- [ ] **Create Event**
  - [ ] Set event details (EN + TH)
  - [ ] Set date/time
  - [ ] Link to school
  - [ ] Share with teachers

- [ ] **Edit Event**
  - [ ] Update event details
  - [ ] Change sharing settings

- [ ] **Delete Event**
  - [ ] Soft delete event
  - [ ] Verify hidden from lists

### Analytics & Reports
- [ ] **Teacher Activity Dashboard**
  - [ ] Login as moderator
  - [ ] View teacher analytics
  - [ ] Check class counts
  - [ ] View trends

- [ ] **Export Data**
  - [ ] Export classes to CSV
  - [ ] Export students to Excel
  - [ ] Export analytics
  - [ ] Verify file downloads

### Audit Logs
**Login as Admin**

- [ ] **View Audit Logs**
  - [ ] Go to Audit Logs tab
  - [ ] Filter by action type
  - [ ] Filter by user
  - [ ] Filter by date range
  - [ ] View statistics

- [ ] **Export Audit Logs**
  - [ ] Export to CSV
  - [ ] Verify all fields included

### Help System
- [ ] **Access Help**
  - [ ] Click green "Help" button
  - [ ] Browse categories
  - [ ] Expand feature details
  - [ ] Verify role-based filtering (teachers see only teacher features)

- [ ] **Test Bilingual Help**
  - [ ] Switch language to Thai
  - [ ] Reopen help
  - [ ] Verify Thai content displays

---

## Phase 10: UI/UX Testing

### Bilingual Support
- [ ] **Language Switching**
  - [ ] Click language switcher (🇬🇧/🇹🇭)
  - [ ] Verify all text switches
  - [ ] Reload page → language persists
  - [ ] Test on all major pages

- [ ] **Default Language**
  - [ ] New users default to Thai
  - [ ] Verify language preference saves

### Dark Mode
- [ ] **System Theme**
  - [ ] Check automatic dark mode activation
  - [ ] Verify all components styled correctly
  - [ ] Test all pages in dark mode

### Toast Notifications
- [ ] **Success Toasts**
  - [ ] Trigger success action
  - [ ] Verify green toast (bottom-right)
  - [ ] Auto-dismisses after 5 seconds

- [ ] **Error Toasts**
  - [ ] Trigger error action
  - [ ] Verify red toast
  - [ ] Shows actual error message

### Calendar Views
- [ ] **Weekly Calendar**
  - [ ] Navigate weeks
  - [ ] View class schedule
  - [ ] Click on class → details

- [ ] **Month Calendar**
  - [ ] Navigate months
  - [ ] See class indicators
  - [ ] Multi-select dates for booking

### Search & Filters
- [ ] **Search Students**
  - [ ] Search by name (EN)
  - [ ] Search by name (TH)
  - [ ] Search by student ID
  - [ ] Verify bilingual search works

- [ ] **Filter Classes**
  - [ ] Filter by status
  - [ ] Filter by date range
  - [ ] Filter by school
  - [ ] Filter by teacher

### Pagination
- [ ] **Large Datasets**
  - [ ] Create 50+ items
  - [ ] Verify pagination appears
  - [ ] Navigate pages
  - [ ] Change page size

### Mobile Responsiveness
- [ ] **Open in Mobile View**
  - [ ] Resize browser to mobile width
  - [ ] Test navigation
  - [ ] Test forms
  - [ ] Test tables (should scroll)

---

## Phase 11: Edge Cases & Error Handling

### Data Validation
- [ ] **Empty Required Fields**
  - [ ] Try submitting forms with missing data
  - [ ] Verify validation messages (bilingual)

- [ ] **Invalid Formats**
  - [ ] Test date formats
  - [ ] Test number inputs
  - [ ] Test file upload limits

### Network Issues
- [ ] **Offline Behavior**
  - [ ] Disable network
  - [ ] Try actions
  - [ ] Verify error messages

- [ ] **Slow Connection**
  - [ ] Throttle network in DevTools
  - [ ] Verify loading indicators

### Concurrent Users
- [ ] **Real-time Updates**
  - [ ] Open two browser windows
  - [ ] Login as different users
  - [ ] Book class in one window
  - [ ] Verify notification appears in other window (real-time)

### Database Errors
- [ ] **Convex Errors**
  - [ ] Trigger rate limit (30 bookings/min)
  - [ ] Verify rate limit error message

---

## Phase 12: Security Testing

### Authentication
- [ ] **Session Expiration**
  - [ ] Login
  - [ ] Wait 24 hours (or adjust in code for testing)
  - [ ] Verify auto-logout

- [ ] **Account Lockout**
  - [ ] 5 failed login attempts
  - [ ] Verify 24-hour lockout
  - [ ] Try login again after lockout → still blocked

### Authorization
- [ ] **Role-Based Access**
  - [ ] Teacher tries to access admin features → blocked
  - [ ] Moderator tries to delete users → blocked
  - [ ] Verify each role sees only their features

### Data Protection
- [ ] **Password Security**
  - [ ] Check Convex dashboard
  - [ ] Verify passwords are hashed (base64, NOT plaintext)
  - [ ] Admin cannot view passwords

- [ ] **Audit Trail**
  - [ ] Verify all sensitive actions logged
  - [ ] Check audit log timestamps
  - [ ] Verify user attribution

---

## Phase 13: Performance Testing

### Load Time
- [ ] **Initial Page Load**
  - [ ] Open DevTools → Network
  - [ ] Clear cache
  - [ ] Reload page
  - [ ] Verify loads under 3 seconds

### Query Performance
- [ ] **Large Datasets**
  - [ ] Load page with 100+ classes
  - [ ] Verify loads quickly
  - [ ] Check Convex dashboard for query times

### Real-time Updates
- [ ] **Notification Latency**
  - [ ] Book class
  - [ ] Measure time until moderator receives notification
  - [ ] Should be < 1 second

---

## Test Results Summary

### Passed Features ✅
<!-- Mark features as you test them -->

### Failed Features ❌
<!-- Note any bugs found -->

### Performance Metrics
- Page load time: ___ seconds
- Notification latency: ___ ms
- Query performance: ___ ms

### Known Issues
<!-- Document any issues to fix before production -->

---

## Sign-Off

- [ ] All critical features tested and working
- [ ] All bugs documented
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested by:** _______________  
**Date:** _______________  
**Staging URL:** _______________

---

## Next Steps After Testing

1. **Document bugs** in GitHub Issues
2. **Fix critical issues** on `develop` branch
3. **Re-test** on staging
4. **Merge to `main`** when all tests pass
5. **Deploy to production**
6. **Monitor production** for issues

---

**Remember:** Staging is your safety net - test thoroughly, break things freely, fix confidently! 🚀
