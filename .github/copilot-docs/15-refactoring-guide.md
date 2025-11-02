# Code Refactoring Guide

[← Back to Index](../copilot-instructions.md)

---

## 🔧 Purpose

Systematic approach to refactoring large files while maintaining functionality and real-time features.

**Current Technical Debt**:

- `components/class-booking.tsx`: 2,930 lines (CRITICAL - needs splitting)
- `convex/classes.ts`: 2,213 lines (HIGH - needs modularization)
- `components/student-management.tsx`: 1,193 lines (MEDIUM)
- `components/class-detail-modal.tsx`: 1,065 lines (MEDIUM)

---

## Refactoring Priority #1: class-booking.tsx (2,930 lines)

### Current Structure Analysis

**File breakdown**:

- Lines 1-200: Imports and type definitions (200 lines)
- Lines 201-500: State management (300 lines)
- Lines 501-800: Form handlers (300 lines)
- Lines 801-1200: Multi-date booking logic (400 lines)
- Lines 1201-1600: Recurring booking logic (400 lines)
- Lines 1601-2000: Conflict detection (400 lines)
- Lines 2001-2400: UI sections (filters, forms) (400 lines)
- Lines 2401-2930: Modals and sub-components (530 lines)

### Proposed Split (7 New Files)

```
components/
├── class-booking/                    # NEW DIRECTORY
│   ├── index.tsx                     # Main component (300 lines)
│   ├── class-booking-state.ts        # State management hook (150 lines)
│   ├── class-booking-form.tsx        # Form component (300 lines)
│   ├── multi-date-picker.tsx         # Multi-date logic (400 lines)
│   ├── recurring-booking-config.tsx  # Recurring setup (400 lines)
│   ├── conflict-detector.tsx         # Conflict logic (400 lines)
│   ├── filter-panel.tsx              # Filters UI (300 lines)
│   └── booking-helpers.ts            # Utility functions (200 lines)
```

### Step-by-Step Refactoring

#### Phase 1: Extract State Management (Week 1)

```typescript
// components/class-booking/class-booking-state.ts
import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export interface BookingState {
  // Selection state
  selectedSchool: Id<"schools"> | null;
  selectedTeacher: Id<"users"> | null;
  selectedStudent: Id<"students"> | null;
  selectedLocation: Id<"locations"> | null;
  
  // Date/time state
  selectedDates: number[];
  startTime: string;
  endTime: string;
  
  // Booking mode
  isRecurring: boolean;
  weekCount: number;
  
  // UI state
  showConflicts: boolean;
  isSubmitting: boolean;
}

export function useClassBookingState(userId: Id<"users">) {
  // Selection state
  const [selectedSchool, setSelectedSchool] = useState<Id<"schools"> | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Id<"users"> | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Id<"students"> | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Id<"locations"> | null>(null);
  
  // Date/time state
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  
  // Booking mode
  const [isRecurring, setIsRecurring] = useState(false);
  const [weekCount, setWeekCount] = useState(1);
  
  // UI state
  const [showConflicts, setShowConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Derived state
  const hasSelection = useMemo(() => 
    selectedTeacher && selectedStudent && selectedDates.length > 0,
    [selectedTeacher, selectedStudent, selectedDates]
  );
  
  // Data queries
  const schools = useQuery(api.schools.list, {});
  const teachers = useQuery(
    api.users.byRole, 
    selectedSchool ? { role: "teacher", schoolId: selectedSchool } : "skip"
  );
  const students = useQuery(
    api.students.bySchool,
    selectedSchool ? { schoolId: selectedSchool } : "skip"
  );
  
  return {
    // State
    selectedSchool,
    selectedTeacher,
    selectedStudent,
    selectedLocation,
    selectedDates,
    startTime,
    endTime,
    isRecurring,
    weekCount,
    showConflicts,
    isSubmitting,
    
    // Setters
    setSelectedSchool,
    setSelectedTeacher,
    setSelectedStudent,
    setSelectedLocation,
    setSelectedDates,
    setStartTime,
    setEndTime,
    setIsRecurring,
    setWeekCount,
    setShowConflicts,
    setIsSubmitting,
    
    // Derived
    hasSelection,
    
    // Data
    schools,
    teachers,
    students,
  };
}
```

