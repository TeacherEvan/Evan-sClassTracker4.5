# Comprehensive QA Test Plan - Evan's Class Tracker 4.5

**Version:** 4.5.32  
**QA Date:** December 6, 2025  
**Status:** In Progress  
**Testing Type:** E2E Testing with Playwright

---

## Executive Summary

This document outlines the comprehensive quality assurance plan for all new features and logic in Evan's Class Tracker 4.5. The QA process validates:

- Teacher role features (unblocked booking, self-guardian, duplicate modal, merging)
- Moderator role features (school connection, analytics, EN/TH flagging)
- Location dropdown system (EN/TH, accurate map data)
- Admin watchlist and audit trail
- Data migration and legacy cleanup

---

## 1. Teacher Role Feature Tests

### 1.1 Unblocked Booking Flow

**Feature Description:** Teachers with guardian-linked classes can book classes without moderator approval.

**Test Cases:**

#### TC-T1.1.1: Teacher with Guardian-Linked Class

```gherkin
Given: A teacher user logged in
And: The teacher has guardian-linked classes (isGuardianLinked: true)
When: The teacher creates a new class booking
Then: The class status should be "approved" immediately
And: No moderator approval workflow should be triggered
```gherkin

#### TC-T1.1.2: Teacher without Guardian-Linked Class

```gherkin
Given: A teacher user logged in
And: The teacher does NOT have guardian-linked classes
When: The teacher creates a new class booking
Then: The class status should be "pending"
And: Moderator approval workflow should be triggered
And: Notification should be sent to moderators
```gherkin

**Existing Test Coverage:**
- `tests/e2e/class-booking.spec.ts` - Partial coverage exists
- Needs validation for guardian-linked bypass logic

---

### 1.2 Self-Guardian Feature (Private Tutoring)

**Feature Description:** Teachers can act as guardians for their own private tutoring students.

**Test Cases:**

#### TC-T1.2.1: Teacher Creates Private Student

```gherkin
Given: A teacher user logged in
When: The teacher creates a new student with guardian relationship
Then: The teacher should be linked as the student's guardian
And: The guardian relationship should be stored in providers table
And: The student should be visible in teacher's student list
```gherkin

#### TC-T1.2.2: Guardian-Linked Student Booking Auto-Approval

```gherkin
Given: A teacher user with a guardian-linked student
When: The teacher books a class for that student
Then: The class should be auto-approved (status: "approved")
And: No moderator intervention required
And: isGuardianLinked flag should be true
```gherkin

**Existing Test Coverage:**
- `tests/e2e/student-management.spec.ts` - Needs guardian relationship tests

---

### 1.3 Duplicate Class Detection Modal

**Feature Description:** System detects and warns about potential duplicate class bookings.

**Test Cases:**

#### TC-T1.3.1: Duplicate Detection - Same Location/Time

```gherkin
Given: A teacher user logged in
And: An existing class on 2025-12-10 at 10:00 at Location A
When: The teacher attempts to book another class at same location/time
Then: A duplicate detection modal should appear
And: Modal should show details of existing class
And: Teacher should have option to continue or cancel
```gherkin

#### TC-T1.3.2: Duplicate Detection - Overlapping Time

```gherkin
Given: An existing class from 10:00-11:00
When: Teacher books a class from 10:30-11:30 at same location
Then: System should detect time overlap
And: Warning modal should appear
```gherkin

#### TC-T1.3.3: No Duplicate - Different Location

```gherkin
Given: An existing class at Location A at 10:00
When: Teacher books a class at Location B at 10:00
Then: No duplicate warning should appear
And: Booking should proceed normally
```gherkin

**Existing Test Coverage:**
- Needs new test file or addition to class-booking.spec.ts

---

### 1.4 Class Merging Feature

**Feature Description:** Teachers can merge multiple classes with same location/time into a single class.

**Test Cases:**

#### TC-T1.4.1: View Mergeable Classes

