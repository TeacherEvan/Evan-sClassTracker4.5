# Contact Admin UI & Notification Window - Visual Design Summary

## UI Design Overview

This document provides a detailed visual description of the implemented features since actual screenshots cannot be captured in the current environment.

## 1. Enhanced Contact Admin Button

### Button Appearance
- **Location**: Top-right header, next to Language Switcher and Logout button
- **Design**: 
  - Gradient background: Orange (#F97316) to Red (#EF4444)
  - White text with MessageCircle icon
  - Rounded corners (lg radius)
  - Shadow with hover shadow-lg effect
  - Text: "Contact Admin" (English) / "ติดต่อผู้จัดการ" (Thai)

### Modal Dialog Design

#### Header Section
- **Background**: Full-width gradient from orange-500 to red-500
- **Text**: White, 2xl size
- **Icon**: MessageCircle (w-7 h-7)
- **Title**: "Contact Administrator" / "ติดต่อผู้จัดการระบบ"
- **Subtitle**: "Get help, report issues, or suggest improvements"
- **Close Button**: Top-right corner, white with hover background

#### User Info Card
- **Background**: Light blue gradient (blue-50 to indigo-50)
- **Border**: Blue-200, rounded-xl
- **Content**: "Submitting as: [username] (role)"
- **Style**: Font-medium with bold username in blue-600

#### Request Type Selection Grid
**Layout**: 2 columns on mobile, 3 columns on desktop

**Each Type Button**:
- Padding: 3 units (p-3)
- Border: 2px solid, rounded-xl
- **States**:
  - Unselected: Gray border, no background
  - Selected: Colored background matching type, colored border, shadow-md
  - Hover: Slight border color change, shadow

**Type Icons & Colors**:
1. **General Inquiry** (MessageSquare)
   - Icon: Gray
   - Selected: Gray-50 background, gray-200 border
   
2. **Feature Suggestion** (Lightbulb)
   - Icon: Yellow-600
   - Selected: Yellow-50 background, yellow-200 border
   
3. **Bug Report** (Bug)
   - Icon: Red-600
   - Selected: Red-50 background, red-200 border
   
4. **Help Request** (HelpCircle)
   - Icon: Blue-600
   - Selected: Blue-50 background, blue-200 border
   
5. **Notification Window Request** (Bell)
   - Icon: Indigo-600
   - Selected: Indigo-50 background, indigo-200 border
   - **Note**: Only visible to teachers and moderators

#### Form Fields
**Subject Fields**:
- Two inputs: English and Thai
- Rounded-xl corners
- Border with focus ring (orange-500)
- Placeholder text in respective language
- Red asterisk for required field indicator

**Message Fields**:
- Two large textareas (5 rows each)
- Same styling as subject fields
- Resize disabled for consistent layout

#### Footer Section
- **Background**: Gray-50 (light mode), Gray-900 (dark mode)
- **Border**: Top border, rounded bottom
- **Buttons**: Side-by-side, equal width
  1. **Cancel**: Border-only button, gray
  2. **Send Request**: Gradient orange-to-red, white text, Send icon

#### Special Features
- **Loading State**: "Sending..." text with disabled appearance
- **Validation**: Fields turn red if invalid
- **Toast Notification**: Success message after submission

## 2. Notification Window

### Backdrop
- **Coverage**: Full screen (fixed inset-0)
- **Background**: Black with 70% opacity
- **Effect**: Backdrop blur for depth

### Modal Container
- **Position**: Centered on screen
- **Max Width**: 2xl (672px)
- **Max Height**: 85% of viewport
- **Scrollable**: Vertical scroll if content exceeds height
- **Rounded**: 2xl corners for modern look
- **Shadow**: 2xl for strong elevation

### Header Section
- **Background**: Triple gradient
  - Indigo-600 → Purple-600 → Pink-600
- **Padding**: 8 units (generous spacing)
- **Icon Container**:
  - White background with 20% opacity
  - Backdrop blur effect
  - Rounded full (circle)
  - Sparkles icon (w-8 h-8)
- **Title**: 3xl size, bold, centered, white text

### Greeting Section
- **Background**: Light blue to indigo gradient
- **Border**: 2px blue-200 border
- **Padding**: 5 units
- **Text**: Large (lg), semibold, personalized with username
- **Example**: "Hello Teacher Evan!" / "สวัสดี Teacher Evan!"

### Message Section
- **Background**: White (light mode), Gray-800 (dark mode)
- **Padding**: 8 units
- **Text**: Base size, leading-relaxed for readability
- **Style**: Prose dark:prose-invert for markdown-like formatting
- **Content**: Full bilingual message content

### Update Summary Section (Optional)
- **Separator**: 2px top border
- **Heading**: 
  - Sparkles icon in purple-600
  - "Recent Updates" text
  - Bold, lg size

**Update Card**:
- **Background**: Purple-50 to pink-50 gradient
- **Border**: Purple-200
- **Version Badge**: 
  - Purple-600 background
  - White text, xs size, bold
  - Rounded-full (pill shape)
- **Date**: Small gray text next to badge
- **Title**: Bold, dark text
- **Description**: Small gray text
- **Features List**:
  - CheckCircle icons in green-600
  - Up to 3 features shown
  - "Key Features" heading

### Footer Section
- **Background**: Gray-50 (light mode), Gray-900 (dark mode)
- **Padding**: 6 units
- **Button**: Full width
  - Gradient: Indigo-600 → Purple-600 → Pink-600
  - Text: White, bold, lg size
  - Height: 4 units (py-4)
  - CheckCircle icon
  - Text: "OK, I understand" / "ตกลง เข้าใจแล้ว"
  - Hover: Darker gradients, shadow-xl

### Animation
- **Entry**: Fade in + scale up (95% → 100%)
- **Duration**: 300ms
- **Timing**: Smooth ease transition
- **Delay**: 500ms before showing

## 3. Admin Contact Requests Management

### Page Header
- **Title**: "Contact Requests" / "คำขอติดต่อ"
- **Size**: 2xl, bold
- **Location**: Top of content area

### Status Filter Bar
- **Layout**: Horizontal scroll on mobile, flex on desktop
- **Buttons**: 5 status filters
  - All, Pending, In Progress, Resolved, Dismissed
  - Active: Orange-500 background, white text, shadow
  - Inactive: Gray-200 background, gray-700 text
  - Hover: Gray-300 background
  - Rounded-lg, font-medium

### Request Cards
**Card Layout**:
- **Background**: White (light mode), Gray-800 (dark mode)
- **Border**: Gray-200, rounded-xl
- **Padding**: 6 units
- **Hover**: Shadow-lg effect

**Card Header**:
- **Type Icon**: Colored icon (5x5) based on request type
- **Status Badge**: 
  - Pill shape (rounded-full)
  - Color-coded background
  - xs font, semibold
  - Colors:
    - Pending: Yellow-100 / Yellow-800
    - In Progress: Blue-100 / Blue-800
    - Resolved: Green-100 / Green-800
    - Dismissed: Gray-100 / Gray-800
- **Date**: Small gray text

**Card Body**:
- **Subject**: Bold, lg, dark text
- **Message**: Regular text, gray-700
- **Metadata**: Small text showing:
  - "From: [username] (role)"
  - "Type: [request_type]"

**Admin Notes** (if present):
- **Container**: Blue-50 background, blue-200 border
- **Title**: "Admin Notes:" in semibold blue-900
- **Content**: Small blue-800 text

**Action Buttons** (top-right):
1. **Manage**: Blue-600, CheckCircle icon
2. **Delete**: Red-600, Trash2 icon
- Hover: Colored background (50% opacity)
- Rounded-lg

### Management Modal
- **Similar styling to Contact Admin dialog**
- **Admin Notes Fields**: Two textareas (English/Thai)
- **Status Buttons**: 2x2 grid
  - In Progress: Blue-500
  - Resolved: Green-500
  - Dismissed: Gray-500
  - Pending: Yellow-500

## 4. Admin Notification Windows Management

### Page Header
- **Icon**: Bell icon in indigo-600
- **Title**: "Notification Windows" / "หน้าต่างประกาศ"
- **Create Button**:
  - Gradient: Indigo-600 to Purple-600
  - Plus icon, white text
  - "Create Window" text
  - Rounded-lg, shadow-md

### Window Cards
**Card Appearance**:
- Active windows: Border-2 indigo-500, shadow-lg
- Inactive windows: Border-2 gray-200
- Background: White / Gray-800
- Rounded-xl, padding-6

**Card Header**:
- **Status Badge**: 
  - Active: Green-100 / Green-800, "Active"
  - Inactive: Gray-100 / Gray-800, "Inactive"
- **Metadata**: 
  - Priority: "Priority: [1-10]"
  - Views: "Views: [count]"
  - All small gray text

**Card Body**:
- **Title**: Bold, lg size, bilingual
- **Message**: Gray-700, line-clamp-2 (max 2 lines)
- **Info Icons**:
  - Users icon: Shows target role
  - CheckCircle icon: If shows updates

**Action Buttons** (vertical stack):
1. **Edit**: Blue-600, Edit icon
2. **Toggle**: Yellow/Green-600, Power icon
3. **Delete**: Red-600, Trash2 icon
- All with hover backgrounds

### Create/Edit Modal
**Header**: Gradient indigo-to-purple, white text

**Form Sections**:
1. **Title**: Two text inputs (EN/TH)
2. **Greeting**: Two text inputs with placeholder hint
   - Placeholder: "Hello {username}!" / "สวัสดี {username}!"
3. **Message**: Two large textareas (5 rows each)
4. **Options Grid** (2 columns):
   - **Target Role**: Dropdown select
     - Options: All users, Teachers only, Moderators only, Admins only
   - **Priority**: Number input (1-10)
5. **Show Update Summary**: Checkbox with label

**Footer**: Two buttons
- Cancel: Border-only
- Create/Update: Gradient indigo-to-purple

## Color Palette Summary

### Primary Colors
- **Orange**: #F97316 (orange-500)
- **Red**: #EF4444 (red-500)
- **Indigo**: #4F46E5 (indigo-600)
- **Purple**: #9333EA (purple-600)
- **Pink**: #DB2777 (pink-600)

### Status Colors
- **Pending**: Yellow (warning)
- **In Progress**: Blue (info)
- **Resolved**: Green (success)
- **Dismissed**: Gray (neutral)
- **Active**: Green (success)
- **Inactive**: Gray (neutral)

### Type Colors
- **General**: Gray
- **Feature**: Yellow
- **Bug**: Red
- **Help**: Blue
- **Notification**: Indigo

## Responsive Behavior

### Mobile (< 768px)
- Request type grid: 2 columns
- Full-width buttons
- Stacked layouts
- Bottom padding for mobile nav bar
- Touch-optimized tap targets (larger)

### Desktop (≥ 768px)
- Request type grid: 3 columns
- Side-by-side buttons
- Wider max-widths
- Hover states fully enabled
- Smaller, more compact elements

## Dark Mode Support

All components fully support dark mode with:
- Dark backgrounds (gray-800, gray-900)
- Light text on dark backgrounds
- Adjusted border colors (gray-700, gray-600)
- Maintained contrast ratios for accessibility
- Consistent gradient appearances

## Accessibility Features

1. **Semantic HTML**: Proper button, label, input elements
2. **ARIA Labels**: All interactive elements have accessible names
3. **Keyboard Navigation**: Full tab navigation support
4. **Focus States**: Visible focus rings on all interactive elements
5. **Color Contrast**: WCAG AA compliant contrast ratios
6. **Screen Reader Support**: Descriptive text for all actions
7. **Touch Targets**: Minimum 44x44px touch areas on mobile

## Animation & Transitions

- **Duration**: 300ms for most transitions
- **Easing**: Default ease timing function
- **Properties**: 
  - Opacity for fades
  - Transform for scales and movements
  - Background colors for hover states
  - Shadow for depth changes
- **Loading States**: Spin animation on icons during operations

## Typography

- **Headings**: 
  - xl to 3xl sizes
  - Bold weight (700)
  - Dark text in light mode, white in dark mode
- **Body Text**:
  - Base size (16px)
  - Regular weight (400)
  - Gray-700 in light mode, gray-300 in dark mode
- **Small Text**:
  - xs to sm sizes
  - Used for metadata, hints
  - Gray-500/gray-400

## Summary

The implemented UI features provide a modern, professional appearance that:
- Uses consistent gradients for visual appeal
- Employs semantic colors for status indication
- Maintains accessibility and usability standards
- Provides clear visual hierarchy
- Supports both light and dark modes
- Works responsively across all device sizes
- Includes smooth animations and transitions
- Follows the existing design system

All components use Tailwind CSS utility classes for maintainability and consistency with the rest of the application.
