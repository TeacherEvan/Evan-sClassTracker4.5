# User Authentication & Class Booking Features

This document describes the new features added to Evan's Class Tracker 4.5.

## Features Overview

### 1. User Authentication System

#### User Roles

- **Admin**: Can manage users, create notifications, and oversee the entire system
- **Moderator**: Can acknowledge and approve/reject class bookings for their school
- **Teacher**: Can book classes and receive notifications

#### User Creation

- Users are created by admins through the User Management interface
- Default password format: `Teacher{username}`
  - Example: Username "Evan" gets password "TeacherEvan"
- All users are required to change their password on first login
- **Important**: Admins can only reset passwords, not view them

#### Password Requirements

- No minimum requirements - users can create any password they want
- Password change is forced on first login
- Only the user and the system know the password (stored as hash)

### 2. Class Booking System

#### Booking Workflow

1. **Teacher books a class**:
   - Selects a school
   - Provides class details (title, description in English/Thai)
   - Sets scheduled date
   - Submits booking

2. **Automatic notification**:
   - The moderator associated with the selected school receives a notification
   - Notification appears in their notification panel

3. **Moderator acknowledgment**:
   - Moderator can acknowledge the booking
   - Moderator can approve or reject the booking
   - Teacher receives notification of the decision

#### Status States

- **Pending**: Initial state when class is booked
- **Acknowledged**: Moderator has seen and acknowledged the booking
- **Approved**: Moderator has approved the class
- **Rejected**: Moderator has rejected the class (with optional reason)

### 3. Student Management

#### Unique Student IDs

Each student is assigned a unique identifier with the following format:

```
{SchoolHash}-{NameHash}-{Timestamp}-{Random}
```

Example: `BANG-EVTH-abc123-XY4Z`

Components:

- **SchoolHash**: First 4 characters of school ID (uppercase)
- **NameHash**: First 2 chars of first name + first 2 chars of last name (uppercase)
- **Timestamp**: Unix timestamp in base36 format
- **Random**: 4-character random string (uppercase)

This ensures:

- No duplicate student IDs
- Easy school identification
- Chronological ordering capability
- Human-readable format

#### Student Management Interface

The Student Management component provides comprehensive CRUD operations for managing students:

**Features**:

1. **Create Students**: Add new students with full bilingual support
2. **Edit Students**: Update student information including guardian details
3. **Delete Students**: Remove students with confirmation dialog
4. **Duplicate Students**: Clone guardian-linked students (not school-linked)
5. **Filter Students**: View students by school or guardian-only
6. **Guardian Support**: Link students to guardians instead of schools

**Student Information Fields**:

- **First Name** (required): Student's first name
- **Last Name** (required): Student's last name
- **Grade** (required): Grade level (e.g., "Grade 5", "P.3", "M.2")
- **School** (optional): Link to a school OR leave blank for guardian
- **Student ID** (auto-generated): Unique identifier assigned by system

**Guardian Information Fields**:

- **Guardian Name** (required if no school): Primary guardian's name
- **Guardian Phone** (optional): Contact phone number
- **Guardian Email** (optional): Contact email address

**Business Rules**:

- Students must be linked to EITHER a school OR have a guardian name
- Students cannot be linked to both school and guardian simultaneously
- Only guardian-linked students can be duplicated
- School-linked students cannot be duplicated (prevents data integrity issues)
- Student IDs are automatically generated and cannot be edited

**Filter Options**:

1. **All Students**: Shows all students in the system
2. **Guardian Only**: Shows only students linked to guardians (no school)
3. **[School Name]**: Shows students for a specific school

**Access Control**: Admin only (in current implementation)

#### Use Cases

**School-Linked Students**:

- Traditional school environment
- Students are associated with a specific school
- School moderators can manage their school's students
- Student ID includes school identifier

**Guardian-Linked Students**:

- Homeschooling scenarios
- Private tutoring arrangements
- Students not yet enrolled in a school
- Multiple students under same guardian can be duplicated for efficiency

**Example Workflow - Guardian Student**:

1. Admin creates first student for a guardian family
2. Fills in student details and guardian information
3. System generates unique student ID with "GUARDIAN" hash
4. Admin duplicates student to add siblings
5. Edits duplicated student with sibling's information
6. Guardian contact info is pre-filled from original student

### 4. Weekly Calendar View

#### Overview

The Weekly Calendar provides an interactive 7-day view for scheduling and managing classes. It displays a Monday-Sunday week grid with classes organized by day.

**Features**:

