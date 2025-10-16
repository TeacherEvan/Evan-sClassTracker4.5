# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Evan's Class Tracker 4.5                   │
│                  Next.js 15 + Convex + Vercel                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Login Page   │  │ Main App     │  │ DB Init      │         │
│  │ - Auth form  │  │ - Dashboard  │  │ - Setup      │         │
│  │ - Validation │  │ - Navigation │  │ - Samples    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ User Mgmt    │  │ Class Book   │  │ Password Chg │         │
│  │ - Create     │  │ - Form       │  │ - Forced     │         │
│  │ - Reset      │  │ - Approval   │  │ - Security   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ Notification │  │ Language     │                           │
│  │ - List       │  │ - EN/TH      │                           │
│  │ - Form       │  │ - Switcher   │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                        Convex React
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer (Convex)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users.ts     │  │ classes.ts   │  │ students.ts  │         │
│  │ - login()    │  │ - book()     │  │ - create()   │         │
│  │ - create()   │  │ - acknowledge│  │ - list()     │         │
│  │ - change     │  │ - approve()  │  │ - unique ID  │         │
│  │   Password() │  │ - reject()   │  │   generator  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ schools.ts   │  │ notifications│  │ init.ts      │         │
│  │ - list()     │  │ - create()   │  │ - setup()    │         │
│  │ - create()   │  │ - list()     │  │ - samples    │         │
│  │ - update     │  │ - markRead() │  │              │         │
│  │   Moderator()│  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         Real-time Sync
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer (Convex)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users        │  │ classes      │  │ students     │         │
│  │ - username   │  │ - teacherId  │  │ - firstName  │         │
│  │ - password   │  │ - schoolId   │  │ - lastName   │         │
│  │ - role       │  │ - title      │  │ - studentId  │         │
│  │ - schoolId   │  │ - status     │  │ - schoolId   │         │
│  │ - require    │  │ - scheduled  │  │ - grade      │         │
│  │   PwdChange  │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ schools      │  │ notifications│                           │
│  │ - name       │  │ - title/     │                           │
│  │ - nameTh     │  │   titleTh    │                           │
│  │ - moderator  │  │ - message/   │                           │
│  │   Id         │  │   messageTh  │                           │
│  │              │  │ - type       │                           │
│  │              │  │ - userId     │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Authentication Flow

```
User enters credentials
         ↓
[LoginForm Component]
         ↓
users.login({ username, password })
         ↓
[Convex Backend - users.ts]
         ↓
Query users table by username
         ↓
Verify password hash
         ↓
Return user data (no password)
         ↓
[Frontend receives user]
         ↓
Check requirePasswordChange flag
         ↓
If true: Show PasswordChangeDialog
If false: Show main app
```

### Class Booking Flow

```
Teacher fills booking form
         ↓
[ClassBooking Component]
         ↓
classes.book({ teacherId, schoolId, title, ... })
         ↓
[Convex Backend - classes.ts]
         ↓
Insert class into database (status: "pending")
         ↓
Query school to get moderatorId
         ↓
Create notification for moderator
         ↓
Insert notification into database
         ↓
[Real-time update triggers]
         ↓
Moderator's NotificationList updates
         ↓
Moderator sees new notification
```

### Password Change Flow

```
User logs in (first time or after reset)
         ↓
Check requirePasswordChange === true
         ↓
Show PasswordChangeDialog
         ↓
User enters current and new password
         ↓
users.changePassword({ userId, currentPassword, newPassword })
         ↓
[Convex Backend - users.ts]
         ↓
Verify current password
         ↓
Hash new password
         ↓
Update user: { passwordHash, requirePasswordChange: false }
         ↓
Dialog closes, user proceeds to app
```

### Student Creation with Unique ID

```
User enters student details
         ↓
students.create({ firstName, lastName, schoolId, grade })
         ↓
[Convex Backend - students.ts]
         ↓
Generate unique ID:
  - Extract school hash
  - Extract name hash
  - Add timestamp
  - Add random string
         ↓
Check database for duplicate
         ↓
If duplicate: Regenerate (retry up to 10x)
If unique: Insert student
         ↓
Return { id, studentId }
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────────┐
│                    User Authenticates                   │
└─────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
         role === "admin"?    role === "moderator"?
              ↓                     ↓
             YES                   YES
              ↓                     ↓
    ┌─────────────────┐   ┌─────────────────┐
    │ Admin Dashboard │   │ Mod Dashboard   │
    ├─────────────────┤   ├─────────────────┤
    │ - Users tab     │   │ - Classes tab   │
    │ - Notifications │   │   (school only) │
    │ - Classes       │   │ - Notifications │
    └─────────────────┘   │   (school only) │
                          └─────────────────┘
              ↓
         role === "teacher"?
              ↓
             YES
              ↓
    ┌─────────────────┐
    │ Teacher Dash    │
    ├─────────────────┤
    │ - Classes tab   │
    │   (own only)    │
    │ - Notifications │
    │   (own only)    │
    └─────────────────┘
```