```gherkin
Given: A teacher user logged in
And: Multiple classes exist with same location/date/time
When: The teacher opens the "Merge Classes" modal
Then: Classes should be grouped by location/date/time
And: Each group should show total classes count
And: Groups should be displayed with checkboxes for selection
```gherkin

#### TC-T1.4.2: Select Target Class for Merge

```gherkin
Given: The merge modal is open with mergeable groups
When: Teacher enables a group checkbox
Then: Target class selection UI should appear
And: Radio buttons for each class in the group should be displayed
And: Teacher can select which class to keep as primary
```gherkin

#### TC-T1.4.3: Execute Class Merge

```gherkin
Given: A group is enabled and target class is selected
When: Teacher clicks "Merge Classes" button
Then: All non-target classes should be marked as merged
And: Students from merged classes should be added to target class
And: Target class should show updated student count
And: Merged classes should not appear in active class list
```gherkin

#### TC-T1.4.4: Prevent Invalid Merge

```gherkin
Given: The merge modal is open
When: Teacher enables a group but does not select target class
Then: Merge button should be disabled
And: Error message should indicate selection required
```gherkin

**Existing Test Coverage:**
- `tests/e2e/merge-classes.spec.ts` - Comprehensive coverage exists ✅

---

## 2. Moderator Role Feature Tests

### 2.1 School Connection and Scoping

**Feature Description:** Moderators are strictly scoped to their assigned school and cannot access other schools' data.

**Test Cases:**

#### TC-M2.1.1: Moderator School Scope Enforcement

```gherkin
Given: A moderator user logged in for School A
When: The moderator views classes
Then: Only classes from School A should be visible
And: Classes from other schools should be filtered out
```gherkin

#### TC-M2.1.2: Moderator Cannot Access Other Schools

```gherkin
Given: A moderator user for School A
When: Attempting to directly access School B data via URL manipulation
Then: Access should be denied
And: Error message should be displayed
And: Audit log should record unauthorized access attempt
```gherkin

#### TC-M2.1.3: Moderator Dashboard Shows School-Specific Data

```gherkin
Given: A moderator user logged in
When: Viewing dashboard/analytics
Then: All metrics should be filtered to moderator's school only
And: School name should be displayed prominently
```gherkin

**Existing Test Coverage:**
- Needs validation in existing tests
- Security test case to be added

---

### 2.2 Analytics Dashboard Access

**Feature Description:** Moderators have access to Teacher Comparison analytics for their school.

**Test Cases:**

#### TC-M2.2.1: Moderator Sees Teacher Comparison Tab

```gherkin
Given: A moderator user logged in
When: The moderator opens Analytics modal
Then: "Teacher Comparison" tab should be visible
And: Tab should be accessible (not disabled)
```gherkin

#### TC-M2.2.2: Teacher Comparison Data Shows School Teachers Only

```gherkin
Given: Moderator opens Teacher Comparison view
When: Viewing teacher performance metrics
Then: Only teachers from moderator's school should be listed
And: Metrics should be accurate (classes, attendance, etc.)
And: CSV export should include only school teachers
```gherkin

#### TC-M2.2.3: Teacher Cannot Access Teacher Comparison

```gherkin
Given: A teacher user logged in
When: The teacher opens Analytics modal
Then: "Teacher Comparison" tab should NOT be visible
And: Only summary analytics should be available
```gherkin

**Existing Test Coverage:**
- `tests/e2e/analytics.spec.ts` - Comprehensive coverage exists ✅

---

### 2.3 EN/TH Language Flagging System

**Feature Description:** Moderators can flag students/classes with English or Thai language preference for better scheduling.

**Test Cases:**

#### TC-M2.3.1: Flag Student with Language Preference

```gherkin
Given: A moderator viewing student details
When: The moderator adds an EN/TH flag to student
Then: Flag should be saved to student record
And: Flag should be visible in student list
And: Flag should persist across sessions
```gherkin

#### TC-M2.3.2: Filter Classes by Language Flag