1. **Week Navigation**: Browse previous/next weeks with arrow buttons
2. **Today Button**: Jump to the current week instantly
3. **Add Classes**: Click any day to open class booking dialog
4. **Color-Coded Status**: Visual status indicators for each class
5. **Role-Based Filtering**: Automatic filtering based on user role
6. **School Filter**: Teachers and admins can filter by school

#### Calendar Interface

**Week Display**:

- 7 columns representing Monday through Sunday
- Current day highlighted in blue
- Each day shows date number and day name (bilingual)
- Classes appear as cards within their scheduled day

**Class Cards Display**:

- **Title**: Class name (in selected language)
- **Teacher**: Name of the teacher who booked the class
- **School**: School name where class is scheduled
- **Status Indicator**: Color-coded border based on approval status

**Status Colors**:

- **Yellow** (`bg-yellow-50`): Pending - awaiting moderator review
- **Blue** (`bg-blue-50`): Acknowledged - moderator has seen the request
- **Green** (`bg-green-50`): Approved - class is confirmed
- **Red** (`bg-red-50`): Rejected - class was not approved

#### Add Class Dialog

**Trigger**: Click on any day in the calendar

**Form Fields**:

1. **School Selection**:
   - Dropdown list of all schools
   - Pre-filled for moderators (their assigned school)
   - Required field

2. **Title** (English):
   - English class name
   - Displayed to English-language users
   - Required field

3. **Title** (Thai):
   - Thai class name (ชื่อหัวข้อ)
   - Displayed to Thai-language users
   - Required field

4. **Description** (English):
   - Detailed class description in English
   - Multiple lines supported
   - Required field

5. **Description** (Thai):
   - Detailed class description in Thai (คำอธิบาย)
   - Multiple lines supported
   - Required field

6. **Date Display**:
   - Shows selected date in localized format
   - Read-only (determined by clicked day)

**Validation**:

- All fields must be filled in both languages
- School must be selected
- Error messages appear in user's selected language

#### Role-Based Behavior

**Teachers**:

- Can view calendar of all their classes across all schools
- Can add classes to any school
- See only their own classes by default
- Can optionally filter by school

**Moderators**:

- See only classes for their assigned school
- School selection pre-filled in add dialog
- Cannot view other schools' classes
- Can acknowledge/approve from class booking tab

**Admins**:

- Full view of all schools and classes
- Can filter by specific school or view all
- Can add classes to any school
- Complete system oversight

#### Navigation Controls

**Previous Week** (`<` button):

- Moves calendar back 7 days
- Updates all displayed classes
- Maintains current filters

**Next Week** (`>` button):

- Moves calendar forward 7 days
- Updates all displayed classes
- Maintains current filters

**Today** (button):

- Resets calendar to current week
- Highlights today's date
- Quick return to present day

#### Technical Details

**Date Range Query**:

- Queries `api.classes.getByDateRange`
- Fetches classes from Monday 00:00 to Sunday 23:59:59
- Includes appropriate filters for user role

**Real-Time Updates**:

- Uses Convex real-time subscriptions
- Calendar refreshes automatically when classes are added/modified
- No manual refresh needed

**Memoization**:

- Week start/end dates are memoized
- Week days array is memoized
- Prevents unnecessary recalculations

**Responsive Design**:

- Grid layout adapts to screen size
- Horizontal scrolling on mobile devices
- Touch-friendly interaction

### 5. School Management

#### Overview

The School Management interface allows administrators to create, edit, and delete schools, as well as assign moderators to manage each school.

**Features**:

1. **Create Schools**: Add new schools with bilingual names
2. **Edit Schools**: Update school information and moderator assignment
3. **Delete Schools**: Remove schools with confirmation
4. **Assign Moderators**: Link moderators to schools for management
5. **View All Schools**: Table view of all schools with current moderators

#### School Management Interface

**Access Control**: Admin only

**School Information Fields**:

1. **School Name (English)** (required):
   - English name of the school
   - Displayed to English-language users
   - Example: "Bangkok International School"

2. **School Name (Thai)** (required):
   - Thai name of the school (ชื่อโรงเรียน)
   - Displayed to Thai-language users
   - Example: "โรงเรียนนานาชาติกรุงเทพ"

3. **Moderator Assignment** (optional):
   - Dropdown list of users with moderator role
   - Links a moderator to manage this school
   - Can be changed at any time

**School List Table**:

- **School Name**: Displays in user's selected language
- **Moderator**: Shows assigned moderator's username (or "Unassigned")
- **Actions**: Edit and Delete buttons

