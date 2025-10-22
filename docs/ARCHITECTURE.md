# System Architecture

## Overview

Bilingual (English/Thai) class tracking system built with **Next.js 15**, **React 19**, **Convex** real-time backend, and **Tailwind v4**. Recent optimizations (Oct 2025) achieved 40-50% faster loads, 10-100x faster queries via N+1 elimination, and native database pagination.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Evan's Class Tracker 4.5                   │
│           Next.js 15 + React 19 + Convex + Tailwind v4          │
│                  🚀 Optimized Oct 2025                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Provider Hierarchy (Load-Bearing - DO NOT REORDER):           │
│  1. ErrorBoundary → 2. ConvexClientProvider →                  │
│  3. DeviceProvider → 4. DataProvider → 5. LanguageProvider     │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Login Page   │  │ Main App     │  │ DB Init      │         │
│  │ - Auth form  │  │ - Dashboard  │  │ - Setup      │         │
│  │ - Validation │  │ - Navigation │  │ - Samples    │         │
│  │ - Toast      │  │ - Role tabs  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ User Mgmt    │  │ Class Book   │  │ Password Chg │         │
│  │ - Create     │  │ - Multi-date │  │ - Forced     │         │
│  │ - Reset      │  │ - Optional   │  │ - Security   │         │
│  │ - Rate Limit │  │   Fields     │  │ - Toast      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Student Mgmt │  │ Edit Modal   │  │ Notification │         │
│  │ - Unique IDs │  │ - Audit      │  │ - Toast      │         │
│  │ - 11 Optional│  │   Trail      │  │ - Bilingual  │         │
│  │   Fields     │  │ - Changes    │  │ - Types      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                        Convex React
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer (Convex)                   │
├─────────────────────────────────────────────────────────────────┤
│  🚀 Performance Patterns: Index-first, No N+1, Pagination       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users.ts     │  │ classes.ts   │  │ students.ts  │         │
│  │ - login()    │  │ - book()     │  │ - create()   │         │
│  │ - create()   │  │ - editClass()│  │ - list()     │         │
│  │ - change     │  │ - acknowledge│  │ - unique ID  │         │
│  │   Password() │  │ - approve()  │  │   generator  │         │
│  │ - custom     │  │ - reject()   │  │ - soft del   │         │
│  │   session    │  │ - audit trail│  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ schools.ts   │  │ notifications│  │ pagination.ts│         │
│  │ - list()     │  │ - create()   │  │ - native     │         │
│  │ - create()   │  │ - list()     │  │   paginate() │         │
│  │ - update     │  │ - markRead() │  │ - efficient  │         │
│  │   Moderator()│  │ - bilingual  │  │   cursor     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ rateLimit.ts │  │ postClassNotes│ │ appUpdates.ts│         │
│  │ - check()    │  │ - feedback   │  │ - announce   │         │
│  │ - validate   │  │ - wizard     │  │ - viewed     │         │
│  │ - 20-30/min  │  │ - teacher    │  │   tracking   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         Real-time Sync
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer (Convex)                    │
├─────────────────────────────────────────────────────────────────┤
│  📊 Indexed queries, soft deletes, bilingual fields             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ users        │  │ classes      │  │ students     │         │
│  │ - username   │  │ - teacherId  │  │ - firstName  │         │
│  │ - password   │  │ - schoolId   │  │ - lastName   │         │
│  │ - role       │  │ - studentId  │  │ - studentId  │         │
│  │ - schoolId   │  │ - status     │  │ - schoolId   │         │
│  │ - require    │  │ - scheduled  │  │ - grade      │         │
│  │   PwdChange  │  │ - isEdited   │  │ - isActive   │         │
│  │ - deviceType │  │ - editHistory│  │ - 11 optional│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ schools      │  │ notifications│  │ locations    │         │
│  │ - name       │  │ - title/     │  │ - name/      │         │
│  │ - nameTh     │  │   titleTh    │  │   nameTh     │         │
│  │ - moderator  │  │ - message/   │  │ - schoolId   │         │
│  │   Id         │  │   messageTh  │  │ - isActive   │         │
│  │              │  │ - type       │  │              │         │
│  │              │  │ - userId     │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ postClassNotes│ │ appUpdates   │                           │
│  │ - classId    │  │ - title/Th   │                           │
│  │ - feedback   │  │ - content/Th │                           │
│  │ - rating     │  │ - isActive   │                           │
│  │ - teacherId  │  │ - viewedBy   │                           │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimizations (Oct 2025)

### Key Achievements

- **40-50% faster initial load** - Code splitting with lazy loading
- **10-100x faster queries** - Eliminated N+1 database queries
- **Native database pagination** - Efficient handling of 10,000+ records
- **Rate limiting** - Protection against abuse (20-30 requests/min)
- **Input validation** - Security improvements on all user inputs
- **Toast notifications** - Modern, non-blocking UI feedback

### Critical Performance Patterns

1. **Index-First Queries**
   - Always use `.withIndex()` to avoid table scans
   - Check `convex/schema.ts` for available indexes
   - Example: `ctx.db.query("classes").withIndex("by_school_and_date", q => q.eq("schoolId", schoolId))`

2. **Batch Fetching (No N+1)**
   - NEVER query inside loops
   - Use batch fetch + lookup map pattern
   - See: `docs/OPTIMIZATION_ANALYSIS_2025.md`

