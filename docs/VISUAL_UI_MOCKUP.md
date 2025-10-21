# Visual UI Mockup - Edit Class Feature

## Before Edit (Moderator View)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Class Bookings                                    [Book Class] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  John Doe                                      [Approved]     │
│  Location: ABC School - Room 101                              │
│  Scheduled: Monday, January 20, 2025, 10:00 AM                │
│                                                               │
│  ───────────────────────────────────────────────────────────  │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │ Edit Class  │  │ Delete Class │                            │
│  │   📝 Blue   │  │   🗑️ Red     │                            │
│  └─────────────┘  └─────────────┘                            │
│                                                               │
│  Teacher will be notified of any changes                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## After Clicking "Edit Class"

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Class Bookings                                    [Book Class] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  John Doe                                      [Approved]     │
│  Location: ABC School - Room 101                              │
│  Scheduled: Monday, January 20, 2025, 10:00 AM                │
│                                                               │
│  ───────────────────────────────────────────────────────────  │
│                                                               │
│  ╔═══════════════════════════════════════════════════════════╗│
│  ║ 📝 Edit Class Details                                     ║│
│  ║                                                           ║│
│  ║ Student                                                   ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ John Doe                                          ▼│    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ School                                                    ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ ABC School                                        ▼│    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ Location                                                  ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ Room 101                                          ▼│    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ Scheduled Date & Time                                     ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ 2025-01-20T10:00                                  │    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ Status                                                    ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ Approved                                          ▼│    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ ┌─────────────────┐  ┌──────────┐                        ║│
│  ║ │ Save Changes    │  │ Cancel   │                        ║│
│  ║ │   ✓ Green       │  │  Gray    │                        ║│
│  ║ └─────────────────┘  └──────────┘                        ║│
│  ╚═══════════════════════════════════════════════════════════╝│
│                                                               │
│  Teacher will be notified of any changes                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## After Making Changes and Clicking "Save"

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ✓ Class updated successfully                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  Jane Smith                                    [Pending]      │
│  Location: ABC School - Room 102                              │
│  Scheduled: Wednesday, January 25, 2025, 2:00 PM              │
│                                                               │
│  ───────────────────────────────────────────────────────────  │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │ Edit Class  │  │ Delete Class │                            │
│  │   📝 Blue   │  │   🗑️ Red     │                            │
│  └─────────────┘  └─────────────┘                            │
│                                                               │
│  Teacher will be notified of any changes                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Meanwhile, Teacher Receives Notification

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Notifications                                              [i] ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌───────────────────────────────────────────────────────────────┐
│ 🔔 Class Updated                                              │
│                                                               │
│ Your class with John Doe has been updated by moderator1      │
│                                                               │
│ คลาสของคุณกับ John Doe ถูกอัปเดตโดย moderator1               │
│                                                               │
│ Just now                                                   [X]│
└───────────────────────────────────────────────────────────────┘
```

## Mobile View (Portrait)

```
┌─────────────────────┐
│ Class Bookings      │
│                     │
│ [Book Class]        │
└─────────────────────┘

┌─────────────────────┐
│                     │
│ John Doe            │
│          [Approved] │
│                     │
│ Location:           │
│ ABC School - Room   │
│ 101                 │
│                     │
│ Scheduled:          │
│ Mon, Jan 20, 2025   │
│ 10:00 AM            │
│                     │
│ ─────────────────── │
│                     │
│ ┌─────────────────┐ │
│ │   Edit Class    │ │
│ │    📝 Blue      │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │  Delete Class   │ │
│ │    🗑️ Red       │ │
│ └─────────────────┘ │
│                     │
│ Teacher will be     │
│ notified of any     │
│ changes             │
│                     │
└─────────────────────┘
```

## Dark Mode

```
┌───────────────────────────────────────────────────────────────┐
│ ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ │
│                                                               │
│  John Doe                                      [Approved]     │
│  Location: ABC School - Room 101                              │
│  Scheduled: Monday, January 20, 2025, 10:00 AM                │
│                                                               │
│  ───────────────────────────────────────────────────────────  │
│                                                               │
│  ╔═══════════════════════════════════════════════════════════╗│
│  ║ 📝 Edit Class Details                                     ║│
│  ║ [Blue background with 20% opacity in dark mode]          ║│
│  ║                                                           ║│
│  ║ Student                                                   ║│
│  ║ ┌───────────────────────────────────────────────────┐    ║│
│  ║ │ John Doe                       [Dark gray bg]    ▼│    ║│
│  ║ └───────────────────────────────────────────────────┘    ║│
│  ║                                                           ║│
│  ║ [... other fields ...]                                   ║│
│  ║                                                           ║│
│  ║ ┌─────────────────┐  ┌──────────┐                        ║│
│  ║ │ Save Changes    │  │ Cancel   │                        ║│
│  ║ └─────────────────┘  └──────────┘                        ║│
│  ╚═══════════════════════════════════════════════════════════╝│
│                                                               │
│ ⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛ │
└───────────────────────────────────────────────────────────────┘
```

## Color Reference

### Light Mode
- **Blue Form**: `#EFF6FF` (bg-blue-50)
- **Blue Border**: `#BFDBFE` (border-blue-200)
- **Blue Button**: `#2563EB` (bg-blue-600)
- **Green Button**: `#16A34A` (bg-green-600)
- **Red Button**: `#DC2626` (bg-red-600)
- **Gray Button**: `#6B7280` (bg-gray-500)

