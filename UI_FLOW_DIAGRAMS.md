# UI Flow Diagrams

## Feature 1: Inline Student Creation (Already Complete)

```
┌─────────────────────────────────────────────────────────┐
│          Book Class Form (Teacher View)                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Student Name                    [+ Create New]  ←──┐  │
│  ┌───────────────────────────────────────────┐      │  │
│  │ Select a student                          │      │  │
│  │ - John Doe                               │      │  │
│  │ - Jane Smith                             │      │  │
│  └───────────────────────────────────────────┘      │  │
│                                                     │  │
│  School                                             │  │
│  ┌───────────────────────────────────────────┐      │  │
│  │ ABC School                               │      │  │
│  └───────────────────────────────────────────┘      │  │
│                                                     │  │
└─────────────────────────────────────────────────────┘  │
                                                         │
         User clicks "+ Create New" ────────────────────┘
                                                         
┌─────────────────────────────────────────────────────────┐
│          Book Class Form (Creating Student)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Student Name               [← Select Existing]  ←──┐  │
│  ┌──────────────────────────────────────────────┐    │  │
│  │ ╔════════════════════════════════════════╗  │    │  │
│  │ ║ First Name                             ║  │    │  │
│  │ ║ ┌────────────────────────────────────┐ ║  │    │  │
│  │ ║ │ John                               │ ║  │    │  │
│  │ ║ └────────────────────────────────────┘ ║  │    │  │
│  │ ║                                        ║  │    │  │
│  │ ║ Last Name                              ║  │    │  │
│  │ ║ ┌────────────────────────────────────┐ ║  │    │  │
│  │ ║ │ Wilson                             │ ║  │    │  │
│  │ ║ └────────────────────────────────────┘ ║  │    │  │
│  │ ║                                        ║  │    │  │
│  │ ║ Grade                                  ║  │    │  │
│  │ ║ ┌────────────────────────────────────┐ ║  │    │  │
│  │ ║ │ Grade 5                            │ ║  │    │  │
│  │ ║ └────────────────────────────────────┘ ║  │    │  │
│  │ ║                                        ║  │    │  │
│  │ ║ School                                 ║  │    │  │
│  │ ║ ┌────────────────────────────────────┐ ║  │    │  │
│  │ ║ │ ABC School                         │ ║  │    │  │
│  │ ║ └────────────────────────────────────┘ ║  │    │  │
│  │ ║                                        ║  │    │  │
│  │ ║ [✓ Create & Select Student]            ║  │    │  │
│  │ ╚════════════════════════════════════════╝  │    │  │
│  └──────────────────────────────────────────────┘    │  │
│        ↑ Blue highlighted box                        │  │
│                                                       │  │
│                                                       │  │
└───────────────────────────────────────────────────────┘  │
                                                           │
         User clicks "Create & Select Student" ───────────┘
                                                           
┌─────────────────────────────────────────────────────────┐
│          Book Class Form (Student Auto-Selected)        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Student Name                    [+ Create New]        │
│  ┌───────────────────────────────────────────┐         │
│  │ John Wilson                    ←──────────┼────┐    │
│  │ - Jane Smith                              │    │    │
│  └───────────────────────────────────────────┘    │    │
│                ↑ Newly created student selected   │    │
│                                                   │    │
│  [Alert: "Student created successfully!" ✓]       │    │
│                                                   │    │
│  Continue with rest of booking form...           │    │
│                                                   │    │
└───────────────────────────────────────────────────┘    │
                                                         │
         Flow continues to complete booking ─────────────┘
```

---

## Feature 2: Moderator Class Editing (Newly Implemented)

