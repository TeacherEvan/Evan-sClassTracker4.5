# Key Files Reference

[← Back to Index](../copilot-instructions.md)

---

## Architecture & Schema

**`convex/schema.ts`**

- Database schema (source of truth)
- Table definitions, indexes, validation
- Bilingual field requirements

**`app/layout.tsx`**

- Provider hierarchy (critical order)
- ErrorBoundary → Convex → Device → Data → Language
- DO NOT reorder providers

**`docs/ARCHITECTURE.md`**

- System diagrams
- Data flows
- Component relationships

**`docs/OPTIMIZATION_ANALYSIS_2025.md`**

- N+1 query fixes
- Performance improvements
- Batch fetch patterns

---

## Core Patterns & Helpers

**`lib/language-context.tsx`**

- Bilingual helper (`t()` function)
- Language state management
- Context provider

**`lib/toast.ts`**

- Toast notification manager
- Event subscription pattern
- Replaces alert/confirm

**`lib/session-utils.ts`**

- Session management
- 24-hour auto-expiration
- localStorage with validation

**`convex/rateLimit.ts`**

- Rate limiting and input validation
- Anti-abuse protection
- Mutation safeguards

**`convex/pagination.ts`**

- Native database pagination
- Cursor-based navigation

**`convex/auditHelpers.ts`**

- Audit logging helpers
- Standard action constants
- Quick logging function

---

## Backend Logic

**`convex/classes/`** (Modular - NEW Dec 2025)

Split from monolithic classes.ts (2,213 lines → modular structure):

- `index.ts` - Re-exports (public API for backward compatibility)
- `queries.ts` - 9 query functions (15KB)
- `mutations.ts` - 16 mutation functions (79KB)
- `helpers.ts` - Authorization helpers (5KB)
- `README.md` - Module documentation

Features:
- State machine (pending → acknowledged → approved/rejected)
- Approval workflow
- Edit audit trail
- Authorization helpers (`verifyClassAccess`)
- Bulk deletion with safeguards
- Better organization and maintainability

**`convex/students.ts`**

- Unique ID generation pattern
- School-based vs Guardian-based IDs
- Duplicate prevention
- Name validation (max 100 chars)

**`convex/users.ts`**

- Authentication
- Password hashing (btoa() - NOT production-secure)
- Account lockout (5 failed attempts → 24hr lock)
- Session creation

**`convex/teacherClassCount.ts`**

- ClassCount tracking
- Cycle management
- Confirmation flow for cycle changes

**`convex/analytics.ts`**

- Educational performance metrics
- Role-based analytics (teacher/moderator/admin)
- Summary analytics (total classes, attendance rate, active students, avg ClassCount)
- Student performance analysis with ratings
- Index-based queries with batch fetching
- Type-safe with Doc<"classes">[] annotations

**`convex/notifications.ts`**

- Cycle management
- Confirmation flow for cycle changes

**`convex/notifications.ts`**

- System-generated notifications
- Auto-created by mutations
- Real-time unread badge updates

**`convex/messages.ts`**

- User-initiated messages
- File attachments (Convex Storage)
- Read receipts
- Direct and group messages

**`convex/providers.ts`**

- Provider CRUD (create/list/get/update/soft delete)
- Role-based access (teachers/admins only; moderators blocked)
- Validations for categories and ownership

**`convex/seed.ts`**

- Database seeding mutation
- Automated test data generation
- Image seeding logic

**`convex/files.ts`**

- File management utilities
- Upload URL generation (`generateUploadUrl`)
- Secure file handling

---

## UI Components

**`components/class-booking/`** (Modular - NEW Dec 2025)

Decomposed from monolithic class-booking.tsx (2,930 lines → modular structure):

- `index.tsx` - Main orchestrator component (126KB)
- `types.ts` - Shared TypeScript interfaces
- `constants.ts` - Shared constants (defaults, limits)
- `class-booking-state.ts` - State management hook (9KB)
- `ClassItemDisplay.tsx` - Reusable class card component (30KB)

Features:
- Multi-date booking
- Optional fields
- Conflict detection
- Recurring weekly bookings
- Better maintainability and testability

**`components/edit-class-modal.tsx`**

- Full edit modal
- Audit trail integration
- Bilingual form inputs

**`components/desktop-notification-toast.tsx`**

- Toast notification UI
- Bottom-right corner
- Auto-dismiss with duration

**`components/teacher-cycle-editor.tsx`**

- Nested modal pattern
- Confirmation flow
- Active cycle indicator
- Escape key handling

**`components/teacher-class-count-modal.tsx`**

- Cycle editor integration
- Role-based access (moderator/admin only)
- Active cycle visual indicator

**`components/hierarchical-student-selector.tsx`**

- Progressive filtering (Grade → Class → Student)
- Reduces cognitive load
- Auto-populate in edit mode
- Separate guardian section

**`components/bilingual-input.tsx`**

- Reusable debounced bilingual input
- 300ms debounce (50% fewer re-renders)
- Consistent dark mode styling
- Type-safe props

**`components/admin-error-reports.tsx`**

- Error reporting dashboard
- Filtering by status/severity
- Full stack trace viewer
- Admin notes and resolution

**`components/audit-logs.tsx`**

- Audit log viewer
- Filters and statistics
- CSV export
- Full audit trail

**`components/class-analytics.tsx`**

