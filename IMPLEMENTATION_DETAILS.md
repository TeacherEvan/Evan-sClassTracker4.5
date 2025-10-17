# Logo and Student Request Feature Implementation

## Overview
This document provides a visual guide and technical details for the new logo design and teacher student request feature.

## 1. Logo Design

### Design Philosophy
- **Stoic & Intellectual**: Uses Playfair Display serif font for classic, scholarly appearance
- **Professional**: Clean, minimalist design that reflects educational professionalism
- **Branded**: Consistent identity with memorable slogan
- **Animated**: Subtle pulsating effect draws attention without being distracting

### Logo Component Structure
```tsx
<Logo size="sm" | "md" | "lg" showSlogan={boolean} />
```

**Sizes:**
- `sm`: Header logo (text-xl/2xl, no slogan by default)
- `md`: Login page (text-3xl/4xl, with slogan)
- `lg`: Special displays (text-4xl/5xl)

**Slogan Animation:**
```css
@keyframes pulse-gold {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.85; transform: scale(1.02); }
}
```
- Duration: 2 seconds
- Easing: ease-in-out
- Infinite loop
- Gold color: #D4AF37

### Implementation Locations

#### Login Page (`components/login-form.tsx`)
```tsx
<Logo size="md" showSlogan={true} />
```
- Centered in login card
- Full branding experience for first impression
- Includes animated slogan

#### Main Header (`app/page.tsx`)
```tsx
<Logo size="sm" showSlogan={false} />
```
- Compact version without slogan
- Saves vertical space in header
- Still maintains brand identity

### Typography
- **Font**: Playfair Display (loaded from Google Fonts)
- **Weight**: 400 (normal), 700 (bold for title)
- **Letter Spacing**: 0.02em for readability
- **Text Shadow**: Subtle glow on slogan for depth

## 2. Student Request Feature

### Architecture

#### Database Schema
New table: `studentRequests`
```typescript
{
  teacherId: Id<"users">,
  schoolId: Id<"schools">,
  firstName: string,
  lastName: string,
  grade: string,
  notes: string,
  notesTh: string,
  status: "pending" | "approved" | "rejected",
  createdStudentId?: Id<"students">,
  rejectionReason?: string,
  rejectionReasonTh?: string,
  createdAt: number,
  resolvedAt?: number,
  resolvedBy?: Id<"users">
}
```

**Indexes:**
- `by_teacher` - Teacher's requests
- `by_school` - School's requests
- `by_status` - Filter by status
- `by_school_and_status` - Compound index for efficient filtering

#### Backend API (`convex/studentRequests.ts`)

**Queries:**
- `list(teacherId?, schoolId?, status?)` - List requests with filters
- `getById(id)` - Get single request

**Mutations:**
- `create(...)` - Teacher creates request
- `approve(requestId, moderatorId)` - Moderator approves
- `reject(requestId, moderatorId, reason, reasonTh)` - Moderator rejects

**Automatic Actions:**
- Notification to moderator on create
- Notification to teacher on approve/reject
- Student record created on approve
- Activity log entry for all actions

### User Interface

#### Teacher View: `TeacherStudentRequests` Component

**Features:**
- "Request Student" button in header
- Modal form with fields:
  - First Name, Last Name, Grade
  - Notes (English & Thai) - both required
  - School selection (if teacher works at multiple schools)
- Request list with status badges:
  - 🟡 Pending - yellow
  - 🟢 Approved - green
  - 🔴 Rejected - red (with reason)
- Timestamps for submitted and resolved dates
- Bilingual throughout

**Navigation Tab:**
- Icon: `UserPlus` from Lucide React
- Label: "Add Student" / "เพิ่มนักเรียน"
- Visible only to teachers

#### Moderator View: `ModeratorStudentApprovals` Component

**Features:**
- Two tabs: "Pending" and "All Requests"
- Pending count badge on tab
- Request cards showing:
  - Student name and grade
  - Teacher who submitted
  - Notes from teacher
  - Action buttons (Approve/Reject)
- Reject modal with bilingual reason fields
- Success/error messages
- Real-time updates via Convex

**Navigation Tab:**
- Icon: `UserPlus` from Lucide React
- Label: "Student Approvals" / "อนุมัติการเพิ่มนักเรียน"
- Visible only to moderators

### Workflow Diagram

```
Teacher                    Moderator                  System
   |                          |                          |
   |-- Submit Request ------→ |                          |
   |                          |← Notification Sent ------|
   |                          |                          |
   |                          |-- Review Request ------→ |
   |                          |                          |
   |                          |-- Approve -------------→ |
   |                          |                          |-- Create Student
   |← Notification Sent ------|                          |-- Log Action
   |                          |                          |
   |  OR                      |                          |
   |                          |-- Reject (+ reason) ---→ |
   |← Notification Sent ------|                          |-- Log Action
   |                          |                          |
```

### Notification Examples

**To Moderator (on request):**
```
Title: "New Student Request" / "คำขอเพิ่มนักเรียนใหม่"
Message: "Teacher {name} has requested to add a new student: 
          {firstName} {lastName} (Grade {grade}). 
          Please review and approve or reject."
Type: warning (yellow)
```

