# Fix Summary: Moderator Account Logging Issue

## Problem
When a moderator logged in and tried to add a class via the weekly calendar, they could not:
1. Select which teacher would teach the class (it was hardcoded to the moderator's account)
2. See the student's class designation (e.g., "K1", "K2") in the student dropdown

## Solution

### Before (Original Code)
```tsx
// State - no teacherId field
const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
const [studentId, setStudentId] = useState<Id<"students"> | "">("");
const [locationId, setLocationId] = useState<Id<"locations"> | "">("");

// Form submission - hardcoded to current user
await bookClass({
    teacherId: currentUser._id,  // ❌ PROBLEM: Always uses logged-in user
    schoolId: schoolId as Id<"schools">,
    studentId: studentId as Id<"students">,
    locationId: locationId as Id<"locations">,
    scheduledDate: selectedDate.getTime(),
    bookedByUserId: currentUser._id,
});

// Student dropdown - no class info
<option key={student._id} value={student._id}>
    {student.firstName} {student.lastName}
</option>
```

### After (Fixed Code)
```tsx
// State - added teacherId with smart default
const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
const [studentId, setStudentId] = useState<Id<"students"> | "">("");
const [locationId, setLocationId] = useState<Id<"locations"> | "">("");
const [teacherId, setTeacherId] = useState<Id<"users"> | "">(
    currentUser.role === "teacher" ? currentUser._id : ""  // ✅ Auto-fill for teachers, empty for mods/admins
);

// Form validation - ensure teacher is selected
if (!teacherId) {
    setError(t("Please select a teacher", "กรุณาเลือกครูผู้สอน"));
    return;
}

// Form submission - uses selected teacher
await bookClass({
    teacherId: teacherId as Id<"users">,  // ✅ FIXED: Uses selected teacher
    schoolId: schoolId as Id<"schools">,
    studentId: studentId as Id<"students">,
    locationId: locationId as Id<"locations">,
    scheduledDate: selectedDate.getTime(),
    bookedByUserId: currentUser._id,
});

// New teacher selection UI (shown only for moderators/admins)
{(currentUser.role === "moderator" || currentUser.role === "admin") && (
    <div>
        <label htmlFor="teacherSelect" className="block text-sm font-medium mb-2">
            {t("Teacher", "ครูผู้สอน")}
        </label>
        <select
            id="teacherSelect"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value as Id<"users"> | "")}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
            required
        >
            <option value="">{t("-- Select Teacher --", "-- เลือกครูผู้สอน --")}</option>
            {users?.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                    {teacher.username}
                </option>
            ))}
        </select>
    </div>
)}

// Student dropdown - now shows class and grade
<option key={student._id} value={student._id}>
    {student.firstName} {student.lastName}
    {student.class ? ` (${student.class})` : ""}  // ✅ Show class if available
    {student.grade ? ` - ${student.grade}` : ""}  // ✅ Show grade if available
</option>
// Example output: "Mickey Mouse (K1) - Kindergarten"
```

## Visual Flow Comparison

### Before: Moderator Flow ❌
```
Moderator logs in
  ↓
Opens "Add Class" dialog
  ↓
Sees form fields:
  - School
  - Student (no class info)
  - Location
  ↓
Submits form
  ↓
Class created with moderator as teacher ❌ WRONG!
```

### After: Moderator Flow ✅
```
Moderator logs in
  ↓
Opens "Add Class" dialog
  ↓
Sees form fields:
  - School
  - Teacher ← NEW! Dropdown to select teacher
  - Student (with class designation like "K1")
  - Location
  ↓
Must select a teacher ← NEW! Validation
  ↓
Submits form
  ↓
Class created with selected teacher ✅ CORRECT!
```

### Teacher Flow (Unchanged) ✅
```
Teacher logs in
  ↓
Opens "Add Class" dialog
  ↓
Sees form fields:
  - School
  - Student (with class designation like "K1")
  - Location
  (No teacher dropdown - auto-set to current teacher)
  ↓
Submits form
  ↓
Class created with teacher as teacher ✅ CORRECT!
```

## Key Features

1. **Role-Based UI**: Teacher dropdown only shown for moderators and admins
2. **Smart Defaults**: Teachers automatically have their ID selected, mods/admins start empty
3. **Validation**: Form cannot be submitted without selecting a teacher (for mods/admins)
4. **Enhanced UX**: Student dropdown shows class designation and grade for better identification
5. **Proper Resets**: All form fields reset when dialog is closed or after submission

## Impact
- **Moderators** can now properly log classes for any teacher
- **Admins** can log classes for any teacher at any school
- **Teachers** experience no change (existing behavior preserved)
- **All users** can now see student class/grade info in dropdowns
