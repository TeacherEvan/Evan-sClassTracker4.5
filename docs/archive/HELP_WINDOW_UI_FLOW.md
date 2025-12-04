# Help Window UI Flow and Visual Guide

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Main Application                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Header                                           │  │
│  │  [🏠 Class Tracker]  [🌐] [🟢 Help] [📞] [⚙️] [🚪]  │  │
│  │                            ↑                      │  │
│  │                    User clicks here               │  │
│  └──────────────────────────────────────────────────┘  │
│                            │                            │
│                            ▼                            │
│         ┌──────────────────────────────────┐           │
│         │   Help Window Opens (Modal)      │           │
│         │                                  │           │
│         │  ┌────────────────────────────┐ │           │
│         │  │ Welcome Teacher/Boss/Evan! │ │           │
│         │  │ What would you like to do? │ │           │
│         │  └────────────────────────────┘ │           │
│         │                                  │           │
│         │  ▼ Class Booking (3)             │           │
│         │    • Book a Class      →────┐   │           │
│         │    • Approve Bookings       │   │           │
│         │    • View Calendar          │   │           │
│         │                             │   │           │
│         │  ▶ Messages (2)             │   │           │
│         │  ▶ Analytics (2)            │   │           │
│         │  ▶ Management (4)           │   │           │
│         │  ▶ Advanced (4)             │   │           │
│         └──────────────────────────────┘  │           │
│                            │                            │
│                            ▼                            │
│         ┌──────────────────────────────────┐           │
│         │  Feature Detail Modal            │           │
│         │                                  │           │
│         │  [←]              📅           [✕]│          │
│         │  Book a Class                    │           │
│         │                                  │           │
│         │  Description:                    │           │
│         │  Teachers can book classes...    │           │
│         │                                  │           │
│         │  ✓ How to Use:                   │           │
│         │  1️⃣ Click 'Classes' tab          │           │
│         │  2️⃣ Click 'Book New Class'       │           │
│         │  3️⃣ Select school, student...    │           │
│         │  4️⃣ Add optional details         │           │
│         │     💡 Tip: Be specific!         │           │
│         │  5️⃣ Submit for approval          │           │
│         │                                  │           │
│         │  [Got it!]                       │           │
│         └──────────────────────────────────┘           │
└─────────────────────────────────────────────────────────┘
```

## Visual Components

### 1. Help Button (Header)

```
┌─────────────────────────────────────────────────┐
│  Class Tracker                                  │
│  Welcome, Evan · Admin                          │
│                                                 │
│  [🌐 EN/TH] [🟢 Help] [📞 Contact] [🚪 Logout]  │
│               ↑                                 │
│         Green button                            │
│     Always visible                              │
└─────────────────────────────────────────────────┘
```

### 2. Help Window (Main View)

```
╔══════════════════════════════════════════════════╗
║  🔵 Help & Guide                            [✕] ║
║  Welcome Teacher! What would you like to do?    ║
╠══════════════════════════════════════════════════╣
║                                                 ║
║  Browse features to learn how to use the system ║
║                                                 ║
║  ┌─────────────────────────────────────────┐   ║
║  │ ▼ 📅 Class Booking           (3 features)│   ║
║  │                                          │   ║
║  │   ┌────────────────────────────────┐    │   ║
║  │   │ 📆 Book a Class             ▶️  │    │   ║
║  │   │ Schedule classes with students │    │   ║
║  │   └────────────────────────────────┘    │   ║
║  │                                          │   ║
║  │   ┌────────────────────────────────┐    │   ║
║  │   │ 📆 View Calendar            ▶️  │    │   ║
║  │   │ See all classes and events     │    │   ║
║  │   └────────────────────────────────┘    │   ║
║  └─────────────────────────────────────────┘   ║
║                                                 ║
║  ┌─────────────────────────────────────────┐   ║
║  │ ▶ 💬 Messages & Communication  (2 features)│ ║
║  └─────────────────────────────────────────┘   ║
║                                                 ║
║  ┌─────────────────────────────────────────┐   ║
║  │ ▶ 📊 Reports & Analytics      (2 features)│ ║
║  └─────────────────────────────────────────┘   ║
║                                                 ║
║  📚 Need more help?                             ║
║  Click 'Contact Admin' button in top right     ║
╚══════════════════════════════════════════════════╝
```

### 3. Feature Detail Modal

```
╔══════════════════════════════════════════════════╗
║  [← Back]                                  [✕]  ║
║                                                 ║
║  ┌─────┐                                        ║
║  │ 📅 │  Book a Class                           ║
║  └─────┘                                        ║
╠══════════════════════════════════════════════════╣
║                                                 ║
║  Teachers can book classes by selecting a       ║
║  school, student, location, date and time.      ║
║  The booking is sent to the moderator for       ║
║  approval.                                      ║
║                                                 ║
║  ┌─────────────────────────────────────────┐   ║
║  │ ✓ How to Use                            │   ║
║  │                                          │   ║
║  │  ① Click 'Classes' tab                  │   ║
║  │  ② Click 'Book New Class' button        │   ║
║  │  ③ Select school, student, location     │   ║
║  │  ④ Add optional details (subject, etc.) │   ║
║  │     ┌───────────────────────────────┐   │   ║
║  │     │ 💡 Tip: Adding detailed info  │   │   ║
║  │     │ helps moderators approve      │   │   ║
║  │     │ requests faster              │   │   ║
║  │     └───────────────────────────────┘   │   ║
║  │  ⑤ Submit for moderator approval        │   ║
║  └─────────────────────────────────────────┘   ║
║                                                 ║
║  ┌─────────────────────────────────────────┐   ║
║  │  Ready to try it?                       │   ║
║  │  Close this and start using the feature!│   ║
║  │                                          │   ║
║  │                  [Got it!]               │   ║
║  └─────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════╝
```

## Color Scheme

### Help Button

- **Background**: `bg-green-100` (light green)
- **Text**: `text-green-700` (dark green)
- **Hover**: `bg-green-200` (brighter green)
- **Icon**: HelpCircle (question mark in circle)

### Help Window

- **Header**: Green-to-blue gradient

  ```
  from-green-600 → via-teal-600 → to-blue-600
  ```

- **Background**: White/dark gray (theme aware)
- **Category headers**: Blue-purple gradient backgrounds
- **Feature cards**: Gray gradient with hover effects

### Feature Detail

- **Header**: Blue-to-purple gradient

  ```
  from-blue-600 → via-indigo-600 → to-purple-600
  ```

- **Step numbers**: Blue circles with white text
- **Tip boxes**: Yellow background with lightbulb icon

## Interaction States

### Closed State (Default)

```
[🟢 Help]  ← Green button, ready to click
```

### Hover State

```
[🟢 Help]  ← Slightly brighter, cursor pointer
   ↑
  Scale slightly larger (hover:scale-105)
