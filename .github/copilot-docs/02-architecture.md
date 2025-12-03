# Architecture Essentials

[← Back to Index](../copilot-instructions.md)

---

## Provider Hierarchy (Load-Bearing - DO NOT REORDER)

Provider order in `app/layout.tsx` is **CRITICAL** - reordering causes runtime failures:

```tsx
<ErrorBoundary>              // 1. Catches all errors
  <ConvexClientProvider>     // 2. DB connection
    <DeviceProvider>         // 3. Device detection (depends on Convex)
      <DataProvider>         // 4. Shared data layer (schools, users)
        <LanguageProvider>   // 5. UI-only state (innermost)
```

**Visual dependency flow:**

```mermaid
graph TD
    A[ErrorBoundary] --> B[ConvexClientProvider]
    B --> C[DeviceProvider]
    C --> D[DataProvider]
    D --> E[LanguageProvider]
    E --> F[Page Components]
    
    B -.->|provides| G[useQuery/useMutation]
    C -.->|provides| H[deviceType state]
    D -.->|provides| I[schools/users data]
    E -.->|provides| J[t function for bilingual]
    
    style A fill:#ff6b6b
    style B fill:#4ecdc4
    style C fill:#45b7d1
    style D fill:#96ceb4
    style E fill:#ffeaa7
    style F fill:#dfe6e9
```

All components need `"use client"` directive. Never reorder or remove these providers.

---

## Convex Backend Pattern

- **Schema is source of truth**: `convex/schema.ts` defines tables, indexes, and validation
- **Never edit** `convex/_generated/` - auto-regenerated from schema
- **Client pattern**: `useQuery(api.users.list, {})` for reads, `useMutation(api.classes.book)` for writes
- **Pass userId explicitly** - no built-in `ctx.auth.getUserIdentity()`, uses custom session auth
- **All components require `"use client"`** - Next.js App Router requires this for client-side hooks

---

## Authentication & Session Management

**Custom authentication** (not Convex built-in auth):

```tsx
// Session stored in localStorage with 24-hour expiration
import { saveUserSession, loadUserSession, clearUserSession } from "@/lib/session-utils";

// On login - saves with auto-expiration
saveUserSession(user);

// On page load - validates expiration
const user = loadUserSession(); // Returns null if expired

// On logout
clearUserSession();
```

**Session security features**:

