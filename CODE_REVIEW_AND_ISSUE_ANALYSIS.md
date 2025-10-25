# Code Review & Potential Issue Analysis
**Date:** October 25, 2025  
**Purpose:** Static code analysis to identify potential errors before testing  
**Scope:** Full application review

---

## 1. Known Issues from Linting

### TypeScript ESLint Warnings

**File:** `convex/students.ts`  
**Lines:** 242-246, 313-317  
**Issue:** Unused variables with underscore prefix

```typescript
// Line 242-246
const _userAgent = args.userAgent;
const _screenResolution = args.screenResolution;
const _timezone = args.timezone;
const _locale = args.locale;
const _sessionId = args.sessionId;
```

**Severity:** Minor  
**Impact:** No functional impact, just code cleanliness  
**Fix:** Either use these variables or remove them  
**Recommendation:** Remove if not needed, or implement audit logging that uses them

---

## 2. Security Concerns (From Documentation)

### 2.1 Password Hashing - CRITICAL

**File:** `convex/users.ts`, `convex/init.ts`, `convex/seedSangsomProject.ts`  
**Issue:** Using `btoa()` for password hashing (Base64 encoding)

```typescript
function hashPassword(password: string): string {
  return btoa(password);  // ⚠️ REVERSIBLE!
}
```

**Severity:** CRITICAL (Production blocker)  
**Impact:** Database compromise = all passwords exposed  
**Current Status:** Documented as "NOT production-ready"  
**Fix Required:** Migrate to bcrypt before production  
**Testing Note:** This is a known limitation, not a bug to fix now

### 2.2 Session Storage

**File:** `lib/session-utils.ts` (assumed)  
**Issue:** localStorage for session storage (XSS vulnerability)  
**Severity:** HIGH  
**Impact:** Sessions accessible to any JavaScript  
**Mitigation:** 24-hour auto-expiration implemented  
**Production Fix:** Migrate to HttpOnly cookies

### 2.3 Account Lockout

**File:** `convex/users.ts`  
**Issue:** 24-hour lockout after 5 failed attempts  
**Status:** IMPLEMENTED ✅  
**Testing Note:** Verify this works correctly

---

## 3. Potential Database Issues

### 3.1 Student ID Generation Race Condition

**File:** `convex/students.ts` (Line 130-155)  
**Potential Issue:** Race condition in unique ID generation

```typescript
while (attempts < maxAttempts) {
  const existing = await ctx.db
    .query("students")
    .withIndex("by_student_id", (q) => q.eq("studentId", studentId))
    .first();

  if (!existing) {
    break;  // ⚠️ Another request could insert between check and insert
  }
  // Regenerate...
}
```

**Severity:** Low  
**Likelihood:** Very low (timestamp + random makes collisions rare)  
**Testing:** Create 100 students rapidly and check for duplicates  
**Recommendation:** Add unique constraint at database level if Convex supports it

### 3.2 Soft Delete Pattern Consistency

**Files:** Multiple (`locations.ts`, `messages.ts`, `events.ts`)  
**Issue:** Some tables use `isActive`, others use soft delete patterns  
**Testing Note:** Verify soft deletes filter correctly in all queries

Example locations should filter:
```typescript
.withIndex("by_active", q => q.eq("isActive", true))
```

### 3.3 Index Usage Verification

**Concern:** Queries without `.withIndex()` cause full table scans  
**Files to Check:** All `convex/*.ts` files  
**Testing:** Monitor query performance with 1000+ records  
**Known Good:** Per docs, most queries use indexes correctly

---

## 4. UI/UX Potential Issues

### 4.1 Bilingual Validation Pattern

**Status:** Recently migrated from `||` to `&&` (Oct 25, 2025)  
**Testing Critical:** Verify forms accept single language input

**Old Pattern (WRONG):**
```typescript
if (!nameEn.trim() || !nameTh.trim()) {
  // Required BOTH languages
}
```

**New Pattern (CORRECT):**
```typescript
if (!nameEn.trim() && !nameTh.trim()) {
  // Requires AT LEAST ONE language
}
```

**Files to Test:**
- `components/notification-form.tsx`
- `components/location-form.tsx` (if exists)
- `components/student-form.tsx` (if exists)
- Any form with bilingual input

### 4.2 BilingualInput Component