#### Phase 2: Extract Conflict Detection (Week 1)

```typescript
// components/class-booking/conflict-detector.tsx
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface ConflictCheck {
  teacherId: Id<"users">;
  dates: number[];
  startTime: string;
  endTime: string;
}

export function useConflictDetection({ teacherId, dates, startTime, endTime }: ConflictCheck) {
  // Query existing classes for teacher in date range
  const existingClasses = useQuery(
    api.classes.byTeacherAndDateRange,
    teacherId && dates.length > 0 ? {
      teacherId,
      startDate: Math.min(...dates),
      endDate: Math.max(...dates)
    } : "skip"
  );
  
  const conflicts = useMemo(() => {
    if (!existingClasses) return [];
    
    return dates.flatMap(date => {
      const dayClasses = existingClasses.filter(c => 
        isSameDay(c.scheduledDate, date)
      );
      
      return dayClasses.filter(c => 
        timeOverlaps(
          { start: startTime, end: endTime },
          { start: c.startTime, end: c.endTime }
        )
      ).map(c => ({
        date,
        classId: c._id,
        studentName: c.studentName,
        time: `${c.startTime}-${c.endTime}`
      }));
    });
  }, [existingClasses, dates, startTime, endTime]);
  
  return {
    conflicts,
    hasConflicts: conflicts.length > 0,
    conflictCount: conflicts.length
  };
}

export function ConflictWarning({ conflicts }: { conflicts: any[] }) {
  const { t } = useLanguage();
  
  if (conflicts.length === 0) return null;
  
  return (
    <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
          {t("Scheduling Conflicts Detected", "พบความขัดแย้งในตารางเวลา")}
        </h4>
      </div>
      <ul className="space-y-1 text-sm">
        {conflicts.map((conflict, idx) => (
          <li key={idx} className="text-yellow-700 dark:text-yellow-300">
            {format(conflict.date, "MMM d, yyyy")} - {conflict.time} - {conflict.studentName}
          </li>
        ))}
      </ul>
    </div>
  );
}

function timeOverlaps(
  slot1: { start: string; end: string },
  slot2: { start: string; end: string }
): boolean {
  const start1 = parseTime(slot1.start);
  const end1 = parseTime(slot1.end);
  const start2 = parseTime(slot2.start);
  const end2 = parseTime(slot2.end);
  
  return start1 < end2 && start2 < end1;
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
```

#### Phase 3: Extract Recurring Logic (Week 2)

```typescript
// components/class-booking/recurring-booking-config.tsx
import { useState } from 'react';
import { format, addWeeks } from 'date-fns';

interface RecurringConfig {
  startDate: number;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  weekCount: number;
  startTime: string;
  endTime: string;
}

export function RecurringBookingConfig({
  config,
  onChange
}: {
  config: RecurringConfig;
  onChange: (config: RecurringConfig) => void;
}) {
  const { t } = useLanguage();
  
  // Generate array of dates based on config
  const generatedDates = useMemo(() => {
    const dates: number[] = [];
    let currentDate = config.startDate;
    
    for (let week = 0; week < config.weekCount; week++) {
      dates.push(currentDate);
      currentDate = addWeeks(currentDate, 1).getTime();
    }
    
    return dates;
  }, [config.startDate, config.weekCount]);
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Start Date", "วันเริ่มต้น")}
        </label>
        <input
          type="date"
          value={format(config.startDate, "yyyy-MM-dd")}
          onChange={(e) => onChange({
            ...config,
            startDate: new Date(e.target.value).getTime()
          })}
          className="input"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Day of Week", "วันในสัปดาห์")}
        </label>
        <select
          value={config.dayOfWeek}
          onChange={(e) => onChange({
            ...config,
            dayOfWeek: Number(e.target.value)
          })}
          className="select"
        >
          {daysOfWeek.map((day, idx) => (
            <option key={idx} value={idx}>
              {t(day.en, day.th)}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          {t("Number of Weeks", "จำนวนสัปดาห์")}
        </label>
        <input
          type="number"
          min={1}
          max={52}
          value={config.weekCount}
          onChange={(e) => onChange({
            ...config,
            weekCount: Number(e.target.value)
          })}
          className="input"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t(
            `Will create ${generatedDates.length} classes`,
            `จะสร้าง ${generatedDates.length} คลาส`
          )}
        </p>
      </div>
      
      {/* Preview */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
        <h4 className="font-semibold mb-2">
          {t("Preview Dates", "ตัวอย่างวันที่")}
        </h4>
        <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
          {generatedDates.map((date, idx) => (
            <div key={idx} className="flex justify-between">
              <span>{format(date, "EEEE, MMM d, yyyy")}</span>
              <span className="text-gray-500">
                {config.startTime} - {config.endTime}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const daysOfWeek = [
  { en: "Sunday", th: "วันอาทิตย์" },
  { en: "Monday", th: "วันจันทร์" },
  { en: "Tuesday", th: "วันอังคาร" },
  { en: "Wednesday", th: "วันพุธ" },
  { en: "Thursday", th: "วันพฤหัสบดี" },
  { en: "Friday", th: "วันศุกร์" },
  { en: "Saturday", th: "วันเสาร์" }
];
```

