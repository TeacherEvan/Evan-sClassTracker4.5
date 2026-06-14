# Quick Start Testing Guide

## 🚀 How to Test New Features

### Prerequisites

```powershell
cd "c:\Users\User\OneDrive\Documents\Vs2\Evan'sClassTracker4.5\Evan-sClassTracker4.5"
npx convex dev    # Terminal 1 - Backend
npm run dev       # Terminal 2 - Frontend
```

Open: `http://localhost:3001`

---

## Feature 1: Teacher Helper Hidden (Moderator View)

**Test Steps:**

1. Login as **moderator** user
2. Check navigation tabs
3. ✅ **Expected:** "Teacher's Helper" tab is NOT visible
4. Login as **teacher** user
5. ✅ **Expected:** "Teacher's Helper" tab IS visible

**Pass Criteria:** Moderators don't see the tab, teachers do.

---

## Feature 2: Unread Message Indicator

**Test Steps:**

1. Login as **User A** (teacher)
2. Send direct message to **User B**
3. Logout and login as **User B**
4. ✅ **Expected:** Red pulsating badge on "Messages" tab
5. Badge shows number count (e.g., "1")
6. Click Messages tab and read message
7. ✅ **Expected:** Badge disappears after reading

**Pass Criteria:** Badge appears, pulses, shows count, disappears when read.

---

## Feature 3: Admin Delete Notifications

**Test Steps:**

1. Login as **admin** user
2. Navigate to Notifications tab
3. ✅ **Expected:** Red Trash2 icon next to each notification
4. Click trash icon
5. ✅ **Expected:** Confirmation dialog appears
6. Confirm deletion
7. ✅ **Expected:** Notification removed from list
8. Login as **teacher** user
9. ✅ **Expected:** Only gray X button (no delete option)

**Pass Criteria:** Admin sees delete button, teacher doesn't, deletion works.

---

## Feature 4: Inline Student Creation

**Test Steps:**

1. Login as **teacher** user
2. Navigate to "Book Class" tab
3. Click **"Create New Student"** toggle button
4. ✅ **Expected:** Inline form appears (blue highlighted box)
5. Fill in:
   - First Name: "John"
   - Last Name: "Doe"
   - Grade: "Grade 5"
   - School: Select from dropdown
6. Click **"Create Student"** button
7. ✅ **Expected:** Student created and auto-selected
8. ✅ **Expected:** Toggle returns to "Select Existing" mode
9. Complete class booking normally

**Pass Criteria:** Student creation works inline, auto-selects, no page navigation.

---

## Feature 5: Guardian Location Auto-Approval

### Setup (Admin/Moderator)

1. Navigate to **Location Management**
2. Create new location:
   - Name: "John's Home"
   - Type: **Guardian** (select from dropdown)
   - School: Select parent school
3. Save location

### Test (Teacher)

1. Login as **teacher** user
2. Navigate to **Book Class**
3. Select school that has guardian location
4. Select **"John's Home"** location
5. ✅ **Expected:** "Guardian Title" input field appears
6. ✅ **Expected:** Blue info text: "Classes at guardian's home are auto-approved"
7. Enter guardian title: "Mom"
8. Fill rest of form (student, date)
9. Submit booking
10. ✅ **Expected:** Class immediately shows status "approved"
11. ✅ **Expected:** NO notification sent to moderators

### Verify (Moderator)

1. Login as **moderator**
2. Check pending classes
3. ✅ **Expected:** Guardian-linked class NOT in pending queue

**Pass Criteria:** Guardian classes auto-approved, skip moderator queue, guardian title required.

---

## Feature 6: Admin Edit/Delete Classes (Backend Only)

**Note:** Frontend UI not yet implemented. Test via Convex Dashboard.

### Test Update Class

1. Open Convex Dashboard: `http://localhost:3001/_convex`
2. Navigate to **Functions** → **classes** → **updateClass**
3. Call mutation with params:

   ```json
   {
     "classId": "<existing-class-id>",
     "scheduledDate": 1740000000000
   }
   ```

4. ✅ **Expected:** Class updated
5. Check teacher notifications
6. ✅ **Expected:** Teacher received "Class Updated" notification

### Test Delete Class

1. In Convex Dashboard: **classes** → **deleteClass**
2. Call mutation:

   ```json
   {
     "classId": "<existing-class-id>"
   }
   ```

