# Quick Reference Card - Code Quality Utilities

**Version**: 4.5.28 | **Date**: Nov 18, 2025

---

## 🎯 Accessibility (`lib/accessibility-utils.ts`)

```typescript
import { 
  getStatusAriaLabel, 
  getStatusBadgeClasses,
  getStatusIconName,
  MIN_TOUCH_TARGET,
  FOCUS_RING,
  announceToScreenReader 
} from "@/lib/accessibility-utils";

// Status badge with icon + text + color
const { combined } = getStatusBadgeClasses("approved");
const label = getStatusAriaLabel("approved", language);
const iconName = getStatusIconName("approved"); // "Check"

<span className={combined} role="status" aria-label={label}>
  <Check className="w-4 h-4" />
  <span>{label}</span>
</span>

// Minimum touch targets
<button className={`px-4 py-2 ${MIN_TOUCH_TARGET}`}>Click Me</button>

// Keyboard navigation
<button className={FOCUS_RING}>Accessible Button</button>

// Screen reader announcement
announceToScreenReader("Class created successfully");
```

---

## ⌨️ Keyboard Shortcuts (`lib/use-keyboard-shortcuts.ts`)

```typescript
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from "@/lib/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";

const shortcuts = [
  { ...COMMON_SHORTCUTS.NEW, callback: () => setShowForm(true) },
  { ...COMMON_SHORTCUTS.SAVE, callback: handleSave, disabled: !isDirty },
  { ...COMMON_SHORTCUTS.CLOSE, callback: () => setShowForm(false) },
  { 
    key: "?", 
    shift: true, 
    description: "Show help",
    descriptionTh: "แสดงความช่วยเหลือ",
    callback: () => setShowHelp(true) 
  },
];

useKeyboardShortcuts(shortcuts);

// Help modal
const [showHelp, setShowHelp] = useState(false);
<KeyboardShortcutsHelp 
  shortcuts={shortcuts}
  isOpen={showHelp} 
  onClose={() => setShowHelp(false)} 
/>
```

**Available Shortcuts**:
- `Ctrl+N` - Create new item
- `Ctrl+S` - Save  
- `Ctrl+K` - Search/Filter
- `Escape` - Close modal
- `?` - Show help
- `Ctrl+E` - Edit
- `Delete` - Delete
- `Ctrl+R` - Refresh

---

## 📝 Logging (`lib/logger.ts`)

```typescript
import { logger } from "@/lib/logger";

// Development only (stripped in production)
logger.debug("Component rendered", { 
  component: "ClassBooking",
  props: { studentId, schoolId } 
});

// Info (all environments)
logger.info("Class created", { classId, userId });

// Warning
logger.warn("Deprecated API used", { function: "oldMethod" });

// Error with context
logger.error("Failed to save class", error, {
  component: "ClassBooking",
  action: "save",
  userId
});

// Performance tracking
const endPerf = logger.startPerf("fetchClasses");
const classes = await fetchClasses();
endPerf(); // Logs: [PERF] fetchClasses: 45.23ms
```

---

## ↩️ Undo Mechanism (`lib/toast.ts`)

```typescript
import { toast } from "@/lib/toast";

// Delete with undo
const handleDelete = async (classId: Id<"classes">) => {
  await softDeleteClass({ classId }); // Soft delete first
  
  toast.show({
    title: "Class deleted",
    titleTh: "ลบชั้นเรียนแล้ว",
    message: "Click undo to restore within 10 seconds",
    messageTh: "คลิกเพื่อกู้คืนภายใน 10 วินาที",
    type: "info",
    duration: 10000, // 10 seconds
    action: {
      label: "Undo",
      labelTh: "เลิกทำ",
      onClick: async () => {
        await restoreClass({ classId });
        toast.success("Class restored", "กู้คืนชั้นเรียนแล้ว");
      }
    }
  });
};
```

---

## ☑️ Bulk Actions (`components/bulk-action-bar.tsx`)

```typescript
import { BulkActionBar } from "@/components/bulk-action-bar";

const [selectedClasses, setSelectedClasses] = useState<Set<Id<"classes">>>(new Set());

// Toggle selection
const toggleSelection = (id: Id<"classes">) => {
  const newSet = new Set(selectedClasses);
  if (newSet.has(id)) {
    newSet.delete(id);
  } else {
    newSet.add(id);
  }
  setSelectedClasses(newSet);
};

// Select all
const selectAll = () => {
  setSelectedClasses(new Set(filteredClasses.map(c => c._id)));
};

// Bulk approve
const handleBulkApprove = async (ids: Id<"classes">[]) => {
  await Promise.all(ids.map(id => approveClass({ classId: id })));
  toast.success(`Approved ${ids.length} classes`, `อนุมัติ ${ids.length} ชั้นเรียน`);
};

// Bulk reject
const handleBulkReject = async (ids: Id<"classes">[]) => {
  await Promise.all(ids.map(id => rejectClass({ classId: id })));
  toast.success(`Rejected ${ids.length} classes`, `ปฏิเสธ ${ids.length} ชั้นเรียน`);
};

// UI
<>
  {/* Checkbox for each class */}
  <input 
    type="checkbox" 
    checked={selectedClasses.has(class._id)}
    onChange={() => toggleSelection(class._id)}
    className={MIN_TOUCH_TARGET}
  />
  
  {/* Bulk action bar */}
  <BulkActionBar
    selectedIds={selectedClasses}
    onApprove={handleBulkApprove}
    onReject={handleBulkReject}
    onClearSelection={() => setSelectedClasses(new Set())}
    entityType="class"
  />
</>
```

