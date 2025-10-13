# Quick Reference Guide

## User Roles & Permissions

| Role | Create Users | Manage Schools | Book Classes | Approve Classes | View All Notifications |
|------|--------------|----------------|--------------|-----------------|------------------------|
| Admin | ✅ | ✅ | ❌ | ❌ | ✅ |
| Moderator | ❌ | ❌ | ❌ | ✅ (their school) | ✅ (their school) |
| Teacher | ❌ | ❌ | ✅ | ❌ | ✅ (their own) |

## Default Passwords

When a user is created with username `{name}`, their default password is `Teacher{name}`.

Examples:
- Username: `Evan` → Password: `TeacherEvan`
- Username: `admin` → Password: `TeacherAdmin`
- Username: `Sarah` → Password: `TeacherSarah`

## Workflow Diagrams

### New User Flow
```
1. Admin creates user "Evan"
   ↓
2. System sets password to "TeacherEvan"
   ↓
3. Admin shares credentials with Evan
   ↓
4. Evan logs in
   ↓
5. System shows password change dialog
   ↓
6. Evan must change password before proceeding
   ↓
7. Evan can now use the system
```

### Class Booking Flow
```
1. Teacher books class at School A
   ↓
2. System creates notification for School A's moderator
   ↓
3. Moderator sees notification in their notification panel
   ↓
4. Moderator navigates to Classes tab
   ↓
5. Moderator acknowledges the booking
   ↓
6. Teacher receives "acknowledged" notification
   ↓
7. Moderator approves or rejects
   ↓
8. Teacher receives final decision notification
```

### Student Registration Flow
```
1. User creates student record
   - First Name: "John"
   - Last Name: "Smith"
   - School: Bangkok International (ID: jd2k3l...)
   ↓
2. System generates unique ID:
   - SchoolHash: "JD2K" (first 4 chars of school ID)
   - NameHash: "JOSM" (Jo from John, Sm from Smith)
   - Timestamp: "lmn3p4" (current time in base36)
   - Random: "X7Y9" (random 4 chars)
   ↓
3. Final Student ID: "JD2K-JOSM-lmn3p4-X7Y9"
   ↓
4. System checks for duplicates
   ↓
5. If duplicate exists, regenerate (retry up to 10 times)
   ↓
6. Student created with unique ID
```

## UI Navigation

### Admin View
```
┌─────────────────────────────────────────┐
│ Class Tracker                   [EN/ไทย] │
│ Welcome, admin · Admin           [Logout]│
├─────────────────────────────────────────┤
│ [Notifications] [Classes] [Users]       │
├─────────────────────────────────────────┤
│                                          │
│  Users Tab:                              │
│  ┌─────────────────────────────────┐    │
│  │ Create New User                  │    │
│  │ Username: [________]             │    │
│  │ Role: [Teacher ▼]                │    │
│  │ School: [Select... ▼]            │    │
│  │ [Create User]                    │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Existing Users:                         │
│  • Evan (Teacher) [Reset Password]       │
│  • moderator1 (Moderator) [Reset]        │
│                                          │
└─────────────────────────────────────────┘
```

### Teacher View
```
┌─────────────────────────────────────────┐
│ Class Tracker                   [EN/ไทย] │
│ Welcome, Evan · Teacher          [Logout]│
├─────────────────────────────────────────┤
│ [Notifications] [Classes]               │
├─────────────────────────────────────────┤
│                                          │
│  Classes Tab:          [Book Class]      │
│  ┌─────────────────────────────────┐    │
│  │ Math 101                         │    │
│  │ Scheduled: Dec 15, 2023 10:00 AM │    │
│  │ Status: [Approved]               │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Science Lab                      │    │
│  │ Scheduled: Dec 16, 2023 2:00 PM  │    │
│  │ Status: [Pending]                │    │
│  └─────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘
```