```gherkin
Given: Multiple students with different language flags
When: Moderator filters class list by language flag
Then: Only classes with matching language students should appear
And: Count should be accurate
```gherkin

#### TC-M2.3.3: Bilingual Display of Language Flags

```gherkin
Given: Language flags are set
When: Viewing in English mode
Then: Flags should display "EN" or "TH" appropriately
When: Switching to Thai mode
Then: Flags should display in Thai equivalents
```gherkin

**Existing Test Coverage:**
- Needs investigation - may be in student-management or class-booking tests

---

## 3. Location Dropdown System Tests

### 3.1 Bilingual Location Names

**Feature Description:** All locations display with both English and Thai names, respecting user's language preference.

**Test Cases:**

#### TC-L3.1.1: Location Dropdown Shows Current Language

```gherkin
Given: User is in English mode
When: Opening location dropdown in class booking form
Then: Locations should display English names
And: Dropdown should be sorted alphabetically by English names
```gherkin

#### TC-L3.1.2: Language Switch Updates Locations

```gherkin
Given: Location dropdown is open showing English names
When: User switches to Thai language
Then: Dropdown should update to show Thai names
And: Sorting should update to Thai alphabetical order
```gherkin

#### TC-L3.1.3: Both Languages Available in Database

```gherkin
Given: Admin creates a new location
When: Entering location details
Then: Both nameEn and nameTh fields should be required
And: Validation should enforce at least one language
And: Preferred pattern: both languages filled
```gherkin

**Existing Test Coverage:**
- Needs validation in class-booking tests
- BilingualInput component tested

---

### 3.2 Accurate Map Data Integration

**Feature Description:** Locations include accurate latitude/longitude for map display and routing.

**Test Cases:**

#### TC-L3.2.1: Location Has Valid Coordinates

```gherkin
Given: A location record in the database
When: Viewing location details
Then: Latitude should be between -90 and 90
And: Longitude should be between -180 and 180
And: Coordinates should match actual physical location
```gherkin

#### TC-L3.2.2: Map Display Shows Correct Location

```gherkin
Given: A class with a location having coordinates
When: Viewing class details with map
Then: Map pin should appear at correct coordinates
And: Map should be centered on the location
And: Location name should display on map marker
```gherkin

#### TC-L3.2.3: Location Selector Shows Map Preview

```gherkin
Given: User is selecting a location in booking form
When: Hovering over or selecting a location
Then: Map preview should display (if feature exists)
And: Preview should show correct location marker
```gherkin

**Existing Test Coverage:**
- Needs investigation - map integration may not have E2E tests
- May require manual testing or visual validation

---

## 4. Admin Watchlist and Audit Trail Tests

### 4.1 Admin Watchlist Feature

**Feature Description:** Admins can flag users/entities for monitoring and receive alerts.

**Test Cases:**

#### TC-A4.1.1: Add User to Watchlist

```gherkin
Given: An admin user logged in
When: Admin adds a teacher/moderator to watchlist
Then: User should appear in watchlist dashboard
And: Watchlist entry should include reason and timestamp
And: Admin should receive notifications for watchlisted user activity
```gherkin

#### TC-A4.1.2: Watchlist Alerts on Activity

```gherkin
Given: A user is on admin watchlist
When: The watchlisted user performs actions (class booking, student edit)
Then: Admin should receive real-time notification
And: Notification should include action details
And: Audit log should record the activity
```gherkin

#### TC-A4.1.3: Remove User from Watchlist

```gherkin
Given: A user is currently on watchlist
When: Admin removes user from watchlist
Then: User should no longer appear in watchlist
And: Alert notifications should stop for that user
And: Removal should be logged in audit trail
```gherkin

**Existing Test Coverage:**
- Needs investigation - may not have E2E test coverage
- Feature existence needs confirmation

---

### 4.2 Comprehensive Audit Trail

**Feature Description:** All significant actions are logged with user, timestamp, action type, and details.