---

## 🎨 Status Badge Pattern

**Before** (Color-only, not accessible):
```typescript
<div className={status === "approved" ? "bg-green-500" : "bg-red-500"} />
```

**After** (Accessible):
```typescript
import { Check, X } from "lucide-react";
import { getStatusAriaLabel, getStatusBadgeClasses } from "@/lib/accessibility-utils";

const { combined } = getStatusBadgeClasses(status);
const label = getStatusAriaLabel(status, language);

<span className={combined} role="status" aria-label={label}>
  {status === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
  <span>{label}</span>
</span>
```

---

## 🔍 Migration Checklist

### Replace Console Logs
```typescript
// Before
console.log("User action:", action);

// After
logger.debug("User action", { action, userId, component: "ClassBooking" });
```

### Add Keyboard Shortcuts
```typescript
// Before
{/* No shortcuts */}

// After
useKeyboardShortcuts([
  { ...COMMON_SHORTCUTS.NEW, callback: () => setShowForm(true) },
  { ...COMMON_SHORTCUTS.CLOSE, callback: () => setShowForm(false) },
]);
```

### Make Status Accessible
```typescript
// Before
<div className="bg-green-500" />

// After
const { combined } = getStatusBadgeClasses("approved");
<span className={combined} role="status" aria-label={getStatusAriaLabel("approved", language)}>
  <Check className="w-4 h-4" />
  <span>{getStatusAriaLabel("approved", language)}</span>
</span>
```

### Add Undo to Deletions
```typescript
// Before
const handleDelete = async (id) => {
  await deleteClass({ classId: id });
  toast.success("Deleted", "ลบแล้ว");
};

// After
const handleDelete = async (id) => {
  await softDeleteClass({ classId: id });
  toast.show({
    title: "Deleted",
    titleTh: "ลบแล้ว",
    message: "Click undo to restore",
    messageTh: "คลิกเพื่อกู้คืน",
    type: "info",
    duration: 10000,
    action: {
      label: "Undo",
      labelTh: "เลิกทำ",
      onClick: () => restoreClass({ classId: id })
    }
  });
};
```

---

## 📦 Imports Quick Reference

```typescript
// Accessibility
import { 
  getStatusAriaLabel, 
  getStatusBadgeClasses, 
  getStatusIconName,
  MIN_TOUCH_TARGET, 
  FOCUS_RING,
  announceToScreenReader 
} from "@/lib/accessibility-utils";

// Keyboard Shortcuts
import { 
  useKeyboardShortcuts, 
  COMMON_SHORTCUTS,
  formatShortcut 
} from "@/lib/use-keyboard-shortcuts";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";

// Logging
import { logger } from "@/lib/logger";

// Toast Actions
import { toast } from "@/lib/toast";

// Bulk Actions
import { BulkActionBar } from "@/components/bulk-action-bar";
```

---

## 🎯 Common Patterns

### Modal with Keyboard Support
```typescript
const [showModal, setShowModal] = useState(false);

useKeyboardShortcuts([
  {
    key: "Escape",
    description: "Close modal",
    descriptionTh: "ปิดหน้าต่าง",
    callback: () => setShowModal(false),
    disabled: !showModal
  }
]);
```

### Form with Keyboard Support
```typescript
const [isDirty, setIsDirty] = useState(false);

useKeyboardShortcuts([
  {
    ...COMMON_SHORTCUTS.SAVE,
    callback: handleSubmit,
    disabled: !isDirty
  }
]);
```

### List with Keyboard Navigation
```typescript
const [selectedIndex, setSelectedIndex] = useState(0);

useKeyboardShortcuts([
  {
    key: "ArrowDown",
    description: "Next item",
    descriptionTh: "รายการถัดไป",
    callback: () => setSelectedIndex(i => Math.min(i + 1, items.length - 1))
  },
  {
    key: "ArrowUp",
    description: "Previous item",
    descriptionTh: "รายการก่อนหน้า",
    callback: () => setSelectedIndex(i => Math.max(i - 1, 0))
  }
]);
```

---

## ✅ Testing Checklist

- [ ] All buttons have `MIN_TOUCH_TARGET`
- [ ] All focusable elements have `FOCUS_RING`
- [ ] Status indicators use icon + text + color
- [ ] ARIA labels present on all status elements
- [ ] Keyboard shortcuts don't conflict with browser
- [ ] Escape key closes all modals
- [ ] Console.* replaced with logger.* in components
- [ ] Undo available for all destructive actions
- [ ] Bulk actions have confirmation modals
- [ ] Screen reader announces dynamic changes

---

**Quick Start**: Copy-paste patterns above into your components.  
**Full Docs**: See `COMPLETE_IMPLEMENTATION_NOV_18_2025.md`