#### Operations

**Create School**:

1. Click "Add School" button
2. Fill in English and Thai school names
3. Optionally select a moderator
4. Click "Create School"
5. School appears in table immediately

**Edit School**:

1. Click pencil icon on school row
2. Form pre-fills with current school data
3. Modify name or moderator assignment
4. Click "Update School"
5. Changes save and form closes

**Delete School**:

1. Click trash icon on school row
2. Confirm deletion in dialog
3. School is removed from system
4. Related data (classes, students) may need cleanup

**Assign/Reassign Moderator**:

1. Edit existing school
2. Select different moderator from dropdown
3. Save changes
4. Moderator's school filter updates automatically

#### Moderator Dropdown

**Behavior**:

- Only shows users with `role: "moderator"`
- Includes "No Moderator" option
- Automatically filters from all users
- Sorted alphabetically by username

**Moderator Permissions**:

- Moderators assigned to a school can:
  - View classes for their school only
  - Acknowledge class bookings
  - Approve/reject class requests
  - View their school's students (future feature)

#### Validation Rules

**Required Fields**:

- English school name cannot be empty
- Thai school name cannot be empty
- Both must have at least 1 character

**Optional Fields**:

- Moderator assignment is optional
- Schools can exist without an assigned moderator
- Multiple schools can share the same moderator (not recommended)

#### Use Cases

**New School Setup**:

1. Admin creates school with both language names
2. Admin assigns a moderator to manage the school
3. Moderator can now manage classes for that school
4. Teachers can book classes at the new school

**Moderator Change**:

1. Admin edits existing school
2. Selects new moderator from dropdown
3. Old moderator loses access to school
4. New moderator gains management permissions

**School Closure**:

1. Admin deletes school after confirming
2. Consider cleaning up related classes
3. Consider transferring or removing students
4. Moderator assignment is removed

### 6. Database Initialization

On first run, the system will show a database initialization screen that creates:

- Admin account (username: `admin`, password: `TeacherAdmin`)
- Sample moderator (username: `moderator1`, password: `TeacherModerator1`)
- Sample teacher (username: `Evan`, password: `TeacherEvan`)
- Two sample schools:
  - Bangkok International School (โรงเรียนนานาชาติกรุงเทพ)
  - Chiang Mai Academy (โรงเรียนเชียงใหม่อคาเดมี)

**⚠️ Important**: Change all default passwords after first login!

## Usage Guide

### For Admins

1. **Login** with admin credentials
2. **Change password** when prompted (first login only)
3. Navigate to the **Users** tab to:
   - Create new users (teachers, moderators)
   - Assign users to schools
   - Reset user passwords if needed
4. Use **Notifications** tab to send system-wide or user-specific notifications

### For Moderators

1. **Login** with your credentials
2. **Change password** when prompted (first login only)
3. Monitor **Notifications** for new class bookings
4. Navigate to **Classes** tab to:
   - View pending class bookings
   - Acknowledge bookings
   - Approve or reject classes

### For Teachers

1. **Login** with your credentials
2. **Change password** when prompted (first login only)
3. Navigate to **Classes** tab to:
   - Book new classes
   - View your booking history
   - Check booking statuses
4. Navigate to **Calendar** tab to:
   - View your scheduled classes in weekly format
   - Add classes by clicking on any day
   - See status of all your classes at a glance
5. Monitor **Notifications** for booking updates

## Automatic Notification System

The system automatically generates notifications for key events in the class booking workflow:

### Notification Triggers

**1. Class Booked by Teacher**:

- **Recipient**: Moderator of the selected school
- **Type**: Warning (yellow)
- **Title**: "New Class Booking" / "การจองคลาสใหม่"
- **Message**: Details about the teacher, class, and scheduled date

**2. Class Acknowledged by Moderator**:

- **Recipient**: Teacher who booked the class
- **Type**: Info (blue)
- **Title**: "Class Acknowledged" / "รับทราบการจองคลาส"
- **Message**: Moderator has seen the booking

**3. Class Approved by Moderator**:

- **Recipient**: Teacher who booked the class
- **Type**: Success (green)
- **Title**: "Class Approved" / "อนุมัติคลาสแล้ว"
- **Message**: Class has been approved and confirmed

**4. Class Rejected by Moderator**:

- **Recipient**: Teacher who booked the class
- **Type**: Error (red)
- **Title**: "Class Rejected" / "ปฏิเสธคลาส"
- **Message**: Includes reason for rejection (if provided)

