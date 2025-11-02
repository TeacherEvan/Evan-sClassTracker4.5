# TODO List - Evan's Class Tracker 4.5

**Last Updated:** November 1, 2025

---

## � Priority 1 - This Week (From Nov 1 Audit)

### 1. Monitor Bcrypt Migration ⏳

**Status:** In Progress (Deployed Nov 1, 2025)  
**Timeline:** 2-4 weeks for full user base migration

**Action Items:**

- [ ] Test auto-upgrade with first 10 logins (see `docs/BCRYPT_TESTING_GUIDE.md`)
- [ ] Monitor migration progress weekly via `getMigrationStats` query
- [ ] Check Convex logs for "🔄 Auto-upgrading password hash" messages
- [ ] Verify no increase in login failures or account lockouts
- [ ] Track migration percentage: Week 1 (30-40%), Week 2 (60-70%), Week 3-4 (90-100%)

**Expected Completion:** November 29, 2025 (4 weeks)

---

### 2. Add Database Indexes (2 hours, 10-100x performance gain)

**File:** `convex/schema.ts`

**Changes Needed:**

```typescript
// Students table
students: defineTable({...})
    .index("by_grade_and_class", ["grade", "class"]) // NEW

// Locations table
locations: defineTable({...})
    .index("by_name_and_active", ["name", "isActive"]) // NEW
    .index("by_school_and_active", ["schoolId", "isActive"]) // NEW
```

**Follow-up:**

1. Deploy: `npx convex deploy`
2. Update `seedPrivateClasses.ts` to use `.withIndex()` instead of JavaScript filter
3. Test private class seeding

**Benefit:** Queries run 10-100x faster, reduced memory usage

---

### 3. Feature Usage Tracking (1 hour setup)

**Purpose:** Understand which features are actually used for data-driven decisions

**Implementation:**

- Create `convex/analytics/featureTracking.ts`
- Add `featureUsage` table to schema
- Track: Payment Calculator, Provider system, Wizards, Analytics dashboard

**Benefit:** Identify underused features for improvement or deprecation

---

## �🚀 New Features

_No new features planned at this time_

---

## ✅ Recently Completed (November 1, 2025)

### Bcrypt Password Migration ✅

**Description:** Upgraded from insecure btoa() encoding to industry-standard bcrypt hashing

**Implementation:**

- Soft migration strategy (zero user disruption)
- Auto-upgrade on login (transparent to users)
- Hybrid verification system (supports both hash types)
- Migration tracking query for admin monitoring
- Documentation: `docs/archive/implementations/IMPLEMENTATION_SUMMARY_BCRYPT_MIGRATION_NOV_1_2025.md`

---

### Wizard-Based Onboarding ✅

**Description:** Step-by-step guided workflows for moderators and teachers

**Implementation:**

- 5 new wizards: Booking, ClassCount Report, Message, Notification, Dashboard
- Reduced onboarding time from 30min to <10min
- Documentation: `docs/archive/implementations/IMPLEMENTATION_SUMMARY_WIZARD_STARTUP_NOV_1_2025.md`

---

### Analytics Dashboard - Phase 5 ✅

**Description:** Comprehensive educational performance metrics dashboard providing insights for teachers, moderators, and administrators.

**Implemented Features:**

- ✅ 4 Visual Summary Cards:
  - Total Classes (blue gradient)
  - Attendance Rate (green gradient)
  - Active Students (purple gradient)
  - Avg ClassCount (orange gradient)
- ✅ Student Performance Table with:
  - Student name, total classes, attended classes
  - Attendance rate with color-coded ratings
  - Average ClassCount per student
  - Performance ratings (Excellent ≥90%, Good ≥70%, Needs Improvement <70%)
- ✅ Date range filtering (defaults to last 30 days)
- ✅ CSV export functionality with bilingual headers
- ✅ Role-based access control:
  - Teachers: See own students only
  - Moderators: See school-wide data
  - Admins: See system-wide data
- ✅ Responsive design with mobile-friendly card layout
- ✅ Dark mode support
- ✅ Complete bilingual support (EN/TH)
- ✅ Loading and empty states
- ✅ Analytics button in Class Booking header (indigo gradient)

**Technical Implementation:**

- Component: `components/class-analytics.tsx` (352 lines)
- Backend: `convex/analytics.ts` (294 lines)
- Integration: `components/class-booking.tsx` (Analytics button)
- Performance: Index-based queries, batch fetching, Map lookups
- Type Safety: Explicit Doc<"classes">[] annotations

**Status:** ✅ **COMPLETE** - Deployed to production Nov 1, 2025

---

## ✅ Recently Completed (October 31, 2025)

### Class Payment Calculator (Security-First Ephemeral Tool) ✅