**Test Cases:**

#### TC-A4.2.1: Audit Log Records User Actions

```gherkin
Given: Any user performs a significant action
When: Action includes: class create/edit/delete, user edit, approval
Then: Audit log should create entry with:
  - User ID and username
  - Action type
  - Target entity ID and type
  - Timestamp
  - Old and new values (for edits)
  - School context
```gherkin

#### TC-A4.2.2: Admin Views Audit Trail

```gherkin
Given: An admin user logged in
When: Admin opens audit trail dashboard
Then: All audit entries should be displayed
And: Entries should be filterable by date, user, action type
And: Entries should be sortable by timestamp
And: Pagination should work correctly
```gherkin

#### TC-A4.2.3: Audit Log Cannot Be Modified

```gherkin
Given: Audit entries exist in database
When: Any user (including admin) attempts to modify audit log
Then: Modification should be prevented by database constraints
And: Audit logs should be immutable
```gherkin

#### TC-A4.2.4: Audit Log Performance

```gherkin
Given: Large number of audit entries (1000+)
When: Querying audit logs with filters
Then: Query should use appropriate index
And: Results should return within 2 seconds
And: Pagination should load efficiently
```gherkin

**Existing Test Coverage:**
- Audit logging exists in backend (convex/helpers/auditHelpers.ts)
- E2E tests needed for admin UI

---

## 5. Data Migration and Legacy Cleanup Tests

### 5.1 Guardian to Provider Migration

**Feature Description:** Legacy guardian role migrated to Provider system (completed Oct 2025).

**Test Cases:**

#### TC-D5.1.1: No Legacy Guardian Users Exist

```gherkin
Given: Database has been migrated
When: Querying users table
Then: No users should have role = "guardian"
And: All guardian relationships should be in providers table
```gherkin

#### TC-D5.1.2: Provider Relationships Are Valid

```gherkin
Given: Migrated provider records exist
When: Validating provider-student relationships
Then: All providerId fields should reference valid user IDs
And: All studentId fields should reference valid student records
And: No orphaned relationships should exist
```gherkin

#### TC-D5.1.3: UI Removes Guardian Role References

```gherkin
Given: Navigating application UI
When: Viewing user management, dropdowns, filters
Then: "Guardian" role should not appear in any UI
And: Only "teacher", "moderator", "admin" roles should be visible
And: Provider system should be used for parent/guardian relationships
```gherkin

**Existing Test Coverage:**
- Documentation confirms migration complete (Oct 2025)
- Schema validation test needed
- UI validation test needed

---

### 5.2 Bcrypt to PBKDF2 Password Migration

**Feature Description:** Password hashing migrated from bcrypt to PBKDF2 (Web Crypto API).

**Test Cases:**

#### TC-D5.2.1: Verify All Users Migrated to PBKDF2

```gherkin
Given: Password migration script has been run
When: Querying user password hashes
Then: All password hashes should use PBKDF2 format
And: No bcrypt hashes should remain (starts with "$2")
And: Migration dashboard should show 100% completion
```gherkin

#### TC-D5.2.2: Login Works with PBKDF2 Hashes

```gherkin
Given: User account with PBKDF2 password hash
When: User logs in with correct password
Then: Login should succeed
And: Session should be created
And: No errors should occur
```gherkin

#### TC-D5.2.3: Legacy Bcrypt Login Auto-Upgrades

```gherkin
Given: User account with legacy bcrypt hash (if any remain)
When: User logs in with correct password
Then: Login should succeed (backward compatibility)
And: Password should be re-hashed to PBKDF2
And: Next login should use PBKDF2 verification
```gherkin

**Existing Test Coverage:**
- `tests/e2e/auth.spec.ts` - Basic login tests exist
- Password migration validation needed
- Security test for hash format validation needed

---

### 5.3 Database Schema Cleanup

**Feature Description:** Remove deprecated fields and ensure schema consistency.

**Test Cases:**

