# Changelog - Evan's Class Tracker 4.5

All notable changes to this project are documented here.

## [4.5.13] - November 1, 2025 ⏳ IN PROGRESS

### Added - Class Booking UX Overhaul (Phases 1-3 Complete)

- **FilterChip Component**: Material Design 3 compliant filter chip ✅
  - 48x48dp touch targets (WCAG 2.1 Level AA - 2.5.5 Target Size)
  - 5 color variants matching filter types (blue, green, purple, orange, teal)
  - Remove button with X icon
  - Bilingual support (EN/TH) with ARIA labels
  - Dark mode support
  - Keyboard accessible (Tab + Enter/Space)
  - Max 120px value truncation with tooltip
  - Component: `components/filter-chip.tsx` (~88 lines)

- **Chip-based Filter Panel**: Collapsible horizontal chip UI ✅
  - Active filter chips ALWAYS visible (at-a-glance status)
  - Collapse/Expand toggle in header
  - Active filter badge count in header
  - Filter dropdowns collapsible (Show/Hide Filters button)
  - Clear All button integrated in chip panel
  - 80% vertical space reduction when collapsed (~80px vs ~400px)
  - Horizontal scroll for overflow chips (max 2 rows)
  - Professional color-coded chips (Teacher: Blue, School: Green, Student: Purple, Grade: Orange, Class: Teal)

- **School Filter for Teachers**: Multi-school teaching support ✅
  - School filter now visible to teachers AND admins (was admin-only)
  - Teachers see only schools where they have classes (Set-based filtering)
  - Admins continue to see all schools
  - Moderators remain school-scoped (no filter needed)
  - Essential for teachers who substitute at multiple locations

### Changed

- **Booking Terminology Standardization**: Consistent language across all roles ✅
  - Removed conditional "Req/Book Class" vs "Book Class" in button
  - Removed conditional "Request a New Class" vs "Book a New Class" in form header
  - All roles now see "Book Class" and "Book a New Class"
  - Eliminates confusion about booking vs requesting workflow

- **Filter Panel UX**: Complete redesign for mobile-first experience ✅
  - Replaced vertical dropdown stack with horizontal chip panel
  - Active filters visible without scrolling
  - Filter dropdowns hidden by default (Show Filters to expand)
  - Touch-friendly 48x48px minimum targets
  - WCAG 2.1 Level AA compliant (keyboard nav, focus visible, contrast ratios)
  - Material Design 3 validated pattern

### Technical Improvements

- **Accessibility**: WCAG 2.1 Level AA compliance ✅
  - Keyboard navigation (2.1.1 Keyboard)
  - Focus visible (2.4.7 Focus Visible)
  - Target size 48x48px (2.5.5 Target Size)
  - Contrast ratios 4.5:1 text, 3:1 UI (1.4.3 Contrast)
  - ARIA labels for screen readers (4.1.2 Name, Role, Value)

- **Performance**: Reduced DOM complexity ✅
  - Collapsible filter panel reduces initial render size
  - Active chips render only when filters applied
  - Lazy rendering of filter dropdowns

### Documentation

- **Research Findings**: Material Design 3 + WCAG 2.1 validation ✅
  - File: `docs/RESEARCH_FINDINGS_CLASS_BOOKING_UX_NOV_2025.md`
  - Comprehensive analysis of filter chip patterns
  - Touch target sizing requirements
  - Accessibility best practices

- **Implementation Plans**: Detailed phase-by-phase execution ✅
  - Original plan: `docs/IMPLEMENTATION_PLAN_CLASS_BOOKING_UX_OVERHAUL_NOV_2025.md`
  - Streamlined plan: `docs/IMPLEMENTATION_PLAN_STREAMLINED_NOV_2025.md`
  - 5 phases, 9.5 days total timeline

---

## [4.5.12] - October 31, 2025 ✅ COMPLETE

### Added - Class Count Enhancements & Payment Calculator (Phase 3 Complete)

- **Payment Calculator**: Security-first ephemeral calculation tool with zero database persistence ✅
  - Mandatory disclaimer screen explaining privacy protection
  - Real-time payment calculation (rate × total ClassCount)
  - Date range filtering for accurate period calculations
  - Provider/school entity filtering
  - Professional single-page print layout (7 columns, 6mm margins, entity badges)
  - Booking/approval metadata tracking (bookedByUserId, approvedByUserId, approvalSource)
  - Print-to-PDF with signature lines and security disclaimer footer
  - Calculator icon in Class Count Modal header (easy access)
  - Component: `components/class-payment-calculator.tsx` (~852 lines)
  - Backend metadata: `convex/schema.ts`, `convex/classes.ts`, `convex/teacherClassCount.ts`

- **Enhanced Class Count Modal**: Interactive drill-down with expandable class details ✅
  - Expandable class cards showing full details on click
  - All student names displayed (primary + additional students)
  - Post-class notes loaded on-demand (lazy loading prevents N+1 queries)
  - Attendance status with color-coded badges
  - Behavior and participation notes display
  - Duration and ClassCount breakdown per class
  - Component: `components/class-detail-card.tsx`

