# Documentation Index

**Last Updated:** October 26, 2025  
**Status:** Cleaned & Reorganized  
**Recent Changes:**

- Archived 10+ redundant docs (E2E implementation, cleanup summaries, staging guides)
- Consolidated staging documentation into DEPLOYMENT_GUIDE.md
- Consolidated help window documentation (3 files → 1)
- Fixed TypeScript errors in E2E testing helpers (function overloads)
- Updated DOCUMENTATION_INDEX.md to reflect current structure

---

## Start Here

### Essential Reading (Priority Order)

1. **[../.github/copilot-instructions.md](../.github/copilot-instructions.md)** - AI agent guidelines & critical patterns
2. **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Executive summary with all key links
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture & data flows
4. **[../README.md](../README.md)** - Setup instructions & quick start
5. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Developer quick reference

---

## Core Documentation

### Getting Started

- **[SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)** - Executive summary
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Common patterns
- **[FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md)** - Complete feature reference
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Testing procedures

### Architecture & Design

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture
- **[UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md)** - UI patterns & flows (NEW - merged UI docs)
- **[MOBILE_UI_GUIDE.md](MOBILE_UI_GUIDE.md)** - Mobile-specific patterns

### Deployment & Operations

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production & staging deployment (includes Convex, Vercel, testing)
- **[CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md)** - GitHub Actions setup & automation
- **[STAGING_TEST_PLAN.md](STAGING_TEST_PLAN.md)** - Comprehensive staging testing checklist
- **[TROUBLESHOOTING_CI_CD.md](TROUBLESHOOTING_CI_CD.md)** - CI/CD troubleshooting guide
- **[COST_ANALYSIS_CONVEX_VS_VERCEL.md](COST_ANALYSIS_CONVEX_VS_VERCEL.md)** - Cost projections

### Security & Compliance

- **[SECURITY_REVIEWS.md](SECURITY_REVIEWS.md)** - Comprehensive security analysis (NEW - merged 4 security docs)
- **[AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md)** - Audit trail system
- **[COPILOT_INSTRUCTIONS_REVIEW.md](COPILOT_INSTRUCTIONS_REVIEW.md)** - Security analysis of guidelines

### Performance & Optimization

- **[PERFORMANCE_AUDIT_OCT_24_2025.md](PERFORMANCE_AUDIT_OCT_24_2025.md)** - Comprehensive performance audit
- **[CODE_QUALITY_REVIEW.md](CODE_QUALITY_REVIEW.md)** - Code quality analysis
- **[COMPONENT_SPLITTING_PLAN.md](COMPONENT_SPLITTING_PLAN.md)** - Component splitting strategy

**Note:** Detailed optimization analysis and pending optimizations have been archived. See `archive/OPTIMIZATION_ANALYSIS_2025.md` and `archive/PENDING_OPTIMIZATIONS.md` for historical reference.

### Feature Documentation

- **[HELP_WINDOW_FEATURE.md](HELP_WINDOW_FEATURE.md)** - Interactive help system (comprehensive guide)
- **[CONTACT_ADMIN_FEATURE.md](CONTACT_ADMIN_FEATURE.md)** - Contact Admin & Notification Window
- **[GOLD_TABLET_NOTIFICATION_WINDOW.md](GOLD_TABLET_NOTIFICATION_WINDOW.md)** - Notification window system
- **[ALERT_TO_TOAST_MIGRATION.md](ALERT_TO_TOAST_MIGRATION.md)** - Toast notifications
- **[DUPLICATE_BOOKING_PREVENTION.md](DUPLICATE_BOOKING_PREVENTION.md)** - Booking conflict prevention
- **[MODERATOR_ADMIN_EVENT_BOOKING.md](MODERATOR_ADMIN_EVENT_BOOKING.md)** - Event booking feature
- **[MODERATOR_CLASSCOUNT_FEATURE.md](MODERATOR_CLASSCOUNT_FEATURE.md)** - Class count tracking
- **[SANGSOM_PROJECT_IMPORT.md](SANGSOM_PROJECT_IMPORT.md)** - Sangsom data import

### Testing & Quality

- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Manual testing procedures
- **[E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md)** - Playwright E2E testing (active implementation)
- **[TESTING_BULK_DELETION.md](TESTING_BULK_DELETION.md)** - Bulk deletion testing

### Implementation Status

- **[../IMPLEMENTATION_SUMMARY_UX_FIXES_OCT_25_2025.md](../IMPLEMENTATION_SUMMARY_UX_FIXES_OCT_25_2025.md)** - Latest UX fixes (validation patterns)
- **[../IMPLEMENTATION_SUMMARY_OCT_25_2025.md](../IMPLEMENTATION_SUMMARY_OCT_25_2025.md)** - Session expiration & BilingualInput component
- **[../IMPLEMENTATION_SUMMARY_CYCLE_EDITOR.md](../IMPLEMENTATION_SUMMARY_CYCLE_EDITOR.md)** - Teacher cycle editor
- **[../IMPLEMENTATION_SUMMARY_HELP_WINDOW.md](../IMPLEMENTATION_SUMMARY_HELP_WINDOW.md)** - Help window system
- **[../IMPLEMENTATION_SUMMARY_STARTUP_WINDOW.md](../IMPLEMENTATION_SUMMARY_STARTUP_WINDOW.md)** - Startup window
- **[../TODO.md](../TODO.md)** - Active tasks
- **[FEATURE_COMPLETION_SUMMARY.md](FEATURE_COMPLETION_SUMMARY.md)** - Feature status
- **[IMPLEMENTATION_REVIEW_2025.md](IMPLEMENTATION_REVIEW_2025.md)** - Latest review
- **[AUTHORIZATION_REFACTORING_COMPLETE.md](AUTHORIZATION_REFACTORING_COMPLETE.md)** - Auth refactoring

### Historical Reference

- **[archive/](archive/)** - Archived implementation summaries & dated reviews (26 files)
  - E2E testing implementation summary
  - Cleanup summaries (Oct 24, 2025)
  - Convex deployment fixes
  - Help window UI flow & quickstart
  - Staging setup guides
  - Historical security fixes
  - Performance optimization analysis
  - And more...

---

## Quick Links by Role

### AI Agent / New Developer

1. [copilot-instructions.md](../.github/copilot-instructions.md) - Start here
2. [ARCHITECTURE.md](ARCHITECTURE.md) - System overview
3. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Common patterns
4. [E2E_TESTING_GUIDE.md](E2E_TESTING_GUIDE.md) - Testing with Playwright

### Backend Developer

1. [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md) - API reference
2. [SECURITY_REVIEWS.md](SECURITY_REVIEWS.md) - Security requirements
3. [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md) - Audit trails
4. [PERFORMANCE_AUDIT_OCT_24_2025.md](PERFORMANCE_AUDIT_OCT_24_2025.md) - Performance patterns

### Frontend Developer

1. [UI_DESIGN_GUIDE.md](UI_DESIGN_GUIDE.md) - UI patterns
2. [MOBILE_UI_GUIDE.md](MOBILE_UI_GUIDE.md) - Mobile patterns
3. [ALERT_TO_TOAST_MIGRATION.md](ALERT_TO_TOAST_MIGRATION.md) - Toast notifications

### DevOps

1. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment procedures
2. [CI_CD_SETUP_GUIDE.md](CI_CD_SETUP_GUIDE.md) - CI/CD setup
3. [COST_ANALYSIS_CONVEX_VS_VERCEL.md](COST_ANALYSIS_CONVEX_VS_VERCEL.md) - Cost tracking

### Security / Compliance

