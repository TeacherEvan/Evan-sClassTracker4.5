# Feature Implementation Plan

## Status Review: Current Implementation

### ✅ Already Implemented

1. **Cancel Class Request** - Fully functional
   - Backend: `convex/cancellationRequests.ts` with complete CRUD operations
   - Frontend: `components/class-booking.tsx` with teacher UI
   - Status: Teachers can request cancellation, moderators can approve/reject
   - Schema: `cancellationRequests` table with indexes

2. **Teacher's Helper** - Fully functional
   - Available to ALL users (teachers, moderators, admins, guardians)
   - Component: `components/teacher-helper.tsx` and `teacher-helper-admin.tsx`
   - Status: Working as designed

---

## New Features to Implement

### 1. Add Student During Class Request ✨ **NEW**

**User Story**: Teachers can create new students inline while booking a class instead of navigating to separate student management tab.

**Implementation**:

- **Component**: `components/class-booking.tsx`
- **Changes**:
  - Add "Create New Student" button in class booking form
  - Toggle between "Select Existing Student" and "Create New Student" modes
  - Inline student creation form with all required fields
  - Auto-select newly created student after creation
  
**Backend** (already supports this):

- `api.students.create` mutation exists
- No backend changes needed

**UI Flow**:

```
1. Teacher clicks "Book Class"
2. Options: [Select Existing Student] [+ Create New Student]
3. If Create New:
   - Show inline form (firstName, lastName, grade, school/guardian selection)
   - Submit creates student
   - Auto-selects new student in booking form
4. Continue with existing class booking flow
```

---

### 2. Guardian Location Type ✨ **NEW**

**User Story**: Teachers can link students to "Guardian" location instead of school, bypassing moderator approval workflow for personal tutoring arrangements.

**Implementation**:

**Schema Changes** (`convex/schema.ts`):

```typescript
classes: {
  // Add new field
  guardianTitle: v.optional(v.string()), // Description of guardian relationship
  isGuardianLinked: v.optional(v.boolean()), // Flag for guardian-linked classes
}

locations: {
  // Add new type
  type: v.union(
    v.literal("school"),     // Existing
    v.literal("guardian")    // NEW - indicates guardian location
  ),
  // Guardian locations don't need moderator approval
}
```

**Backend Changes**:

- `convex/classes.ts`:
  - Modify `book` mutation to accept `guardianTitle` parameter
  - Auto-approve classes when `isGuardianLinked: true` (skip moderator workflow)
  - Create notification to teacher only (no moderator notification)

- `convex/locations.ts`:
  - Add "Guardian" location to each school automatically
  - Filter: Guardian locations visible to all teachers

**Frontend Changes**:

- `components/class-booking.tsx`:
  - When "Guardian" location selected → show `guardianTitle` text input
  - Bilingual inputs: "Guardian Title (English)" / "Guardian Title (Thai)"
  - Placeholder: "e.g., Parent, Private Tutor, Homeschool Coordinator"

**Workflow**:

```
NORMAL CLASS:
Teacher books → pending → Moderator acknowledges → Moderator approves → approved

GUARDIAN CLASS:
Teacher books with guardianTitle → auto-approved (no moderator involved)
```

---

### 3. Remove Teacher's Helper from Moderator Dashboard ✨ **NEW**

**User Story**: Moderators should not see Teacher's Helper tab to reduce UI clutter.

**Implementation**:

- **File**: `app/page.tsx`
- **Change**: Add role check to hide tab for moderators
- **Current**: Tab visible to all users
- **New**: Hide from moderators only

```tsx
{/* Teacher's Helper tab - hide from moderators */}
{user.role !== "moderator" && (
  <button onClick={() => setActiveTab("resources")}>
    {t("Teacher's Helper", "ผู้ช่วยครู")}
  </button>
)}
```

---

### 4. 30-Day Calendar Picker for Class Booking ✨ **NEW**

**User Story**: Both teachers and moderators should see a visual 30-day calendar when selecting class dates instead of just date input field.

**Implementation**:

**New Component**: `components/month-calendar-picker.tsx`

- Display full month grid view
- Highlight today
- Click to select date
- Show selected date with visual indicator
- Bilingual month/day names

**Integration Points**:

1. **Teacher class booking form** (`components/class-booking.tsx`)
2. **Moderator class approval view** (`components/moderator-list-view.tsx`)
3. **Weekly calendar view** (`components/weekly-calendar.tsx`)

**Existing**: `components/calendar-picker.tsx` (7-day week view)
**New**: `components/month-calendar-picker.tsx` (30-day month view)