**5. Database Initialization**:

- **Recipient**: Admin account
- **Type**: Warning (yellow)
- **Title**: "Welcome to Class Tracker!" / "ยินดีต้อนรับสู่ Class Tracker!"
- **Message**: Reminder to change default password

### Manual Notifications

Admins can create custom notifications:

- Can target specific users or send system-wide
- Can choose any notification type
- Must provide content in both English and Thai
- Useful for announcements, reminders, or alerts

## Security Notes

- Passwords are hashed before storage (using base64 encoding - **Note**: In production, use bcrypt or similar)
- Admins cannot view user passwords, only reset them
- Password change is mandatory on first login
- Each user role has specific permissions and access levels

## API Reference

### Convex Functions

#### Users (`convex/users.ts`)

- `list()`: Get all users (admin only)
- `getByUsername(username)`: Get user by username
- `getById(id)`: Get user by ID
- `getCurrentUser()`: Get current logged-in user from session
- `create({ username, role, schoolId? })`: Create new user
- `login({ username, password })`: Authenticate user
- `changePassword({ userId, currentPassword, newPassword })`: Change password
- `resetPassword({ userId })`: Reset user password (admin only)

#### Schools (`convex/schools.ts`)

- `list()`: Get all schools
- `getById(id)`: Get school by ID
- `create({ name, nameTh, moderatorId? })`: Create new school
- `updateModerator({ schoolId, moderatorId })`: Update school moderator

#### Classes (`convex/classes.ts`)

- `list({ teacherId?, schoolId?, status? })`: Get classes with filters
- `getById(id)`: Get class by ID
- `getByDateRange({ startDate, endDate, schoolId?, teacherId? })`: Get classes within date range (optimized for calendar view)
- `book({ teacherId, schoolId, title, titleTh, description, descriptionTh, scheduledDate })`: Book a class
- `acknowledge({ classId })`: Acknowledge a class booking
- `approve({ classId })`: Approve a class
- `reject({ classId, reason?, reasonTh? })`: Reject a class

#### Students (`convex/students.ts`)

- `list({ schoolId? })`: Get students (optionally filtered by school)
- `getById(id)`: Get student by ID
- `getByStudentId(studentId)`: Get student by unique student ID
- `getByGuardian({ guardianName })`: Get students by guardian name
- `create({ firstName, lastName, schoolId?, grade, guardianName?, guardianPhone?, guardianEmail? })`: Create new student
- `update({ id, firstName?, lastName?, grade?, guardianName?, guardianPhone?, guardianEmail? })`: Update student
- `remove({ id })`: Delete student
- `duplicate({ id })`: Duplicate a guardian-linked student

#### Notifications (`convex/notifications.ts`)

- `list({ userId? })`: Get all notifications (optionally filtered by user)
- `unreadCount({ userId? })`: Get count of unread notifications
- `create({ title, titleTh, message, messageTh, type, userId? })`: Create notification
- `markAsRead({ id })`: Mark single notification as read
- `markAllAsRead({ userId? })`: Mark all notifications as read
- `remove({ id })`: Delete notification

### Utility Functions

#### Date Utilities (`lib/date-utils.ts`)

- `formatRelativeTime(timestamp, language)`: Format timestamp as relative time (e.g., "5 min ago")
- `getWeekStart(date)`: Get Monday of the week for given date
- `isToday(date)`: Check if a date is today
- `formatDate(date, language)`: Format date in localized format

#### Constants & Helpers (`lib/constants.ts`)

- `NOTIFICATION_TYPES`: Constant object for notification types
- `CLASS_STATUS`: Constant object for class status types
- `getNotificationTypeColor(type)`: Get Tailwind classes for notification background
- `getNotificationTypeTextColor(type)`: Get Tailwind classes for notification text
- `getClassStatusColor(status)`: Get Tailwind classes for class status background

#### Type Definitions (`lib/types.ts`)

- `User`: User object type with role and school
- `NotificationType`: Union type for notification types
- `Notification`: Notification object type
- `ClassStatus`: Union type for class status
- `ClassData`: Class object type with all fields
- `Student`: Student object type with guardian fields

## Database Schema

### Users Table

```typescript
{
  username: string;
  passwordHash: string;
  role: "teacher" | "moderator" | "admin";
  schoolId?: Id<"schools">;
  requirePasswordChange: boolean;
  createdAt: number;
}
```

### Schools Table

```typescript
{
  name: string;
  nameTh: string;
  moderatorId?: Id<"users">;
  createdAt: number;
}
```