**File:** `components/bilingual-input.tsx`  
**Feature:** 300ms debouncing for performance  
**Testing:** Type rapidly, verify no lag or lost characters  
**Expected:** Smooth input with 50% fewer re-renders

### 4.3 Time Display Bug (Fixed)

**Status:** FIXED per documentation  
**Testing:** Verify time shows immediately after class creation  
**Files:** `components/class-booking.tsx`, calendar components  
**Test Cases:**
- Create class at 14:30 → Should show "14:30" immediately
- Edit time → No drift to current time
- Refresh page → Time persists correctly

### 4.4 Provider Hierarchy (CRITICAL)

**File:** `app/layout.tsx`  
**Issue:** Provider order is load-bearing, cannot be reordered

```tsx
<ErrorBoundary>              // 1. Must be outermost
  <ConvexClientProvider>     // 2. DB connection
    <DeviceProvider>         // 3. Depends on Convex
      <DataProvider>         // 4. Shared data layer
        <LanguageProvider>   // 5. UI-only state
```

**Testing:** Verify no runtime errors related to context  
**DO NOT:** Reorder or remove any provider

### 4.5 Dark Mode Support

**Status:** Implemented with Tailwind v4  
**Testing:** Toggle dark mode, check all components  
**Watch for:** Text contrast issues, white flashes  
**Files:** All `.tsx` components should use dark mode classes

---

## 5. Real-time Updates (Convex)

### 5.1 useQuery Hook Patterns

**Files:** All components using Convex data  
**Potential Issue:** Stale data if not using reactive queries correctly

**Correct Pattern:**
```typescript
const classes = useQuery(api.classes.list, { schoolId });
// Auto-updates when data changes ✅
```

**Incorrect Pattern:**
```typescript
const classes = await fetch(...);  // Static, won't update ❌
```

**Testing:** Create class in one browser tab, verify it appears in another tab

### 5.2 Mutation Error Handling

**Pattern to Verify:**
```typescript
const bookClass = useMutation(api.classes.book);

try {
  await bookClass({ ... });
  toast.success(...);  // Must show success feedback
} catch (error) {
  toast.error(...);    // Must show error feedback
}
```

**Testing:** Trigger errors (invalid data, auth failures) and verify toast appears

---

## 6. Performance Concerns

### 6.1 N+1 Query Problem (Fixed)

**Status:** Fixed per Oct 2025 optimizations  
**Performance Gain:** 10-100x faster  
**Testing:** Load calendar with 100+ classes, check load time  
**Expected:** < 2 seconds for 100 classes

**Pattern to Verify (Batch Fetch):**
```typescript
// ✅ GOOD
const studentIds = [...new Set(classes.map(c => c.studentId))];
const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
const studentMap = new Map(students.map(s => [s._id, s]));

// ❌ BAD (should not exist anymore)
for (const classItem of classes) {
  const student = await ctx.db.get(classItem.studentId);  // N+1!
}
```

### 6.2 Rate Limiting

**Files:** `convex/rateLimit.ts`, `convex/classes.ts`, `convex/messages.ts`  
**Limits:**
- Class bookings: 30/min
- Messages: 20/min

**Testing:**
- Spam book classes → Should block after 30
- Spam send messages → Should block after 20
- Wait 1 minute → Should allow again

### 6.3 Pagination

**File:** `convex/pagination.ts`  
**Feature:** Native database pagination with cursors  
**Testing:** Load page with 10,000+ records  
**Expected:** First page loads < 1 second  
**Verify:** "Load More" button works correctly

---

## 7. Sangsom School Specific Issues

### 7.1 Seed Script Execution

**File:** `convex/seedSangsomProject.ts`  
**Potential Issue:** Multiple executions creating duplicates

**Protection:**
```typescript
const existing = await ctx.db
  .query("schools")
  .filter((q) => q.eq(q.field("name"), "Sangsom School"))
  .first();

if (existing) {
  // Use existing school ✅
}
```

**Testing:**
- Run `seedSangsomProject` twice
- Verify only one Sangsom School exists
- Verify no duplicate events created

### 7.2 Events vs Classes Confusion

**IMPORTANT:** Sangsom uses EVENTS, not CLASSES  
**Rationale:** No actual students, just schedule placeholders

**Testing:**
- Check `events` table, not `classes` table
- Verify events show in calendar (if integrated)
- Confirm no ghost classes for Sangsom schedule

### 7.3 Piglet Student Creation

