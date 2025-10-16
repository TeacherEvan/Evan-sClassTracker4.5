# Visual Guide - New Features

## 🎯 Main App Layout (Updated)

### Header Section
```
┌──────────────────────────────────────────────────────────────────┐
│  Class Tracker                        [Contact Admin] 🌐 [Logout]│
│  Welcome, Teacher123 · Teacher                                   │
└──────────────────────────────────────────────────────────────────┘
```

**New Elements:**
- `[Contact Admin]` - Orange/red gradient button (non-admin only)
- Toast notifications appear in top-right corner on desktop

### Navigation Tabs
```
┌──────────────────────────────────────────────────────────────────┐
│ [📅 Calendar] [📚 Classes] [💬 Messages] [🔔 Notifications]      │
│ [🏫 Schools] [🎓 Students] [🛡️ Moderators] [👥 Users]           │
└──────────────────────────────────────────────────────────────────┘
```

**New Tabs:**
- `💬 Messages` - For all users
- `🛡️ Moderators` - Admin only

## 💬 Messaging Hub

### Layout Structure
```
┌────────────────────────────────────────────────────────────────────┐
│  💬 Messaging Hub                    [Direct] [Group]              │
│  3 unread messages                                                 │
├──────────────┬─────────────────────────────────────────────────────┤
│              │  Chat with: John Smith                              │
│ Available    │  Teacher                                            │
│ Users        ├─────────────────────────────────────────────────────┤
│              │                                                     │
│ [John Smith] │                                        You: Hello!  │
│  Teacher     │                                                     │
│              │  John: Hi there!                                   │
│ [Mary Jones] │  12:45 PM [Mark read] [Ack]                        │
│  Moderator   │                                                     │
│              │  You: How are you?                                 │
│ [Peter Lee]  │  12:46 PM ✔✔                                       │
│  Teacher     │                                                     │
│              │                                                     │
│              ├─────────────────────────────────────────────────────┤
│              │ [Type message (English)] [Type message (Thai)]      │
│              │ [Send Message 📤]                                   │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Direct Mode Features
- Left sidebar: List of available users
- Selected user highlighted in blue
- Chat area shows conversation
- Message bubbles (blue for sent, gray for received)
- Time stamps on each message
- Read/Acknowledge buttons on received messages

### Group Mode
```
┌────────────────────────────────────────────────────────────────────┐
│  💬 Messaging Hub                    [Direct] [Group]              │
├──────────────┬─────────────────────────────────────────────────────┤
│              │  🏫 ABC International School                        │
│ Schools      │  Group Conversation                                 │
│              ├─────────────────────────────────────────────────────┤
│ [ABC School] │  Teacher John                                       │
│  🏫          │  Meeting at 3 PM                                    │
│              │  2:30 PM                                            │
│ [XYZ School] │                                                     │
│  🏫          │  You (Teacher Mary)                                │
│              │  I'll be there!                                     │
│              │  2:31 PM ✔✔                                         │
│              │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Group Mode Features
- Left sidebar: List of schools
- Selected school highlighted in purple
- Messages show sender name
- All school members can see messages
- Same acknowledgment system

## 🔔 Desktop Notification Toasts

### Toast Examples

**Info Toast (Blue)**
```
┌─────────────────────────────────────────┐
│ ℹ️  New Feature Available        [×]    │
│    Check out the new messaging hub!    │
└─────────────────────────────────────────┘
```

**Success Toast (Green)**
```
┌─────────────────────────────────────────┐
│ ✓  Message Sent Successfully     [×]    │
│    Your message has been delivered     │
└─────────────────────────────────────────┘
```

**Warning Toast (Yellow)**
```
┌─────────────────────────────────────────┐
│ ⚠️  Action Required               [×]    │
│    Please update your profile          │
└─────────────────────────────────────────┘
```

**Error Toast (Red)**
```
┌─────────────────────────────────────────┐
│ ✗  Connection Error               [×]    │
│    Unable to connect to server         │
└─────────────────────────────────────────┘
```

**Features:**
- Auto-dismiss after 5 seconds
- Manual close with [×] button
- Slide-in from right
- Stack vertically (newest on top)
- Fixed position: top-right corner

## 🛡️ Moderator List View