3. **Native Pagination**
   - Use Convex `.paginate()` for large datasets
   - Database-level pagination with cursor support
   - Implementation: `convex/pagination.ts`

4. **Soft Deletes**
   - Use `isActive` boolean flag
   - Never hard delete records
   - Query with `.withIndex("by_active", q => q.eq("isActive", true))`

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

```text
┌─────────────────────────────────────────┐
│          Frontend Technologies          │
├─────────────────────────────────────────┤
│ • Next.js 15 (App Router + Turbopack)   │
│ • React 19                              │
│ • TypeScript 5                          │
│ • Tailwind CSS 4                        │
│ • Lucide React (Icons)                  │
│ • Custom Toast System                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Backend Technologies           │
├─────────────────────────────────────────┤
│ • Convex (Database + API)               │
│ • Real-time Subscriptions               │
│ • TypeScript Edge Functions             │
│ • Rate Limiting & Validation            │
│ • Native Pagination                     │
│ • Custom Session Auth                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Key Features & Patterns        │
├─────────────────────────────────────────┤
│ • Bilingual (EN/TH) First               │
│ • Index-First Queries                   │
│ • Soft Deletes Only                     │
│ • Edit Audit Trails                     │
│ • Multi-Date Booking                    │
│ • Toast Notifications                   │
│ • Collapsible Optional Fields           │
│ • Provider Hierarchy (Load-Bearing)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│               Deployment                │
├─────────────────────────────────────────┤
│ • Vercel (Frontend + Edge Network)      │
│ • Convex Cloud (Backend + Database)     │
│ • Turbopack (Build System)              │
└─────────────────────────────────────────┘
```

## File Organization

```text
Evan-sClassTracker4.5/
│
├── .github/
│   └── copilot-instructions.md (AI agent guidelines)
│
├── app/
│   ├── layout.tsx          (Root layout + critical provider hierarchy)
│   ├── page.tsx            (Main app with auth + modal triggers)
│   └── globals.css         (Global styles)
│
├── components/
│   ├── admin-contact-button.tsx (Admin support)
│   ├── class-booking.tsx   (Multi-date booking + optional fields)
│   ├── database-init.tsx   (First-time setup)
│   ├── desktop-notification-toast.tsx (Toast UI component)
│   ├── edit-class-modal.tsx (Full edit with audit trail)
│   ├── error-boundary.tsx  (Error handling)
│   ├── guardian-dashboard.tsx (Guardian role UI)
│   ├── language-switcher.tsx (EN/TH toggle)
│   ├── location-management.tsx (Location CRUD)
│   ├── login-form.tsx      (Authentication)
│   ├── merge-classes-modal.tsx (Class merging)
│   ├── messaging-hub.tsx   (Teacher messaging)
│   ├── moderator-list-view.tsx (Moderator class list)
│   ├── multi-date-calendar.tsx (Multi-date selection)
│   ├── notification-form.tsx (Create notifications)
│   ├── notification-list.tsx (Display notifications)
│   ├── password-change-dialog.tsx (Password change)
│   ├── post-class-notes-modal.tsx (Feedback wizard)
│   ├── school-management.tsx (School CRUD)
│   ├── student-management.tsx (Student CRUD + 11 optional fields)
│   ├── teacher-activity-dashboard.tsx (Analytics)
│   ├── teacher-helper.tsx  (Helper tools)
│   ├── teacher-logs-manager.tsx (Log management)
│   ├── update-announcement-modal.tsx (Update tracking)
│   ├── user-management.tsx (User CRUD)
│   └── weekly-calendar.tsx (Calendar view)
│
├── convex/
│   ├── schema.ts           (Database schema + indexes)
│   ├── users.ts            (User auth & management)
│   ├── schools.ts          (School management)
│   ├── classes.ts          (Class booking + audit trail)
│   ├── students.ts         (Student management + unique IDs)
│   ├── notifications.ts    (Notification system)
│   ├── messages.ts         (Teacher messaging)
│   ├── locations.ts        (Location management)
│   ├── postClassNotes.ts   (Feedback system)
│   ├── appUpdates.ts       (Update announcements)
│   ├── teacherLogs.ts      (Activity logging)
│   ├── pagination.ts       (Native pagination)
│   ├── rateLimit.ts        (Rate limiting + validation)
│   ├── exports.ts          (Data export functions)
│   ├── search.ts           (Search functionality)
│   ├── simpleAnalytics.ts  (Analytics data)
│   ├── bulkOperations.ts   (Bulk import/export)
│   ├── groups.ts           (Student grouping)
│   ├── crons.ts            (Scheduled tasks)
│   └── init.ts             (Database initialization)
│
├── lib/
│   ├── convex-provider.tsx (Convex React setup)
│   ├── language-context.tsx (i18n context)
│   ├── data-context.tsx    (Shared data layer)
│   ├── device-context.tsx  (Device detection)
│   ├── toast.ts            (Toast notification manager)
│   └── constants.ts        (App constants)
│
└── docs/
    ├── .github/
    │   └── copilot-instructions.md (AI agent guidelines)
    ├── ARCHITECTURE.md             (This file)
    ├── OPTIMIZATION_ANALYSIS_2025.md (Performance improvements)
    ├── FEATURES_DOCUMENTATION.md   (API reference)
    ├── QUICK_REFERENCE.md          (User guide)
    ├── DEPLOYMENT.md               (Deployment guide)
    └── [30+ other documentation files]
```
