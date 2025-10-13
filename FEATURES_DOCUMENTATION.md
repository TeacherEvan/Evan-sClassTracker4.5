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

### 4. Database Initialization

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
4. Monitor **Notifications** for booking updates

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
- `book({ teacherId, schoolId, title, titleTh, description, descriptionTh, scheduledDate })`: Book a class
- `acknowledge({ classId })`: Acknowledge a class booking
- `approve({ classId })`: Approve a class
- `reject({ classId, reason?, reasonTh? })`: Reject a class

#### Students (`convex/students.ts`)
- `list({ schoolId? })`: Get students
- `getById(id)`: Get student by ID
- `getByStudentId(studentId)`: Get student by unique student ID
- `create({ firstName, lastName, schoolId, grade })`: Create new student
- `update({ id, firstName?, lastName?, grade? })`: Update student
- `remove({ id })`: Delete student

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
  schoolId: Id<"schools">;
  grade: string;
  createdAt: number;
}
```

## Future Enhancements

Potential improvements for future versions:
- Implement proper bcrypt password hashing
- Add email notifications
- Add calendar view for class bookings
- Add class attendance tracking
- Add student performance metrics
- Add file upload for class materials
- Add real-time chat between teachers and moderators