**To Teacher (on approval):**
```
Title: "Student Request Approved" / "คำขอเพิ่มนักเรียนได้รับการอนุมัติ"
Message: "Your request to add {firstName} {lastName} has been approved. 
          The student has been added to the system."
Type: success (green)
```

**To Teacher (on rejection):**
```
Title: "Student Request Rejected" / "คำขอเพิ่มนักเรียนถูกปฏิเสธ"
Message: "Your request to add {firstName} {lastName} has been rejected. 
          Reason: {reason}"
Type: error (red)
```

### Activity Logging

All actions are logged in `teacherLogs`:
- `student_requested` - Teacher submits request
- `student_approved` - Moderator approves
- `student_rejected` - Moderator rejects

Each log includes:
- Bilingual action description
- Timestamp
- Related teacher and school IDs
- Related student ID (for approved requests)

### Security & Validation

**Teacher Constraints:**
- Can only request students for their assigned school
- Must provide bilingual notes
- Cannot modify request after submission

**Moderator Constraints:**
- Can only see/approve requests for their assigned school
- Must provide bilingual rejection reason
- Cannot approve already-processed requests

**System Constraints:**
- Unique student ID generation (max 10 retries)
- Duplicate status prevented at database level
- Notifications sent only to relevant users

## 3. Bilingual Support

### Translation Pattern
All user-facing text uses the `t()` helper:
```tsx
{t("English text", "ข้อความไทย")}
```

### Bilingual Fields
Database fields requiring both languages:
- `notes` / `notesTh`
- `rejectionReason` / `rejectionReasonTh`
- All notification titles and messages
- All activity log actions and details

### Language Switching
Users can switch between English and Thai at any time:
- Logo displays in both languages
- All UI updates immediately
- Form validation messages in current language
- Notifications display in current language

## 4. Technical Details

### Dependencies
- React 19.1.0
- Next.js 15.5.4
- Convex 1.27.5
- Tailwind CSS v4
- Lucide React (icons)
- Google Fonts (Playfair Display)

### File Structure
```
components/
├── logo.tsx                           # Logo component
├── teacher-student-requests.tsx       # Teacher UI
└── moderator-student-approvals.tsx    # Moderator UI

convex/
├── schema.ts                          # Updated with studentRequests table
└── studentRequests.ts                 # Backend API

app/
├── layout.tsx                         # Updated with Google Fonts
└── page.tsx                           # Updated with new tabs
```

### Performance Considerations
- Real-time updates via Convex subscriptions
- Efficient compound indexes for queries
- Optimistic UI updates for better UX
- Lazy loading of request lists
- Memoized school lookups

## 5. Future Enhancements

### Potential Improvements
1. Bulk student requests
2. Template notes for common scenarios
3. Request history search/filter
4. Export approved requests to CSV
5. Student request analytics
6. Email notifications (in addition to in-app)
7. Request comments/discussion thread
8. Auto-approval based on criteria

### Scalability
- Indexes support efficient queries at scale
- Pagination ready (using existing pagination system)
- Soft deletes possible (add `isActive` flag)
- Archival strategy for old requests

## 6. Troubleshooting

### Common Issues

**Logo not displaying:**
- Check Google Fonts loaded in `app/layout.tsx`
- Verify `components/logo.tsx` imported correctly
- Check browser console for font loading errors

**Student requests not appearing:**
- Verify teacher assigned to a school
- Check Convex connection is active
- Verify `studentRequests.ts` deployed to Convex
- Check browser console for API errors

**Notifications not sent:**
- Verify moderator assigned to school
- Check notification table for entries
- Verify user IDs are correct in request

**Build failures:**
- Ensure Convex schema deployed first
- Run `npx convex dev` to regenerate types
- Check for TypeScript errors in new components

### Debug Mode
Enable debug logging by adding to component:
```tsx
useEffect(() => {
  console.log('Requests:', requests);
  console.log('User:', user);
}, [requests, user]);
```

## 7. Screenshots

_Note: Screenshots would be added here once the application is running and features can be visually captured._

### Planned Screenshots:
1. Login page with new logo and slogan
2. Main header with compact logo
3. Teacher "Add Student" tab - empty state
4. Teacher request form - filled out
5. Teacher request list - multiple statuses
6. Moderator "Student Approvals" tab - pending requests
7. Moderator rejection modal
8. Notification examples
9. Activity log entries
10. Dark mode examples

## 8. Testing Checklist

See `TESTING_GUIDE.md` for comprehensive testing procedures.

Quick verification:
- [ ] Logo appears on login
- [ ] Logo appears in header
- [ ] Slogan animates
- [ ] Teachers see "Add Student" tab
- [ ] Moderators see "Student Approvals" tab
- [ ] Request submission works
- [ ] Notifications sent
- [ ] Approval creates student
- [ ] Rejection sends reason
- [ ] Activity logged
- [ ] Bilingual throughout
- [ ] Dark mode compatible
- [ ] Mobile responsive
