# Messaging Hub Redesign - Implementation Notes

## New 5-Tab Structure

### Tab 1: Messages (Inbox)

- Shows all conversations (direct + group)
- Unread message badges
- Click to open conversation
- Most recent messages first

### Tab 2: Available Users

- School selector dropdown
- User list filtered by selected school
- Shows user role (teacher/moderator/admin)
- Click to start 1-on-1 conversation

### Tab 3: Groups

- School-wide groups (default for each school)
- Custom moderator-created groups
- Only moderators can create groups
- Shows group creator

### Tab 4: Moderators

- Quick access to all moderators
- Filterable list
- Direct messaging to moderators

### Tab 5: Admin/Evan

- Special highlighted UI for admin contact
- Priority messaging indicator
- Direct line for urgent matters

## Key Features Added

### Offline Support

- Online/offline indicator in header
- Messages queue when offline
- Auto-send when connection returns
- "Queue Message" button when offline

### Acknowledgement Messages

- Yellow highlighted system messages
- Shows 2-week deletion notice
- Automatically sent on first message

### Better UX

- Tab-based navigation
- Cleaner sidebar
- Better message grouping
- Scroll to bottom on new messages

## Integration Points

- Uses `lib/message-queue.ts` for offline support
- Uses `convex/groups.ts` for group management
- Uses `convex/users.ts` for role-based queries
- Uses `convex/messages.ts` for all messaging