## Notification System Architecture

```
Event Triggers:
┌─────────────────────────────────────────────────┐
│ 1. Class booked by teacher                      │
│ 2. Class acknowledged by moderator              │
│ 3. Class approved by moderator                  │
│ 4. Class rejected by moderator                  │
│ 5. Database initialized                         │
└─────────────────────────────────────────────────┘
                    ↓
           Create Notification
                    ↓
┌─────────────────────────────────────────────────┐
│ notifications.create({                          │
│   title, titleTh,                               │
│   message, messageTh,                           │
│   type: "info"|"success"|"warning"|"error",     │
│   userId: (target user)                         │
│ })                                              │
└─────────────────────────────────────────────────┘
                    ↓
           Insert into Database
                    ↓
        Real-time Update Triggers
                    ↓
┌─────────────────────────────────────────────────┐
│ User's NotificationList Component Updates      │
│ - New notification appears                      │
│ - Unread count increments                       │
│ - Sound/visual alert (if implemented)           │
└─────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────┐
│              Password Storage                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Plain Text Password (user enters)              │
│           ↓                                     │
│  hashPassword() - base64 encoding               │
│           ↓                                     │
│  Hashed Password (stored in database)           │
│                                                 │
│  ⚠️ Current: base64 (simple)                    │
│  🔒 Production: Use bcrypt/argon2               │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         Password Reset Process                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Admin clicks "Reset Password"                  │
│           ↓                                     │
│  users.resetPassword({ userId })                │
│           ↓                                     │
│  Generate: "Teacher" + username                 │
│           ↓                                     │
│  Hash new password                              │
│           ↓                                     │
│  Update: { passwordHash, requirePwdChange }     │
│           ↓                                     │
│  Display password to admin (one time only)      │
│           ↓                                     │
│  Admin shares with user                         │
│                                                 │
│  ❌ Admin CANNOT view existing password         │
│  ✅ Admin CAN reset to known default            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Real-time Update Flow

```
User Action (anywhere)
         ↓
Mutation Function Called
         ↓
Database Modified
         ↓
┌────────────────────────────┐
│ Convex Real-time Engine    │
│ Detects change             │
└────────────────────────────┘
         ↓
Identifies affected queries
         ↓
Re-executes queries
         ↓
Pushes updates to clients
         ↓
┌────────────────────────────┐
│ All Connected Clients      │
│ Receive updates instantly  │
└────────────────────────────┘
         ↓
React Components Re-render
         ↓
UI Updates Automatically

Example:
Teacher books class
    → classes.book() mutation
    → notifications.create() mutation
    → Moderator's useQuery(api.notifications.list) updates
    → Moderator sees new notification
    → All in < 100ms
```

## Technology Stack

```
┌─────────────────────────────────────────┐
│          Frontend Technologies          │
├─────────────────────────────────────────┤
│ • Next.js 15 (App Router)               │
│ • React 19                              │
│ • TypeScript                            │
│ • Tailwind CSS 4                        │
│ • Lucide React (Icons)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Backend Technologies           │
├─────────────────────────────────────────┤
│ • Convex (Database + API)               │
│ • Real-time Subscriptions               │
│ • TypeScript                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│               Deployment                │
├─────────────────────────────────────────┤
│ • Vercel (Frontend)                     │
│ • Convex Cloud (Backend)                │
└─────────────────────────────────────────┘
```

## File Organization

```
Evan-sClassTracker4.5/
│
├── app/
│   ├── layout.tsx          (Root layout + providers)
│   ├── page.tsx            (Main app with auth)
│   └── globals.css         (Global styles)
│
├── components/
│   ├── class-booking.tsx   (Class booking UI)
│   ├── database-init.tsx   (First-time setup)
│   ├── language-switcher.tsx (EN/TH toggle)
│   ├── login-form.tsx      (Authentication)
│   ├── notification-form.tsx (Create notifications)
│   ├── notification-list.tsx (Display notifications)
│   ├── password-change-dialog.tsx (Password change)
│   └── user-management.tsx (User CRUD)
│
├── convex/
│   ├── schema.ts           (Database schema)
│   ├── users.ts            (User auth & management)
│   ├── schools.ts          (School management)
│   ├── classes.ts          (Class booking)
│   ├── students.ts         (Student management)
│   ├── notifications.ts    (Notification system)
│   └── init.ts             (Database initialization)
│
├── lib/
│   ├── convex-provider.tsx (Convex React setup)
│   └── language-context.tsx (i18n context)
│
└── Documentation/
    ├── README.md                   (Quick start)
    ├── FEATURES_DOCUMENTATION.md   (API reference)
    ├── IMPLEMENTATION_SUMMARY.md   (What was built)
    ├── QUICK_REFERENCE.md          (User guide)
    └── ARCHITECTURE.md             (This file)
```
