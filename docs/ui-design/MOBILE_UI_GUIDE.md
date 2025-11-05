# Mobile UI Design Guide

## Overview
This document describes the mobile-first UI optimizations implemented in the Class Tracker application. The design focuses on touch-friendly interactions, clear visual hierarchy, and modern mobile UX patterns.

## Design Principles

### 1. Mobile-First Approach
- All components are designed for mobile screens first
- Progressive enhancement for tablet and desktop
- Breakpoint: `md:` (768px) for tablet/desktop adaptations

### 2. Touch-Friendly Interactions
- **Minimum Touch Target**: 44x44px (Apple/Google guidelines)
- **Touch Manipulation**: `-webkit-tap-highlight-color: transparent`
- **Active States**: Scale animations (0.95, 0.98, 0.99) for tactile feedback

### 3. Visual Hierarchy
- **Typography Scale**:
  - Mobile: `text-base` (16px) for body, `text-xl` (20px) for headers
  - Desktop: `text-sm` (14px) for body, `text-2xl` (24px) for headers
- **Rounded Corners**:
  - Mobile: `rounded-xl` (12px) or `rounded-2xl` (16px)
  - Desktop: `rounded-lg` (8px)

### 4. Spacing System
- **Container Padding**:
  - Mobile: `px-3 py-4` (12px, 16px)
  - Desktop: `p-4` or `p-8` (16px, 32px)
- **Component Spacing**: `space-y-3` or `space-y-4`

## Key Features

### Bottom Navigation Bar
Located at: `app/page.tsx`

**Mobile-Only Navigation** (hidden on desktop):
- Fixed to bottom of screen
- 4 primary tabs: Calendar, Classes, Messages, Alerts
- Icon + label design
- Active state with blue highlight and background
- Safe area inset support for notched devices

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t z-50 md:hidden safe-area-inset-bottom">
  <div className="flex justify-around items-center h-16 px-2">
    {/* Tab buttons */}
  </div>
</nav>
```

### Pull-to-Refresh
Located: `lib/use-pull-to-refresh.ts`

**Features**:
- Activates at top of page when pulling down
- Visual indicator with rotating icon
- Customizable threshold (default: 80px)
- Resistance factor for natural feel (default: 2.5)

**Usage**:
```tsx
const { isPulling, isRefreshing, pullDistance } = usePullToRefresh(handleRefresh);
```

### Swipe Gestures
Located: `lib/use-swipe-gesture.ts`

**Supported Directions**: left, right, up, down
**Threshold**: 50px (customizable)

**Usage** (Calendar week navigation):
```tsx
useSwipeGesture({
  onSwipeLeft: goToNextWeek,
  onSwipeRight: goToPreviousWeek,
});
```

### Form Inputs

**Mobile Optimizations**:
- Larger input fields: `py-3` (12px vertical padding)
- Bigger text: `text-base` (16px) to prevent zoom on iOS
- Enhanced focus states: `focus:ring-2 focus:ring-blue-500`
- Rounded corners: `rounded-xl`
- Touch manipulation class for better performance

**Example**:
```tsx
<input
  className="px-4 py-3 md:py-2 text-base md:text-sm border rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 touch-manipulation"
/>
```

### Buttons

**Mobile-Optimized Button**:
- Height: `py-3.5` (14px padding) for easy tapping
- Full width on mobile: `w-full md:w-auto`
- Shadow for depth: `shadow-lg shadow-blue-500/20`
- Active state: `active:scale-95` or `active:scale-98`

**Example**:
```tsx
<button
  className="w-full bg-blue-500 text-white px-4 py-3.5 md:py-2.5 rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-98 transition-all touch-manipulation shadow-lg shadow-blue-500/20 text-base md:text-sm font-medium"
>
  Submit
</button>
```

### Cards & Containers

**Mobile Card Design**:
- Rounded corners: `rounded-2xl md:rounded-lg`
- Shadow: `shadow-lg`
- Padding: `p-4 md:p-6`
- Active state: `active:scale-[0.99]` for interactive cards

**Example**:
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-lg shadow-lg p-4 md:p-6 active:scale-[0.99] transition-transform">
  {/* Content */}
</div>
```

## Component-Specific Optimizations

### Login Form
- Large input fields with autocomplete
- Full-width submit button
- Proper keyboard types for mobile

