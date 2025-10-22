# Contact Admin UI & Notification Window - Quick Start Guide

## For Users

### How to Contact Admin
1. Click the **"Contact Admin"** button in the top-right header
2. Choose your request type:
   - General Inquiry
   - Feature Suggestion
   - Bug Report
   - Help Request
   - Notification Window Request (teachers/mods only)
3. Fill in subject and message (at least one language required)
4. Click **"Send Request"**
5. You'll receive a confirmation toast and can track status

### When You See a Notification Window
1. A full-screen overlay will appear with important information
2. Read the personalized greeting and message
3. Check any app updates summary at the bottom (if shown)
4. Click **"OK, I understand"** to acknowledge
5. You won't see that window again

## For Administrators

### Managing Contact Requests
1. Navigate to **"Contact Requests"** tab
2. Use status filter to view: All, Pending, In Progress, Resolved, or Dismissed
3. Click the **manage icon** (checkmark) on any request
4. Add admin notes in English and/or Thai
5. Select new status to update and notify user
6. Or click **delete icon** (trash) to remove request

### Creating Notification Windows
1. Navigate to **"Notification Windows"** tab
2. Click **"Create Window"** button
3. Fill in the form:
   - **Title**: Main heading (bilingual)
   - **Greeting**: Use `{username}` placeholder
   - **Message**: Main content (bilingual)
   - **Target Role**: Choose audience (all/teacher/moderator/admin)
   - **Priority**: 1-10 (higher = shown first)
   - **Show Update Summary**: Toggle to include app updates
4. Click **"Create"**
5. Window becomes active immediately

### Managing Notification Windows
- **Edit**: Click edit icon to modify window
- **Toggle Active/Inactive**: Click power icon
- **Delete**: Click trash icon (removes window and all views)
- **View Count**: Shows how many users have seen the window

## Key Features

### Request Types
- 🔵 **General Inquiry** - General questions or feedback
- 💡 **Feature Suggestion** - Ideas for new features
- 🐛 **Bug Report** - Report issues or bugs
- ❓ **Help Request** - Need assistance
- 🔔 **Notification Window Request** - Request announcement creation

### Status Flow
1. **Pending** → User submitted, waiting for admin review
2. **In Progress** → Admin is working on it
3. **Resolved** → Issue completed, user notified
4. **Dismissed** → Request closed without action, user notified

### Notification Window Features
- ✨ Personalized greetings with user's name
- 🎯 Target specific user roles
- 📊 Optional app updates summary
- 🔢 Priority system for multiple windows
- 👁️ View tracking (one-time display)
- 🌐 Full bilingual support

## Tips & Best Practices

### For Users
- **Be specific**: Provide clear subjects and detailed messages
- **Use both languages**: If possible, fill in both English and Thai
- **Check status**: View your previous requests to see admin responses
- **Don't spam**: Rate limit is 10 requests per 10 minutes

### For Admins
- **Respond promptly**: Users get notified of status changes
- **Use admin notes**: Provide helpful feedback in both languages
- **Set appropriate priority**: Higher priority windows show first
- **Test targeting**: Use role filters to reach specific audiences
- **Keep it concise**: Notification windows should be brief and actionable

## Common Use Cases

### Feature Requests
1. User suggests improvement via "Feature Suggestion"
2. Admin reviews and marks as "In Progress"
3. Once implemented, admin marks as "Resolved" with notes
4. User receives success notification

### Bug Reports
1. User reports issue via "Bug Report"
2. Admin investigates and adds notes
3. Developer fixes issue
4. Admin marks as "Resolved" with fix details
5. User receives notification

### Announcements
1. Admin creates high-priority notification window
2. Sets target to "All users" or specific role
3. Enables "Show Update Summary" if relevant
4. Window displays to all users on next login
5. Users acknowledge and continue

### Help Requests
1. Teacher needs help with feature
2. Submits "Help Request" with details
3. Admin responds with admin notes
4. Admin marks as "Resolved" with solution
5. Teacher receives helpful response

## Troubleshooting

### "Failed to send request"
- Check internet connection
- Ensure at least one language has content
- Wait if rate limit exceeded (10 per 10 minutes)

### "No admin users found"
- Contact system administrator
- Database needs at least one admin user

### Notification window not showing
- Check if you've already viewed it (one-time display)
- Verify your role matches target audience
- Ensure window is set to "active"

### Request not updating
- Verify you're logged in as admin
- Check for network errors in console
- Refresh page and try again

## Technical Details

### Rate Limits
- Contact requests: 10 per 10 minutes per user
- Prevents spam and abuse

### Data Storage
- All requests and windows stored in Convex database
- Soft deletes for audit trail
- Indexed queries for fast retrieval

### Security
- Role verification on all admin operations
- Input validation on all forms
- Rate limiting on submissions

### Performance
- Lazy loading for admin components
- Indexed database queries
- Optimistic UI updates with toast notifications

## Need More Info?

See comprehensive documentation:
- **Feature Documentation**: `/docs/CONTACT_ADMIN_NOTIFICATION_WINDOW.md`
- **Visual Design Guide**: `/docs/CONTACT_ADMIN_UI_VISUAL_GUIDE.md`

## Support

For questions or issues with these features:
1. Use the Contact Admin button to reach administrators
2. Select appropriate request type
3. Provide detailed description of your issue

---

**Implementation Date**: October 22, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