#### TC-D5.3.1: No Deprecated Fields in Schema

```gherkin
Given: Schema definition in convex/schema.ts
When: Reviewing table definitions
Then: No deprecated fields should be marked for removal
And: All fields should have clear purpose
And: Documentation should explain all fields
```gherkin

#### TC-D5.3.2: All Indexes Are Utilized

```gherkin
Given: Indexes defined in schema
When: Analyzing query patterns in codebase
Then: All indexes should be used by at least one query
And: No unused indexes should exist
And: Query performance should meet SLA (<2s)
```gherkin

#### TC-D5.3.3: Data Integrity Validation

```gherkin
Given: Production database
When: Running data integrity checks
Then: No orphaned records should exist
And: All foreign key relationships should be valid
And: No NULL values in required fields
```gherkin

**Existing Test Coverage:**
- Schema validation exists
- Data integrity tests needed

---

## Test Execution Strategy

### Environment Setup

1. **Local Development Environment**
   - Run `npx convex dev` (Convex backend)
   - Run `npm run dev` (Next.js frontend)
   - Ensure `.env.local` has correct `NEXT_PUBLIC_CONVEX_URL`

2. **Test Data Seeding**
   - Use existing test users from `tests/e2e/helpers.ts`
   - Ensure test data includes all role types
   - Create test data for edge cases

3. **Test Execution Modes**
   - **Standard Mode**: `npm run test:e2e`
   - **HAR Replay Mode**: `npm run test:e2e:replay` (faster, offline)
   - **HAR Record Mode**: `npm run test:e2e:record` (update HAR files)
   - **UI Mode**: `npm run test:e2e:ui` (interactive debugging)

### Test Prioritization

#### P0 - Critical (Must Pass)

- Login and authentication (TC-D5.2.x)
- Teacher class booking (TC-T1.1.x)
- Moderator approval workflow (TC-M2.1.x)
- School scoping security (TC-M2.1.2)

#### P1 - High (Should Pass)

- Class merging (TC-T1.4.x)
- Analytics access control (TC-M2.2.x)
- Location bilingual display (TC-L3.1.x)
- Audit trail logging (TC-A4.2.x)

#### P2 - Medium (Nice to Have)

- Duplicate detection (TC-T1.3.x)
- Language flagging (TC-M2.3.x)
- Map data accuracy (TC-L3.2.x)
- Watchlist feature (TC-A4.1.x)

#### P3 - Low (Can Defer)

- Data migration validation (TC-D5.1.x, TC-D5.3.x)
- Performance benchmarks

### Success Criteria

**Feature Sign-off Criteria:**
- ✅ All P0 tests pass (100% pass rate)
- ✅ At least 90% of P1 tests pass
- ✅ No security vulnerabilities found
- ✅ No data loss or corruption
- ✅ Performance meets SLA (<2s page load, <1s mutations)
- ✅ Bilingual support works correctly
- ✅ All roles have appropriate access control

**Blockers for Deployment:**
- ❌ Any P0 test failure
- ❌ Security vulnerability discovered
- ❌ Data corruption or loss
- ❌ Critical performance degradation
- ❌ Authentication/authorization bypass

---

## Test Results Summary

**Note:** To be filled after test execution

### P0 Critical Tests: **X / Y Passed (Z%)**

### P1 High Tests: **X / Y Passed (Z%)**

### P2 Medium Tests: **X / Y Passed (Z%)**

### P3 Low Tests: **X / Y Passed (Z%)**

### Total Tests: **X / Y Passed (Z%)**

### Issues Found:
1. [Issue description]
2. [Issue description]

### Blockers:
1. [Blocker description]

### Recommendations:
1. [Recommendation]

---

## Sign-off

**QA Engineer:** _______________  
**Date:** _______________  
**Status:** ⚪ Not Started | 🟡 In Progress | 🟢 Passed | 🔴 Blocked

**Approved for Deployment:** ☐ Yes  ☐ No  ☐ Conditional

**Notes:**
