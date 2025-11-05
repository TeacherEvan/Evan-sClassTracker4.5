# Contact Admin & Notification Window System

**Feature**: Professional communication system between users and administrators  
**Implemented**: October 22, 2025  
**Components**: Contact Request System + Notification Window Delivery

---

## Quick Start

### For Users

#### How to Contact Admin

1. Click **"Contact Admin"** button in top-right header
2. Choose your request type:
   - 🔵 General Inquiry - Questions or feedback
   - 💡 Feature Suggestion - Ideas for new features
   - 🐛 Bug Report - Report issues or bugs
   - ❓ Help Request - Need assistance
   - 🔔 Notification Window Request (teachers/mods only)
3. Fill in subject and message (at least one language required)
4. Click **"Send Request"**
5. Receive confirmation toast and track status

#### When You See a Notification Window

1. Full-screen overlay appears with important information
2. Read personalized greeting and message
3. Check app updates summary (if shown)
4. Click **"OK, I understand"** to acknowledge
5. Won't show again to you

### For Administrators

#### Managing Contact Requests

1. Navigate to **"Contact Requests"** tab
2. Filter by status: All, Pending, In Progress, Resolved, Dismissed
3. Click **manage icon** (checkmark) to:
   - Add admin notes (bilingual)
   - Update status and notify user
4. Or click **delete icon** (trash) to remove

#### Creating Notification Windows

1. Navigate to **"Notification Windows"** tab
2. Click **"Create Window"**
3. Fill form:
   - **Title**: Main heading (bilingual)
   - **Greeting**: Use `{username}` placeholder
   - **Message**: Main content (bilingual)
   - **Target Role**: all/teacher/moderator/admin
   - **Priority**: 1-10 (higher shown first)
   - **Show Update Summary**: Toggle for app updates
4. Click **"Create"** → Active immediately

---

## Implementation Details

### Architecture

**Backend** (`convex/`):

- `adminContactRequests.ts` - CRUD + notifications
- `notificationWindows.ts` - Window management + view tracking
- Schema: `adminContactRequests`, `notificationWindows`, `notificationWindowViews`

**Frontend** (`components/`):

- `admin-contact-button.tsx` - User-facing request modal
- `admin-contact-requests.tsx` - Admin management panel
- `admin-notification-windows.tsx` - Window creation/editing
- `desktop-notification-window.tsx` - Display overlay

### Request Types

| Type | Icon | Who Can Use | Description |
|------|------|-------------|-------------|
| General Inquiry | MessageSquare | All | Questions/feedback |
| Feature Suggestion | Lightbulb | All | New feature ideas |
| Bug Report | Bug | All | Report issues |
| Help Request | HelpCircle | All | Assistance needed |
| Notification Window | Bell | Teacher/Mod only | Request announcement |

### Status Flow

```
Pending → In Progress → Resolved/Dismissed
  ↓          ↓              ↓
User      Admin         User notified
submits   working       final status
```

**Status Types**:

- **Pending**: Awaiting admin review
- **In Progress**: Admin working on it
- **Resolved**: Completed, user notified
- **Dismissed**: Closed without action, user notified

### Notification Window Features

- ✨ **Personalized greetings**: `{username}` → actual username
- 🎯 **Role targeting**: All, Teacher, Moderator, Admin
- 📊 **App updates summary**: Optional recent changes display
- 🔢 **Priority system**: 1-10 scale (higher shown first)
- 👁️ **View tracking**: One-time display per user
- 🌐 **Bilingual**: Full English/Thai support
- 🔒 **Security**: Admin-only creation/editing

---

## UI Design

### Contact Admin Button

**Location**: Top-right header  
**Design**:

- Gradient: Orange (#F97316) to Red (#EF4444)
- White text with MessageCircle icon
- Rounded corners, shadow effects
- Hover: Enhanced shadow

### Contact Modal Dialog

#### Header

- Full-width gradient (orange-500 → red-500)
- White 2xl text
- MessageCircle icon (w-7 h-7)
- Close button (top-right)

#### User Info Card

- Light blue gradient background
- Shows: "Submitting as: [username] (role)"
- Bold blue-600 username

#### Request Type Grid

**Layout**: 2 columns (mobile), 3 columns (desktop)

**Button States**:

- **Unselected**: Gray border, no background
- **Selected**: Colored background + border + shadow
- **Hover**: Border color change, shadow

**Type Colors**:

- General Inquiry: Gray
- Feature Suggestion: Yellow-600
- Bug Report: Red-600
- Help Request: Blue-600
- Notification Window: Indigo-600

#### Form Fields

- **Subject**: English + Thai inputs
- **Message**: Large textareas (5 rows each)
- **Styling**: Rounded-xl, orange-500 focus ring
- **Validation**: Required fields marked with red asterisk

#### Footer

- Gray-50 background
- **Cancel**: Border-only gray button
- **Send Request**: Orange-to-red gradient, Send icon
- **Loading**: "Sending..." disabled state

### Notification Window Overlay

#### Backdrop

- Full screen coverage
- Black 70% opacity
- Backdrop blur effect

#### Modal Container

- Centered on screen
- White background (dark mode: dark-gray)
- Max width 2xl (tablet), 3xl (desktop)
- Rounded-2xl corners
- Large shadow

#### Header Design

- Gradient: Indigo → Purple → Pink
- White text, 3xl size
- BellRing icon (animated)
- Subtle pulse animation

#### Content Sections

1. **Greeting**: Large font, personalized
2. **Message**: Well-spaced paragraphs
3. **Update Summary** (optional):
   - Light background card
   - Feature list with icons
   - Version number

#### Action Button

- Full-width on mobile
- Orange-to-red gradient
- Large padding, shadow
- Text: "OK, I understand"

---

## Rate Limiting & Security

### Rate Limits

- **Contact Requests**: 10 per 10 minutes per user
- **Prevents**: Spam and abuse

### Security Measures

- **Admin-only**: Notification window creation
- **Role verification**: Request type restrictions
- **Input validation**: Required field checks
- **Bilingual requirement**: At least one language

### Data Privacy

- **View tracking**: Only stores user ID + window ID + timestamp
- **Admin notes**: Only visible to admins
- **User data**: Subject/message stored securely

---

## Common Use Cases

### Feature Request Flow

1. User submits "Feature Suggestion"
2. Admin reviews, marks "In Progress"
3. Feature implemented
4. Admin marks "Resolved" with notes
5. User receives success notification

### Bug Report Flow

1. User reports via "Bug Report"
2. Admin investigates, marks "In Progress"
3. Bug fixed
4. Admin marks "Resolved", explains fix
5. User notified

### Announcement Creation

1. Admin creates notification window
2. Sets target role (e.g., all teachers)
3. Includes app update summary
4. Sets high priority (8/10)
5. Users see on next login

### Emergency Notice

1. Critical issue occurs
2. Admin creates high-priority window (10/10)
3. Targets all users
4. Personalized urgent message
5. All users see immediately

---

## Best Practices

### For Users

- ✅ **Be specific**: Clear subjects, detailed messages
- ✅ **Bilingual**: Fill both languages when possible
- ✅ **Check status**: View previous requests
- ❌ **Don't spam**: Respect 10/10min rate limit

### For Admins

- ✅ **Respond promptly**: Users get status change notifications
- ✅ **Use admin notes**: Provide helpful feedback (bilingual)
- ✅ **Appropriate priority**: Higher = shows first
- ✅ **Test targeting**: Use role filters effectively
- ✅ **Concise windows**: Brief, actionable messages
- ❌ **Don't overuse**: Too many windows = user fatigue

---

## Technical Reference

### Database Schema

**adminContactRequests**:

```typescript
{
  userId: Id<"users">;
  requestType: "general_inquiry" | "feature_suggestion" | "bug_report" | 
               "help_request" | "notification_window_request";
  subject: string;
  subjectTh: string;
  message: string;
  messageTh: string;
  status: "pending" | "in_progress" | "resolved" | "dismissed";
  adminNotes?: string;
  adminNotesTh?: string;
  createdAt: number;
  updatedAt: number;
}
```

**notificationWindows**:

```typescript
{
  title: string;
  titleTh: string;
  greeting: string;          // Can use {username} placeholder
  greetingTh: string;
  message: string;
  messageTh: string;
  targetRole: "all" | "teacher" | "moderator" | "admin";
  priority: number;          // 1-10
  isActive: boolean;
  showUpdateSummary: boolean;
  createdAt: number;
  createdBy: Id<"users">;
}
```

**notificationWindowViews**:

```typescript
{
  windowId: Id<"notificationWindows">;
  userId: Id<"users">;
  viewedAt: number;
}
```

### Key Mutations

**Contact Requests**:

- `create` - Submit new request
- `list` - Get all requests (admin only)
- `updateStatus` - Change status + notify user
- `remove` - Delete request

**Notification Windows**:

- `create` - Create new window
- `update` - Edit existing window
- `toggleActive` - Enable/disable window
- `remove` - Delete window + views
- `getActiveForUser` - Get unviewed windows for user
- `markAsViewed` - Record user view

### Indexes

```typescript
// adminContactRequests
.index("by_user", ["userId"])
.index("by_status", ["status"])
.index("by_created_at", ["createdAt"])

// notificationWindows
.index("by_active", ["isActive"])
.index("by_priority", ["priority"])
.index("by_target_role", ["targetRole"])

// notificationWindowViews
.index("by_window", ["windowId"])
.index("by_user", ["userId"])
.index("by_window_and_user", ["windowId", "userId"])
```

---

## Troubleshooting

### User Issues

**"Can't submit request"**

- Check: At least one language filled
- Check: Request type selected
- Check: Not hitting rate limit (10/10min)

**"Notification window won't dismiss"**

- Click "OK, I understand" button
- Window auto-hides after click
- Won't show again

### Admin Issues

**"Window not appearing for users"**

- Check: `isActive` = true
- Check: Target role matches users
- Check: Users haven't viewed it before

**"Can't delete request"**

- Admin-only action
- Check role permissions

---

## Future Enhancements

**Planned**:

- 📧 Email notifications for contact requests
- 📎 File attachments for bug reports
- 🔔 In-app notification bell with badge count
- 📊 Analytics dashboard for request trends
- 🔍 Advanced search/filtering
- 📱 Push notifications (mobile)

**Under Consideration**:

- Canned responses for admins
- Request escalation system
- Public knowledge base integration
- Multi-admin assignment

---

## Related Documentation

- [GOLD_TABLET_NOTIFICATION_WINDOW.md](GOLD_TABLET_NOTIFICATION_WINDOW.md) - Gold Tablet variant
- [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md) - Admin action logging
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md) - Complete API reference

---

**Last Updated**: October 24, 2025  
**Status**: Production-ready ✅  
**Maintained by**: TeacherEvan