### Classes Table

```typescript
{
  teacherId: Id<"users">;
  schoolId: Id<"schools">;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  status: "pending" | "acknowledged" | "approved" | "rejected";
  scheduledDate: number;
  createdAt: number;
}
```

### Students Table

```typescript
{
  firstName: string;
  lastName: string;
  studentId: string; // Unique identifier
  schoolId?: Id<"schools">; // Optional - null for guardian-linked students
  grade: string;
  guardianName?: string; // Guardian name if no school
  guardianPhone?: string; // Guardian contact phone
  guardianEmail?: string; // Guardian contact email
  createdAt: number;
}
```

## Performance Optimizations

The system includes several performance optimizations:

### Database Indexing Strategy

**Compound Indexes for Date Queries**:

- `by_school_and_date`: Enables efficient school-filtered calendar queries
- `by_teacher_and_date`: Optimizes teacher-specific date range lookups
- `by_scheduled_date`: Fast date range queries for admin views

**Guardian Index**:

- `by_guardian`: Quick lookup of students by guardian name

### React Performance

**Memoization** (`weekly-calendar.tsx`):

- Week start/end dates are memoized with `useMemo`
- Week days array is memoized to prevent recalculation
- Reduces unnecessary re-renders on component updates

**Utility Functions**:

- `lib/constants.ts`: Centralized color/type utilities prevent duplication
- `lib/date-utils.ts`: Shared date formatting across components
- `lib/types.ts`: Centralized TypeScript types for consistency

### Convex Query Optimization

**Conditional Index Usage**:

```typescript
// Uses most efficient index based on filters
if (args.schoolId) {
  return ctx.db.query("classes")
    .withIndex("by_school_and_date", ...)
}
```

**Real-time Subscriptions**:

- Automatic cache invalidation on data changes
- No manual polling required
- Optimistic updates for instant UI feedback

## Code Quality Best Practices

### Component Architecture

1. **Component Modularity**: Each component has single responsibility
   - `LoginForm`: Authentication only
   - `WeeklyCalendar`: Calendar view and class scheduling
   - `StudentManagement`: Complete CRUD for students
   - `SchoolManagement`: School and moderator management

2. **Type Safety**: Full TypeScript coverage with strict mode
   - Centralized types in `lib/types.ts`
   - Convex auto-generated types in `convex/_generated/`
   - No `any` types - strict null checks enabled

3. **Error Handling**: Try-catch blocks with user-friendly error messages
   - Bilingual error messages
   - Form validation before submission
   - Graceful degradation on API failures

4. **Bilingual Validation**: Ensures both languages always provided
   - Frontend validation checks for empty translations
   - Backend validation in Convex mutations
   - Translation helper `t()` function used consistently

5. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
   - Proper heading hierarchy (h1, h2, h3)
   - Form labels associated with inputs
   - Keyboard-navigable dialogs and modals
   - Color contrast meets WCAG AA standards

### State Management Patterns

**Client-Side State**:

- `useState` for form inputs and UI toggles
- `useMemo` for expensive calculations (date ranges, filters)
- Minimal local state - rely on Convex real-time sync

**Server-Side State**:

- Convex handles all persistent data
- Real-time subscriptions via `useQuery`
- Optimistic updates via `useMutation`
- No Redux or additional state libraries needed

### Form Handling Pattern

Standard pattern used across all forms:

```typescript
const [field, setField] = useState("");
const [error, setError] = useState("");
const mutation = useMutation(api.module.function);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  
  // Validation
  if (!field.trim()) {
    setError(t("Error message EN", "ข้อความผิดพลาด TH"));
    return;
  }
  
  try {
    await mutation({ field });
    // Reset form
    setField("");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed");
  }
};
```

### Styling Conventions

**Color Scheme**:

- Primary: Blue (`blue-600`, `blue-500`)
- Success: Green (`green-600`, `green-500`)
- Warning: Yellow (`yellow-600`, `yellow-500`)
- Error: Red (`red-600`, `red-500`)

**Dark Mode**:

- All components support dark mode via `dark:` variants
- Automatic detection of system preference
- Consistent opacity levels (e.g., `dark:bg-gray-800`)

**Responsive Breakpoints**:

- Mobile-first approach
- `md:` for tablet (768px+)
- `lg:` for desktop (1024px+)
- Grid layouts adapt to screen size

## Testing Recommendations

### Manual Testing Checklist

**User Authentication**:

- [ ] Login with correct credentials
- [ ] Login with incorrect credentials
- [ ] Forced password change on first login
- [ ] Password change with incorrect current password
- [ ] Admin password reset

**Class Booking Workflow**:

- [ ] Teacher books class
- [ ] Moderator receives notification
- [ ] Moderator acknowledges class
- [ ] Teacher receives acknowledgment notification
- [ ] Moderator approves class
- [ ] Teacher receives approval notification
- [ ] Moderator rejects class with reason
- [ ] Teacher receives rejection notification

**Student Management**:

- [ ] Create school-linked student
- [ ] Create guardian-linked student
- [ ] Edit student information
- [ ] Delete student with confirmation
- [ ] Duplicate guardian-linked student
- [ ] Attempt to duplicate school-linked student (should fail)
- [ ] Filter students by school
- [ ] Filter students by guardian-only

**Weekly Calendar**:

- [ ] View current week
- [ ] Navigate to previous/next week
- [ ] Jump to today
- [ ] Add class by clicking day
- [ ] View classes color-coded by status
- [ ] Filter by school (admin/teacher)
- [ ] Moderator sees only their school

**Bilingual Support**:

- [ ] Switch between English and Thai
- [ ] Verify all UI elements translate
- [ ] Create content in both languages
- [ ] View notifications in both languages

### Automated Testing (Future)

**Unit Tests** (Recommended: Vitest):

- Utility functions (`date-utils.ts`, `constants.ts`)
- Student ID generation logic
- Form validation logic

**Integration Tests** (Recommended: Playwright):

- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness

**E2E Tests** (Recommended: Cypress):

- Full authentication flow
- Complete class booking workflow
- Student CRUD operations

## Troubleshooting Guide

### Common Issues

**Issue**: "Convex connection failed"

- **Solution**: Ensure `npx convex dev` is running
- **Solution**: Check `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- **Solution**: Verify internet connection

**Issue**: "Database not initialized"

- **Solution**: Click "Initialize Database" button on first load
- **Solution**: Check Convex dashboard for schema deployment

**Issue**: "Notifications not appearing"

- **Solution**: Check browser console for errors
- **Solution**: Verify user has correct permissions
- **Solution**: Ensure notifications were created with valid userId

**Issue**: "Calendar not showing classes"

- **Solution**: Verify classes exist in date range
- **Solution**: Check role-based filters (moderator sees only their school)
- **Solution**: Clear browser cache and refresh

**Issue**: "Cannot duplicate student"

- **Solution**: Only guardian-linked students can be duplicated
- **Solution**: Check student is not linked to a school

**Issue**: "Password reset not working"

- **Solution**: Only admin can reset passwords
- **Solution**: Ensure userId is valid
- **Solution**: User must change password on next login

### Performance Issues

**Slow queries**:

- Check Convex dashboard for query performance
- Verify indexes are being used
- Consider adding pagination for large datasets

**UI lag**:

- Check for unnecessary re-renders (React DevTools)
- Verify `useMemo` is being used for expensive calculations
- Profile with Chrome DevTools Performance tab

## Deployment Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Update environment variables in Vercel
- [ ] Test authentication flow end-to-end
- [ ] Verify email notifications (if implemented)
- [ ] Test on multiple devices and browsers
- [ ] Check accessibility with screen reader
- [ ] Verify SSL certificate is active
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Configure backup strategy for Convex data
- [ ] Document admin procedures
- [ ] Train users on system usage
- [ ] Plan for user support and feedback

## Future Enhancements

### High Priority

- **Security**: Implement proper bcrypt password hashing
- **Email**: Add email notifications for critical events
- **Pagination**: Add pagination for large student/class lists
- **Search**: Add search functionality across all data tables

### Medium Priority

- **Attendance**: Add class attendance tracking
- **Performance Metrics**: Add student performance tracking
- **File Upload**: Add file upload for class materials
- **Reports**: Add export to CSV/PDF functionality
- **Bulk Operations**: Add bulk student import from CSV

### Low Priority

- **Real-time Chat**: Add chat between teachers and moderators
- **Analytics Dashboard**: Add charts and metrics for admins
- **Mobile App**: Develop native mobile applications
- **Calendar Integration**: Sync with Google Calendar/Outlook
- **Push Notifications**: Add browser push notifications
- **Multi-school Support**: Allow teachers to work at multiple schools
- **Custom Roles**: Add customizable role permissions
- **Audit Log**: Track all user actions for compliance
- **API Access**: Provide REST API for third-party integrations
- **Theming**: Allow custom color schemes per school
