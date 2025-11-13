# VS Code-Style Layout Redesign Plan

**Date**: November 9, 2025  
**Status**: Planning Phase  
**Priority**: HIGH (Major UX Improvement)

---

## 🎯 Design Goals

Transform current horizontal-tab layout into multi-panel VS Code-inspired layout:

**Current Layout Issues:**

- ❌ Single-panel horizontal tabs at top
- ❌ No multi-tasking support (can only view one thing at a time)
- ❌ Wasted vertical space on wide screens
- ❌ Poor productivity for teachers managing multiple tasks

**Target Layout Benefits:**

- ✅ Multi-panel view (left sidebar + center + right panel + bottom panel)
- ✅ Multi-tasking (view calendar WHILE chatting)
- ✅ Familiar VS Code patterns (left nav, right auxiliary, bottom terminal)
- ✅ Resizable panels for user customization
- ✅ Responsive collapse on mobile

---

## 📐 Layout Wireframe

### Desktop Layout (>1024px)

```text
┌──────────────────────────────────────────────────────────────┐
│  HEADER (Logo, User Info, Language, Logout)        [60px]    │
├──────────┬──────────────────────────────────┬────────────────┤
│          │                                  │                │
│  LEFT    │  CENTER MAIN CONTENT             │  RIGHT PANEL   │
│  NAV     │  (Calendar/Classes/Students/etc) │  (Messages)    │
│  [240px] │  (Dynamic based on selection)    │  [320px]       │
│          │                                  │  - Chat        │
│  - 📅 Cal│                                  │  - Notifs      │
│  - 📚 Cls│                                  │  - Quick       │
│  - 👥 Std│                                  │    Actions     │
│  - 💬 Msg│                                  │                │
│  - 📊 Evt│                                  │  [Collapsible] │
│  - 🏫 Sch│                                  │                │
│  - ...   │                                  │                │
│          │                                  │                │
├──────────┴──────────────────────────────────┴────────────────┤
│  BOTTOM PANEL (Events/Student Quick View)          [240px]   │
│  - Upcoming events list                                      │
│  - Recent student bookings                                   │
│  - Quick stats                                [Collapsible]  │
└──────────────────────────────────────────────────────────────┘
```

### Tablet Layout (768px - 1024px)

```text
┌──────────────────────────────────────────────────┐
│  HEADER                                [60px]    │
├──────┬───────────────────────────────────────────┤
│      │                                           │
│ LEFT │  CENTER MAIN CONTENT                      │
│ NAV  │  (Right panel collapses, accessible       │
│[60px]│   via hamburger menu)                     │
│      │                                           │
│ 📅   │                                           │
│ 📚   │                                           │
│ 👥   │                                           │
│ 💬   │                                           │
│ ...  │                                           │
│      │                                           │
├──────┴───────────────────────────────────────────┤
│  BOTTOM PANEL (Collapsed by default)  [40px]    │
│  [Expand ▲]                                      │
└──────────────────────────────────────────────────┘
```

### Mobile Layout (<768px)

```text
┌──────────────────────────┐
│  HEADER (Compact) [60px] │
├──────────────────────────┤
│                          │
│  MAIN CONTENT            │
│  (Full width)            │
│                          │
│  Left nav: Hamburger ☰   │
│  Right panel: Modal      │
│  Bottom panel: Hidden    │
│                          │
│                          │
└──────────────────────────┘
```

---

## 🏗️ Technical Implementation Plan

### Phase 1: Core Layout Structure (Day 1-2)

**Files to Create:**

1. **`app/workspace-layout.tsx`** (NEW)
   - Main workspace container
   - CSS Grid layout (4-region grid)
   - Responsive breakpoints

2. **`components/sidebar-nav.tsx`** (NEW)
   - Left sidebar navigation
   - Icon + label for each section
   - Active state highlighting
   - Collapsible on tablet/mobile

3. **`components/right-panel.tsx`** (NEW)
   - Messages/chat view
   - Notifications quick view
   - Quick actions
   - Toggle visibility

4. **`components/bottom-panel.tsx`** (NEW)
   - Events timeline
   - Recent student activity
   - Quick stats
   - Collapsible with drag handle

**CSS Grid Layout** (`app/workspace-layout.tsx`):

```tsx
<div className="grid grid-cols-[240px_1fr_320px] grid-rows-[60px_1fr_240px] h-screen">
  {/* Header - spans all columns */}
  <header className="col-span-3 row-span-1">
    <Header />
  </header>
  
  {/* Left Sidebar */}
  <aside className="col-span-1 row-span-2">
    <SidebarNav />
  </aside>
  
  {/* Main Content */}
  <main className="col-span-1 row-span-1">
    {renderActiveView()}
  </main>
  
  {/* Right Panel */}
  <aside className="col-span-1 row-span-2">
    <RightPanel />
  </aside>
  
  {/* Bottom Panel - spans left nav + main content */}
  <footer className="col-span-2 row-span-1">
    <BottomPanel />
  </footer>
</div>
```

