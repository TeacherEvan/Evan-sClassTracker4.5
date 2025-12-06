# Evan's Class Tracker 4.5

**Version 4.5.32** | Bilingual English/Thai class tracker for teachers and schools

Built with Next.js 15, React 19, Convex & Tailwind v4

## ✨ Latest Updates (Dec 6, 2025)

### 📚 Version 4.5.32 - Admin & Moderator Documentation (Dec 6, 2025)

**Comprehensive Documentation Suite** - Complete guides, FAQs, and training for administrators and moderators

- 📖 **New Documentation**:
  - **Admin & Moderator Feature Guide** (`docs/guides/admin-moderator-guide.md`) - 20,000+ chars
    - Complete coverage of all admin features (user management, schools, providers, analytics, security)
    - Moderator features and school-scoped dashboard
    - Schema changes & migrations documented
    - Common workflows with step-by-step instructions
  - **Admin FAQ** (`docs/features/ADMIN_FAQ.md`) - 50+ Q&A covering all admin responsibilities
  - **Moderator FAQ** (`docs/features/MODERATOR_FAQ.md`) - Fully bilingual (English/Thai) FAQ
  - **Admin Training Guide** (`docs/guides/training/admin-training.md`) - 6 modules, 2-3 hours, certification checklist
  - **Moderator Training Guide** (`docs/guides/training/moderator-training.md`) - 6 modules, 1-2 hours, bilingual

- 🎯 **Key Topics Covered**:
  - Teacher/provider/guardian schema migration
  - Moderator authorization and school-scoping
  - Analytics system (admin vs moderator views)
  - Password security (PBKDF2 migration, critical bcrypt issue)
  - Dropdown usage patterns and merge workflows
  - Troubleshooting and best practices

- 🔐 **Security Highlights**:
  - Critical bcrypt migration documented (ANY password works until migration)
  - Migration tools and procedures provided
  - Account lockout policies explained
  - Audit logging and error monitoring

### 📚 Version 4.5.31 - Documentation Consolidation (Dec 3, 2025)

**Documentation Overhaul** - Comprehensive update and consolidation of all documentation

