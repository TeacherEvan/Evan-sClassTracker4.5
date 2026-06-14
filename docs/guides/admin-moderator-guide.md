# Admin & Moderator Feature Guide

**Version**: 4.5.32  
**Last Updated**: December 6, 2025  
**Audience**: System Administrators and School Moderators

---

## Table of Contents

1. [Overview](#overview)
2. [Admin Features](#admin-features)
3. [Moderator Features](#moderator-features)
4. [Schema Changes & Migrations](#schema-changes--migrations)
5. [Analytics System](#analytics-system)
6. [Security & Authorization](#security--authorization)
7. [Common Workflows](#common-workflows)

---

## Overview

This guide covers administrative and moderator-specific features in Evan's Class Tracker 4.5, including recent enhancements to the provider system, analytics dashboard, and authorization model.

### Role Hierarchy

```text
ADMIN (God Mode)
  ↓ Can create and manage
MODERATOR (School-Scoped)
  ↓ Can approve classes for
TEACHER (Multi-School)
  ↓ Can book classes for
STUDENT
```

### Key Principles

- **Admins** have unrestricted access to all features and data
- **Moderators** are strictly scoped to their assigned school
- **Teachers** can work across multiple schools
- **Security** is enforced at both backend and frontend layers

---

## Admin Features

### 1. User Management

**Location**: Admin Dashboard → Users Tab

#### Creating Users

1. Click "Add User" button
2. Fill in required fields:
   - Username (unique identifier)
   - Role (Teacher, Moderator, Admin)
   - School Assignment (for moderators)
3. System generates default password: `Teacher{username}`
4. User must change password on first login

**Example**:

- Username: `john.smith`
- Default Password: `Teacherjohn.smith`

#### Password Management

**Reset Password**:

- Resets user password to default format
- Sets `requirePasswordChange: true`
- User must change on next login
- **Security Note**: Bcrypt users require immediate migration (see [Security](#security--authorization))

**Password Security**:

- PBKDF2 hashing with 100,000 iterations
- SHA-256 algorithm, 32-byte hash, 16-byte salt
- No minimum requirements (user choice)
- Account lockout: 5 failed attempts → 24-hour lock

#### User Deletion

**Bulk Deletion**:

- Select multiple users via checkboxes
- Confirmation dialog required
- Cascading effects on related data
- **Critical**: Audit logs remain intact

### 2. School Management

**Location**: Admin Dashboard → Schools Tab

#### Creating Schools

1. Click "Add School" button
2. Fill bilingual names:
   - **English**: "Bangkok International School"
   - **Thai**: "โรงเรียนนานาชาติกรุงเทพ"
3. Assign moderator (optional)
4. Submit

#### Moderator Assignment

**Rules**:

- One moderator per school (recommended)
- Moderators can manage multiple schools (not recommended)
- Unassigned schools have no approval workflow
- Assignment can be changed anytime

**Impact of Assignment**:

- Moderator gains access to school's data
- Classes require moderator approval
- Analytics become school-scoped

### 3. Provider Management

**NEW**: October 2025 - Provider System

**Location**: Admin Dashboard → Providers Tab

#### Provider Categories

1. **Personal** - Teacher's private students
2. **Private** - Private tutoring company
3. **Language School** - Language centers
4. **Educational Camp** - Camps/workshops
5. **Guardian** (NEW) - Replaces guardian user role

#### Creating Providers

```typescript
{
  name: "ABC Language Center",     // English
  nameTh: "ศูนย์ภาษา ABC",         // Thai
  category: "language_school",
  createdBy: userId,
  isActive: true
}
```

**Key Features**:

- Auto-approval for provider classes (bypasses moderator)
- XOR validation: Must have EITHER schoolId OR providerId
- Soft delete support (isActive flag)

### 4. Location Management

**Location Proposal Workflow**:

1. Teachers propose new locations
2. Admin reviews proposals
3. Admin approves/rejects with bilingual names
4. Approved locations appear in dropdowns

**Bilingual Requirement**:

- Both English and Thai names required
- Validation: At least one language must be filled
- Pattern: `&&` (AND) logic for optional fields

### 5. Analytics Dashboard

**NEW**: November 2025 - Admin Analytics

**Location**: Admin Dashboard → Analytics Tab

#### System-Wide Metrics

**Summary Cards**:

- Total Schools count
- Total Teachers count
- Total Classes count
- Completion Rate percentage

**Classes by School Table**:

- School name (bilingual)
- Class count per school
- Attendance rate
- Active students

**Export Functionality**:

- CSV download with bilingual headers
- Filename: `admin-analytics-{date}.csv`
- Includes all aggregated data

### 6. Notification Management

#### Creating Notifications

**Types**:

- **Broadcast**: All users
- **School-Specific**: One school only
- **User-Specific**: Individual user

**Bilingual Template**:

```typescript
{
  title: "System Maintenance",
  titleTh: "การบำรุงรักษาระบบ",
  message: "System will be down...",
  messageTh: "ระบบจะหยุดทำงาน...",
  type: "warning", // success/info/warning/error
  userId: optional // null for broadcast
}
```

**Automated Notifications**:

- Class booked → Moderator notified
- Class acknowledged → Teacher notified
- Class approved/rejected → Teacher notified

### 7. Audit & Monitoring

#### Audit Logs

**Location**: Admin Dashboard → Audit Logs

**Tracked Actions**:

- User creation/deletion
- Class approval/rejection
- Password resets
- School assignments
- Provider creation

**Log Fields**:

- Timestamp
- User ID
- Action type
- Target entity
- Details (JSON)

#### Error Reports

**Location**: Admin Dashboard → Error Reports

**Client-Side Errors**:

- Stack traces
- Browser context
- User actions
- Timestamp
- Error message

**Resolution Workflow**:

1. Review error details
2. Reproduce issue
3. Fix and deploy
4. Mark as resolved

---

## Moderator Features

### 1. School-Scoped Dashboard

**Critical**: Moderators see ONLY their assigned school's data

#### What Moderators Can Access

✅ **Allowed**:

- Classes at assigned school
- Students at assigned school
- Teachers teaching at assigned school
- School-specific analytics
- Approval workflow

❌ **Blocked**:

- Other schools' classes
- Other schools' students
- Provider classes
- Admin functions
- Cross-school booking

### 2. Class Approval Workflow

**Location**: Moderator Dashboard → Classes Tab

#### Workflow Steps

```text
1. Teacher books class
   ↓
2. Status: PENDING (yellow)
   ↓
3. Moderator acknowledges (blue)
   ↓
4. Moderator reviews details
   ↓
5. Moderator approves/rejects
   ↓
6. Status: APPROVED (green) or REJECTED (red)
   ↓
7. Teacher notified
```

#### Approval Actions

**Acknowledge**:

- Changes status to "acknowledged"
- Shows moderator has seen request
- Teacher receives notification
- No approval/rejection yet

**Approve**:

- Changes status to "approved"
- Class confirmed for scheduled date
- Teacher receives approval notification
- Auto-completion after class date

**Reject**:

- Changes status to "rejected"
- Requires reason (bilingual optional)
- Teacher receives rejection notification
- Class marked as rejected

#### UI Restrictions

**School Dropdown**:

- **Locked** (disabled: true)
- Pre-filled with assigned school
- Cannot be changed
- Visual feedback: opacity-75, cursor-not-allowed

**Provider Section**:

- **Hidden** from moderator view
- Moderators cannot create provider classes
- Backend enforces restriction

### 3. Moderator Analytics

**NEW**: November 2025 - School-Scoped Analytics

**Location**: Moderator Dashboard → Analytics Tab

#### Available Metrics

**Summary Cards**:

- Total Classes (school-only)
- Attendance Rate (school-only)
- Active Students (school-only)
- Avg Class Size (school-only)

**Student Performance Table**:

- Student name
- Total classes attended
- Attendance rate (color-coded)
- Performance rating (Excellent/Good/Needs Improvement)

**Date Range Filter**:

- Start date selector
- End date selector
- Defaults to last 30 days

**Export**:

- CSV download with school prefix
- Filename: `{school-name}-analytics-{date}.csv`

#### Performance Ratings

- **Excellent** (≥90%): Green badge
- **Good** (70-89%): Blue badge
- **Needs Improvement** (<70%): Yellow badge

### 4. Messaging System

**Send Messages**:

- To teachers at assigned school
- Bilingual message support
- Group messages available
- Individual messages available

**Receive Messages**:

- From teachers
- From admin (broadcast)
- Real-time notifications

### 5. Student Management

**NEW**: November 2025 - Moderator Student Access

**Allowed Operations**:

- View students at assigned school
- Edit student details (school-linked only)
- Filter by grade/class
- Export student list

**Restricted Operations**:

- Cannot create students (admin-only)
- Cannot delete students (admin-only)
- Cannot access guardian-linked students
- Cannot transfer students to other schools

---

## Schema Changes & Migrations

### 1. Provider System Migration (October 2025)

**Status**: ✅ COMPLETE

#### Before (Guardian Role)

```typescript
users: {
  role: "teacher" | "moderator" | "admin" | "guardian";
}
```

#### After (Provider System)

```typescript
users: {
  role: "teacher" | "moderator" | "admin" | "guardian" // DEPRECATED
}

providers: {
  name: string,
  nameTh: string,
  category: "personal" | "private" | "language_school" | "educational_camp" | "guardian"
}

classes: {
  schoolId?: Id<"schools">, // Optional
  providerId?: Id<"providers"> // Optional
  // XOR validation: Must have one, not both
}
```

**Migration Steps**:

1. Provider table created
2. Guardian users migrated to provider category
3. Classes updated with providerId
4. Students linked to providers
5. Guardian role marked deprecated

**Impact**:

- Guardian role no longer used for new users
- Existing guardian users auto-migrate on login
- Classes bypass moderator approval when using providerId

### 2. Password Hashing Migration (November 2025)

**Status**: 🔴 **CRITICAL - Migration Required**

#### Before (bcrypt)

```typescript
passwordHash: bcrypt.hash(password, 10);
```

#### After (PBKDF2)

```typescript
passwordHash: await pbkdf2Hash(password);
// 100,000 iterations, SHA-256, 32-byte hash
```

**Critical Issue**:

- Bcrypt hashes cannot be verified in Convex runtime
- **ANY password works for bcrypt users** (temporary bypass)
- Migration tool created: `scripts/migrate-bcrypt-passwords.ps1`

**Migration Required**:

1. Run: `.\scripts\migrate-bcrypt-passwords.ps1`
2. All bcrypt users reset to `Teacher{username}`
3. Users forced to change password on first login
4. Auto-upgrade to PBKDF2 on password change

**Timeline**:

- PBKDF2 deployed: November 2, 2025
- Bcrypt issue discovered: November 9, 2025
- Migration tool created: November 9, 2025
- **TODO**: Run migration immediately

### 3. Session Management (October 2025)

**Added**:

- 24-hour session expiration
- Account lockout after 5 failed attempts
- Login history tracking (last 10 logins)

**Schema Fields**:

```typescript
users: {
  failedLoginAttempts?: number,
  accountLockedUntil?: number,
  lastSuccessfulLogin?: number,
  loginHistory?: Array<{
    timestamp: number,
    userAgent: string,
    deviceType: string,
    platform: string,
    browser: string
  }>
}
```

---

## Analytics System

### 1. Backend (convex/analytics.ts)

**Two Query Functions**:

#### getSummaryAnalytics

**Parameters**:

- `userId`: Current user ID
- `dateRange`: { start: number, end: number }

**Returns**:

```typescript
{
  totalClasses: number,
  attendanceRate: number,
  activeStudents: number,
  avgClassSize: number
}
```

**Role-Based Filtering**:

- **Admin**: All schools
- **Moderator**: Assigned school only
- **Teacher**: Own classes only

**Performance**:

- Index-based queries
- Batch fetching (Promise.all)
- Map-based lookups (O(1))

#### getStudentPerformance

**Parameters**:

- `userId`: Current user ID
- `dateRange`: { start: number, end: number }

**Returns**:

```typescript
Array<{
  studentId: Id<"students">;
  studentName: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number;
  avgClassSize: number;
  performanceRating: "excellent" | "good" | "needs_improvement";
}>;
```

**Performance Rating Logic**:

```typescript
if (attendanceRate >= 0.9) return "excellent";
if (attendanceRate >= 0.7) return "good";
return "needs_improvement";
```

### 2. Frontend (components/class-analytics.tsx)

**Component Structure**:

- Summary Cards (4 gradient cards)
- Date Range Selector
- Student Performance Table
- Export to CSV button

**Features**:

- Loading states
- Empty states
- Bilingual support
- Dark mode compatible
- Responsive design

### 3. Admin Analytics (components/admin-analytics-dashboard.tsx)

**NEW**: November 2025

**System-Wide View**:

- All schools aggregated
- Total teachers count
- Total classes count
- Completion rate
- Classes by school breakdown

**Export Format**:

```csv
School,Total Classes,Attendance Rate,Active Students
"Bangkok International",245,87.5%,42
"Chiang Mai Academy",189,92.3%,38
```

---

## Security & Authorization

### 1. Moderator Authorization Model

**Enforcement Layers**:

#### Layer 1: Backend Authorization

**File**: `convex/classes.ts` - `book` mutation

```typescript
// STRICT MODERATOR SCHOOL SCOPING (Nov 1, 2025)
if (bookingUser.role === "moderator") {
  // Moderator must have assigned school
  if (!bookingUser.schoolId) {
    throw new Error("Moderator account must have an assigned school");
  }

  // School ID must match
  if (args.schoolId && args.schoolId !== bookingUser.schoolId) {
    throw new Error(`Authorization failed: Moderators can only book classes at their assigned school`);
  }

  // Cannot create provider classes
  if (args.providerId) {
    throw new Error("Moderators cannot create provider classes");
  }
}
```

**Error Messages**:

```text
Authorization failed: Moderators can only book classes at their assigned school.
Your school: Sangsom Kindergarten (k1xyz789abc).
Attempted school: Bangkok International (k2def456ghi).
```

#### Layer 2: Frontend UI Lock

**File**: `components/class-booking.tsx`

```tsx
<select
  id="school"
  value={schoolId}
  disabled={true} // Permanently locked for moderators
  className="opacity-75 cursor-not-allowed"
>
```

#### Layer 3: Query Filtering

**All Queries**:

- Automatically filter by moderator's schoolId
- No manual filtering required
- Enforced at database level

**Example**:

```typescript
// Moderator query (auto-filtered)
const classes = await ctx.db
  .query("classes")
  .withIndex("by_school", (q) => q.eq("schoolId", user.schoolId))
  .collect();
```

### 2. Password Security

**PBKDF2 Implementation**:

- 100,000 iterations (100x stronger than bcrypt)
- SHA-256 algorithm
- 32-byte hash output
- 16-byte random salt
- Web Crypto API (Convex-compatible)

**Account Lockout**:

- 5 failed attempts
- 24-hour lockout period
- Automatic unlock after expiry
- Login history tracking

**Session Management**:

- 24-hour expiration
- localStorage storage (private deployment)
- Explicit userId passing
- No automatic renewal

### 3. Access Control Matrix

| Feature                   | Admin | Moderator       | Teacher      |
| ------------------------- | ----- | --------------- | ------------ |
| Create Users              | ✅    | ❌              | ❌           |
| Assign Moderators         | ✅    | ❌              | ❌           |
| Create Schools            | ✅    | ❌              | ❌           |
| Create Providers          | ✅    | ❌              | ✅           |
| Book Classes (Any School) | ✅    | ❌              | ✅           |
| Book Classes (Own School) | ✅    | ✅              | ✅           |
| Approve Classes           | ✅    | ✅ (own school) | ❌           |
| View All Analytics        | ✅    | ❌              | ❌           |
| View School Analytics     | ✅    | ✅ (own school) | ❌           |
| View Own Analytics        | ✅    | ✅              | ✅           |
| Manage Students           | ✅    | ⚠️ (view only)  | ⚠️ (limited) |
| Send Broadcasts           | ✅    | ❌              | ❌           |
| Send School Messages      | ✅    | ✅ (own school) | ❌           |

---

## Common Workflows

### 1. Onboarding New Moderator

**Admin Steps**:

1. Create moderator user account
2. Assign to specific school
3. Send credentials to moderator
4. Monitor first login

**Moderator Steps**:

1. Login with credentials
2. Change password (forced)
3. View startup window
4. Explore school-scoped dashboard
5. Review pending classes

**Validation**:

- [ ] Moderator can only see assigned school
- [ ] School dropdown is locked
- [ ] Analytics show only school data
- [ ] Cannot approve other schools' classes

### 2. Class Approval Process

**Teacher**:

1. Book class via Booking Wizard
2. Select school, student, date
3. Submit booking
4. Status: PENDING (yellow)

**System**:

1. Create notification for moderator
2. Send to assigned school's moderator
3. Update class status

**Moderator**:

1. Receive notification
2. Navigate to Classes tab
3. Review class details
4. Click "Acknowledge" (optional)
5. Click "Approve" or "Reject"
6. Add reason if rejecting (bilingual)

**Teacher**:

1. Receive approval/rejection notification
2. View updated status
3. Proceed or rebook if rejected

### 3. Generating Analytics Reports

**Moderator Steps**:

1. Navigate to Analytics tab
2. Select date range (default: last 30 days)
3. Review summary cards
4. Scroll to student performance table
5. Click "Export CSV" for records
6. Open detailed analytics modal for charts

**Admin Steps**:

1. Navigate to Admin Analytics
2. View system-wide summary
3. Review classes by school table
4. Export aggregated data
5. Share with stakeholders

### 4. Provider Class Creation

**Teacher Steps**:

1. Navigate to Class Booking
2. Select "Provider" instead of "School"
3. Choose provider from dropdown
4. Fill class details
5. Submit

**System**:

1. Validate XOR (no schoolId if providerId)
2. Auto-approve class (bypass moderator)
3. Set status: APPROVED (green)
4. Notify teacher of confirmation

**Result**:

- No moderator approval needed
- Class immediately confirmed
- Provider-linked student notified

### 5. Merge Duplicate Classes

**Moderator/Teacher Steps**:

1. Navigate to Classes tab
2. Filter by recurring group
3. Select duplicate classes
4. Click "Merge Classes" button
5. Review merge preview
6. Confirm merge

**System**:

1. Combine class records
2. Preserve attendance data
3. Update status to merged
4. Log audit trail

### 6. Password Reset Workflow

**Admin Steps**:

1. Navigate to User Management
2. Find user account
3. Click "Reset Password"
4. Confirm action

**System**:

1. Reset password to `Teacher{username}`
2. Set `requirePasswordChange: true`
3. Log password reset in audit

**User**:

1. Login with reset password
2. Forced to change password
3. Enter new password (twice)
4. Auto-upgrade to PBKDF2 hash
5. Continue to dashboard

---

## Best Practices

### For Admins

1. **User Management**:
   - Create moderators before assigning schools
   - Use consistent username format
   - Monitor failed login attempts
   - Run bcrypt migration immediately

2. **School Management**:
   - Assign one moderator per school
   - Use bilingual names consistently
   - Review unassigned schools regularly
   - Monitor school activity

3. **Security**:
   - Review audit logs weekly
   - Monitor error reports
   - Update documentation
   - Communicate system changes

### For Moderators

1. **Class Approval**:
   - Acknowledge classes promptly
   - Provide clear rejection reasons (bilingual)
   - Review class details thoroughly
   - Monitor approval metrics

2. **Communication**:
   - Send group messages when appropriate
   - Use bilingual messages
   - Respond to teacher inquiries
   - Escalate issues to admin

3. **Analytics**:
   - Review weekly performance
   - Export data for records
   - Share insights with teachers
   - Track attendance trends

---

## Troubleshooting

### Common Issues

**Issue**: Moderator can't see any classes

**Solution**:

- Verify moderator has assigned schoolId
- Check classes exist at that school
- Verify date range filter
- Check class status filters

---

**Issue**: School dropdown is not locked for moderator

**Solution**:

- Check user role in database
- Verify frontend component version
- Clear browser cache
- Report bug to admin

---

**Issue**: Analytics show no data

**Solution**:

- Verify date range includes classes
- Check classes have attended status
- Verify user permissions
- Refresh page

---

**Issue**: Cannot approve classes from other schools

**Solution**:

- This is expected behavior (security)
- Moderators are school-scoped
- Contact admin if school assignment is wrong

---

## Additional Resources

- **Architecture Documentation**: `.github/copilot-docs/02-architecture.md`
- **Security Considerations**: `.github/copilot-docs/05-security.md`
- **Non-Negotiable Patterns**: `.github/copilot-docs/03-patterns.md`
- **Feature Documentation**: `docs/features/FEATURES_DOCUMENTATION.md`
- **Implementation Summaries**: `docs/archive/implementations/`

---

**Document Version**: 1.0.0  
**System Version**: 4.5.32  
**Last Updated**: December 6, 2025