**File:** `convex/testPigletStudent.ts` (NEW)  
**Dependencies:**
- Sangsom School must exist (run `seedSangsomProject` first)
- Teacher/moderator must exist in Sangsom School

**Potential Issues:**
1. School not found → Error with helpful message ✅
2. No creator found → Error with helpful message ✅
3. Duplicate Piglet → Returns existing student ✅

**Testing:**
- Run `createPigletStudent` before seeding → Should error
- Run `seedSangsomProject` → Then `createPigletStudent` → Success
- Run `createPigletStudent` again → Should return existing

---

## 8. Authorization & Access Control

### 8.1 Role-Based Access Matrix

| Action | Admin | Moderator | Teacher | Guardian |
|--------|-------|-----------|---------|----------|
| Delete past classes | ✅ | ❌ | ❌ | ❌ |
| Delete own future classes | ✅ | ✅ | ✅ | ❌ |
| Delete other's classes | ✅ | ✅ (same school) | ❌ | ❌ |
| Approve classes | ✅ | ✅ (same school) | ❌ | ❌ |
| Create users | ✅ | ❌ | ❌ | ❌ |
| View all students | ✅ | ❌ (school only) | ❌ (school only) | ❌ (own only) |

**Testing:** Verify each role respects boundaries

### 8.2 Backend Authorization Checks

**Critical:** UI hiding buttons is not enough, backend must verify

**Pattern to Verify:**
```typescript
export const deleteClass = mutation({
  handler: async (ctx, args) => {
    // 1. Get user
    const user = await ctx.db.get(args.userId);
    
    // 2. Get class
    const classItem = await ctx.db.get(args.classId);
    
    // 3. Authorization check
    if (user.role === "teacher" && classItem.teacherId !== user._id) {
      throw new Error("Unauthorized");  // ✅ Backend blocks
    }
    
    // 4. Date check
    if (user.role !== "admin" && classItem.scheduledDate < Date.now()) {
      throw new Error("Cannot delete past classes");  // ✅ Backend blocks
    }
    
    // 5. Perform action
    await ctx.db.delete(args.classId);
  }
});
```

**Testing:** Use DevTools Console to call mutations directly, bypassing UI

---

## 9. Toast Notification System

### 9.1 Toast Requirements

**Pattern:**
```typescript
toast.success("Message EN", "Message TH");
toast.error("Error EN", "Error TH");
toast.warning("Warning EN", "Warning TH");
toast.info("Info EN", "Info TH");
```

**Testing:**
- Every mutation should show toast feedback
- Success actions → Green toast
- Errors → Red toast
- Toasts auto-dismiss after ~5 seconds
- Can manually dismiss with X button
- Multiple toasts stack vertically

**Anti-pattern (should NOT exist):**
```typescript
alert("Class booked!");  // ❌ NEVER USE
confirm("Are you sure?");  // ❌ NEVER USE
```

### 9.2 Bilingual Toast Messages

**Testing:**
- Switch to Thai → Toasts show Thai message
- Switch to English → Toasts show English message
- Both messages provided in all toast calls

---

## 10. Specific Component Issues to Check

### 10.1 Class Booking Form

**File:** `components/class-booking.tsx`

**Potential Issues:**
- [ ] Student dropdown shows Piglet
- [ ] Multi-date selection works
- [ ] Optional fields truly optional
- [ ] Bilingual inputs accept single language
- [ ] Time input doesn't reset to current time
- [ ] Guardian-linked students auto-approve (bypass moderator)

### 10.2 Calendar Component

**Files:** Calendar-related components

**Potential Issues:**
- [ ] Classes show correct times immediately
- [ ] Quick edit buttons appear on desktop hover only
- [ ] Mobile view hides quick actions
- [ ] Status colors accurate (pending/acknowledged/approved/rejected)
- [ ] Clicking card opens detail modal
- [ ] Week navigation works

### 10.3 Student Creation Form

**Potential Issues:**
- [ ] Unique student ID generates correctly
- [ ] Grade and class dropdowns populated
- [ ] School filter works (teacher/moderator can only select own school)
- [ ] Form enables "Create" button when all required fields filled
- [ ] Bilingual fields optional (at least one language)

### 10.4 Edit Class Modal

**File:** `components/edit-class-modal.tsx`

**Potential Issues:**
- [ ] Pre-fills all fields correctly
- [ ] Date/time picker shows existing values
- [ ] Editing creates audit trail
- [ ] "Add More Dates" feature works
- [ ] Toast shows "Successfully added X date(s)!"
- [ ] No time drift when saving without changes