- **24-hour auto-expiration**: Sessions expire after 24 hours (NEW Oct 2025)
- **Auto-extension on activity**: Each page load resets the timer
- **Default password**: `Teacher{username}` (e.g., `TeacherEvan`)
- **First login**: Forced password change via `requirePasswordChange` flag
- **Admin powers**: Create/reset passwords, cannot view existing passwords
- **Password hashing**: Uses PBKDF2 (Web Crypto API, 100,000 iterations) with hybrid verification during migration from legacy bcrypt and btoa() hashes (NEW Nov 2025)
- **Account lockout**: 24-hour lockout after 5 failed login attempts (see Pattern #11)

---

## Modular Architecture (Dec 2025)

**Recent Refactoring**: Large monolithic files split into maintainable modules

### Frontend Modular Components

**`components/class-booking/`** - Decomposed from monolithic class-booking.tsx (2,930 lines → modular)

```
components/class-booking/
├── index.tsx                    # Main orchestrator (126KB)
├── types.ts                     # TypeScript interfaces
├── constants.ts                 # Shared constants
├── class-booking-state.ts       # State management hook (9KB)
└── ClassItemDisplay.tsx         # Class card component (30KB)
```

**Benefits**:
- Better code organization and readability
- Easier to test individual components
- Reduced cognitive load when editing
- Type safety with shared interfaces
- Reusable state management hook

**Usage pattern**:
```tsx
// Main component imports and orchestrates
import { useClassBookingState } from './class-booking-state';
import { ClassItemDisplay } from './ClassItemDisplay';
import { DEFAULT_START_TIME, DEFAULT_END_TIME } from './constants';
import type { BookingFormData } from './types';
```

### Backend Modular Structure

**`convex/classes/`** - Split from monolithic classes.ts (2,213 lines → modular)

```
convex/classes/
├── index.ts                     # Re-exports (public API)
├── queries.ts                   # 9 query functions (15KB)
├── mutations.ts                 # 16 mutation functions (79KB)
├── helpers.ts                   # Authorization helpers (5KB)
└── README.md                    # Module documentation
```

**Query functions** (queries.ts):
- `list` - Paginated class list
- `get` - Single class details
- `getByStatus` - Filter by status
- `getByTeacher` - Teacher's classes
- `getByStudent` - Student's classes
- `getBySchool` - School's classes
- `getConflicts` - Scheduling conflicts
- `getSchedule` - Weekly schedule view
- `listForDateRange` - Date-filtered classes

**Mutation functions** (mutations.ts):
- `book` - Create new class
- `update` - Edit existing class
- `acknowledge` - Moderator acknowledges
- `approve` - Moderator approves
- `reject` - Moderator rejects
- `delete` - Soft delete
- `bulkDelete` - Admin bulk delete
- `bulkApprove` - Admin bulk approve
- `bulkReject` - Admin bulk reject
- `cancel` - Cancel class
- `postpone` - Reschedule class
- `markAttended` - Mark attendance
- ... (16 total)

**Helper functions** (helpers.ts):
- `verifyClassAccess` - Authorization check
- `canModifyClass` - Permission check
- `isClassOwner` - Ownership check

**Re-export pattern** (index.ts):
```typescript
// Public API - all exports go through index.ts
export * from './queries';
export * from './mutations';
export * from './helpers';
```

**Benefits**:
- Easier to find specific functionality
- Reduced merge conflicts
- Better code review experience
- Logical grouping of related functions
- Maintains backward compatibility via re-exports

---

## Database Schema Structure

**Source of truth**: `convex/schema.ts`

### Key Tables

**users**

- Roles: `admin` (God mode), `moderator` (school-scoped), `teacher` (multi-school), `guardian` (private tutoring)
- Device tracking: `deviceType` (desktop/mobile/tablet)
- Login security: `failedLoginAttempts`, `accountLockedUntil`, `lastSuccessfulLogin`
- Indexes: `by_username`, `by_school`, `by_role`, `by_device_type`

**classes**

- Status machine: `pending` → `acknowledged` → `approved`/`rejected`
- Guardian auto-approve: `isGuardianLinked: true` bypasses moderator
- Edit audit trail: `editHistory` array tracks all changes
- Indexes: `by_teacher`, `by_school`, `by_student`, `by_status`, `by_scheduled_date`, `by_school_and_date`, `by_teacher_and_date`

**students**

- Dual ID generation: School-based vs Guardian-based (see Pattern #7, #15)
- School students: `SCHOOLHASH-NAMEHASH-TIMESTAMP-RANDOM`
- Guardian students: `AREA-NAMEHASH-BIRTHDATE-RANDOM`
- Indexes: `by_student_id`, `by_school`, `by_guardian`, `by_guardian_id`, `by_area`

**notifications**

- System-generated (not user-initiated)
- Auto-created by mutations (class booking, student creation, etc.)
- One-way communication (no replies)
- Real-time unread badge updates

**messages**

- User-initiated (not system-generated)
- File attachments supported via Convex Storage
- Read receipts via `acknowledgedBy` array
- Direct (1-to-1) and group (school-wide) messages

---

## Next Steps

- **Learn core patterns** → [Non-Negotiable Patterns](./03-patterns.md)
- **Understand integrations** → [Integration Points & Architecture](./04-integration.md)
- **Review security** → [Security Considerations](./05-security.md)

---

[← Back to Index](../copilot-instructions.md)