---

### Phase 2: Resizable Panels (Day 3-4)

**Dependencies:**

- `react-resizable-panels` (lightweight, React 19 compatible)
- OR custom implementation using mouse/touch events

**Features:**

- Drag handles between panels
- Min/max width constraints
- Save panel sizes to localStorage
- Snap-to-default on double-click drag handle

**Example** (using `react-resizable-panels`):

```tsx
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

<PanelGroup direction="horizontal">
  <Panel defaultSize={20} minSize={10} maxSize={30}>
    <SidebarNav />
  </Panel>
  
  <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500" />
  
  <Panel defaultSize={50} minSize={30}>
    <MainContent />
  </Panel>
  
  <PanelResizeHandle className="w-1 bg-gray-300 hover:bg-blue-500" />
  
  <Panel defaultSize={30} minSize={15} maxSize={40}>
    <RightPanel />
  </Panel>
</PanelGroup>
```

---

### Phase 3: Component Migration (Day 5-6)

**Move existing components into new layout:**

1. **Left Sidebar Navigation Items:**
   - Calendar → `activeView: "calendar"`
   - Classes → `activeView: "classes"`
   - Students → `activeView: "students"`
   - Messages → `activeView: "messages"`
   - Events → `activeView: "events"`
   - Schools (admin) → `activeView: "schools"`
   - Moderators (admin) → `activeView: "moderators"`
   - Locations → `activeView: "locations"`
   - Resources → `activeView: "resources"`
   - Analytics → `activeView: "analytics"`

2. **Right Panel Components:**
   - Messages Hub (always visible)
   - Notifications (badge + dropdown)
   - Quick Actions (book class, add student)

3. **Bottom Panel Components:**
   - Events timeline (from `components/event-management.tsx`)
   - Recent student bookings
   - Quick stats (class count, student count)

4. **Main Content (Center):**
   - Existing lazy-loaded components
   - No changes to component internals
   - Just mounted in new location

---

### Phase 4: State Management (Day 7)

**Layout State:**

```tsx
interface LayoutState {
  leftSidebarWidth: number;
  rightPanelWidth: number;
  bottomPanelHeight: number;
  rightPanelVisible: boolean;
  bottomPanelVisible: boolean;
  activeView: ViewType;
}

type ViewType = 
  | "calendar" 
  | "classes" 
  | "students" 
  | "messages" 
  | "events" 
  | "schools" 
  | "moderators" 
  | "locations" 
  | "resources" 
  | "analytics";
```

**Persistence** (localStorage):

```tsx
// Save layout preferences
localStorage.setItem('layoutPreferences', JSON.stringify({
  leftSidebarWidth: 240,
  rightPanelWidth: 320,
  bottomPanelHeight: 240,
  rightPanelVisible: true,
  bottomPanelVisible: true
}));

// Restore on mount
const savedPrefs = localStorage.getItem('layoutPreferences');
if (savedPrefs) {
  setLayoutState(JSON.parse(savedPrefs));
}
```

---

### Phase 5: Responsive Behavior (Day 8)

**Breakpoints:**

```scss
// Tailwind config (if needed)
screens: {
  'mobile': '0px',      // Full mobile
  'tablet': '768px',    // Collapse right panel
  'desktop': '1024px',  // Full layout
  'wide': '1440px'      // Wider default panels
}
```

**Responsive Logic:**

```tsx
// Detect screen size
const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

useEffect(() => {
  const handleResize = () => {
    const width = window.innerWidth;
    if (width < 768) setScreenSize('mobile');
    else if (width < 1024) setScreenSize('tablet');
    else setScreenSize('desktop');
  };
  
  window.addEventListener('resize', handleResize);
  handleResize(); // Initial check
  
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Conditional rendering
{screenSize === 'desktop' && <RightPanel />}
{screenSize !== 'mobile' && <BottomPanel />}
```

---

### Phase 6: Testing & Polish (Day 9-10)

**E2E Tests to Update:**

1. **Navigation tests:**
   - Click sidebar items → verify main content updates
   - Verify active state highlighting

2. **Panel tests:**
   - Resize panels → verify localStorage saves
   - Collapse/expand → verify state persists
   - Mobile: hamburger menu opens sidebar

3. **Existing feature tests:**
   - Class booking still works in new layout
   - Student management still works
   - Messages still work

**Accessibility:**

- Keyboard navigation (Tab, Arrow keys)
- ARIA labels for panels
- Focus management when switching views
- Screen reader announcements