### 10.5 Teacher Cycle Editor

**File:** `components/teacher-cycle-editor.tsx`

**Potential Issues:**
- [ ] Nested modal has higher z-index (z-60 > z-50)
- [ ] Escape key only closes nested modal, not parent
- [ ] Confirmation flow for replacing existing cycle
- [ ] Auto-focus on first input field
- [ ] Active cycle indicator shows correct dates

---

## 11. Data Integrity Checks

### 11.1 Foreign Key Integrity (Soft)

Convex doesn't enforce foreign keys, so check manually:

**Orphaned Records to Check:**
- [ ] Students without valid schoolId
- [ ] Classes without valid studentId
- [ ] Classes without valid teacherId
- [ ] Messages without valid senderId/recipientId
- [ ] Notifications without valid userId

**Query to Test:**
```typescript
const students = await ctx.db.query("students").collect();
for (const student of students) {
  if (student.schoolId) {
    const school = await ctx.db.get(student.schoolId);
    if (!school) {
      console.error(`Orphaned student: ${student._id}`);
    }
  }
}
```

### 11.2 Index Coverage

**Verify all queries use indexes:**

```bash
# Search for queries without withIndex
grep -r "ctx.db.query" convex/ | grep -v "withIndex"
```

**Expected:** Only queries that intentionally scan full table (admin views)

---

## 12. Browser Compatibility

### 12.1 Supported Browsers

**Expected to Work:**
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+

**Known Issues:**
- IE 11: NOT SUPPORTED (Next.js 15 requirement)
- Safari < 14: Might have issues with Convex real-time

**Testing:**
- Test on at least 2 different browsers
- Check DevTools console for browser-specific errors

### 12.2 Mobile Browsers

**Testing Required:**
- iOS Safari
- Chrome Mobile
- Firefox Mobile

**Specific Checks:**
- Touch events work (no hover issues)
- Virtual keyboard doesn't obscure inputs
- Date/time pickers use native controls
- Responsive layout at 320px-480px width

---

## 13. Audit Logging

### 13.1 Actions That Should Be Logged

**File:** `convex/auditLogs.ts`, `convex/auditHelpers.ts`

**Should log:**
- User creation/deletion
- Password resets
- Bulk operations (bulk delete, bulk import)
- School management changes
- Security-sensitive actions

**Testing:**
- Perform admin action → Check audit log created
- Verify audit log shows username, action, timestamp
- Check audit log export functionality

### 13.2 Audit Log Viewer

**File:** `components/audit-logs.tsx`

**Features to Test:**
- Filter by user
- Filter by action type
- Filter by date range
- Export to CSV
- Statistics dashboard

---

## 14. Help System

### 14.1 Help Window

**Status:** Implemented (Oct 2025)

**Features to Test:**
- [ ] Green "Help" button visible in header
- [ ] Modal opens on click
- [ ] 20+ features documented
- [ ] Bilingual content (EN/TH)
- [ ] Role-based filtering (teachers see teacher features)
- [ ] Expandable categories
- [ ] Close button works
- [ ] Escape key closes modal

### 14.2 Content Accuracy

**Verify:**
- Instructions match actual UI
- Screenshots (if any) are current
- Links work (if any)
- No outdated information

---

## 15. Known Good Patterns (Don't Break)

### 15.1 Session Management

**File:** `lib/session-utils.ts`

**Features:**
- 24-hour auto-expiration ✅
- Auto-extension on activity ✅
- Logout clears session ✅

**DO NOT:**
- Change expiration logic
- Remove auto-extension
- Break logout function

### 15.2 Unique Student ID Format

**Pattern:** `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`  
**Example:** `SANG-PIPO-abc123-XY4Z`

**DO NOT:**
- Change format (breaks existing IDs)
- Remove any component
- Make it non-deterministic

### 15.3 Class Booking State Machine

**Flow:**
```
Teacher books → "pending"
  ↓
Moderator acknowledges → "acknowledged"
  ↓
Moderator approves/rejects → "approved"/"rejected"

EXCEPTION: isGuardianLinked: true → auto-approve
```

**DO NOT:**
- Skip acknowledge step
- Allow backward transitions
- Break guardian auto-approve

---

## 16. Testing Priorities