### Moderator View
```
┌─────────────────────────────────────────┐
│ Class Tracker                   [EN/ไทย] │
│ Welcome, moderator1 · Moderator [Logout] │
├─────────────────────────────────────────┤
│ [Notifications (2)] [Classes]           │
├─────────────────────────────────────────┤
│                                          │
│  Classes Tab:                            │
│  ┌─────────────────────────────────┐    │
│  │ New Class Booking: Math 101      │    │
│  │ Teacher: Evan                    │    │
│  │ Status: [Pending]                │    │
│  │ [Acknowledge] [Approve] [Reject] │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Science Lab                      │    │
│  │ Teacher: Evan                    │    │
│  │ Status: [Acknowledged]           │    │
│  │ [Approve] [Reject]               │    │
│  └─────────────────────────────────┘    │
│                                          │
└─────────────────────────────────────────┘
```

## Common Tasks

### Create a New Teacher
1. Login as admin
2. Go to Users tab
3. Enter username (e.g., "Sarah")
4. Select "Teacher" role
5. Select school (optional)
6. Click "Create User"
7. Note the generated password: "TeacherSarah"
8. Share credentials with Sarah

### Book a Class
1. Login as teacher
2. Go to Classes tab
3. Click "Book Class"
4. Fill in:
   - Title (English): "Math 101"
   - Title (Thai): "คณิตศาสตร์ 101"
   - Description (both languages)
   - School
   - Scheduled date
5. Click "Book Class"
6. Wait for moderator notification

### Approve a Class
1. Login as moderator
2. Check Notifications tab for new bookings
3. Go to Classes tab
4. Find pending class
5. Click "Acknowledge" (optional)
6. Click "Approve" or "Reject"
7. Teacher receives notification

### Reset a Password
1. Login as admin
2. Go to Users tab
3. Find user in list
4. Click "Reset Password"
5. Confirm action
6. Note new password shown: "Teacher{username}"
7. Share with user

## Password Change Dialog

When user logs in for first time (or after password reset):

```
┌──────────────────────────────────────┐
│ Change Password                      │
├──────────────────────────────────────┤
│ ℹ️ First-time login                  │
│ Please change your password. Note:   │
│ Admin can only reset passwords, not  │
│ view them.                           │
├──────────────────────────────────────┤
│ Current Password: [______________]   │
│ New Password: [______________]       │
│ (No minimum requirements)            │
│ Confirm Password: [______________]   │
│                                      │
│ [Change Password]                    │
└──────────────────────────────────────┘
```

## Notification Types

| Type | Color | Used For |
|------|-------|----------|
| Info | Blue | General information |
| Success | Green | Positive updates (approvals, confirmations) |
| Warning | Yellow | Important alerts (new bookings, password reminders) |
| Error | Red | Critical issues (rejections) |

## API Endpoints (Convex Functions)

### Authentication
- `users.login({ username, password })` - Login user
- `users.changePassword({ userId, currentPassword, newPassword })` - Change password
- `users.resetPassword({ userId })` - Reset password (admin)

### User Management
- `users.create({ username, role, schoolId? })` - Create user
- `users.list()` - Get all users
- `users.getByUsername({ username })` - Get user

### Class Management
- `classes.book({ teacherId, schoolId, title, ... })` - Book class
- `classes.acknowledge({ classId })` - Acknowledge booking
- `classes.approve({ classId })` - Approve class
- `classes.reject({ classId, reason?, reasonTh? })` - Reject class
- `classes.list({ teacherId?, schoolId?, status? })` - List classes

### Student Management
- `students.create({ firstName, lastName, schoolId, grade })` - Create student
- `students.list({ schoolId? })` - List students
- `students.getByStudentId({ studentId })` - Get by unique ID

### School Management
- `schools.list()` - Get all schools
- `schools.create({ name, nameTh, moderatorId? })` - Create school

## Database Initialization

First-time setup creates:

### Users
| Username | Password | Role | School |
|----------|----------|------|---------|
| admin | TeacherAdmin | Admin | - |
| moderator1 | TeacherModerator1 | Moderator | Bangkok International |
| Evan | TeacherEvan | Teacher | Bangkok International |

### Schools
- Bangkok International School (โรงเรียนนานาชาติกรุงเทพ)
- Chiang Mai Academy (โรงเรียนเชียงใหม่อคาเดมี)

### Initial Notification
Welcome notification sent to admin with password change reminder.