**Description:** Professional payment calculator with audit-ready single-page print output that never persists financial data to the database.

**Implemented Features:**

- ✅ Security-first design: All calculations ephemeral (component-level state only)
- ✅ Mandatory disclaimer screen before access
- ✅ Teacher selection (moderators/admins) or auto-filled for teachers
- ✅ Date range filtering (default: current month)
- ✅ Entity filtering (all/schools/providers/specific entity)
- ✅ Real-time calculation: ClassCount × Rate = Total Payment
- ✅ Professional single-page print layout with:
  - Compact header with metadata grid (teacher, period, rate, generated timestamp)
  - 4-card summary (total classes, ClassCount, average ClassCount per session, total payment)
  - Entity-level summary table (sessions, ClassCount, payment by school/provider)
  - Full session breakdown with: Date, Time, Type, Students, Entity, Location, Booked by, Approved by, Duration, ClassCount, Rate, Payment
  - Reviewer notes section for manual annotations
  - Signature lines (Teacher, Reviewer, Date)
  - Security disclaimer and system footer
- ✅ Complete bilingual support (EN/TH) throughout all sections
- ✅ Booking/approval metadata tracking:
  - `bookedByUserId`, `bookedByUsername` (persisted in schema)
  - `approvedByUserId`, `approvedByUsername`, `approvalSource` (persisted in schema)
  - Auto-approval sources: `auto_provider`, `auto_guardian`, `system`, `admin`, `moderator`
  - Display formatting with localized labels and fallbacks
- ✅ Print optimization:
  - Condensed typography (8.5px–16px font sizes)
  - Tight spacing (8mm page margins, minimal padding)
  - Professional grayscale styling (no heavy color fills)
  - Single-page output for typical monthly reports
- ✅ On-screen table view (first 20 classes with pagination note)

**Technical Implementation:**

- Component: `components/class-payment-calculator.tsx` (852 lines)
- Backend: `convex/teacherClassCount.ts` (getMyClassCountDetails query with booking/approval metadata)
- Schema: `convex/schema.ts` (optional booking/approval fields in classes table)
- Mutations: `convex/classes.ts` (bookWithConflictCheck, book, approve, reject, updateClass with metadata population)
- Print: Custom HTML generation with professional work-log layout
- Security: Zero database persistence for rate/payment calculations

**Status:** ✅ **COMPLETE** - Production-ready (security disclaimer required before access)

---

## ✅ Recently Completed (October 27, 2025)

### Hierarchical Student Selector ✅

**Description:** Progressive filtering system for student selection (Grade → Class → Student).

**Implemented Features:**

- ✅ 3-step progressive filtering reduces cognitive load
- ✅ Reusable component for all student selection contexts
- ✅ Smart defaults and pre-population for edit mode
- ✅ Integrated in class booking, weekly calendar, and add student features
- ✅ Complete bilingual interface (EN/TH)

**Technical Implementation:**

- Component: `components/hierarchical-student-selector.tsx` (151 lines)
- Integration: `class-booking.tsx`, `weekly-calendar.tsx`
- Performance: Reduces visible options from 100+ to 15 max per step

**Status:** ✅ **COMPLETE** - Production-ready

---

### Enhanced Class Count System ✅

**Description:** Comprehensive enhancements to teacher class count reporting and management.

**Implemented Features:**

- ✅ Teacher selection dropdown for moderators/admins
- ✅ Print language selection dialog (English/Thai)
- ✅ Detailed print reports with full class breakdown
- ✅ Professional HTML generation with summary cards
- ✅ CSV export updated for selected teacher
- ✅ Complete bilingual support throughout

**Technical Implementation:**

- Component: `components/teacher-class-count-modal.tsx` (major enhancements)
- Features: Teacher switching, language-specific printing, detailed reporting
- Print: Custom HTML generation with professional formatting

**Status:** ✅ **COMPLETE** - Production-ready

---

### Post-Class Validation Fix ✅

**Description:** Fixed overly strict bilingual validation that required both languages.

**Implemented Features:**

- ✅ Applied correct bilingual validation pattern (`&&` instead of `||`)
- ✅ Now truly allows optional bilingual notes (at least one language required)
- ✅ Consistent with other optional bilingual fields across the app

**Technical Implementation:**

- Component: `components/post-class-notes-modal.tsx` (validation fix)
- Pattern: Uses `&&` for "at least one" vs `||` for "both required"

**Status:** ✅ **COMPLETE** - Production-ready

---

### YouTube Downloader Removal ✅

**Description:** Complete removal of YouTube downloader feature per user request.

**Removed:**