1. [SECURITY_REVIEWS.md](SECURITY_REVIEWS.md) - Security analysis
2. [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md) - Audit system
3. [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Security checklist

---

## Recent Changes (October 26, 2025)

### Documentation Cleanup & Consolidation

**Archived Historical Documents** (10 files):

- `IMPLEMENTATION_SUMMARY_E2E_TESTING.md` - Implementation details (superseded by E2E_TESTING_GUIDE.md)
- `CLEANUP_FINAL_OCT_24_2025.md` - Cleanup summary (historical)
- `CONVEX_DEPLOYMENT_FIX_OCT_23_2025.md` - Deployment fix (resolved)
- `FIX_DELETED_STUDENT_LOADING_STATE.md` - Specific bug fix (resolved)
- `AUTOMATED_TESTING_PIPELINE_PLAN.md` - Future plan (1667 lines)
- `HELP_WINDOW_QUICKSTART.md` - Quick start (merged into HELP_WINDOW_FEATURE.md)
- `HELP_WINDOW_UI_FLOW.md` - UI flow (merged into HELP_WINDOW_FEATURE.md)
- `STAGING_SETUP_GUIDE.md` - Staging setup (consolidated into DEPLOYMENT_GUIDE.md)
- `CONVEX_TEST_DEPLOYMENT_GUIDE.md` - Convex staging (consolidated into DEPLOYMENT_GUIDE.md)
- `STAGING_TEST.md` - Simple test file (superseded by STAGING_TEST_PLAN.md)

**Consolidated Documentation:**

- **Help Window:** 3 files → 1 (`HELP_WINDOW_FEATURE.md`)
- **Staging:** 4 files → 1 section in `DEPLOYMENT_GUIDE.md`
- **E2E Testing:** Active guide maintained, implementation summary archived

**Code Fixes:**

- Fixed TypeScript errors in `tests/e2e/helpers.ts` (function overload signatures)
- All CI/CD type checks now passing

**Result:** 40+ docs → ~30 active docs (25% reduction), clearer organization, less duplication

---

## Previous Cleanup (October 24, 2025)

**Merged:**

- DEPLOYMENT.md + DEPLOYMENT_CHECKLIST.md → **DEPLOYMENT_GUIDE.md**
- 4 security reviews → **SECURITY_REVIEWS.md**
- 3 Contact Admin docs → **CONTACT_ADMIN_FEATURE.md**
- UI_FLOW_DIAGRAMS + VISUAL_UI_MOCKUP → **UI_DESIGN_GUIDE.md**

**Archived** (21 files moved to archive/):

- 16 dated implementation summaries
- 4 dated codebase reviews
- 1 Sangsom project documentation

**Combined Result:** 46 files → ~30 active files (35% total reduction)

---

## Project Achievements

### Performance

- **40-50% faster** initial page load (code splitting)
- **10-100x faster** queries (N+1 elimination)
- True pagination (handles 10,000+ records)

### Security

- 24-hour account lockout (5 failed attempts)
- Rate limiting on critical operations
- Bulk deletion safeguards
- Comprehensive audit logging

### Features

- Bilingual support (English/Thai)
- Real-time updates (Convex subscriptions)
- Multi-date class booking
- File attachments in messages
- Contact Admin with notification window

---

## Finding Documentation

### By Topic

**Performance:** PERFORMANCE_AUDIT_OCT_24_2025.md, CODE_QUALITY_REVIEW.md, archive/OPTIMIZATION_ANALYSIS_2025.md  
**Security:** SECURITY_REVIEWS.md, AUDIT_LOGGING_IMPLEMENTATION.md  
**Deployment:** DEPLOYMENT_GUIDE.md (includes staging), CI_CD_SETUP_GUIDE.md  
**Testing:** E2E_TESTING_GUIDE.md, TESTING_GUIDE.md, STAGING_TEST_PLAN.md  
**UI/UX:** UI_DESIGN_GUIDE.md, MOBILE_UI_GUIDE.md  
**Features:** FEATURES_DOCUMENTATION.md, HELP_WINDOW_FEATURE.md, CONTACT_ADMIN_FEATURE.md

### By Question

**"How do I..."** → QUICK_REFERENCE.md  
**"What's the architecture?"** → ARCHITECTURE.md  
**"How do I deploy?"** → DEPLOYMENT_GUIDE.md (includes staging)  
**"How do I test?"** → E2E_TESTING_GUIDE.md, TESTING_GUIDE.md  
**"Why is X slow?"** → PERFORMANCE_AUDIT_OCT_24_2025.md  
**"Is this secure?"** → SECURITY_REVIEWS.md  
**"What features exist?"** → FEATURES_DOCUMENTATION.md  
**"How do I troubleshoot CI/CD?"** → TROUBLESHOOTING_CI_CD.md

---

**Maintained by:** TeacherEvan  
**Documentation Review:** Quarterly  
**Last Cleanup:** October 26, 2025