3. ✅ **Expected:** Class deleted
4. Check teacher notifications
5. ✅ **Expected:** Teacher received "Class Deleted" notification BEFORE deletion

**Pass Criteria:** Mutations work, teacher notified with student name and admin username.

---

## Feature 7: Month Calendar Picker (Component Ready)

**Note:** Component exists but not yet integrated into forms.

**Manual Test:**

1. Open `components/month-calendar-picker.tsx`
2. Import into test page
3. Render with props:

   ```tsx
   <MonthCalendarPicker selectedDate={new Date()} onDateSelect={(date) => console.log(date)} />
   ```

4. ✅ **Expected:** Calendar renders with current month
5. Click arrows to navigate months
6. ✅ **Expected:** Month changes
7. Click date
8. ✅ **Expected:** Date highlighted, console logs selected date
9. Click today
10. ✅ **Expected:** Today has blue background

**Pass Criteria:** Calendar navigates, selects dates, highlights today and selection.

---

## Feature 8: Admin Delete Messages (Backend Only)

**Test via Convex Dashboard:**

1. Open Convex Dashboard
2. Navigate to **messages** → **deleteMessage**
3. Call with message ID:

   ```json
   {
     "messageId": "<existing-message-id>"
   }
   ```

4. ✅ **Expected:** Message deleted
5. Try as **teacher** user
6. ✅ **Expected:** Error "Unauthorized"

**Pass Criteria:** Admin can delete, teachers cannot.

---

## Regression Tests

### Verify Existing Features Still Work

**1. Normal Class Booking (School Location):**

- [ ] Teacher can book class at school location
- [ ] Moderator receives notification
- [ ] Moderator can approve/reject
- [ ] Teacher receives status notification

**2. Location Request:**

- [ ] Teacher can request new location
- [ ] Moderator sees pending location
- [ ] Moderator can approve/reject

**3. Student Management:**

- [ ] Can view students list
- [ ] Can edit existing student
- [ ] Can search students

**4. Messages:**

- [ ] Can send direct message
- [ ] Can send group message
- [ ] Messages appear in real-time

**5. Notifications:**

- [ ] Notifications created for class approvals
- [ ] Notifications dismissed correctly
- [ ] Notification types display correct colors

---

## Mobile Testing Checklist

**Responsive UI:**

- [ ] Inline student creation form readable on mobile
- [ ] Guardian title input accessible
- [ ] Unread badge visible on small screens
- [ ] Month calendar touch interactions work
- [ ] Toggle buttons tap correctly
- [ ] Confirmation dialogs readable

**Touch Targets:**

- [ ] All buttons > 44px tap target
- [ ] Form inputs easy to focus
- [ ] Scrolling smooth
- [ ] No horizontal overflow

---

## Performance Checks

**Database Queries:**

- [ ] Unread count query fast (< 100ms)
- [ ] Student creation doesn't block UI
- [ ] Calendar picker renders quickly
- [ ] Guardian location detection instant

**Network:**

- [ ] Check Convex DevTools for mutation timing
- [ ] Verify optimistic updates work
- [ ] No excessive re-renders

---

## Known Issues to Watch For

1. **TypeScript cached errors:** If IDE shows errors after build succeeds, reload VS Code
2. **Convex must run first:** Start `npx convex dev` before `npm run dev`
3. **Guardian location type:** Must be created via location management before testing
4. **Calendar picker:** Not yet integrated, component standalone ready

---

## Success Criteria Summary

✅ **All 8 features tested**  
✅ **No breaking changes to existing features**  
✅ **Bilingual UI works (English/Thai)**  
✅ **Role-based permissions enforced**  
✅ **Mobile responsive**  
✅ **No console errors**  
✅ **Build passes without TypeScript errors**

---

## Troubleshooting

**Badge doesn't pulse:**

- Check `app/globals.css` has `@keyframes pulse-red`
- Verify `.pulse-red` class applied
- Clear browser cache

**Guardian title doesn't show:**

- Ensure location has `type: "guardian"` in database
- Check location query returns type field
- Verify `isGuardianLocation` computed correctly

**Student creation fails:**

- Check `createdBy` parameter included
- Verify teacher is authenticated
- Check Convex logs for error details

**Admin delete fails:**

- Confirm user role is "admin"
- Check backend mutation has role verification
- Verify notificationId/messageId valid

---

_Test execution time: ~30 minutes for full suite_  
_Critical path: Features 1-5 (user-facing UI changes)_
