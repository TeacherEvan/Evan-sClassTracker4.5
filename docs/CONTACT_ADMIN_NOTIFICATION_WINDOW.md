# Contact Admin UI and Notification Window - Implementation Documentation

## Overview

This document details the implementation of the enhanced Contact Admin UI and Notification Window features for Evan's Class Tracker 4.5. These features provide a professional, robust communication system between users and administrators, along with a powerful notification delivery system.

## Implementation Date
October 22, 2025

## Features Implemented

### 1. Enhanced Contact Admin UI

#### Purpose
Replaces the simple message-sending dialog with a comprehensive contact request system that categorizes and tracks user requests.

#### Key Features
- **Multiple Request Types**:
  - General Inquiry
  - Feature Suggestion
  - Bug Report
  - Help Request
  - Notification Window Request (for mods/teachers only)

- **Professional Design**:
  - Modern gradient header (orange-to-red)
  - Icon-based type selection with visual feedback
  - Rounded corners and shadow effects
  - Clean, spacious layout
  - Responsive design for all devices

- **Bilingual Support**:
  - Full English/Thai support for all UI elements
  - Separate input fields for both languages
  - Subject and message fields in both languages

- **Request Management**:
  - Automatic notification to all admins when request is submitted
  - Rate limiting (10 requests per 10 minutes)
  - Status tracking (pending, in_progress, resolved, dismissed)
  - Admin notes capability

#### User Experience
1. Non-admin users see "Contact Admin" button in header
2. Clicking opens a large, professional modal dialog
3. User selects request type from visual grid
4. User fills in subject and message (bilingual)
5. Submit button sends request and notifies admins
6. Toast confirmation shown to user

### 2. Notification Window System

#### Purpose
Allows admins to create important announcements that are displayed to users in a modal window upon login or when triggered.

#### Key Features
- **Personalized Greetings**: Uses `{username}` placeholder that gets replaced with actual username
- **Rich Content**: Supports multi-line messages with full bilingual content
- **Update Summary**: Optional display of recent app updates/features
- **Target Filtering**: Can target all users or specific roles (teacher, moderator, admin)
- **Priority System**: Higher priority windows shown first (1-10 scale)
- **View Tracking**: Tracks which users have viewed each window
- **One-Time Display**: Each user sees each window only once

#### User Experience
1. User logs in and sees main app
2. If an unviewed notification window exists, it appears as overlay
3. Beautiful gradient header (indigo-purple-pink)
4. Personalized greeting with user's name
5. Main message content displayed
6. Optional app updates summary at bottom
7. Large "OK, I understand" button to acknowledge
8. Window won't show again to that user

### 3. Admin Management Components

#### Contact Requests Management
Located at: `/components/admin-contact-requests.tsx`

Features:
- View all contact requests with filtering by status
- Color-coded status indicators
- Request type icons for quick identification
- Inline management actions
- Add admin notes (bilingual)
- Change status (pending → in_progress → resolved/dismissed)
- Delete requests
- Automatic user notification on status change

#### Notification Windows Management
Located at: `/components/admin-notification-windows.tsx`

Features:
- Create new notification windows
- Edit existing windows
- Toggle active/inactive status
- Set priority levels
- Choose target audience (all/role-specific)
- Enable/disable update summary
- View count tracking
- Delete windows (cascades to view records)

## Database Schema

### Tables Added

#### 1. adminContactRequests
```typescript
{
  userId: Id<"users">,
  userRole: string,
  username: string,
  requestType: "general" | "feature_suggestion" | "bug_report" | "help_request" | "notification_window_request",
  subject: string,
  subjectTh: string,
  message: string,
  messageTh: string,
  status: "pending" | "in_progress" | "resolved" | "dismissed",
  adminNotes?: string,
  adminNotesTh?: string,
  resolvedBy?: Id<"users">,
  resolvedAt?: number,
  createdAt: number
}
```

Indexes:
- by_user: [userId]
- by_status: [status]
- by_type: [requestType]
- by_created_at: [createdAt]
- by_user_and_status: [userId, status]

#### 2. notificationWindows
```typescript
{
  title: string,
  titleTh: string,
  greeting: string,
  greetingTh: string,
  message: string,
  messageTh: string,
  showUpdateSummary: boolean,
  targetRole?: "all" | "teacher" | "moderator" | "admin",
  isActive: boolean,
  priority: number,
  createdBy: Id<"users">,
  createdAt: number
}
```

Indexes:
- by_active: [isActive]
- by_priority: [priority]
- by_created_at: [createdAt]
- by_active_and_priority: [isActive, priority]

#### 3. notificationWindowViews
```typescript
{
  userId: Id<"users">,
  windowId: Id<"notificationWindows">,
  viewedAt: number
}
```

Indexes:
- by_user: [userId]
- by_window: [windowId]
- by_user_and_window: [userId, windowId]

## Backend Functions