**UI Enhancement**:

```tsx
// Replace current date input with calendar toggle
<button onClick={() => setShowMonthCalendar(!showMonthCalendar)}>
  <Calendar /> {selectedDate ? formatDate(selectedDate) : "Select Date"}
</button>

{showMonthCalendar && (
  <MonthCalendarPicker
    selectedDate={selectedDate}
    onSelectDate={(date) => {
      setSelectedDate(date);
      setShowMonthCalendar(false);
    }}
  />
)}
```

---

### 5. Teacher-Proposed Locations with Moderator Approval ✨ **NEW**

**User Story**: Teachers can suggest new locations when booking classes. Moderators review and approve these during class acknowledgement, which permanently adds them to the location options.

**Schema Changes** (`convex/schema.ts`):

```typescript
classes: {
  // Already exists:
  pendingLocationName: v.optional(v.string()),
  pendingLocationNameTh: v.optional(v.string()),
  
  // Add status tracking
  locationApprovalStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected")
  )),
}
```

**Backend Changes**:

`convex/classes.ts`:

- Modify `acknowledge` mutation:
  - Check if class has `pendingLocationName`
  - If yes, show moderator approval UI
  - Add `approveLocation` mutation parameter

- New mutation: `approveClassLocation`:

  ```typescript
  export const approveClassLocation = mutation({
    args: {
      classId: v.id("classes"),
      approved: v.boolean(),
    },
    handler: async (ctx, args) => {
      const classDoc = await ctx.db.get(args.classId);
      
      if (args.approved && classDoc.pendingLocationName) {
        // Create permanent location
        const locationId = await ctx.db.insert("locations", {
          schoolId: classDoc.schoolId,
          name: classDoc.pendingLocationName,
          nameTh: classDoc.pendingLocationNameTh,
          type: "school",
          isActive: true,
          createdAt: Date.now(),
        });
        
        // Update class with approved location
        await ctx.db.patch(args.classId, {
          locationId,
          locationApprovalStatus: "approved",
        });
      } else {
        await ctx.db.patch(args.classId, {
          locationApprovalStatus: "rejected",
        });
      }
    },
  });
  ```

**Frontend Changes**:

`components/moderator-list-view.tsx`:

- Show pending location in class details
- Add approval buttons: "Approve Location" / "Reject Location"
- After approval, location appears in school's location list

**Workflow**:

```
1. Teacher books class → Selects "Request New Location"
2. Enters location name (English + Thai)
3. Moderator acknowledges class → Sees pending location request
4. Moderator clicks "Approve Location" → Creates permanent location
5. Location now appears in dropdown for all teachers at that school
```

---

### 6. Unread Message Indicator (Pulsating Red) ✨ **NEW**

**User Story**: Users should immediately notice unread messages with a bright, pulsating red indicator.

**Implementation**:

**CSS Animation** (`app/globals.css`):

```css
@keyframes pulse-red {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.pulse-red {
  animation: pulse-red 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: #ef4444; /* Tailwind red-500 */
  color: white;
}
```

**Component Changes** (`components/messaging-hub.tsx`):

```tsx
{/* Message tab button */}
<button className={`relative ${activeTab === "messages" ? "..." : "..."}`}>
  <MessageSquare />
  {t("Messages", "ข้อความ")}
  
  {/* Unread count badge */}
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 pulse-red rounded-full px-2 py-1 text-xs font-bold">
      {unreadCount}
    </span>
  )}
</button>
```

**Also Apply To**:

- Main navigation "Messages" tab in `app/page.tsx`
- Conversation list items with unread messages
- Group chat indicators

---

### 7. Admin Delete Notifications & Messages ✨ **NEW**

**User Story**: Admins need ability to delete inappropriate or outdated notifications and messages.

**Backend Changes**:

`convex/notifications.ts`:

```typescript
export const deleteNotification = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();
    
    if (user?.role !== "admin") {
      throw new Error("Only admins can delete notifications");
    }
    
    await ctx.db.delete(args.id);
  },
});
```

`convex/messages.ts`:

```typescript
export const deleteMessage = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    // Same admin check
    // ...
    await ctx.db.delete(args.id);
  },
});
```

**Frontend Changes**:

`components/notification-list.tsx`:

```tsx
{user.role === "admin" && (
  <button
    onClick={() => deleteNotification({ id: notification._id })}
    className="text-red-600 hover:text-red-800"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
```

`components/messaging-hub.tsx`:

```tsx
{currentUser.role === "admin" && (
  <button
    onClick={() => deleteMessage({ id: message._id })}
    className="text-red-600 hover:text-red-800"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
```