```
┌─────────────────────────────────────────────────────────┐
│         Class Item (Moderator/Admin View)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  John Doe                            [Approved]        │
│  Location: ABC School - Room 101                       │
│  Scheduled: 2025-01-20 10:00 AM                        │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  [Edit Class]  [Delete Class]  ←─────────────────┐     │
│     ↑ Blue       ↑ Red                           │     │
│                                                  │     │
│  Teacher will be notified of any changes         │     │
│                                                  │     │
└──────────────────────────────────────────────────┘     │
                                                         │
         User clicks "Edit Class" ───────────────────────┘
                                                         
┌─────────────────────────────────────────────────────────┐
│         Class Item (Edit Mode)                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  John Doe                            [Approved]        │
│  Location: ABC School - Room 101                       │
│  Scheduled: 2025-01-20 10:00 AM                        │
│                                                         │
│  ─────────────────────────────────────────────────     │
│                                                         │
│  ╔══════════════════════════════════════════════════╗  │
│  ║  📝 Edit Class Details                           ║  │
│  ║                                                  ║  │
│  ║  Student                                         ║  │
│  ║  ┌────────────────────────────────────────────┐ ║  │
│  ║  │ John Doe                                   │ ║  │
│  ║  │ - Jane Smith                               │ ║  │
│  ║  └────────────────────────────────────────────┘ ║  │
│  ║                                                  ║  │
│  ║  School                                          ║  │
│  ║  ┌────────────────────────────────────────────┐ ║  │
│  ║  │ ABC School                                 │ ║  │
│  ║  └────────────────────────────────────────────┘ ║  │
│  ║                                                  ║  │
│  ║  Location                                        ║  │
│  ║  ┌────────────────────────────────────────────┐ ║  │
│  ║  │ Room 101                                   │ ║  │
│  ║  │ - Room 102                                 │ ║  │
│  ║  └────────────────────────────────────────────┘ ║  │
│  ║                                                  ║  │
│  ║  Scheduled Date & Time                           ║  │
│  ║  ┌────────────────────────────────────────────┐ ║  │
│  ║  │ 2025-01-20 10:00                           │ ║  │
│  ║  └────────────────────────────────────────────┘ ║  │
│  ║                                                  ║  │
│  ║  Status                                          ║  │
│  ║  ┌────────────────────────────────────────────┐ ║  │
│  ║  │ Approved                                   │ ║  │
│  ║  │ - Pending                                  │ ║  │
│  ║  │ - Acknowledged                             │ ║  │
│  ║  │ - Rejected                                 │ ║  │
│  ║  └────────────────────────────────────────────┘ ║  │
│  ║                                                  ║  │
│  ║  [Save Changes]  [Cancel]                        ║  │
│  ║    ↑ Green         ↑ Gray                        ║  │
│  ╚══════════════════════════════════════════════════╝  │
│        ↑ Blue highlighted box                          │
│                                                         │
│  Teacher will be notified of any changes               │
│                                                         │
└─────────────────────────────────────────────────────────┘
                │                    │
                │                    └─────────────────┐
                │                                      │
    Click "Save Changes"                    Click "Cancel"
                │                                      │
                ↓                                      ↓
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  Update class in database   │    │  Discard changes             │
│  Send notification to       │    │  Close edit form             │
│  teacher                    │    │  Reset to original values    │
│  Show success alert         │    │  Return to view mode         │
│  Close edit form            │    │                              │
└─────────────────────────────┘    └──────────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────────────────────┐
│         Class Item (Updated)                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Jane Smith                          [Pending]  ←──┐   │
│  Location: ABC School - Room 102                   │   │
│  Scheduled: 2025-01-25 2:00 PM                     │   │
│                                                    │   │
│  ─────────────────────────────────────────────     │   │
│                                                    │   │
│  [Edit Class]  [Delete Class]                      │   │
│                                                    │   │
│  Teacher will be notified of any changes           │   │
│                                                    │   │
└────────────────────────────────────────────────────┘   │
                                                         │
         Changes reflected in UI ───────────────────────┘

Meanwhile, teacher receives notification:
┌─────────────────────────────────────────────────────────┐
│  🔔 Class Updated                                       │
│  Your class with John Doe has been updated by          │
│  moderator1                                            │
│                                                         │
│  คลาสของคุณกับ John Doe ถูกอัปเดตโดย moderator1        │
└─────────────────────────────────────────────────────────┘
```

---

## User Role Matrix