### Messaging Hub
- Mobile dropdown selector for users/schools
- Chat bubbles with max-width: `max-w-[85%] md:max-w-[70%]`
- Stacked message inputs on mobile
- Larger send button

### Weekly Calendar
- Abbreviated day names on mobile (Mon, Tue, etc.)
- Smaller class cards with adjusted font sizes
- Swipe gestures for week navigation
- Touch-friendly "Add" buttons

### Class Booking
- Stacked form layout on mobile
- Full-width buttons
- Larger status badges
- Improved empty states with icons

### Notification List
- Larger notification cards
- Stacked action buttons on mobile
- Full-width "Mark all as read" button
- Better touch targets for delete/read actions

## CSS Utilities

### Custom Classes

Located: `app/globals.css`

```css
/* Touch optimization */
.touch-manipulation {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Active/pressed state scales */
.active\:scale-95:active {
  transform: scale(0.95);
}

.active\:scale-98:active {
  transform: scale(0.98);
}

.active\:scale-\[0\.99\]:active {
  transform: scale(0.99);
}

/* Safe area support for mobile devices */
.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* Smooth scrolling for mobile */
@media (max-width: 768px) {
  * {
    -webkit-overflow-scrolling: touch;
  }
}

/* Improve focus states for mobile */
@media (max-width: 768px) {
  input:focus,
  textarea:focus,
  select:focus,
  button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
}
```

## Color System

### Shadows
- Blue: `shadow-blue-500/20` (for primary actions)
- Green: `shadow-green-500/20` (for success actions)
- Red: `shadow-red-500/20` (for destructive actions)

### Dark Mode
All components support dark mode with appropriate color adjustments:
- Backgrounds: `bg-white dark:bg-gray-800`
- Text: `text-gray-900 dark:text-white`
- Borders: `border-gray-300 dark:border-gray-600`

## Responsive Patterns

### Layout Stacking
```tsx
// Desktop: side-by-side, Mobile: stacked
<div className="flex flex-col md:flex-row gap-3">
  <button>Action 1</button>
  <button>Action 2</button>
</div>
```

### Conditional Display
```tsx
// Show only on mobile
<div className="md:hidden">Mobile only</div>

// Show only on desktop
<div className="hidden md:block">Desktop only</div>
```

### Responsive Sizing
```tsx
// Icons
<Icon className="w-6 h-6 md:w-5 md:h-5" />

// Text
<h1 className="text-xl md:text-2xl">Title</h1>
```

## Performance Considerations

### Touch Optimization
- `touch-action: manipulation` prevents double-tap zoom
- `transform: scale()` uses GPU acceleration
- Transitions limited to `transform` and `opacity` for 60fps

### Bundle Size
- Total bundle size increase: ~3KB (hooks + utilities)
- No external dependencies added
- Code splitting maintained

## Testing Guidelines

### Mobile Testing Checklist
- [ ] Test on actual mobile devices (iOS and Android)
- [ ] Verify touch targets are at least 44x44px
- [ ] Check pull-to-refresh on various devices
- [ ] Test swipe gestures in calendar
- [ ] Verify keyboard behavior (doesn't cover inputs)
- [ ] Test in both portrait and landscape
- [ ] Verify safe area insets on notched devices
- [ ] Test dark mode on mobile
- [ ] Check form submission flow
- [ ] Verify bottom navigation doesn't cover content

### Browser Testing
- iOS Safari (primary target)
- Chrome Mobile (Android)
- Firefox Mobile
- Samsung Internet

## Future Enhancements

### Potential Additions
1. **Haptic Feedback**: Add vibration feedback for actions
2. **Gesture Animations**: Spring animations for swipe gestures
3. **Offline Mode**: Service worker for offline functionality
4. **Install Prompt**: Progressive Web App installation
5. **Voice Input**: Speech-to-text for messages
6. **Camera Integration**: Photo uploads for class records

### Accessibility Improvements
1. **Screen Reader**: Improve ARIA labels
2. **High Contrast**: Better contrast ratios
3. **Font Scaling**: Respect user font size preferences
4. **Reduced Motion**: Respect prefers-reduced-motion

## Conclusion

The mobile UI implementation provides a modern, touch-friendly experience optimized for mobile devices while maintaining compatibility with desktop browsers. The design follows Apple and Google's mobile UI guidelines and implements industry-standard patterns for mobile web applications.