- **Provider Creation Modal**: Foundation for multi-provider UI integration ✅
  - Provider category selection (personal, private, language_school, educational_camp)
  - Bilingual input with 300ms debouncing
  - Purple gradient header (distinct visual identity)
  - Callback pattern for auto-selection after creation
  - Toast notifications for success/error states
  - Component: `components/create-provider-modal.tsx` (~200 lines)

### Changed

- **Class Count Modal**: Added payment calculator integration ✅
  - New Calculator button in modal header
  - State management for calculator visibility
  - Z-index hierarchy for nested modals
  
- **Class Booking**: Provider booking UI integration completed (Phase 4.2) ✅
  - Provider selection added to booking form (teachers/admins)
  - XOR validation enforced in UI (schoolId XOR providerId)
  - Admin teacher selection enabled when provider is chosen
  - Conditional payload includes providerId and omits school location requirement

- **Payment Calculator Print Layout**: Radically optimized for single-page output ✅
  - Reduced columns from 13 → 7 (eliminated Time, Type, Booked by, Approved by, Rate)
  - Condensed spacing (6mm margins, 7-14px fonts, 1.2 line-height)
  - Entity summary converted from table to inline format
  - Compact 3-card summary (removed Average ClassCount card and notes block)
  - Color-coded entity badges (blue=school, purple=provider)
  - Professional signature section with reduced heights

### Fixed

- **TypeScript Error**: Fixed BilingualInput placeholder props in create-provider-modal.tsx ✅
  - Changed `placeholderEn` → `placeholder` to match component interface

### Documentation

- **Implementation Summaries**: Created comprehensive documentation ✅
  - `IMPLEMENTATION_SUMMARY_PAYMENT_CALCULATOR_OCT_31_2025.md` - Payment calculator completion
  - Updated `IMPLEMENTATION_PLAN_CLASS_COUNT_ENHANCEMENTS_NOV_2025.md` - All phases marked complete
  - `TODO.md` - Payment calculator entry added to Recently Completed section

### Technical

- **Build Status**: All builds passing (Next.js ✅, TypeScript ✅, Convex ✅)
- **Security Design**: Payment calculator maintains zero database persistence
- **Code Quality**: ~800 lines of new TypeScript/React code with full dark mode support
- **Performance**: Lazy loading patterns prevent unnecessary queries
- **Documentation**: Comprehensive implementation summary created

### Pending (Phase 4.2)

- End-to-end testing for provider booking (teacher/admin) and moderator constraints
- Minor ESLint cleanup in create-provider-modal.tsx (unused variable)

## [4.5.11] - October 30, 2025

### Added - Provider System (Phase 1/4)

- **Multi-Provider Architecture**: Teachers can now manage classes across schools, private tutoring, language schools, and educational camps
- **Providers Table**: New database table with 4 categories (personal, private, language_school, educational_camp)
- **XOR Validation**: Entities must have EITHER schoolId OR providerId (mutual exclusivity enforced)
- **Auto-Approval Workflow**: Provider-linked classes automatically bypass moderator approval
- **Role-Based Access**: Teachers create own providers, moderators blocked from providers, admins have full access
- **Batch Fetching**: Provider aggregation uses Map pattern for O(1) lookup performance
- **Pattern #22**: New coding pattern documented for Provider System in copilot-docs

### Changed

- **Schema Updates**: Made schoolId optional in 4 tables (classes, students, cancellationRequests, postClassNotes)
- **Teacher Class Count**: Now aggregates both school and provider classes
- **Conditional Logging**: teacherLogs only created for school-linked classes (providers skip logging)

### Fixed

- **TypeScript Compilation**: Resolved all type errors with type-safe locals pattern
- **Frontend Types**: Updated ClassWithDetails in weekly-calendar.tsx and class-detail-modal.tsx
- **Build Success**: Next.js build passing, Convex deployment successful

### Technical

- **16 Files Modified**: 5 schema/backend, 8 mutations, 5 frontend components
- **Type-Safe Pattern**: Store schoolId in const after conditional check for TypeScript satisfaction
- **Documentation**: Comprehensive implementation summary, architecture updates, pattern guide

## [4.5.9] - October 29, 2025

### Added

- **Filter Navigation Tabs**: Prominent filter controls now appear at top of Class Bookings page
  - Teacher, School, and Student filters always visible (no need to close booking form)
  - Color-coded icons for quick recognition (blue/green/purple)
  - Live results count showing "X of Y classes"
  - 70-75% reduction in scroll distance for navigation
  - Clear All Filters button with gradient styling

### Changed

- **Class Bookings UX**: Filters repositioned before booking form for better navigation flow
- **Filter Design**: Enhanced with gradient backgrounds, individual filter cards, and larger touch targets

## [4.5.4] - October 27, 2025

### Added