- Analytics dashboard modal
- 4 summary cards (Total Classes, Attendance Rate, Active Students, Avg ClassCount)
- Student performance table with color-coded ratings
- Date range filtering
- CSV export functionality
- Role-based data access
- Bilingual support
- Responsive design

**`components/sangsom-delete-button.tsx`**

- Bulk deletion UI
- Confirmation flow
- Reason requirement
- Admin-only access

**`components/class-payment-calculator.tsx`**

- Ephemeral Class Payment Calculator modal
- Disclaimer screen, read-only data fetch, print-to-PDF
- Client-side calculation only (no persistence)

**`components/class-detail-card.tsx`**

- Expandable class card used in Class Count modal
- Shows all students, notes, attendance, and provider/school info

**`components/booking-wizard.tsx`** (NEW Nov 2025)

- Multi-step booking wizard (teacher→grade→class→type→calendar)
- 30-day interactive calendar for once-off bookings
- Recurring class configurator (weeks + day/time selection)
- Completes to class booking form
- Performance: 7 useMemo optimizations added (Nov 2025)

**`components/message-wizard.tsx`** (NEW Nov 2025)

- Multi-step messaging wizard (recipients→compose→send)
- Shows "Pending → Sent" animation
- Auto-redirects to dashboard after 1.5s
- Performance: 2 useMemo optimizations added (Nov 2025)

**`components/class-count-report-wizard.tsx`** (NEW Nov 2025)

- Report generation wizard (teacher→date→view/print)
- Date range selector with validation
- Completes to analytics modal

**`components/message-wizard.tsx`**

- Messaging wizard (recipients→compose→send)
- Multi-recipient teacher selection
- Bilingual message composer (EN+TH)
- Auto-send with status animation
- Auto-redirects to dashboard after 1.5s

**`components/startup-window.tsx`**

- Main entry point for moderators/teachers
- 5 wizard-triggering buttons (Book, Report, Message, Notification, Dashboard)
- Wizard integration and state management
- Role-based menu options

**`components/image-upload/index.tsx`**

- Image upload component
- Drag-and-drop interface
- Preview functionality
- Integration with Convex Storage

---

## Feature Documentation

**`GOLD_TABLET_NOTIFICATION_WINDOW.md`**

- Notification window implementation
- One-time display system
- School-specific vs broadcast targeting

**`IMPLEMENTATION_SUMMARY_WIZARD_STARTUP_NOV_1_2025.md`**

- Wizard-based onboarding implementation
- 5 guided workflows for moderators/teachers
- Complete technical documentation (300+ lines)
- Workflow diagrams and testing checklist

**`IMPLEMENTATION_SUMMARY_CYCLE_EDITOR.md`**

- Nested modal pattern
- Confirmation flow
- Active cycle indicator

**`IMPLEMENTATION_SUMMARY_GUARDIAN_BOOKING_OCT_28_2025.md`**

- Guardian student system
- Auto-approval workflow
- Private tutoring features

**`IMPLEMENTATION_SUMMARY_RECURRING_BOOKINGS_OCT_27_2025.md`**

- Weekly recurring booking pattern
- Date generation logic
- Conflict detection

**`IMPLEMENTATION_SUMMARY_ERROR_REPORTING_OCT_27_2025.md`**

- Error reporting system architecture
- Auto-classification
- Admin dashboard

**`convex/notificationWindows.ts`**

- One-time notification window system
- Targeting options (role, school, everyone)

**`convex/appUpdates.ts`**

- Feature update logging
- Changelog management
- Version tracking

**`.github/AI_AGENT_WORKFLOW.md`**

- Post-implementation procedures
- Automated update workflow
- Implementation summary conventions

---

## Testing & CI/CD

**`tests/e2e/helpers.ts`**

- Reusable test utilities
- login(), logout(), waitForToast(), navigateToTab()
- generateTestData() for unique test data

**`tests/e2e/auth.spec.ts`**

- Authentication tests
- Login, logout, password change
- Language persistence

**`tests/e2e/class-booking.spec.ts`**

- Class booking workflow
- Approval workflow
- Moderator notifications

**`playwright.config.ts`**

- Playwright configuration
- Browser setup
- Test reporter settings

**`.github/workflows/`**

- `ci.yml` - TypeScript + ESLint checks
- `e2e-tests.yml` - Playwright E2E tests
- `deploy-staging.yml` - Auto-deploy develop
- `deploy-production.yml` - Auto-deploy main

---

## Documentation

**`.github/copilot-instructions.md`**

- Main navigation index
- Agent-friendly decision tree
- Documentation stats

**`.github/copilot-docs/`**

- Modular topic-based documentation
- 01-quick-start.md through 10-files.md

**`docs/TESTING_GUIDE.md`**

- Comprehensive testing guide
- Test scenarios and workflows

**`docs/CI_CD_SETUP_GUIDE.md`**

- CI/CD configuration
- GitHub Secrets setup
- Deployment testing

**`docs/AUDIT_LOGGING_IMPLEMENTATION.md`**

- Audit logging patterns
- Actions to audit
- Implementation examples

**`SECURITY_REVIEW_BULK_DELETION.md`**

- Bulk operation safeguards
- Security analysis

**`TODO.md`**

- Current task list
- Future enhancements
- Known issues

---

## Next Steps

- **Back to index** → [Main Index](../copilot-instructions.md)
- **Quick start** → [Quick Start Guide](./01-quick-start.md)
- **Architecture** → [Architecture Essentials](./02-architecture.md)

---

[← Back to Index](../copilot-instructions.md)
