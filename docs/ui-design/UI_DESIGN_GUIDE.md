# UI Design Guide

**Last Updated**: October 24, 2025  
**Project**: Evan's Class Tracker 4.5

---

## Design Principles

### 1. Bilingual-First Design
- **Every UI element** must support English + Thai simultaneously
- Forms need parallel input fields for both languages
- Notifications, buttons, labels all bilingual

### 2. Role-Based UI
- **Teacher**: Focused on booking classes and viewing schedules
- **Moderator**: Approve/reject classes, manage school resources
- **Admin**: Full system control, user management, analytics
- **Guardian**: View student progress (future feature)

### 3. Real-Time Feedback
- Toast notifications (bottom-right corner) for all actions
- Live updates via Convex subscriptions (no manual refresh)
- Clear loading states and error messages

---

## Key UI Patterns

### Inline Student Creation Flow

```

          Book Class Form (Teacher View)                

                                                         
  Student Name                    [+ Create New]    
          
   Select a student                                  
   - John Doe                                       
   - Jane Smith                                     
          
                                                       
  School                                               
          
   ABC School                                       
          
                                                       
  
                                                         
         User clicks \"+ Create New\" 
```

**After clicking \"+Create New\":**

```

          Book Class Form (Creating Student)            

                                                         
  Student Name               [ Select Existing]        
        
           
    First Name                                     
             
     John                                        
             
                                                   
    Last Name                                      
             
     Wilson                                      
             
                                                   
    Grade: [Grade 5]  Class: [/1]                 
                                                   
    [ Create & Select Student]                    
           
        
         Blue highlighted box                          

```

**After creation:**
```

  [Alert: \"Student created successfully!\" ]             
                                                         
  Student Name: John Wilson (auto-selected)             
  School: ABC School                                    
  Continue booking...                                   

```

---

### Moderator Class Editing Flow

**Before Edit:**

```

  John Doe                                      [Approved]     
  Location: ABC School - Room 101                              
  Scheduled: Monday, January 20, 2025, 10:00 AM                
                                                               
    
                                                               
                                
   Edit Class     Delete Class                             
      Blue         Red                                 
                                
                                                               
  Teacher will be notified of any changes                      

```

**After clicking \"Edit Class\":**

```

  
    Edit Class Details                                     
                                                             
   Student: [John Doe ]                                     
   School: [ABC School ]                                    
   Location: [Room 101 ]                                    
   Date/Time: [2025-01-20T10:00]                             
   Status: [Approved ]                                      
                                                             
                             
    Save Changes       Cancel                           
       Green           Gray                            
                             
  
                                                               
  Teacher will be notified of any changes                      

```

**After saving:**
```

   
    Class updated successfully                             
   
                                                               
  Jane Smith                                    [Pending]      
  Location: ABC School - Room 102                              
  Scheduled: Wednesday, January 25, 2025, 2:00 PM              

```

---

### Bulk Deletion Flow

**User Management:**

```

  User Management                                   [+ Create] 

                                                               
  [] Teacher1 (teacher)     [Edit] [Delete]                  
  [] Teacher2 (teacher)     [Edit] [Delete]                  
  [ ] Admin1 (admin)         [Edit] [Delete]                  
  [] Teacher3 (teacher)     [Edit] [Delete]                  
                                                               
     
                                                               
  [Delete Selected (3)]   Red button, disabled if 0 selected 
                                                               

```

**After clicking \"Delete Selected\":**

```

   Confirm Bulk Deletion                          

                                                    
  You are about to delete 3 users:                 
  - Teacher1                                        
  - Teacher2                                        
  - Teacher3                                        
                                                    
  This action is IRREVERSIBLE.                      
                                                    
  Reason (required):                                
   
   End of contract                               
   
                                                    
  [ ] I understand this cannot be undone           
                                                    
                        
   Delete (3)     Cancel                       
     Red           Gray                        
                        

```

---

## Color Scheme