| Feature                    | Teacher | Moderator | Admin |
|----------------------------|---------|-----------|-------|
| Create Student (Inline)    | ✅      | ✅        | ✅    |
| View Edit Button           | ❌      | ✅        | ✅    |
| Edit Class Details         | ❌      | ✅        | ✅    |
| Delete Class               | ❌      | ✅        | ✅    |
| Receive Edit Notifications | ✅      | ❌        | ❌    |

---

## Color Scheme

### Light Mode
- **Blue Form Background**: `bg-blue-50` (RGB: 239, 246, 255)
- **Blue Border**: `border-blue-200` (RGB: 191, 219, 254)
- **Blue Button**: `bg-blue-600` (RGB: 37, 99, 235)
- **Green Button**: `bg-green-600` (RGB: 22, 163, 74)
- **Red Button**: `bg-red-600` (RGB: 220, 38, 38)
- **Gray Button**: `bg-gray-500` (RGB: 107, 114, 128)

### Dark Mode
- **Blue Form Background**: `dark:bg-blue-900/20` (Blue with 20% opacity)
- **Blue Border**: `dark:border-blue-800`
- **Buttons**: Same colors with adjusted contrast

---

## Responsive Behavior

### Mobile (< 768px)
- Buttons stack vertically
- Form fields full width
- Larger touch targets (py-3)
- Rounded corners: `rounded-xl`

### Desktop (≥ 768px)
- Buttons inline (flex-row)
- Form fields may be in grid
- Standard touch targets (py-2)
- Rounded corners: `rounded-lg`

---

## Accessibility Features

1. **Semantic HTML**: `<label>`, `<select>`, `<input>` elements
2. **Focus States**: `focus:ring-2 focus:ring-blue-500`
3. **Disabled States**: `disabled={!editSchoolId}` with visual feedback
4. **Screen Reader Support**: Descriptive labels in both languages
5. **Keyboard Navigation**: All interactive elements keyboard accessible

---

## State Management

### Component State Variables

```typescript
// Edit mode toggle
const [showEditForm, setShowEditForm] = useState(false);

// Form values
const [editStudentId, setEditStudentId] = useState<Id<"students"> | "">(classItem.studentId);
const [editScheduledDate, setEditScheduledDate] = useState(/* ISO string */);
const [editStatus, setEditStatus] = useState<Status>(classItem.status);
const [editSchoolId, setEditSchoolId] = useState<Id<"schools"> | "">(/* ... */);
const [editLocationId, setEditLocationId] = useState<Id<"locations"> | "">(/* ... */);
```

### Data Queries

```typescript
// Context data (shared, cached)
const { schools } = useDataContext();

// Component-specific queries
const students = useQuery(api.students.list, {});
const editLocations = useQuery(
  api.locations.list,
  editSchoolId ? { schoolId: editSchoolId, activeOnly: true } : "skip"
);

// Mutation
const updateClassMutation = useMutation(api.classes.updateClass);
```

---

## Error Handling

1. **Validation**: Checks for required fields before submission
2. **Try-Catch**: Wraps mutation calls
3. **User Feedback**: Alert messages (success/error)
4. **Graceful Degradation**: Form resets on error, user can retry

```typescript
try {
  await updateClassMutation(updates);
  setShowEditForm(false);
  alert(t("Class updated successfully", "อัปเดตคลาสสำเร็จแล้ว"));
} catch (err) {
  alert(err instanceof Error ? err.message : "Failed to update class");
}
```

---

## Performance Considerations

1. **Conditional Queries**: `editLocations` only queries when school selected
2. **Smart Updates**: Only sends changed fields to backend
3. **Optimistic UI**: Convex provides automatic optimistic updates
4. **Shared Context**: Schools data loaded once, shared across components

---

## Future Testing Scenarios

### Edge Cases to Test

1. **No Students Available**: What happens if student list is empty?
2. **No Schools Available**: Should disable school dropdown
3. **Network Error**: Should show error message, allow retry
4. **Concurrent Edits**: Two moderators editing same class
5. **Past Date Selection**: Should backend validate and reject?
6. **Invalid Data**: What if student/school/location deleted during edit?

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (datetime-local support varies)

### Internationalization

- ✅ English labels/messages
- ✅ Thai labels/messages
- ✅ Date formatting respects locale
- ✅ Time formatting respects locale