---

### 8. Admin/Mod Edit & Delete Classes with Notifications ✨ **NEW**

**User Story**: Admins and moderators can edit or delete classes, with affected teachers automatically notified.

**Backend Changes**:

`convex/classes.ts`:

```typescript
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    scheduledDate: v.optional(v.number()),
    studentId: v.optional(v.id("students")),
    locationId: v.optional(v.id("locations")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin/moderator role
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();
    
    if (!user || !["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can edit classes");
    }
    
    const classDoc = await ctx.db.get(args.classId);
    if (!classDoc) throw new Error("Class not found");
    
    // Update class
    const { classId, ...updates } = args;
    await ctx.db.patch(classId, updates);
    
    // Create notification to teacher
    const teacher = await ctx.db.get(classDoc.teacherId);
    const student = await ctx.db.get(classDoc.studentId);
    
    await ctx.db.insert("notifications", {
      userId: classDoc.teacherId,
      title: "Class Updated",
      titleTh: "มีการอัปเดตคลาส",
      message: `Your class with ${student?.firstName} ${student?.lastName} has been updated by ${user.username}`,
      messageTh: `คลาสของคุณกับ ${student?.firstName} ${student?.lastName} ถูกอัปเดตโดย ${user.username}`,
      type: "info",
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const deleteClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    // Same auth check
    // ...
    
    const classDoc = await ctx.db.get(args.classId);
    if (!classDoc) throw new Error("Class not found");
    
    // Create notification before deleting
    await ctx.db.insert("notifications", {
      userId: classDoc.teacherId,
      title: "Class Deleted",
      titleTh: "ลบคลาสแล้ว",
      message: `A class has been deleted by administrator`,
      messageTh: `คลาสถูกลบโดยผู้ดูแลระบบ`,
      type: "warning",
      read: false,
      createdAt: Date.now(),
    });
    
    // Delete class
    await ctx.db.delete(args.classId);
  },
});
```

**Frontend Changes**:

`components/moderator-list-view.tsx`:

```tsx
{/* For each class */}
<div className="flex gap-2">
  <button onClick={() => setEditingClass(classItem)}>
    <Edit className="w-4 h-4" />
    {t("Edit", "แก้ไข")}
  </button>
  
  <button onClick={() => handleDeleteClass(classItem._id)}>
    <Trash2 className="w-4 h-4" />
    {t("Delete", "ลบ")}
  </button>
</div>

{/* Edit modal */}
{editingClass && (
  <EditClassModal
    classData={editingClass}
    onSave={handleUpdateClass}
    onClose={() => setEditingClass(null)}
  />
)}
```

---

## Implementation Order

### Phase 1: Quick Wins (1-2 hours)

1. ✅ Remove Teacher's Helper from moderator dashboard
2. ✅ Add unread message pulsating indicator
3. ✅ Update copilot instructions

### Phase 2: Medium Complexity (2-3 hours)

4. ✅ Add student creation during class request
5. ✅ Admin delete notifications/messages
6. ✅ 30-day calendar picker component

### Phase 3: Complex Features (3-4 hours)

7. ✅ Guardian location type with auto-approval
8. ✅ Teacher-proposed locations with moderator approval
9. ✅ Admin/mod edit & delete classes with notifications

### Phase 4: Testing & Deployment (1 hour)

10. ✅ Comprehensive testing of all features
11. ✅ Commit and push to main
12. ✅ Update all documentation

---

## Testing Checklist

### Feature 1: Add Student During Class Request

- [ ] Teacher can toggle "Create New Student" in booking form
- [ ] Inline form validates all required fields
- [ ] Newly created student auto-selects in booking form
- [ ] Bilingual validation messages work
- [ ] Student appears in student management tab after creation

### Feature 2: Guardian Location

- [ ] "Guardian" location appears in school dropdown
- [ ] Guardian title input appears when Guardian selected
- [ ] Guardian-linked classes skip moderator approval
- [ ] Only teacher receives notification (not moderator)
- [ ] Classes marked as `isGuardianLinked: true`

### Feature 3: Hide Teacher's Helper from Moderators

- [ ] Moderators don't see Teacher's Helper tab
- [ ] Teachers see Teacher's Helper tab
- [ ] Admins see Teacher's Helper tab
- [ ] Guardians see Teacher's Helper tab

### Feature 4: 30-Day Calendar

- [ ] Calendar displays current month
- [ ] Today is highlighted
- [ ] Click on date selects it
- [ ] Selected date has visual indicator
- [ ] Bilingual month/day names display correctly
- [ ] Integrates with class booking form
- [ ] Works on mobile/tablet/desktop

