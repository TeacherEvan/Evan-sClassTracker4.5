# Verification: Fix for Moderators Account Logging Issue

## Issue
Moderators and admins could not select which teacher would teach a class when logging from their account in the weekly calendar "Add Class" dialog. Additionally, students' class designation (e.g., "K1", "K2") and grade were not visible in the student dropdown.

## Changes Made

### 1. Added Teacher Selection State
- Added `teacherId` state that:
  - Defaults to `currentUser._id` for teacher role users
  - Defaults to empty string for moderator/admin roles (forcing selection)

### 2. Added Teacher Selection Dropdown
- New dropdown field shown only for moderators and admins
- Uses the existing `users` query which already loads all teachers
- Displays teacher usernames for selection
- Required field with validation

### 3. Enhanced Student Display
- Student dropdown now shows:
  - First name and last name (existing)
  - Class designation in parentheses if available (e.g., "(K1)")
  - Grade with dash separator if available (e.g., "- Kindergarten")
  - Example: "Mickey Mouse (K1) - Kindergarten"

### 4. Updated Form Validation
- Added validation to ensure teacher is selected before form submission
- Error message: "Please select a teacher" / "กรุณาเลือกครูผู้สอน"

### 5. Updated Class Booking
- Changed from hardcoded `teacherId: currentUser._id` to `teacherId: teacherId as Id<"users">`
- This allows moderators/admins to create classes for any teacher

### 6. Form Reset Improvements
- All form fields now reset properly when:
  - Dialog is closed via X button
  - Dialog is closed via Cancel button
  - Form is successfully submitted
- Teacher field resets to appropriate default based on user role

## How to Verify

### For Moderators/Admins:
1. Log in as a moderator or admin account
2. Navigate to the Weekly Calendar view
3. Click the "+" button on any day to open the "Add Class" dialog
4. Verify the following fields appear in order:
   - School (may be locked for moderators)
   - **Teacher** (NEW - dropdown with all teachers)
   - Student (with class and grade info)
   - Location

5. Try to submit without selecting a teacher - should show validation error
6. Select a teacher from the dropdown
7. Select a student - notice the format: "Name (Class) - Grade"
8. Select a location
9. Submit the form
10. Verify the class is created with the selected teacher (not the moderator/admin)

### For Teachers:
1. Log in as a teacher account
2. Navigate to the Weekly Calendar view
3. Click the "+" button on any day
4. Verify the Teacher dropdown is **not shown** (teachers always create classes for themselves)
5. Student dropdown should still show class and grade info
6. Form should work as before (teacher is automatically set to current user)

## Files Changed
- `components/weekly-calendar.tsx`
  - Added teacherId state (line ~71-73)
  - Added teacher validation in handleSubmit (~198-201)
  - Updated bookClass call to use selected teacher (~208)
  - Added teacherId reset after submission (~221)
  - Added teacher selection UI (~494-515)
  - Enhanced student display with class and grade (~531-533)
  - Reset all fields when closing dialog (~444-450, ~568-575)

## Edge Cases Handled
- Teachers don't see the teacher dropdown (automatic)
- Moderators can only see their school (existing behavior preserved)
- Admins can select any school and any teacher
- Form validation ensures teacher is selected
- All form fields reset properly when dialog is closed
- Student dropdown gracefully handles missing class or grade info