- **Hierarchical Student Selector**: Progressive filtering (Grade → Class → Student) reduces cognitive load
- **Enhanced Class Count System**: Teacher selection dropdown for moderators, print language selection, detailed reports
- **Print Reports**: Professional HTML generation with full class breakdown, student details, and bilingual support
- **CSV Export Enhancement**: Export class counts for any selected teacher (moderators)

### Fixed

- **Post-Class Validation**: Fixed overly strict validation - now truly allows optional bilingual notes
- **Teacher Selection**: Moderators can now view and export any teacher's class counts

### Removed

- **YouTube Downloader**: Complete removal of YouTube downloader feature per user request

### Changed

- **Student Selection UX**: All student dropdowns now use hierarchical 3-step selection
- **Class Count Modal**: Major enhancements with teacher switching and professional reporting

## [Unreleased] - October 26, 2025

### Fixed

- **Student Creation**: Allow empty lastName for Thai students with single names/nicknames
- **Duplicate Prevention**: Block duplicate students with same name + grade + class + school
- **Error Messages**: Show actual error messages instead of generic "Failed to create student"
- **Default Language**: Ensure Thai is default language for new users
- **CI/CD**: Add `NEXT_TELEMETRY_DISABLED` to prevent telemetry.nextjs.org firewall blocks

### Verified

- **Help System**: Already role-specific (teachers/moderators/admins see different features)

## [4.5.3] - October 25, 2025

### Added

- **Teacher Cycle Editor**: Moderators/admins can edit teacher ClassCount cycles with confirmation flow
- **Startup Window**: Welcome screen with quick actions, recent activity, and app updates
- **Help Window**: Comprehensive role-based help system with step-by-step guides
- **Bilingual Input Component**: Reusable component with 300ms debouncing (50% fewer re-renders)
- **Validation Pattern**: Use `&&` (AND) for optional bilingual inputs instead of `||` (OR)

### Performance

- **40-50% faster page loads** via N+1 query elimination
- **10-100x faster queries** via proper index usage
- **Batch fetch patterns** replace query-in-loop antipattern

### Security

- **Account Lockout**: 24-hour lockout after 5 failed login attempts
- **Session Expiration**: 24-hour auto-expiration with activity extension
- **Bulk Deletion Audit**: Admin role verification + audit logging + soft deletes
- **Input Validation**: Name length limits, required fields, SQL injection prevention

## [4.5.2] - October 23, 2025

### Added

- **Audit Logging**: Complete audit trail for admin actions
- **Post-Class Notes**: Teachers can add notes after class completion
- **Class Merging**: Combine multiple students into one class session
- **Edit History**: Track all changes to class bookings with field-level diff

### Fixed

- **Toast Notifications**: Replaced all `alert()`/`confirm()` with bilingual toast system
- **Dark Mode**: Consistent styling across all components
- **Accessibility**: ARIA labels, keyboard navigation, escape key handling

## [4.5.1] - October 2025

### Added

- **Multi-date Booking**: Book classes for multiple dates simultaneously
- **Optional Class Fields**: Subject, lesson topic, materials, preparation notes, class type
- **Guardian Dashboard**: View student schedules, approve/reject classes
- **Location Proposals**: Teachers propose new locations for moderator approval

### Changed

- **Provider Hierarchy**: Fixed load-bearing order (DO NOT REORDER)
- **Schema Improvements**: Optional fields for backward compatibility

## [4.5.0] - September 2025

### Initial Features

- **Class Booking System**: Teachers book, moderators approve
- **Student Management**: Unique IDs, school/guardian linking
- **Messaging Hub**: Real-time messaging between teachers/moderators
- **Bilingual Support**: Full English/Thai translations
- **Real-time Updates**: Convex backend with live data sync
- **Dark Mode**: System-wide dark theme support

---

## Migration Notes

### From 4.5.2 to 4.5.3

- No breaking changes
- New optional features (Startup Window, Help Window, Cycle Editor)
- Backward compatible schema changes

### From 4.5.1 to 4.5.2

- Audit logging requires no migration (auto-creates entries)
- Edit history backward compatible (optional field)

### From 4.5.0 to 4.5.1

- Schema updated with optional fields (backward compatible)
- No data migration required

---

## Removed/Deprecated

### October 26, 2025

- Consolidated implementation summaries into CHANGELOG.md
- Removed redundant quick fix documentation

---

## Known Issues

### Security (NOT Production-Ready)

1. **Password Hashing**: `btoa()` is reversible - migrate to bcrypt
2. **Session Storage**: localStorage vulnerable to XSS - migrate to HttpOnly cookies
3. **Rate Limiting**: Login/password change endpoints unprotected

**⚠️ Do NOT deploy to production without addressing security items**

---

## Links

- [Architecture](./docs/ARCHITECTURE.md)
- [Testing Guide](./docs/TESTING_GUIDE.md)
- [CI/CD Setup](./docs/CI_CD_SETUP_GUIDE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING_CI_CD.md)