**Polish:**

- Smooth transitions (panel collapse/expand)
- Loading states for lazy components
- Empty states for panels
- Drag handle hover effects

---

## 🎨 Visual Design Tokens

**Colors** (VS Code Dark Theme Inspired):

```scss
// Sidebar
--sidebar-bg: #1e1e1e;
--sidebar-active: #37373d;
--sidebar-hover: #2a2d2e;
--sidebar-text: #cccccc;
--sidebar-text-active: #ffffff;

// Main Content
--main-bg: #252526;
--main-text: #d4d4d4;

// Right Panel
--panel-bg: #1e1e1e;
--panel-border: #3e3e42;

// Bottom Panel
--bottom-bg: #1e1e1e;
--bottom-border: #3e3e42;

// Drag Handles
--resize-handle: #3e3e42;
--resize-handle-hover: #007acc;
```

**Icons** (Lucide):

```tsx
import {
  Calendar,      // Calendar view
  BookOpen,      // Classes
  Users,         // Students
  MessageSquare, // Messages
  CalendarDays,  // Events
  School,        // Schools
  UserCog,       // Moderators
  MapPin,        // Locations
  BookMarked,    // Resources
  BarChart3      // Analytics
} from "lucide-react";
```

---

## 📊 Implementation Timeline

| Phase | Duration | Status | Deliverable |
|-------|----------|--------|-------------|
| **Phase 1** | 2 days | ⏳ Pending | Core layout structure |
| **Phase 2** | 2 days | ⏳ Pending | Resizable panels |
| **Phase 3** | 2 days | ⏳ Pending | Component migration |
| **Phase 4** | 1 day  | ⏳ Pending | State management |
| **Phase 5** | 1 day  | ⏳ Pending | Responsive behavior |
| **Phase 6** | 2 days | ⏳ Pending | Testing & polish |

**Total Estimated Time:** 10 working days (2 weeks)

---

## 🚀 Migration Strategy

### Approach: Parallel Development (Minimal Disruption)

1. **Keep existing layout working** (no breaking changes)
2. **Add feature flag** for new layout:

   ```tsx
   const USE_NEW_LAYOUT = process.env.NEXT_PUBLIC_VSCODE_LAYOUT === "true";
   ```

3. **Develop new layout alongside old**
4. **Test extensively** before switch
5. **Single PR/deploy** for the cutover

### Rollback Plan

If new layout has issues:

```tsx
// In app/page.tsx
const USE_NEW_LAYOUT = false; // Quick disable
```

---

## ✅ Success Criteria

**Must Have:**

- ✅ Left sidebar navigation with all current tabs
- ✅ Resizable panels (left, right, bottom)
- ✅ Panel visibility toggles (right, bottom)
- ✅ Panel sizes persist to localStorage
- ✅ Responsive collapse on mobile/tablet
- ✅ All existing features work in new layout
- ✅ E2E tests pass

**Nice to Have:**

- ⭐ Drag-and-drop panel rearrangement
- ⭐ Custom panel layouts (save multiple presets)
- ⭐ Keyboard shortcuts (Ctrl+B toggle sidebar, etc.)
- ⭐ Panel maximize/minimize animations

---

## 📝 Open Questions

1. **Should we use a library for resizable panels?**
   - Recommendation: YES - use `react-resizable-panels` (lightweight, maintained)

2. **Should bottom panel be always visible or optional?**
   - Recommendation: Collapsible by default, user preference saved

3. **Should we support multiple center panels (split editor like VS Code)?**
   - Recommendation: Phase 2 feature (after initial launch)

4. **Mobile: Full hamburger menu or bottom nav bar?**
   - Recommendation: Hamburger menu (consistent with VS Code Mobile)

---

## 🔗 Related Files

**Will Create:**

- `app/workspace-layout.tsx`
- `components/sidebar-nav.tsx`
- `components/right-panel.tsx`
- `components/bottom-panel.tsx`

**Will Modify:**

- `app/page.tsx` (switch to new layout)
- `app/globals.css` (add VS Code color tokens)
- E2E test files (update selectors)

**References:**

- VS Code Layout: <https://code.visualstudio.com/docs/getstarted/userinterface>
- react-resizable-panels: <https://github.com/bvaughn/react-resizable-panels>

---

## 🎯 Next Steps

1. **Get user approval** on wireframe design
2. **Install dependencies** (`npm install react-resizable-panels`)
3. **Create Phase 1 files** (core layout structure)
4. **Implement basic layout** (no resizing yet)
5. **Test with existing components**
6. **Iterate based on feedback**

---

**Created:** November 9, 2025  
**Last Updated:** November 9, 2025  
**Author:** AI Agent + User Collaboration