#### Phase 4: Main Component Integration (Week 2)

```typescript
// components/class-booking/index.tsx (NEW - much smaller!)
"use client";

import { useClassBookingState } from './class-booking-state';
import { useConflictDetection, ConflictWarning } from './conflict-detector';
import { ClassBookingForm } from './class-booking-form';
import { RecurringBookingConfig } from './recurring-booking-config';
import { FilterPanel } from './filter-panel';

export function ClassBooking({ userId }: { userId: Id<"users"> }) {
  const state = useClassBookingState(userId);
  const conflicts = useConflictDetection({
    teacherId: state.selectedTeacher,
    dates: state.selectedDates,
    startTime: state.startTime,
    endTime: state.endTime
  });
  
  const bookClass = useMutation(api.classes.book);
  
  const handleSubmit = async () => {
    if (!state.hasSelection) return;
    
    state.setIsSubmitting(true);
    
    try {
      await bookClass({
        teacherId: state.selectedTeacher,
        studentId: state.selectedStudent,
        schoolId: state.selectedSchool,
        dates: state.selectedDates,
        startTime: state.startTime,
        endTime: state.endTime,
        isRecurring: state.isRecurring
      });
      
      toast.success("Class booked!", "จองคลาสสำเร็จ!");
      state.setSelectedDates([]);
    } catch (error) {
      toast.error("Booking failed", "การจองล้มเหลว");
    } finally {
      state.setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <FilterPanel state={state} />
      
      {state.isRecurring ? (
        <RecurringBookingConfig
          config={{
            startDate: state.selectedDates[0] || Date.now(),
            dayOfWeek: new Date(state.selectedDates[0] || Date.now()).getDay(),
            weekCount: state.weekCount,
            startTime: state.startTime,
            endTime: state.endTime
          }}
          onChange={(config) => {
            // Update state from recurring config
          }}
        />
      ) : (
        <ClassBookingForm state={state} />
      )}
      
      <ConflictWarning conflicts={conflicts.conflicts} />
      
      <button
        onClick={handleSubmit}
        disabled={!state.hasSelection || state.isSubmitting || conflicts.hasConflicts}
        className="btn-primary"
      >
        {state.isSubmitting ? "Booking..." : "Book Class"}
      </button>
    </div>
  );
}
```

### Migration Checklist

```markdown
Before refactoring:
- [ ] Create feature branch: `git checkout -b refactor/class-booking`
- [ ] Full backup: `npm run backup`
- [ ] Create tests for current functionality
- [ ] Document current behavior (screenshots)

During refactoring:
- [ ] Create new directory structure
- [ ] Move one section at a time
- [ ] Test after each move (npm run dev)
- [ ] Update imports incrementally
- [ ] Keep old file until fully migrated

After refactoring:
- [ ] Run full E2E tests
- [ ] Compare bundle size (should be similar or smaller)
- [ ] Test all booking scenarios:
  - [ ] Once-off booking
  - [ ] Multi-date booking
  - [ ] Recurring booking
  - [ ] Conflict detection
  - [ ] Guardian booking
  - [ ] Provider booking
- [ ] Delete old file
- [ ] Update documentation
- [ ] Merge to main
```

