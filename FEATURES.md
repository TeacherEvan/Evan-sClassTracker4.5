# Notification System Features

## Overview

The Class Tracker notification system provides a comprehensive, bilingual solution for managing alerts and updates in educational environments.

## Core Features

### 1. Bilingual Support
- **Automatic Language Detection:** The system displays content in the user's selected language
- **Complete Translation:** All UI elements, notifications, and messages are available in both English and Thai
- **Seamless Switching:** Users can toggle between languages instantly without page reload

### 2. Notification Types

#### Info (Blue)
- **Purpose:** General announcements and information
- **Use Cases:**
  - Class schedule updates
  - General school announcements
  - Resource availability
  - Event reminders
- **Visual:** Blue background with blue border

#### Success (Green)
- **Purpose:** Positive updates and achievements
- **Use Cases:**
  - Student achievements
  - Completed assignments
  - Successful submissions
  - Milestone celebrations
- **Visual:** Green background with green border

#### Warning (Yellow)
- **Purpose:** Important reminders and cautionary alerts
- **Use Cases:**
  - Upcoming deadlines
  - Missing assignments
  - Schedule changes
  - Required actions
- **Visual:** Yellow background with yellow border

#### Error (Red)
- **Purpose:** Critical issues requiring immediate attention
- **Use Cases:**
  - System errors
  - Urgent problems
  - Critical deadlines passed
  - Emergency notifications
- **Visual:** Red background with red border

### 3. Notification Management

#### Creating Notifications
1. Fill in both English and Thai titles
2. Add message content in both languages
3. Select the appropriate notification type
4. Click "Create Notification"

**Requirements:**
- All fields are required
- Both language versions must be provided
- Title and message must not be empty

#### Viewing Notifications
- Notifications are displayed in reverse chronological order (newest first)
- Unread notifications have a left border indicator
- Each notification shows:
  - Title (in selected language)
  - Message (in selected language)
  - Timestamp (relative or absolute)
  - Type indicator (color-coded)

#### Managing Notifications
- **Mark as Read:** Click the checkmark icon
- **Delete:** Click the X icon
- **Mark All as Read:** Click the "Mark all as read" button in the header
- **Unread Count:** Displayed in the header badge

### 4. Real-time Updates
- Powered by Convex for instant synchronization
- Changes appear immediately across all connected clients
- No page refresh required

### 5. Responsive Design
- Works on desktop, tablet, and mobile devices
- Adaptive layout for different screen sizes
- Touch-friendly interface for mobile users

### 6. Dark Mode Support
- Automatically adapts to system preferences
- Maintains readability in both light and dark themes
- Color-coded notifications remain distinguishable

## User Interface Components

### Language Switcher
- Located in the top-right corner
- Globe icon with EN/ไทย toggle buttons
- Active language is highlighted in blue

### Notification Form
- Side-by-side English/Thai input fields
- Clear field labels
- Dropdown for notification types
- Large, accessible submit button

### Notification List
- Clean, card-based design
- Color-coded by type
- Timestamp with relative time (e.g., "5 minutes ago")
- Quick action buttons (read/delete)

### Empty State
- Bell icon with message
- Shown when no notifications exist
- Available in both languages

## Technical Features

### Database Schema
```typescript
notifications: {
  title: string          // English title
  titleTh: string       // Thai title
  message: string       // English message
  messageTh: string     // Thai message
  type: "info" | "success" | "warning" | "error"
  userId?: string       // Optional user filtering
  read: boolean         // Read status
  createdAt: number     // Timestamp
}
```

### Indexes
- `by_user`: Filter notifications by user
- `by_created_at`: Sort by creation time
- `by_read`: Filter by read status

### API Functions

#### Queries
- `list`: Get all notifications (with optional user filter)
- `unreadCount`: Get count of unread notifications

#### Mutations
- `create`: Create a new notification
- `markAsRead`: Mark a single notification as read
- `markAllAsRead`: Mark all notifications as read
- `remove`: Delete a notification

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators

## Performance

- Static generation where possible
- Optimized bundle size
- Lazy loading of components
- Efficient database queries
- Minimal re-renders with React

## Future Enhancements

Potential features for future versions:
- Push notifications
- Email notifications
- Notification categories/filters
- Search functionality
- Notification scheduling
- User preferences
- Notification templates
- Analytics and reporting
- Export capabilities
- Batch operations

## Best Practices

### For Administrators
1. Use appropriate notification types
2. Keep messages concise and clear
3. Provide context in both languages
4. Use consistent terminology
5. Avoid notification fatigue

### For Users
1. Regularly check notifications
2. Mark notifications as read after viewing
3. Delete old notifications to keep the list clean
4. Set language preference based on comfort
5. Enable system notifications if available

## Troubleshooting

### Notifications not appearing
- Check Convex connection status
- Verify environment variables are set
- Clear browser cache
- Check browser console for errors

### Language not switching
- Ensure JavaScript is enabled
- Check for console errors
- Refresh the page

### Notifications not saving
- Verify Convex deployment is active
- Check all required fields are filled
- Ensure valid data in all fields
- Check network connectivity

## Support

For issues or feature requests, please create an issue on the GitHub repository.