### adminContactRequests.ts
- `list(userId, status?)` - Get all requests (admin only), optionally filtered by status
- `myRequests(userId)` - Get user's own requests
- `create(userId, requestType, subject, subjectTh, message, messageTh)` - Submit new request
- `updateStatus(adminId, requestId, status, adminNotes?, adminNotesTh?)` - Update request status (admin only)
- `remove(adminId, requestId)` - Delete request (admin only)

### notificationWindows.ts
- `getActiveForUser(userId)` - Get highest priority unviewed window for user
- `markAsViewed(userId, windowId)` - Mark window as viewed by user
- `list(userId)` - Get all windows with view counts (admin only)
- `create(...)` - Create new notification window (admin only)
- `update(...)` - Update existing window (admin only)
- `toggleActive(userId, windowId)` - Toggle active status (admin only)
- `remove(userId, windowId)` - Delete window and all view records (admin only)

## UI Components

### 1. AdminContactButton (Enhanced)
File: `/components/admin-contact-button.tsx`

Key Changes:
- Replaced simple message sending with structured contact request system
- Added request type selection grid
- Improved visual design with gradients and icons
- Added subject fields (previously only message)
- Integrated with toast notification system
- Better error handling and user feedback

### 2. NotificationWindow
File: `/components/notification-window.tsx`

Features:
- Full-screen backdrop overlay
- Centered modal with gradient header
- Personalized greeting replacement
- Markdown-style content display
- Conditional update summary section
- Smooth animations (fade + scale)
- One-time display per user

### 3. AdminContactRequests
File: `/components/admin-contact-requests.tsx`

Features:
- Tabbed status filtering
- Color-coded status badges
- Request type icons
- Expandable details with admin notes
- Inline management modal
- Bilingual content display
- Responsive grid layout

### 4. AdminNotificationWindows
File: `/components/admin-notification-windows.tsx`

Features:
- Create/edit modal form
- Active/inactive status toggle
- Priority and target role selection
- View count display
- Update summary toggle
- Bilingual form inputs with placeholders
- Delete confirmation via toast

## Integration Points

### Main Application (app/page.tsx)

Changes made:
1. Added `NotificationWindow` import (core component, not lazy-loaded)
2. Added lazy imports for `AdminContactRequests` and `AdminNotificationWindows`
3. Updated activeTab type to include `"contact_requests"` and `"notification_windows"`
4. Added NotificationWindow component after ToastContainer (renders for all users)
5. Added admin tabs for Contact Requests and Notification Windows
6. Added tab content sections with Suspense wrappers

## Design Patterns Used

### 1. Bilingual-First
Every user-facing string has English and Thai versions. Forms provide parallel input fields.

### 2. Rate Limiting
Contact request submissions are rate-limited to prevent abuse (10 requests per 10 minutes).

### 3. Optimistic UI
Toast notifications provide immediate feedback while backend operations complete.

### 4. Indexed Queries
All database queries use proper indexes for performance.

### 5. View Tracking
Notification windows track views to prevent duplicate displays.

### 6. Cascade Delete
Deleting a notification window also deletes all associated view records.

### 7. Role-Based Access
- Contact requests: Available to all non-admin users
- Admin management: Only accessible to admin role
- Notification window requests: Only shown to teachers and moderators

## Visual Design Philosophy

### Color Scheme
- **Contact Admin**: Orange-to-red gradient (warm, inviting)
- **Notification Windows**: Indigo-purple-pink gradient (professional, eye-catching)
- **Status Indicators**: Semantic colors (green=success, blue=info, yellow=pending, red=error)

### Typography
- Bold headings for hierarchy
- Regular text for content
- Small text for metadata
- Emoji icons for visual appeal

### Layout
- Max-width containers for readability
- Generous padding and spacing
- Rounded corners (xl radius)
- Shadow effects for depth
- Responsive grid layouts

### Interactions
- Hover states on all interactive elements
- Active scale transforms for tactile feedback
- Smooth transitions (300ms duration)
- Toast notifications instead of alerts
- Loading states with spinners

## User Workflows

### Submit Contact Request (Teacher/Moderator)
1. Click "Contact Admin" button in header
2. Select request type from grid
3. Fill in subject (both languages optional)
4. Fill in message (both languages optional)
5. Click "Send Request"
6. See success toast
7. Request appears in admin's Contact Requests tab

### Manage Contact Request (Admin)
1. Navigate to "Contact Requests" tab
2. Filter by status if needed
3. Click manage icon on request
4. Add admin notes (bilingual)
5. Select new status (in_progress, resolved, dismissed)
6. User receives automatic notification

### Create Notification Window (Admin)
1. Navigate to "Notification Windows" tab
2. Click "Create Window" button
3. Fill in title, greeting, message (bilingual)
4. Set target role and priority
5. Toggle "Show Update Summary" if desired
6. Click "Create"
7. Window becomes active and shows to users