---

## Refactoring Priority #2: convex/classes.ts (2,213 lines)

### Current Structure

- Lines 1-100: Imports and helper functions
- Lines 101-500: Query functions (list, get, byTeacher, etc.)
- Lines 501-1000: Booking mutation (complex logic)
- Lines 1001-1500: Update/edit mutations
- Lines 1501-1800: Approval workflow
- Lines 1801-2213: Bulk operations and admin functions

### Proposed Split

```
convex/
├── classes/
│   ├── queries.ts          # All query functions
│   ├── mutations.ts        # Create/update/delete
│   ├── booking.ts          # Booking-specific logic
│   ├── approval.ts         # Workflow mutations
│   ├── bulk-operations.ts  # Admin bulk operations
│   └── helpers.ts          # Shared utilities
```

### Example Split

```typescript
// convex/classes/queries.ts
import { query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    schoolId: v.optional(v.id("schools")),
    teacherId: v.optional(v.id("users")),
    status: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Move list query here
  }
});

export const getById = query({
  // Move from classes.ts
});

export const byTeacher = query({
  // Move from classes.ts
});

// convex/classes/booking.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const book = mutation({
  // Move booking logic here
  // Keep all complex validation
  // Keep notification creation
});

export const bookRecurring = mutation({
  // Move recurring booking here
});

// convex/classes/index.ts (re-export all)
export * from "./queries";
export * from "./mutations";
export * from "./booking";
export * from "./approval";
export * from "./bulk-operations";
```

---

## General Refactoring Principles

### 1. Single Responsibility Principle

```typescript
// ❌ BAD - One component does everything
function ClassManagement() {
  // 2000 lines of booking + editing + viewing + deleting
}

// ✅ GOOD - Separate concerns
function ClassList() { /* viewing only */ }
function ClassBookingForm() { /* booking only */ }
function ClassEditModal() { /* editing only */ }
```

### 2. Extract Custom Hooks

```typescript
// ❌ BAD - Logic embedded in component
function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 100 lines of data fetching logic
  }, []);
  
  // 200 lines of processing logic
  
  return <div>...</div>;
}

// ✅ GOOD - Logic extracted to hook
function useProcessedData() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // 100 lines of data fetching logic
  }, []);
  
  const processed = useMemo(() => {
    // 200 lines of processing logic
  }, [data]);
  
  return { data, processed };
}

function MyComponent() {
  const { data, processed } = useProcessedData();
  return <div>...</div>;
}
```

### 3. Colocate Related Files

```
// ❌ BAD - Scattered files
components/
  class-booking.tsx
  class-booking-helpers.ts
  class-booking-types.ts
lib/
  class-booking-utils.ts

// ✅ GOOD - Colocated
components/class-booking/
  index.tsx
  helpers.ts
  types.ts
  utils.ts
```

### 4. Progressive Enhancement

```
Don't refactor everything at once!

Week 1: Extract state management
Week 2: Extract conflict detection
Week 3: Extract recurring logic
Week 4: Final cleanup and testing

Test after each week!
```

---

## Monitoring Refactoring Impact

### Before Refactoring - Capture Metrics

```powershell
# Bundle size
npm run build
# Note: .next/static/chunks/*.js sizes

# Build time
Measure-Command { npm run build }

# Type check time
Measure-Command { npx tsc --noEmit }

# Test coverage
npm run test:e2e
# Note: pass/fail count
```

### After Refactoring - Compare

```powershell
# Should be similar or better:
- Bundle size: ±5% acceptable
- Build time: Should be faster (fewer type checks per file)
- Type check time: Should be faster (parallel checking)
- Test coverage: Should be same (100% pass)
```

---

## Refactoring Resources

- **React Patterns**: <https://react.dev/learn/you-might-not-need-an-effect>
- **TypeScript Patterns**: <https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html>
- **Next.js Best Practices**: <https://nextjs.org/docs/app/building-your-application/optimizing>

---

[← Back to Index](../copilot-instructions.md)