### Dark Mode
- **Blue Form**: Blue with 20% opacity on dark gray
- **Blue Border**: Darker blue (`border-blue-800`)
- **Input Backgrounds**: `#1F2937` (bg-gray-800)
- **Text**: Light gray/white

## Interactive States

### Button Hover Effects
```
Normal:  [Edit Class]
         bg-blue-600

Hover:   [Edit Class]  ← Slightly darker
         bg-blue-700
         
Active:  [Edit Class]  ← Scales down slightly
         scale-95 (95% of normal size)
```

### Input Focus States
```
Normal:  ┌────────────┐
         │ John Doe   │
         └────────────┘
         
Focus:   ┌────────────┐  ← Blue ring appears
         │ John Doe   │
         └────────────┘
         ring-2 ring-blue-500
```

## Dropdown Interactions

### Student Dropdown Expanded
```
┌───────────────────────────────────┐
│ John Doe                          ▼│ ← Currently selected
├───────────────────────────────────┤
│ John Doe                      [✓] │ ← Checkmark
│ Jane Smith                        │
│ Bob Johnson                       │
│ Mary Williams                     │
└───────────────────────────────────┘
```

### Location Dropdown (School Not Selected)
```
┌───────────────────────────────────┐
│ Select a school first             │ ← Disabled state
└───────────────────────────────────┘
          (Grayed out)
```

### Location Dropdown (School Selected)
```
┌───────────────────────────────────┐
│ Room 101                          ▼│
├───────────────────────────────────┤
│ Room 101                      [✓] │
│ Room 102                          │
│ Room 103                          │
│ Library                           │
└───────────────────────────────────┘
```

## Status Dropdown Options

```
┌───────────────────────────────────┐
│ Approved                          ▼│
├───────────────────────────────────┤
│ Pending          [Yellow badge]   │
│ Acknowledged     [Blue badge]     │
│ Approved         [Green badge] [✓]│
│ Rejected         [Red badge]      │
└───────────────────────────────────┘
```

## Responsive Breakpoints

### Mobile (< 768px)
- Buttons stack vertically
- Larger touch targets (py-3)
- Rounded corners: 16px (rounded-xl)
- Full width dropdowns

### Desktop (≥ 768px)
- Buttons inline horizontally
- Standard touch targets (py-2)
- Rounded corners: 8px (rounded-lg)
- Dropdowns may be in grid layout

## Loading States

### Saving Changes
```
╔═══════════════════════════════════════╗
║ 📝 Edit Class Details                 ║
║                                       ║
║ [... fields ...]                      ║
║                                       ║
║ ┌─────────────────┐                   ║
║ │ ⏳ Saving...    │ ← Disabled state  ║
║ └─────────────────┘                   ║
╚═══════════════════════════════════════╝
```

## Error States

### Failed to Save
```
┌───────────────────────────────────────┐
│ ❌ Failed to update class             │
│ Please try again                      │
└───────────────────────────────────────┘

[Edit form remains open for retry]
```

## Success Confirmation

```
┌───────────────────────────────────────┐
│ ✓ Class updated successfully          │
└───────────────────────────────────────┘

[Form closes, changes visible immediately]
```

## Permission Denied (Teacher View)

```
┌───────────────────────────────────────┐
│ John Doe                   [Approved] │
│ Location: ABC School - Room 101       │
│ Scheduled: Mon, Jan 20, 2025 10:00 AM │
│                                       │
│ ───────────────────────────────────── │
│                                       │
│ [No edit/delete buttons shown]       │
│                                       │
└───────────────────────────────────────┘
```

---

## Summary

This feature provides a seamless inline editing experience that:
- ✅ Matches existing design patterns (blue forms)
- ✅ Works on all devices (responsive)
- ✅ Supports both light and dark modes
- ✅ Provides clear feedback (alerts, notifications)
- ✅ Maintains security (role-based access)
- ✅ Fully bilingual (English/Thai)
