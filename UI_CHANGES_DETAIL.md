# UI Changes: Role-Based Event Booking

## Overview
This document shows the before/after UI changes that clarify role-based permissions for calendar event booking.

## Before (Generic for All Roles)
All users saw the same generic labels, which didn't communicate the different permission levels:

```
Calendar "+" Button Tooltip: "Add class" / "เพิ่มคลาส"
Dialog Title:                "Add Class" / "เพิ่มคลาส"
Submit Button:               "Create Class" / "สร้างคลาส"
```

**Problem:** Teachers, moderators, and admins all saw identical UI, even though:
- Moderators/admins create **approved** classes
- Teachers create **pending** classes (require approval)

## After (Role-Specific Clarity)

### For Moderators & Admins
```
Calendar "+" Button Tooltip: "Book class" / "จองคลาส"
Dialog Title:                "Book Class" / "จองคลาส"
Submit Button:               "Book Class" / "จองคลาส"
```
✓ Clearly indicates direct booking with immediate approval

### For Teachers
```
Calendar "+" Button Tooltip: "Request class" / "ขอจองคลาส"
Dialog Title:                "Request Class" / "ขอจองคลาส"
Submit Button:               "Request Class" / "ขอจองคลาส"
```
✓ Clearly indicates request that requires moderator approval

## Visual Comparison

### Calendar View - "+" Button

**Before:**
```
┌─────────────────────────┐
│  15  [+] ← "Add class"  │
│                         │
│  [Class entries...]     │
└─────────────────────────┘
```

**After (Moderator/Admin):**
```
┌─────────────────────────┐
│  15  [+] ← "Book class" │ ✓ Direct booking
│                         │
│  [Class entries...]     │
└─────────────────────────┘
```

**After (Teacher):**
```
┌─────────────────────────────┐
│  15  [+] ← "Request class"  │ ⏳ Needs approval
│                             │
│  [Class entries...]         │
└─────────────────────────────┘
```

### Booking Dialog

**Before (All Roles):**
```
╔═══════════════════════════════════╗
║  Add Class                    [X] ║
╠═══════════════════════════════════╣
║  School: [Select...            ]  ║
║  Student: [Select...           ]  ║
║  Location: [Select...          ]  ║
║  Time: [09:00                  ]  ║
║                                   ║
║  [Create Class]    [Cancel]       ║
╚═══════════════════════════════════╝
```

**After (Moderator/Admin):**
```
╔═══════════════════════════════════╗
║  Book Class                   [X] ║ ✓ Immediate approval
╠═══════════════════════════════════╣
║  School: [Select...            ]  ║
║  Teacher: [Select teacher...   ]  ║ ← Can select teacher
║  Student: [Select...           ]  ║
║  Location: [Select...          ]  ║
║  Time: [09:00                  ]  ║
║                                   ║
║  [Book Class]      [Cancel]       ║
╚═══════════════════════════════════╝
```

**After (Teacher):**
```
╔═══════════════════════════════════╗
║  Request Class                [X] ║ ⏳ Needs approval
╠═══════════════════════════════════╣
║  School: [Select...            ]  ║
║  Teacher: [Auto-selected]      ║ ← Self only
║  Student: [Select...           ]  ║
║  Location: [Select...          ]  ║
║  Time: [09:00                  ]  ║
║                                   ║
║  [Request Class]   [Cancel]       ║
╚═══════════════════════════════════╝
```

## Impact

### User Experience Improvements
1. **Immediate Clarity**: Users know their permission level before clicking
2. **Action Consistency**: Same verb ("Book" vs "Request") throughout flow
3. **Expectation Setting**: Users know if class will be immediate or pending
4. **Bilingual Accuracy**: Proper Thai translations for each action

### Technical Implementation
- **Minimal Code Changes**: Only 14 lines in 1 component
- **No Logic Changes**: All existing functionality preserved
- **Type Safe**: TypeScript compilation passes
- **Maintainable**: Clear conditional rendering based on user role

## Code Changes

### Location: `components/weekly-calendar.tsx`

#### Change 1: Calendar Button Tooltip (Line 355)
```typescript
// Before
title={t("Add class", "เพิ่มคลาส")}

// After
title={
    currentUser.role === "moderator" || currentUser.role === "admin"
        ? t("Book class", "จองคลาส")
        : t("Request class", "ขอจองคลาส")
}
```

#### Change 2: Dialog Title (Line 447)
```typescript
// Before
{t("Add Class", "เพิ่มคลาส")}

// After
{currentUser.role === "moderator" || currentUser.role === "admin"
    ? t("Book Class", "จองคลาส")
    : t("Request Class", "ขอจองคลาส")}
```

#### Change 3: Submit Button (Line 674)
```typescript
// Before
{t("Create Class", "สร้างคลาส")}

// After
{currentUser.role === "moderator" || currentUser.role === "admin"
    ? t("Book Class", "จองคลาส")
    : t("Request Class", "ขอจองคลาส")}
```

## Backend Support

The UI changes complement existing backend logic:

```typescript
// convex/classes.ts:354-355
const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
const status = isGuardianLinked || isModerator ? "approved" : "pending";
```

## Testing Checklist

- [ ] As Admin: See "Book class" tooltip, "Book Class" title and button
- [ ] As Admin: Created class has "approved" status immediately
- [ ] As Moderator: See "Book class" tooltip, "Book Class" title and button  
- [ ] As Moderator: Created class has "approved" status immediately
- [ ] As Teacher: See "Request class" tooltip, "Request Class" title and button
- [ ] As Teacher: Created class has "pending" status
- [ ] All text displays correctly in English
- [ ] All text displays correctly in Thai (language toggle)

## Conclusion

These small but strategic UI changes make a significant UX improvement by:
- **Communicating permission levels clearly**
- **Setting proper expectations** for the workflow
- **Maintaining consistency** throughout the booking flow
- **Supporting both languages** equally well

The result: Users immediately understand whether they're **booking** (immediate) or **requesting** (pending approval) without needing to remember their role's permissions.