### Priority 1 (MUST TEST)
1. ✅ Piglet student creation and verification
2. ✅ Three account types (admin, moderator, teacher)
3. ✅ Class booking workflow end-to-end
4. ✅ Authentication and authorization
5. ✅ Bilingual functionality

### Priority 2 (SHOULD TEST)
6. ✅ Real-time updates (Convex reactivity)
7. ✅ Toast notifications
8. ✅ Calendar view and navigation
9. ✅ Student management
10. ✅ Location management

### Priority 3 (NICE TO TEST)
11. Analytics and reporting
12. Help system
13. Audit logging
14. Message system
15. Performance under load

---

## 17. Expected Errors (Not Bugs)

### 17.1 Development-Only Features

**These are known and acceptable in development:**

1. **Password hashing with btoa()**
   - Message: "NOT production-ready"
   - Fix: Documented as TODO for production
   - Don't report as bug

2. **localStorage for sessions**
   - Message: "XSS risk"
   - Fix: Documented as TODO for production
   - Don't report as bug

3. **ESLint warnings for unused variables**
   - Severity: Minor
   - Impact: None
   - Fix: Code cleanup, not critical

### 17.2 Expected Validation Errors

**These should trigger and are correct:**

1. "Unauthorized: Cannot create students for other schools"
   - When teacher tries cross-school action
   
2. "Cannot delete classes whose dates have already passed"
   - When non-admin tries to delete past class
   
3. "Account locked. Try again later or contact admin."
   - After 5 failed login attempts
   
4. "Please provide name in at least one language"
   - When both bilingual fields empty

---

## 18. Success Criteria

### Must Pass
- [x] No critical errors in console
- [ ] Piglet student exists and works
- [ ] All 3 account types login successfully
- [ ] Class booking workflow completes
- [ ] Bilingual switching works
- [ ] Toast notifications appear
- [ ] No data loss or corruption

### Should Pass
- [ ] No major errors in console
- [ ] Help system accessible
- [ ] Real-time updates work
- [ ] Authorization boundaries respected
- [ ] Mobile view functional

### Nice to Have
- [ ] No minor warnings
- [ ] Perfect responsive layout
- [ ] All features documented
- [ ] Performance metrics hit targets

---

## 19. Test Execution Workflow

1. **Setup Phase**
   - Start Convex: `npx convex dev`
   - Start Next.js: `npm run dev`
   - Initialize database
   - Run `seedSangsomProject`
   - Run `createPigletStudent`

2. **Static Analysis Phase**
   - Run linter: `npm run lint`
   - Review this document
   - Check for known issues

3. **Manual Testing Phase**
   - Execute COMPREHENSIVE_TEST_EXECUTION_PLAN.md
   - Document all errors found
   - Take screenshots

4. **Bug Fix Phase**
   - Fix critical errors first
   - Fix major errors second
   - Fix minor issues if time

5. **Verification Phase**
   - Re-test fixed bugs
   - Run full regression suite
   - Final sign-off

---

## 20. Known Areas of Complexity

### 20.1 Multi-Date Class Booking

**Complexity:** Creates multiple class records from single form submission  
**Watch for:**
- Transaction-like behavior (all or nothing)
- Duplicate detection
- Proper toast message count

### 20.2 Edit Audit Trail

**Complexity:** Tracks every field change with before/after values  
**Watch for:**
- Null/undefined handling
- Bilingual field changes
- Performance with large edit history

### 20.3 Teacher ClassCount Cycles

**Complexity:** Nested modal with confirmation flow  
**Watch for:**
- Modal z-index conflicts
- Escape key event bubbling
- Date range validation
- Existing cycle replacement logic

---

## TESTING CHECKLIST SUMMARY

**Before Starting:**
- [ ] Read this document completely
- [ ] Review COMPREHENSIVE_TEST_EXECUTION_PLAN.md
- [ ] Understand known limitations (btoa, localStorage)
- [ ] Set up test environment

**During Testing:**
- [ ] Follow test plan systematically
- [ ] Document every error with screenshots
- [ ] Classify errors by severity
- [ ] Test all 3 account types
- [ ] Verify Piglet student works

**After Testing:**
- [ ] Compile error list
- [ ] Fix critical and major errors
- [ ] Re-test all fixes
- [ ] Create final test report
- [ ] Take before/after screenshots

---

**Document Status:** Ready for Testing  
**Last Updated:** October 25, 2025  
**Next Review:** After test execution