### Primary Actions
- **Book/Create**: Blue (#3B82F6)
- **Approve**: Green (#10B981)
- **Edit**: Blue (#3B82F6)
- **Delete**: Red (#EF4444)
- **Cancel**: Gray (#6B7280)

### Status Colors
- **Pending**: Yellow (#F59E0B)
- **Acknowledged**: Blue (#3B82F6)
- **Approved**: Green (#10B981)
- **Rejected**: Red (#EF4444)
- **Completed**: Gray (#6B7280)

### Notifications
- **Success**: Green toast (bottom-right)
- **Error**: Red toast (bottom-right)
- **Info**: Blue toast (bottom-right)

---

## Typography

### Headings
- **H1**: 2.25rem (36px), bold - Page titles
- **H2**: 1.875rem (30px), semibold - Section headers
- **H3**: 1.5rem (24px), semibold - Subsections
- **H4**: 1.25rem (20px), medium - Card titles

### Body Text
- **Large**: 1.125rem (18px) - Important info
- **Regular**: 1rem (16px) - Default body text
- **Small**: 0.875rem (14px) - Meta information
- **Tiny**: 0.75rem (12px) - Footnotes

---

## Layout Patterns

### Mobile-First Grid
```
Mobile (< 768px):     1 column
Tablet (768-1024px):  2 columns
Desktop (> 1024px):   3-4 columns
```

### Spacing System (Tailwind)
- gap-2: 0.5rem (8px) - Tight spacing
- gap-4: 1rem (16px) - Default spacing
- gap-6: 1.5rem (24px) - Section spacing
- gap-8: 2rem (32px) - Page sections

### Container Widths
- **Max width**: 1280px (xl breakpoint)
- **Padding**: 1rem mobile, 2rem desktop
- **Cards**: Rounded corners (0.5rem), shadow-md

---

## Interactive Elements

### Buttons
```tsx
// Primary action
<button className=\"bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded\">
  Book Class
</button>

// Destructive action
<button className=\"bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded\">
  Delete
</button>

// Secondary action
<button className=\"bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded\">
  Cancel
</button>
```

### Form Inputs
```tsx
<input
  type=\"text\"
  className=\"border border-gray-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-blue-500\"
  placeholder=\"Enter name...\"
/>
```

### Dropdowns
```tsx
<select className=\"border border-gray-300 rounded px-3 py-2 w-full\">
  <option>Select student...</option>
  <option>John Doe</option>
  <option>Jane Smith</option>
</select>
```

---

## Accessibility

### Keyboard Navigation
- All interactive elements focusable via Tab
- Escape key closes modals
- Enter key submits forms
- Arrow keys navigate dropdowns

### Screen Readers
- All images have lt text
- Form inputs have ria-label
- Error messages have ole=\"alert\"
- Status changes announced via ria-live

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Icons have labels for screen readers
- Focus indicators visible (2px blue outline)

---

## Responsive Breakpoints

```tsx
// Tailwind breakpoints
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### Example Responsive Classes
```tsx
<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
  {/* 1 col mobile, 2 col tablet, 3 col desktop */}
</div>
```

---

## Animation Guidelines

### Transitions
- **Duration**: 150-200ms for most interactions
- **Easing**: ease-in-out for smooth feel
- **Hover**: Subtle scale (1.02x) or color change

### Toast Notifications
- **Entry**: Slide in from right (200ms)
- **Exit**: Fade out (150ms)
- **Duration**: 3 seconds default, 5 seconds for errors

---

## Component Library

### Core Components
- class-booking.tsx - Multi-date booking form
- edit-class-modal.tsx - Full edit modal with audit trail
- desktop-notification-toast.tsx - Toast notification UI
- 
otification-window.tsx - One-time notification system
- calendar-picker.tsx - Single date picker
- multi-date-calendar.tsx - Multi-date selection

### Admin Components
- user-management.tsx - Bulk user operations
- student-management.tsx - Bulk student operations
- school-management.tsx - School CRUD
- udit-logs.tsx - Audit trail viewer with CSV export

---

## Mobile Considerations

### Touch Targets
- **Minimum**: 44x44px (Apple HIG, WCAG)
- **Preferred**: 48x48px for primary actions
- **Spacing**: 8px minimum between targets

### Mobile Navigation
- Hamburger menu for < 768px
- Bottom navigation for frequent actions
- Swipe gestures for modals (dismiss)

### Performance
- Lazy load images and heavy components
- Debounce search inputs (300ms)
- Paginate long lists (20 items per page)

---

## Testing Checklist

### Visual Testing
- [ ] All UI elements render correctly on mobile/tablet/desktop
- [ ] Bilingual text displays properly (no overflow)
- [ ] Colors meet accessibility standards
- [ ] Focus indicators visible
- [ ] Loading states clear

### Interactive Testing
- [ ] All buttons clickable and respond correctly
- [ ] Forms validate inputs
- [ ] Modals open/close properly
- [ ] Dropdowns show all options
- [ ] Keyboard navigation works

### Real-Time Testing
- [ ] Toast notifications appear/disappear correctly
- [ ] Live updates work (open 2 windows, test sync)
- [ ] No duplicate notifications
- [ ] Error states handled gracefully

---

## Related Documentation

- [MOBILE_UI_GUIDE.md](MOBILE_UI_GUIDE.md) - Mobile-specific patterns
- [ARCHITECTURE.md](ARCHITECTURE.md) - Component hierarchy
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - UI testing procedures
- components/ - Reusable UI components

---

**Maintained by**: TeacherEvan  
**Design System**: Tailwind CSS v4 + Custom Components