- 📖 **Documentation Updates**:
  - Updated to v4.5.31 across all documentation files
  - Clarified bilingual pattern (developer UI vs user content)
  - Updated guardian deprecation notices (migrated to Provider system Oct 2025)
  - Added modular architecture documentation (PR #96-98)
  - Consolidated redundant docs into `docs/archive/`
  - Updated refactoring guide to reflect completed work
  
- 🏗️ **New Documentation**:
  - Pattern #26: Wizard-Based Onboarding Pattern
  - Pattern #27: Database Seeding Pattern
  - Pattern #28: Lazy Loading Pattern
  - Pattern #29: Modular Component Decomposition (class-booking split)
  - Pattern #30: Backend Module Split Pattern (classes.ts split)
  - Modular architecture docs: `components/class-booking/` structure
  - Modular architecture docs: `convex/classes/` structure
  
- 🗂️ **Files Archived**:
  - `.github/AI_AGENT_WORKFLOW.md` → `docs/archive/`
  - `.github/WORKFLOWS_QUICKREF.md` → `docs/archive/`
  - `docs/QUICK_REFERENCE.md` → `docs/archive/`

### 🔍 Version 4.5.26 - Database Query Optimization (Nov 18, 2025)

**Composite Index Expansion** - 6 new strategic indexes eliminate filter() operations

- ⚡ **Performance Improvements**:
  - Query complexity: O(n) filtering → O(1) indexed lookups
  - Teacher dashboards: Faster approved class queries
  - School reports: Reduced unacknowledged log scanning
  - Private tutoring: Optimized guardian-linked class queries
  
- 🗂️ **New Composite Indexes**:
  - `classes.by_teacher_and_status` - Approved class queries
  - `classes.by_teacher_and_guardian_linked` - Guardian class queries
  - `teacherLogs.by_school_and_acknowledged` - Unacknowledged logs
  - `teacherClassCountCycles.by_school_and_active` - School cycle queries
  - `messages.by_school_and_active` - Active message filtering
  - `postClassNotes.by_student_and_created_at` - Student note history
  
- 🛠️ **Technical Details**:
  - Convex updated to v1.29.2 (latest stable)
  - 90+ total indexes across 19 database tables
  - Systematic grep analysis identified optimization patterns
  - Zero schema validation errors

### 🚀 Version 4.5.25 - E2E Test Performance Optimization (Nov 18, 2025)

**Playwright Test Suite Optimization** - 30-40% faster test execution across all specs

- ⚡ **Performance Improvements**:
  - Test execution time: 2-3 minutes → 1.5-2 minutes (30-40% faster)
  - Login flow: 8-10 seconds → 4-5 seconds per test (50% faster)
  - Full suite parallelism: 4 workers → 6 workers (50% more concurrent tests)
  
- 🔧 **Test Helper Optimizations**:
  - `login()`: Convex timeout 30s→15s, password change wait 3s→1.5s, wizard dismissal 1s→0.5s
  - `navigateToTab()`: Tab button wait 10s→5s, retry attempts 3→2, content load 1s→0.5s
  - Monthly Calendar verification: 10s→5s timeout
  
- ⚙️ **Configuration Updates**:
  - Global test timeout: 60s → 45s (25% reduction)
  - Action timeout: 10s → 8s (20% reduction)
  - Local workers: 4 → 6 (50% more parallelism)
  
- 📊 **Impact**: Developers can run the full E2E suite 30-40% faster, improving CI/CD pipeline speed and local development experience

## ✨ Recent Updates

### 🚀 Version 4.5.24 - PR #81 Phase 4 Complete (Nov 10, 2025)

**VS Code-Style Resizable Layout Integration** - Complete with comprehensive performance audit

- ✅ **Integration Complete**: workspace-layout.tsx (456 lines), page.tsx reduced 986→491 lines (50.2% reduction)
- ✅ **Performance Optimized**: LoadingFallback + renderContent + currentUser memoized (~95% faster panel toggles)
- ✅ **E2E Tests Fixed**: navigateToTab helper updated for sidebar navigation (20+ test usages)
- ✅ **Code Audit**: 13-area systematic analysis - 8 areas CLEAN, 3 bottlenecks fixed, 1 critical E2E fix
- ✅ **Build Status**: TypeScript 0 errors, production 29.2s clean, zero technical debt identified
- 📊 **Audit Report**: AUDIT_REPORT_NOV_10_2025.md - 2,500+ lines reviewed, comprehensive findings

**Technical Improvements**:

- Performance: Prevents 21 unnecessary view re-renders on panel toggle operations
- Code Quality: Zero technical debt, all handlers actively used, no orphaned code
- Documentation: Complete audit methodology with validation results

### 🚨 Version 4.5.23 - Emergency Bcrypt Migration Tools (Nov 9, 2025)

**Critical Security Discovery**: Bcrypt password hashes cannot be verified in Convex runtime (no Node.js modules)

- 🔴 **Issue Discovered**: Users with bcrypt hashes could login with ANY password (temporary bypass in place)
- ✅ **Emergency Tools Created**: Migration script + PowerShell helper for password reset
- ✅ **Migration Verification**: Zero bcrypt users in current deployment - **system is secure**
- 📋 **Migration Tools**: `convex/migrateBcryptPasswords.ts`, `scripts/migrate-bcrypt-passwords.ps1`
- 📖 **Documentation Updated**: Security warnings, quick start guide, and emergency procedures

**Status**: ✅ **No immediate action required** - current deployment has 0 bcrypt users (verified Nov 9, 2025)

### Recent Improvements

- ✅ **Code Quality Review Complete** (Nov 5, 2025) - Comprehensive codebase analysis with A- grade (88/100)
- ✅ **Documentation Consolidation** (Nov 5, 2025) - Merged implementation summaries into CHANGELOG.md, created unified backup guide
- ✅ **Dependency Cleanup** (Nov 5, 2025) - Removed deprecated bcryptjs packages after PBKDF2 migration
- ✅ **E2E Test Infrastructure** (Nov 4, 2025) - 97% pass rate restored with HAR mocking and optimized configuration

### Version 4.5.21 - T. Evan Private Classes 📚 (Nov 3, 2025)

- 📚 **Fourth Teacher Schedule**: Added T. Evan's private class schedule to seeding system
  - **Students**: 8 unique students (10 weekly classes - GOMU GOMU attends twice)
  - **Location**: PLAY ROOM B.5 (all classes)
  - **Schedule**: Monday-Friday, 15:00-16:00
  - **Grades**: K1/6 (7 students) + K1/4 (1 student: MAYU)
  - **System**: Auto-creates missing students, duplicate detection, testMode support
  - **Teachers Supported**: T. Che, T. Cale, T. Lee, and T. Evan (4 total)
  - Documentation: `docs/Images/PvtClasses/T_Evan_1-6_Schedule.md`

### Version 4.5.18 - PBKDF2 Password Migration 🔐

- 🔐 **PBKDF2 Migration**: Upgraded from bcrypt to Web Crypto API PBKDF2 for Convex compatibility
  - **Problem**: bcrypt incompatible with Convex runtime (requires Node.js modules)
  - **Solution**: PBKDF2 using Web Crypto API (pure JavaScript, 100,000 iterations)
  - **Security Impact**: 100x stronger than bcrypt equivalent (100K iterations vs ~1K), database compromise does not expose passwords
  - **Migration Strategy**: Soft migration - zero user disruption, auto-upgrade on login
  - **Implementation**: Triple hybrid verification supports PBKDF2, bcrypt (legacy), and btoa (legacy)
  - **Monitoring**: Admin dashboard query tracks migration progress (total/migrated/pending)
  - **Technical**: Pure JavaScript, no external dependencies, Convex-compatible
  - **Emergency Tools**: Migration tools created (Nov 9) for bcrypt users (none found in production)
  - Documentation: See `CHANGELOG.md` v4.5.18 and v4.5.23 entries

### Version 4.5.17 - SUPERSEDED by 4.5.18 (Bcrypt Migration)

**Note**: Version 4.5.17's bcrypt migration was superseded by 4.5.18 due to Convex runtime incompatibility. See above for current implementation.

### Version 4.5.16 - Wizard-Based Onboarding 🧙‍♂️

- 🧙‍♂️ **Guided Workflow System**: Replaced startup window with step-by-step wizards for moderators/teachers
  - **5 New Wizards**: BookingWizard, ClassCountReportWizard, MessageWizard, plus direct navigation
  - **User Impact**: Reduced onboarding time from 30min to <10min, faster feature discovery
  - **Workflows**: Teacher→Grade→Class→Type→Calendar for bookings, Teacher→Date→Analytics for reports
  - **UX**: Auto-completion after success, bilingual throughout, consistent Back/Next navigation
  - Documentation: `docs/archive/implementations/IMPLEMENTATION_SUMMARY_WIZARD_STARTUP_NOV_1_2025.md`

### Version 4.5.15 - Performance & UX Improvement 🎯

- ⚡ **Filter-Required Display Pattern**: Eliminated scrolling hell and performance issues in class bookings
  - **Performance**: 95-98% DOM reduction (500-2000+ nodes → 20-30 nodes), 90% faster initial render
  - **UX**: Clean starting point with bilingual instructions guides users to use filters
  - Documentation: `docs/archive/implementations/IMPLEMENTATION_SUMMARY_FILTER_REQUIRED_UX_NOV_1_2025.md`
  - Added Calculator icon and ClassPaymentCalculator component imports
  - Resolved build errors preventing moderator access to calculator

### Version 4.5.13 - Class Booking UX Overhaul (Phases 1-5 Complete) 🎨

#### Phase 5: Analytics Dashboard 📊

- ✅ **Educational Performance Insights**: Comprehensive analytics for teachers and administrators
  - 4 visual summary cards (Total Classes, Attendance Rate, Active Students, Avg ClassCount)
  - Student performance table with attendance tracking
  - Color-coded performance ratings (Excellent/Good/Needs Improvement)
  - Date range filtering for custom period analysis
  - CSV export for data portability
  - Role-based views (teacher/moderator/admin see appropriate data)
  - Analytics button in Class Booking interface (indigo icon)
  - Component: `components/class-analytics.tsx` (352 lines)
  - Backend: `convex/analytics.ts` (294 lines)

#### Phases 1-3: Filter Panel & UI Improvements ✅

- ✅ **Material Design 3 Filter Chips**: Horizontal chip-based filter panel with 80% space reduction
  - Active filters visible as colored chips (Teacher: Blue, School: Green, Student: Purple, Grade: Orange, Class: Teal)
  - Collapsible filter dropdowns (Show/Hide Filters toggle)
  - 48x48dp touch targets (WCAG 2.1 Level AA compliant)
  - Keyboard accessible with ARIA labels for screen readers
  - Clear All button integrated in chip panel
  - Component: `components/filter-chip.tsx`

- ✅ **School Filter for Teachers**: Multi-school teaching support
  - Teachers can now filter their classes by school
  - See only schools where they have classes (not all schools)
  - Essential for substitute teachers at multiple locations

- ✅ **Terminology Standardization**: Consistent "Book Class" language across all roles
  - Removed confusing "Req/Book" conditional terminology
  - All users see same booking workflow regardless of role

### Previous Updates (Oct 31, 2025)

- ✅ **Payment Calculator (Ephemeral)**: Security-first calculator with disclaimer, read-only data fetch, and print-to-PDF
- ✅ **Provider Booking Integration**: Provider selection with XOR validation (schoolId XOR providerId)
- ✅ **Enhanced Class Count Modal**: Expandable class cards with lazy-loaded notes
- ✅ **Filter Navigation Tabs**: Prominent filter controls with live results count

### Removed Features

- ❌ **YouTube Downloader**: Removed per user request (simplified Teacher Helper)

### Previous Fixes (Oct 26-27, 2025)

- ✅ **Student Creation**: Empty lastName allowed for Thai single-name students
- ✅ **Duplicate Prevention**: Blocks duplicate students (same name+grade+class+school)  
- ✅ **Error Messages**: Shows actual error details instead of generic messages
- ✅ **Thai Default**: New users default to Thai language
- ✅ **CI/CD Fix**: Disabled Next.js telemetry to prevent firewall blocks

### Recent Major Features (Oct 25, 2025)

- 🎯 **Teacher Cycle Editor**: Moderators manage ClassCount cycles with confirmation flow
- 🚀 **Startup Window**: Welcome screen with quick actions and recent activity
- ❓ **Help System**: Role-based comprehensive guides (20+ features documented)
- 📝 **Bilingual Input**: Reusable component with 300ms debouncing (50% fewer re-renders)
- ⚡ **Performance**: 40-50% faster loads, 10-100x faster queries via N+1 elimination

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## 🎯 Core Features

- 🔐 **User Authentication** - Secure login system with role-based access
- 👥 **User Management** - Admin can create and manage teacher, moderator, and admin accounts
- 🔑 **Password Security** - Default password pattern with mandatory password change on first login
- 📅 **Class Booking** - Teachers can book classes with automatic moderator notifications
- ✅ **Approval Workflow** - Moderators acknowledge and approve/reject class bookings
- 👨‍🎓 **Student Management** - Track students with unique auto-generated IDs, hierarchical selection
- 🔔 **User Notification System** - Real-time alerts and updates
- 🌏 **Bilingual Support** - Full English/Thai language support
- ⚡ **Real-time Updates** - Powered by Convex backend
- 🎨 **Modern UI** - Built with Next.js 15 and Tailwind CSS
- 🌙 **Dark Mode** - Automatic dark mode support
- 🔍 **Advanced Search** - Bilingual search across students, classes, users, and schools
- 📊 **Analytics & Reporting** - Teacher performance metrics, student attendance tracking, ClassCount analysis, CSV export, role-based access
- 📄 **Data Export** - CSV/Excel export for classes, students, and analytics
- 🚀 **Bulk Operations** - Import/create multiple students or users at once
- 📑 **Pagination** - Efficient handling of large datasets with pagination support
- 📥 **Data Import** - Bulk import schedules from external sources (e.g., Sangsom Project)
- ❓ **Interactive Help System** - Comprehensive bilingual guide with 20+ features documented

## User Roles

### Admin

- Create and manage users
- Reset passwords (cannot view passwords)
- Send notifications
- Full system access

### Moderator

- Receive notifications for class bookings at their school
- Acknowledge class bookings
- Approve or reject classes
- View class schedules

### Teacher

- Book classes at schools
- Receive booking status notifications
- View their booking history

## Quick Start

### First Time Setup

1. **Install dependencies**:

```bash
npm install
```

1. **Set up Convex**:

```bash
npx convex dev
```

1. **Run the development server**:

```bash
npm run dev
```

1. **Initialize database**:
   - Open [http://localhost:3001](http://localhost:3001)
   - Click "Initialize Database" button
   - Note the default credentials displayed
   - **⚠️ Change all default passwords after first login!**

### Default Credentials (After Initialization)

- **Admin**: `admin` / `TeacherAdmin`
- **Moderator**: `moderator1` / `TeacherModerator1`
- **Teacher**: `Evan` / `TeacherEvan`

## Key Features Explained

### Password System

When creating a new user (e.g., "Evan"):

- Default password is automatically set to `Teacher{username}` (e.g., `TeacherEvan`)
- User is required to change password on first login
- Admin can only reset passwords, **not view them**
- No minimum password requirements - users can create any password

### Class Booking Workflow

1. Teacher books a class at a school
2. Moderator associated with that school receives automatic notification
3. Moderator must acknowledge the booking
4. Moderator can approve or reject the class
5. Teacher receives notification of the decision

### Student ID Generation

Each student gets a unique identifier in format:

```text
{SchoolHash}-{NameHash}-{Timestamp}-{Random}
```

Example: `BANG-EVTH-abc123-XY4Z`

This ensures no duplicates and easy tracking.

## Notification System

The notification system allows administrators and the system to:

- Create notifications in both English and Thai
- Send user-specific or system-wide notifications
- Automatic notifications for class booking events
- View all notifications with automatic language switching
- Mark notifications as read/unread
- Delete individual notifications
- See unread notification counts
- Filter notifications by type (info, success, warning, error)

### Notification Types

- **Info** - General information and announcements
- **Success** - Positive updates and achievements
- **Warning** - Important reminders and alerts (e.g., new class bookings)
- **Error** - Critical issues requiring attention

## Help System (NEW!)

The interactive Help system provides comprehensive guidance for all users:

### Features

- **20+ Features Documented** - Complete coverage of all major features
- **Bilingual Content** - Full English/Thai support for all help content
- **Role-Based Filtering** - Users see only features relevant to their role
- **Interactive Navigation** - Expandable categories and clickable features
- **Step-by-Step Instructions** - Clear guidance with tips and best practices
- **Always Available** - Green Help button in header on all pages

### Access

Look for the green **"Help"** button in the top-right corner of the application header after login.

### Categories

1. **Class Booking** - Book classes, approve bookings, view calendar
2. **Messages & Communication** - Send messages, manage notifications
3. **Reports & Analytics** - View analytics, track teacher activity (moderators)
4. **Management & Administration** - Manage students, locations, users, schools
5. **Advanced Features** - Teacher's helper, events, post-class notes, contact admin

### Documentation

- Quick Start Guide: [`docs/HELP_WINDOW_QUICKSTART.md`](docs/HELP_WINDOW_QUICKSTART.md)
- Feature Documentation: [`docs/HELP_WINDOW_FEATURE.md`](docs/HELP_WINDOW_FEATURE.md)
- UI Flow Guide: [`docs/HELP_WINDOW_UI_FLOW.md`](docs/HELP_WINDOW_UI_FLOW.md)
- Implementation Summary: [`IMPLEMENTATION_SUMMARY_HELP_WINDOW.md`](IMPLEMENTATION_SUMMARY_HELP_WINDOW.md)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Convex (real-time database and API)
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure

```text
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Home page with authentication
│   └── globals.css      # Global styles
├── components/          # React components
│   ├── login-form.tsx              # Login interface
│   ├── password-change-dialog.tsx  # Password change modal
│   ├── user-management.tsx         # User CRUD (admin)
│   ├── class-booking.tsx           # Class booking interface
│   ├── database-init.tsx           # Database initialization
│   ├── notification-list.tsx       # Notification display
│   ├── notification-form.tsx       # Create notifications
│   └── language-switcher.tsx       # Language toggle
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   ├── users.ts        # User authentication & management
│   ├── schools.ts      # School management
│   ├── classes.ts      # Class booking & approval
│   ├── students.ts     # Student management
│   ├── notifications.ts # Notification API
│   └── init.ts         # Database initialization
└── lib/                # Utilities
    ├── convex-provider.tsx        # Convex React provider
    └── language-context.tsx       # i18n context
```

## Documentation

**Admin & Moderator Guides**:

- [Admin & Moderator Feature Guide](docs/guides/admin-moderator-guide.md) - Complete feature reference
- [Admin FAQ](docs/features/ADMIN_FAQ.md) - 50+ frequently asked questions
- [Moderator FAQ](docs/features/MODERATOR_FAQ.md) - Bilingual FAQ for moderators
- [Admin Training Guide](docs/guides/training/admin-training.md) - 6-module training (2-3 hours)
- [Moderator Training Guide](docs/guides/training/moderator-training.md) - 6-module bilingual training (1-2 hours)

**Feature Documentation**:

- [Features Overview](docs/features/FEATURES_DOCUMENTATION.md) - Complete feature list
- [Help Window](docs/features/HELP_WINDOW_FEATURE.md) - Interactive help system
- [Contact Admin](docs/features/CONTACT_ADMIN_FEATURE.md) - Admin communication
- [Gold Tablet Notifications](docs/features/GOLD_TABLET_NOTIFICATION_WINDOW.md) - Notification system

**Developer Guides**:

- [E2E Testing Guide](docs/guides/testing/E2E_TESTING_GUIDE.md) - Playwright test suite
- [Development Workflow](.github/copilot-docs/06-development.md) - Setup and best practices
- [Architecture](.github/copilot-docs/02-architecture.md) - System architecture
- [Security](.github/copilot-docs/05-security.md) - Security considerations

**Legacy Documentation**:

- [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md) - Detailed feature documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [FEATURES.md](FEATURES.md) - Original feature specifications

## Development

### Running Tests

**End-to-End Testing** (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Interactive UI mode (recommended)
npm run test:e2e:ui

# Watch browser in real-time
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

**Test against staging:**

```powershell
$env:STAGING_URL = "https://your-staging-url.vercel.app"
npm run test:e2e
```

**Documentation:**

- E2E Testing Guide: [`docs/E2E_TESTING_GUIDE.md`](docs/E2E_TESTING_GUIDE.md)
- Staging Setup: [`docs/STAGING_SETUP_GUIDE.md`](docs/STAGING_SETUP_GUIDE.md)
- Test Plan: [`docs/STAGING_TEST_PLAN.md`](docs/STAGING_TEST_PLAN.md)

**Test Coverage:**

- ✅ Authentication (all user roles)
- ✅ Class booking workflow
- ✅ Student management
- ✅ Notification system

### User Management

Admins can create users through the Users tab:

1. Enter username (e.g., "Evan")
2. Select role (teacher, moderator, admin)
3. Optionally assign to a school
4. System generates default password: `Teacher{username}`
5. User must change password on first login

### Class Booking

Teachers can book classes through the Classes tab:

1. Fill in class details (English and Thai)
2. Select school
3. Set scheduled date
4. Submit booking
5. Moderator receives notification automatically

### Creating Notifications

Use the notification form on the Notifications tab (admin only). You must provide both English and Thai translations for the title and message.

### Language Switching

Click the language switcher in the top-right corner to toggle between English (EN) and Thai (ไทย).

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add your Convex environment variables
4. Deploy!

### Convex Production Setup

```bash
npx convex deploy
```

This will create a production deployment and provide you with the production URL to add to your Vercel environment variables.

### Manual Backups

Daily automated backups have been disabled to save costs. To run a backup manually:

1. Go to the [Actions tab](../../actions/workflows/backup-convex.yml) in GitHub
2. Click "Run workflow"
3. Choose options:
   - Include file storage in backup (default: true)
   - Upload to cloud storage (default: true)
4. Click "Run workflow"

The backup will be uploaded to GitHub Releases with automatic cleanup (keeps last 30 backups).

To re-enable daily automated backups, uncomment the `schedule` section in `.github/workflows/backup-convex.yml`.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### 🖼️ Version 4.5.27 - Image Processing & Seeding (Nov 18, 2025)

#### Robust Image Handling & Test Data Generation**

- 📸 **Image Processing Pipeline**:
  - Secure client-side uploads via `generateUploadUrl`
  - Direct-to-storage architecture (bypassing function limits)
  - Metadata tracking in `images` table
  
- 🌱 **Database Seeding**:
  - Automated test data population (`seedDatabase`)
  - Configurable volume and cleanup options
  - Consistent development environment setup