### Grid Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  🛡️ Moderator List                                               │
│  School moderators and contact information                       │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ ┌────────────────┐        │
│ │ 🛡️ John Smith   │ │ 🛡️ Mary Jones   │ │ 🛡️ Peter Lee    │        │
│ │ Moderator      │ │ Moderator      │ │ Moderator      │        │
│ │ 🏫 ABC School   │ │ 🏫 XYZ School   │ │ 🏫 DEF School   │        │
│ │ [📧 Message]    │ │ [📧 Message]    │ │ [📧 Message]    │        │
│ │ Created: 1/1/24│ │ Created: 2/1/24│ │ Created: 3/1/24│        │
│ └────────────────┘ └────────────────┘ └────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

**Card Features:**
- Purple/blue gradient background
- Moderator shield icon
- Username and role
- Assigned school with building icon
- Message button (opens direct chat)
- Creation date

**Responsive Grid:**
- Desktop: 3 columns
- Tablet: 2 columns
- Mobile: 1 column

## 📧 Admin Contact Button & Dialog

### Button in Header
```
[📧 Contact Admin]
```
- Appears for non-admin users only
- Orange/red gradient
- Positioned in header next to language switcher

### Contact Dialog
```
┌─────────────────────────────────────────────────────────────┐
│  📧 Contact Admin                                      [×]  │
│  Send a message to the administrator                       │
├─────────────────────────────────────────────────────────────┤
│  ℹ️ Your message will be sent to: Admin                    │
│                                                             │
│  Message (English)                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ I need help with...                                   │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Message (Thai)                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ฉันต้องการความช่วยเหลือ...                          │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Cancel]  [📤 Send]            │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Modal overlay (darkens background)
- Shows admin username
- Two text areas (English + Thai)
- Both fields required
- Cancel and Send buttons
- Loading state during send

## 📱 Device-Specific Features

### Mobile (< 768px)
- Single column layouts
- Larger touch targets
- Simplified messaging interface
- No toast notifications (mobile-optimized)

### Tablet (768-1024px)
- Two-column layouts
- Adaptive grids
- Medium-sized touch targets
- Optional toast notifications

### Desktop (≥ 1024px)
- Full three-column layouts
- Detailed information
- Toast notifications enabled
- Mouse hover effects

## 🌐 Language Support

### English Example
```
Messages Tab:
- "Messaging Hub"
- "Direct" / "Group"
- "Available Users"
- "Send Message"
- "Mark read" / "Ack"
```

### Thai Example (ไทย)
```
Messages Tab:
- "ศูนย์ข้อความ"
- "ตรง" / "กลุ่ม"
- "ผู้ใช้ที่พร้อมใช้งาน"
- "ส่งข้อความ"
- "อ่านแล้ว" / "รับทราบ"
```

**Language Switcher:**
```
[🌐 EN | ไทย]
```
- Toggles all UI text
- Displays appropriate message content
- Maintains user preference

## 🎨 Color Scheme

### Message Bubbles
- **Sent messages**: Blue background (#3B82F6)
- **Received messages**: Gray background (#E5E7EB)

### Toast Notifications
- **Info**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Buttons
- **Primary**: Blue (#3B82F6)
- **Secondary**: Gray (#6B7280)
- **Admin Contact**: Orange/Red gradient (#F97316 → #EF4444)
- **Success**: Green (#10B981)

### Mode Switches
- **Direct Mode**: Blue highlight
- **Group Mode**: Purple highlight

## ⚡ Interactive Elements

### Clickable Items
- User cards in sidebar → Opens conversation
- School cards → Opens group chat
- Message buttons → Opens direct chat
- [×] on toasts → Dismisses notification
- "Mark read" → Marks message as read
- "Ack" → Acknowledges message
- Send button → Sends message

### Hover Effects
- Buttons: Darken on hover
- Cards: Shadow increases on hover
- User/school items: Background lightens

### Loading States
- Sending message: Button shows "Sending..."
- Loading users: Spinner animation
- Loading messages: "Loading messages..."

## 📊 Status Indicators

### Message Status
- ✓ = Sent
- ✓✓ = Acknowledged
- 🔵 = Unread
- ⚪ = Read

### User Availability
- Online/offline status (future enhancement)
- Last seen (future enhancement)

## 🔄 Real-time Updates

All features update automatically:
- New messages appear instantly
- Unread count updates live
- Read receipts update immediately
- User list refreshes on changes
- Toast notifications appear on events

---

**Note**: All screenshots and visual representations are text-based. For actual screenshots, run the application and navigate to each feature.