- ✅ Deleted `components/youtube-downloader.tsx` (436 lines)
- ✅ Cleaned imports and dependencies from `teacher-helper.tsx`
- ✅ Simplified Teacher Helper to single-tab resources view
- ✅ Updated all documentation references

**Status:** ✅ **COMPLETE** - Feature removed

---

### Device Testing Dashboard (COMPLETED)

- ✅ Created comprehensive device testing dashboard
- ✅ Integrated into admin tab
- ✅ Tests items 1-6 from IMPLEMENTATION_REVIEW_AND_STATUS.md
- ✅ Real-time device detection verification
- ✅ Database sync monitoring
- ✅ Service worker status checking

---

## 🧪 Testing & QA

### Manual Testing Checklist (Items 1-6)

**Status:** Ready for Testing ✅

#### 4. Window Resize Re-detection

- [ ] Start with desktop browser (>1024px)
- [ ] Resize to tablet width (768px-1024px)
- [ ] Verify device type updates to "tablet"
- [ ] Resize to mobile width (<768px)
- [ ] Verify device type updates to "mobile"
- [ ] Check resize counter increments

#### 5. Database Sync Verification

- [ ] Login as admin
- [ ] Navigate to Testing tab
- [ ] Verify "DB" and "Local" device types match
- [ ] Resize window to trigger change
- [ ] Wait 2-3 seconds for sync
- [ ] Verify database updated (green checkmark)

**Testing Dashboard Access:**

- Login as `admin` user
- Navigate to "Testing" tab (admin only)
- View real-time test results

---

## 🔄 In Progress

_No items currently in progress_

---

## 📋 Backlog

### Performance Optimizations

- [ ] Implement code splitting for large components (see CODE_SPLITTING_RECOMMENDATIONS.md)
- [ ] Add lazy loading for admin-only components
- [ ] Optimize bundle size for mobile devices
- [ ] Add image optimization for user uploads (if applicable)

### Feature Enhancements

- [ ] Add bulk student import from CSV
- [ ] Add class schedule export to iCal format
- [ ] Add email notifications (in addition to push)
- [ ] Add file attachments to messages
- [ ] Add class attendance tracking
- [ ] Add teacher performance reports
- [ ] Add parent portal access

### UI/UX Improvements

- [ ] Add loading skeletons instead of spinners
- [ ] Add animations for state transitions
- [ ] Improve mobile keyboard handling
- [ ] Add swipe gestures for navigation
- [ ] Add dark mode manual toggle (in addition to auto)
- [ ] Add customizable themes per school

### Security Enhancements

- [ ] Upgrade to bcrypt password hashing
- [ ] Add 2FA authentication
- [ ] Add session timeout
- [ ] Add login attempt rate limiting
- [ ] Add audit log for admin actions

### Testing

- [ ] Add unit tests for Convex functions
- [ ] Add integration tests for workflows
- [ ] Add E2E tests with Playwright
- [ ] Add accessibility testing
- [ ] Add performance testing
- [ ] Add security testing

### Documentation

- [ ] Add API documentation for Convex endpoints
- [ ] Add component documentation with Storybook
- [ ] Add deployment troubleshooting guide
- [ ] Add user manual (EN/TH)
- [ ] Add video tutorials

---

## 🐛 Known Issues

_No known issues at this time_

---

## 💡 Future Ideas

### Advanced Features

- AI-powered class scheduling suggestions
- Automatic translation for notifications
- Voice recording for class notes
- Video conferencing integration
- Student progress tracking with charts
- Automated report generation
- Integration with Google Calendar
- Integration with Microsoft Teams
- WhatsApp notification integration
- LINE notification integration (for Thailand)

### Analytics & Insights

- Teacher workload analysis
- School performance metrics
- Student attendance patterns
- Class booking trends
- Peak usage time analysis
- Predictive analytics for scheduling

---

## 📝 Notes

### Testing Dashboard Usage

**How to Access:**

1. Start development server: `npm run dev`
2. Login with admin credentials
3. Click "Testing" tab in navigation
4. View real-time test results
5. Resize browser to test responsive detection

**What to Check:**

- All 6 tests should show green checkmarks
- Device type should match your actual device
- Database sync should update within 2-3 seconds
- Service worker should be "registered"

---

## 🎯 Priority Matrix

| Priority | Items | Timeline |
|----------|-------|----------|
| **HIGH** | Manual Testing 1-6 | This week |
| **MEDIUM** | Code Splitting | When needed |
| **LOW** | Advanced Features | Q1 2026 |

---

## 📞 Need Help?

For questions or support:

- Check `.github/copilot-instructions.md` for coding guidelines
- Review `docs/IMPLEMENTATION_REVIEW_AND_STATUS.md` for recent changes
- Consult `FEATURES_DOCUMENTATION.md` for feature details

---

**End of TODO List**