### View Notification Window (User)
1. Log in to app
2. See notification window overlay if unviewed window exists
3. Read personalized greeting and message
4. Optionally see app updates summary
5. Click "OK, I understand"
6. Window closes and won't show again

## Performance Considerations

### 1. Lazy Loading
Admin management components are lazy-loaded to reduce initial bundle size.

### 2. Indexed Queries
All database queries use appropriate indexes for fast lookups:
- by_user for user-specific requests
- by_status for filtering
- by_active_and_priority for window selection

### 3. View Tracking
Uses compound index (by_user_and_window) for efficient duplicate checks.

### 4. Rate Limiting
Prevents spam and reduces database load.

## Security Considerations

### 1. Role Verification
All admin mutations verify user role before executing.

### 2. Rate Limiting
Prevents abuse of contact request system.

### 3. Input Validation
All inputs are validated for required fields.

### 4. Soft Errors
Errors are caught and displayed as toasts, not thrown to user.

## Testing Recommendations

### Manual Testing Checklist
- [ ] Submit contact request as teacher
- [ ] Submit contact request as moderator
- [ ] Submit notification window request (should be available)
- [ ] View requests in admin panel
- [ ] Update request status
- [ ] Delete request
- [ ] Create notification window
- [ ] Verify window displays to target users
- [ ] Verify greeting replacement works
- [ ] Verify update summary displays correctly
- [ ] Mark window as viewed
- [ ] Verify window doesn't show again
- [ ] Edit notification window
- [ ] Toggle active/inactive status
- [ ] Delete notification window
- [ ] Test bilingual content in all components

### Edge Cases
- [ ] Empty database (no requests/windows)
- [ ] Multiple active windows (priority ordering)
- [ ] Window with no target role (defaults to "all")
- [ ] Request with only one language filled
- [ ] Rate limit exceeded
- [ ] Non-admin trying to access admin functions

## Future Enhancement Suggestions

### Contact Requests
1. **Email Notifications**: Send email to admins when new request comes in
2. **Attachments**: Allow users to attach screenshots or files
3. **Comments**: Allow back-and-forth conversation on requests
4. **Archiving**: Archive old resolved requests instead of deleting
5. **Analytics**: Track most common request types and resolution times

### Notification Windows
1. **Scheduling**: Schedule windows to activate at specific date/time
2. **Expiration**: Auto-deactivate windows after certain date
3. **Templates**: Pre-defined templates for common announcements
4. **Rich Media**: Support images, videos in messages
5. **Action Buttons**: Add custom action buttons (links, downloads)
6. **A/B Testing**: Create variants and track engagement
7. **Read Receipts**: Track not just views but actual read time

### General
1. **Dashboard Metrics**: Show request volume, resolution times, window engagement
2. **User Feedback**: Allow users to rate helpfulness of admin responses
3. **Quick Replies**: Pre-defined response templates for common requests
4. **Notification Channels**: Integrate with push notifications, SMS
5. **Multi-language Support**: Extend beyond English/Thai

## Maintenance Notes

### Rate Limits
Current rate limits are defined in `convex/adminContactRequests.ts`:
- Contact requests: 10 per 10 minutes per user

To adjust, modify the `checkRateLimit` call in the `create` mutation.

### Indexes
All indexes are defined in `convex/schema.ts`. If adding new query patterns, consider adding appropriate indexes.

### Styling
All components use Tailwind CSS with consistent design tokens:
- Spacing: 2, 3, 4, 6, 8 units
- Rounding: lg, xl, 2xl
- Colors: Using default Tailwind palette
- Dark mode: All components support dark mode

### Bilingual Content
When adding new UI strings:
1. Always provide both English and Thai
2. Use the `t()` function from `useLanguage()` hook
3. Format: `t("English text", "Thai text")`

## Conclusion

This implementation provides a robust, professional system for user-admin communication and important announcements. The design is modern, accessible, and fully bilingual. All features follow the established patterns in the codebase (bilingual-first, indexed queries, rate limiting, toast notifications).

The system is production-ready and can be extended with the suggested enhancements as needs evolve.

## Files Modified/Created

### Created
- `/convex/adminContactRequests.ts` - Backend for contact requests
- `/convex/notificationWindows.ts` - Backend for notification windows
- `/components/admin-contact-requests.tsx` - Admin management UI for requests
- `/components/admin-notification-windows.tsx` - Admin management UI for windows
- `/components/notification-window.tsx` - User-facing notification window component
- `/docs/CONTACT_ADMIN_NOTIFICATION_WINDOW.md` - This documentation

### Modified
- `/convex/schema.ts` - Added 3 new tables
- `/components/admin-contact-button.tsx` - Complete redesign and enhancement
- `/app/page.tsx` - Integration of new components

## Credits

Implemented by: GitHub Copilot AI Agent
Date: October 22, 2025
Project: Evan's Class Tracker 4.5