```

### Open State - Main Window

```
╔════════════════════╗
║ Help Window Open   ║
║ (Modal overlay)    ║
║                    ║
║ Categories listed  ║
║ Can expand/close   ║
╚════════════════════╝
```

### Open State - Detail View

```
╔════════════════════╗
║ Detail Modal       ║
║ (Over help window) ║
║                    ║
║ [← Back] button    ║
║ Steps shown        ║
║ [Got it!] button   ║
╚════════════════════╝
```

## Responsive Behavior

### Desktop (≥768px)

- Full-width modal (max-width: 1280px)
- Side-by-side feature cards
- Hover effects active
- Ample padding and spacing

### Tablet (≥640px, <768px)

- Slightly narrower modals
- Single column feature cards
- Touch-friendly tap targets
- Optimized spacing

### Mobile (<640px)

- Full-screen modals
- Vertical scrolling
- Large tap targets (44px+)
- Compact padding
- Bottom-aligned buttons

## Language Switching

### English Mode

```
┌─────────────────────────────┐
│ 🟢 Help                     │
│                             │
│ Welcome Teacher!            │
│ What would you like to do?  │
│                             │
│ ▼ Class Booking             │
│   • Book a Class            │
│   • View Calendar           │
└─────────────────────────────┘
```

### Thai Mode (Switch via 🌐 button)

```
┌─────────────────────────────┐
│ 🟢 ช่วยเหลือ                │
│                             │
│ ยินดีต้อนรับครู!            │
│ คุณต้องการทำอะไร?           │
│                             │
│ ▼ การจองชั้นเรียน           │
│   • จองชั้นเรียน            │
│   • ดูปฏิทิน                │
└─────────────────────────────┘
```

## Role-Based Content Display

### Teacher View

```
Available Categories:
✅ Class Booking (3 features)
✅ Messages & Communication (2 features)
✅ Advanced Features (4 features)
❌ Reports & Analytics (moderator only)
❌ Management & Administration (moderator/admin)
```

### Moderator View (Boss)

```
Available Categories:
✅ Class Booking (3 features)
✅ Messages & Communication (2 features)
✅ Reports & Analytics (2 features)
✅ Management & Administration (3 features)
✅ Advanced Features (3 features)
❌ Manage Users (admin only)
❌ Manage Schools (admin only)
```

### Admin View (Evan)

```
Available Categories:
✅ Class Booking (3 features)
✅ Messages & Communication (2 features)
✅ Reports & Analytics (2 features)
✅ Management & Administration (4 features)
✅ Advanced Features (4 features)
✅ ALL features visible
```

## Animation Sequences

### Opening Help Window

```
1. User clicks [Help] button
2. Backdrop fades in (300ms)
3. Modal slides up from bottom (500ms)
4. Content fades in
```

### Expanding Category

```
1. User clicks category header
2. Chevron rotates 90° (300ms)
3. Feature list slides down (300ms)
4. Features fade in
```

### Opening Feature Detail

```
1. User clicks feature card
2. Current view fades out (200ms)
3. Detail modal slides in from right (300ms)
4. Content fades in (200ms)
```

### Closing

```
1. User clicks [X] or [Got it!]
2. Modal fades out (300ms)
3. Backdrop fades out (300ms)
4. Component unmounts
```

## Accessibility Features

### Keyboard Navigation

- **ESC**: Close help window
- **TAB**: Navigate between interactive elements
- **ENTER/SPACE**: Activate buttons
- **Arrow keys**: Scroll content

### Screen Reader Support

- ARIA labels on all buttons
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for icons (via title attributes)

### Focus Management

- Focus trapped within modal when open
- Focus returns to Help button when closed
- Visible focus indicators on all interactive elements

---

## Summary

The Help Window feature provides:

1. ✅ **Easy Access** - Green button always visible
2. ✅ **Organized Content** - 5 categories, 20+ features
3. ✅ **Interactive Learning** - Click to explore details
4. ✅ **Bilingual Support** - Seamless English/Thai switching
5. ✅ **Role-Based** - Shows only relevant features
6. ✅ **Beautiful Design** - Modern gradients and animations
7. ✅ **Responsive** - Works on all screen sizes
8. ✅ **Accessible** - Keyboard and screen reader friendly

**Result**: Users can quickly find help on any feature without leaving the application!