### Feature 5: Teacher-Proposed Locations

- [ ] Teacher can request new location in booking form
- [ ] Moderator sees pending location during acknowledgement
- [ ] Moderator can approve/reject location
- [ ] Approved location appears in school's location list
- [ ] Rejected location doesn't create permanent entry
- [ ] Teacher receives notification of approval/rejection

### Feature 6: Unread Message Indicator

- [ ] Red pulsating badge appears on Messages tab when unread
- [ ] Badge shows correct unread count
- [ ] Badge disappears when all messages read
- [ ] Animation is smooth and not distracting
- [ ] Works in light and dark mode

### Feature 7: Admin Delete Notifications/Messages

- [ ] Admin sees delete button on notifications
- [ ] Admin sees delete button on messages
- [ ] Non-admin users don't see delete buttons
- [ ] Delete confirmation modal appears
- [ ] Deleted items remove from UI immediately
- [ ] Backend prevents non-admin deletion attempts

### Feature 8: Admin/Mod Edit/Delete Classes

- [ ] Admin/moderator sees edit/delete buttons on classes
- [ ] Teachers don't see edit/delete buttons
- [ ] Edit modal populates with current class data
- [ ] Saving edits updates class and notifies teacher
- [ ] Delete confirmation modal appears
- [ ] Deleted class notifies teacher
- [ ] Bilingual notifications work correctly

---

## Files to Modify

### Backend (Convex)

- ✅ `convex/schema.ts` - Add new fields
- ✅ `convex/classes.ts` - Guardian auto-approval, location approval, edit/delete mutations
- ✅ `convex/locations.ts` - Guardian location type, auto-create Guardian location
- ✅ `convex/notifications.ts` - Admin delete mutation
- ✅ `convex/messages.ts` - Admin delete mutation

### Frontend (Components)

- ✅ `components/class-booking.tsx` - Inline student creation, guardian title input, 30-day calendar
- ✅ `components/moderator-list-view.tsx` - Location approval UI, edit/delete class buttons
- ✅ `components/messaging-hub.tsx` - Unread indicator, admin delete button
- ✅ `components/notification-list.tsx` - Admin delete button
- ✅ `components/month-calendar-picker.tsx` - **NEW FILE**
- ✅ `app/page.tsx` - Hide Teacher's Helper from moderators, unread message badge

### Styling

- ✅ `app/globals.css` - Pulsating red animation

### Documentation

- ✅ `.github/copilot-instructions.md` - Document all new features and workflows

---

## Risk Assessment

### Low Risk

- Remove Teacher's Helper from moderator view
- Unread message indicator
- Admin delete notifications/messages

### Medium Risk

- Add student during class request (UI complexity)
- 30-day calendar picker (responsive design)
- Teacher-proposed locations (workflow complexity)

### Higher Risk

- Guardian location type (workflow changes, auto-approval logic)
- Admin/mod edit classes (notification system, data integrity)

### Mitigation Strategies

1. **Thorough testing** at each phase before moving to next
2. **Backup database** before deploying to production
3. **Feature flags** for complex features (can disable if issues)
4. **Gradual rollout** - test with small group of users first
5. **Comprehensive error handling** with bilingual error messages

---

## Deployment Strategy

### Pre-Deployment

1. Run `npm run build` locally to catch TypeScript errors
2. Test all features in development environment
3. Review all database migrations/schema changes
4. Backup production database

### Deployment Steps

1. Commit all changes with detailed commit message
2. Push to main branch
3. Monitor Vercel deployment logs
4. Run `npx convex deploy` to deploy backend
5. Test critical paths in production
6. Monitor error logs for 24 hours

### Rollback Plan

If critical issues arise:

1. Revert git commit: `git revert HEAD`
2. Push revert: `git push origin main`
3. Redeploy previous Convex version
4. Investigate issues in development
5. Fix and redeploy

---

## Success Metrics

### Feature Adoption

- % of teachers using inline student creation
- % of classes using Guardian location
- Number of teacher-proposed locations approved
- Message read rates (with new indicator)

### System Health

- No increase in error rates
- Page load times remain < 2 seconds
- Mobile responsiveness maintained
- Database query performance stable

### User Satisfaction

- Reduced clicks to book a class
- Faster moderator approval workflows
- Improved message engagement
- Positive user feedback

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Get approval** for schema changes
3. **Start Phase 1** implementation
4. **Iterate based on feedback**
5. **Document lessons learned**
