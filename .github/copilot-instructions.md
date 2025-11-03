# AI Agent Instructions - Index

**Evan's Class Tracker 4.5** - Bilingual (English/Thai) class tracking system  
**Version:** 4.5.18 (Nov 2, 2025 - Security: PBKDF2 Password Migration)

---

## 📋 Agent-Friendly Navigation

This documentation is split into focused sections for efficient knowledge discovery. Start with the Quick Start, then dive into specific areas as needed.

### 🚀 Essential Reading (Start Here)

**[Quick Start Guide](./copilot-docs/01-quick-start.md)** ⭐ **READ FIRST**

- 7 critical rules that prevent runtime failures
- Tech stack overview
- Critical files reference
- How to start development servers

**[Architecture Essentials](./copilot-docs/02-architecture.md)**

- Provider hierarchy (load-bearing order)
- Convex backend patterns
- Authentication & session management
- Database schema structure

### 📚 Core Documentation

**[Non-Negotiable Patterns](./copilot-docs/03-patterns.md)** (25 patterns)

- Bilingual-first development
- Index-first queries (performance critical)
- N+1 query prevention
- Toast notifications
- Rate limiting
- Unique student IDs
- Class booking state machine
- Soft deletes
- File upload patterns
- Login security (account lockout)
- Bulk deletion (security-critical)
- Audit logging
- Teacher cycle editor
- Guardian student booking (auto-approve)
- Recurring weekly bookings
- Error reporting
- Hierarchical student selector
- Modal accordion pattern (NEW Oct 2025)
- Modal flex layout pattern (NEW Oct 2025)
- Pagination pattern (NEW Oct 2025)
- Collapsible section pattern (NEW Oct 2025)
- Visual bloat fix pattern (NEW Oct 2025)
- Provider system pattern (NEW Oct 2025)
- Ephemeral calculator pattern (NEW Oct 2025)
- Analytics dashboard pattern (NEW Nov 2025)
- Wizard-based onboarding pattern (NEW Nov 2025)

**[Integration Points & Architecture](./copilot-docs/04-integration.md)**

- System architecture overview (3-tier)
- Core data flow patterns
- Class booking workflow (end-to-end)
- Student management workflow
- Messaging ↔ Notifications integration
- School → Moderator → Teacher relationship
- File upload & storage integration
- Component communication patterns
- Cross-cutting concerns
- Audit logging integration

**[Security Considerations](./copilot-docs/05-security.md)** ⚠️

- Security context & environment (private repo)
- Known limitations (NOT production-ready)
- Password hashing issues
- Rate limiting gaps
- localStorage risks

### 🛠️ Development & Testing

**[Development Workflow](./copilot-docs/06-development.md)**

- Local development setup (PowerShell)
- Convex schema changes & migrations
- Debugging real-time updates
- Debugging toast notifications
- Build & deploy
- CI/CD pipeline
- Environment setup
- Testing new features

**[E2E Testing Guide](./copilot-docs/07-testing.md)**

- Playwright setup & commands
- Test structure overview
- 7 Best practices for writing tests
- 4 Performance optimization patterns
- Real test examples from codebase
- Bilingual testing strategies
- Test users & credentials

### 📖 Reference Materials

**[Common Pitfalls](./copilot-docs/08-pitfalls.md)**

- What NOT to do (8 critical warnings)
- Safe changes you can make
- When to ask before proceeding

**[Post-Implementation Procedures](./copilot-docs/09-procedures.md)**

- Update notification workflow (automated)
- Implementation summary conventions
- School-specific vs broadcast notifications
- Version tracking & changelog

**[Key Files Reference](./copilot-docs/10-files.md)**

- Architecture & schema files
- Core patterns & helpers
- Backend logic files
- UI components
- Feature documentation

### 🚨 Operations & Recovery

**[Disaster Recovery Protocols](./copilot-docs/11-disaster-recovery.md)** ⚠️ **EMERGENCY RUNBOOK**

- 10 critical failure scenarios with step-by-step recovery
- Convex offline recovery
- Vercel deployment failures
- Session/authentication issues
- Data corruption procedures
- Emergency contact information

**[Logging & Monitoring Guide](./copilot-docs/12-logging-monitoring.md)**

- Convex logs & real-time debugging
- Vercel deployment logs
- Browser console debugging
- GitHub Actions CI/CD logs
- MongoDB Atlas monitoring
- Error reporting system
- Performance monitoring
- Log aggregation strategies

**[Stack Alternatives & Migration](./copilot-docs/13-stack-alternatives.md)**

- Migration paths from Vercel (Netlify, Cloudflare Pages)
- Convex alternatives (Firebase, Supabase, PlanetScale)
- MongoDB replacement options
- Cost comparison matrix
- Migration complexity ratings
- Self-hosted options

**[How-To Guides](./copilot-docs/14-how-to-guides.md)** 📝 **COPY-PASTE READY**

- Deploy to production (step-by-step)
- Rollback failed deployment
- User management operations
- Debug production issues
- Backup & restore procedures
- Quick reference card

**[Code Refactoring Guide](./copilot-docs/15-refactoring-guide.md)** 🔧

- Priority files for refactoring (2000+ line components)
- Splitting strategy for class-booking.tsx (2,930 lines)
- Modularizing classes.ts backend (2,213 lines)
- Component extraction patterns
- Refactoring checklist & migration steps

---

## 🎯 Quick Decision Tree

**I need to...**

- **Get started immediately** → [Quick Start Guide](./copilot-docs/01-quick-start.md)
- **Understand the architecture** → [Architecture Essentials](./copilot-docs/02-architecture.md)
- **Implement a new feature** → [Non-Negotiable Patterns](./copilot-docs/03-patterns.md)
- **Debug real-time issues** → [Development Workflow](./copilot-docs/06-development.md) → Debugging sections
- **Write E2E tests** → [E2E Testing Guide](./copilot-docs/07-testing.md)
- **Deploy to production** → [How-To Guides](./copilot-docs/14-how-to-guides.md) → Deploy Section
- **Recover from failure** → [Disaster Recovery Protocols](./copilot-docs/11-disaster-recovery.md) ⚠️ **EMERGENCY**
- **Debug production issues** → [Logging & Monitoring Guide](./copilot-docs/12-logging-monitoring.md)
- **Migrate stack components** → [Stack Alternatives](./copilot-docs/13-stack-alternatives.md)
- **Refactor large files** → [Code Refactoring Guide](./copilot-docs/15-refactoring-guide.md)
- **Find a specific file** → [Key Files Reference](./copilot-docs/10-files.md)
- **Avoid breaking changes** → [Common Pitfalls](./copilot-docs/08-pitfalls.md)

---

## 📊 Documentation Stats

- **Documentation Stats**: ~6,000 lines split into 15 focused files
- **Code Patterns**: 25 non-negotiable patterns documented
- **Architecture Diagrams**: 12 ASCII diagrams across integration docs
- **Test Best Practices**: 7 E2E testing patterns + 4 performance optimizations
- **Security Warnings**: 0 known limitations (4 resolved as of Nov 2, 2025)
- **Disaster Recovery**: 10 critical failure scenarios with step-by-step recovery
- **Operational Guides**: 5 practical how-to procedures with copy-paste commands
- **Refactoring Candidates**: 4 files identified (2,930 to 1,065 lines each)
- **Recent Updates**: Nov 2, 2025 (v4.5.18) - PBKDF2 password migration deployed

---

## 🔄 Last Updated

**November 2, 2025** - Version 4.5.18 - PBKDF2 Password Migration 🔐

- **Security Upgrade**: Migrated from bcrypt to PBKDF2 (Web Crypto API)
  - Problem: bcrypt incompatible with Convex runtime (requires Node.js modules)
  - Solution: PBKDF2 using Web Crypto API (pure JavaScript, 100,000 iterations)
  - Strategy: Soft migration - zero user disruption, auto-upgrade on login
  - Triple hybrid verification: Supports PBKDF2, bcrypt (legacy), and btoa (legacy)
  - Timeline: Gradual migration as users login naturally
  - Monitoring: Admin dashboard query tracks migration progress (total/migrated/pending)
  - Implementation: Pure JavaScript, no external dependencies
  - Security Impact: Before A (bcrypt), After A+ (PBKDF2 100K iterations = 100x stronger)
  - Files: `convex/users.ts` (~120 lines), removed bcryptjs package
  - Documentation: Updated for PBKDF2 implementation
- **Build Status**: Next.js ✅, TypeScript ✅, Convex deploy ✅
- **Previous (v4.5.17)**: Bcrypt migration (superseded due to Convex incompatibility)
- **Previous (v4.5.16)**: Wizard-Based Startup Window - 5 guided workflows for moderators/teachers
- **Previous (v4.5.15)**: Filter-Required Display - Eliminated scrolling hell in class bookings (95-98% DOM reduction)
- **Previous (v4.5.14)**: Security Patch - Moderator authorization bypass fixed
- **Previous (v4.5.13)**: Analytics Dashboard - Comprehensive educational performance metrics

---

**Note for AI Agents**: Each section file is self-contained with cross-references. Follow the links to deep-dive into specific topics. Start with Quick Start for immediate productivity.

---

## 🚀 Quick Start for AI Agents (Preview)

**If you only read 7 things, read these:**

1. **NEVER reorder providers** in `app/layout.tsx` - the hierarchy is load-bearing (ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider). Reordering causes runtime failures.

2. **Everything is bilingual (English/Thai)** - Schema has `title` AND `titleTh`. Forms need parallel inputs. Use `BilingualInput` component. Validation: `&&` (AND) not `||` (OR) for optional fields.

3. **Always use `.withIndex()`** for Convex queries - check `convex/schema.ts` for indexes. NEVER query inside loops - use batch fetch + Map pattern. This is critical for performance.

4. **Custom auth with PBKDF2** - Uses localStorage sessions (24hr expiry), PBKDF2 password hashing (Web Crypto API, 100,000 iterations), and explicit userId passing. See `lib/session-utils.ts` and `convex/users.ts`. ⚠️ Note: Hybrid verification during migration supports legacy bcrypt and btoa hashes.

5. **All components need `"use client"`** - Next.js App Router requires this directive for client-side hooks (`useQuery`, `useMutation`, `useState`).

6. **Guardian students auto-approve** - Classes with `isGuardianLinked: true` bypass moderator approval workflow (NEW Oct 2025).

7. **Moderators are STRICTLY school-scoped** - Moderators can ONLY access their assigned school's data. Teachers are multi-school. Admins have God mode. NEVER allow moderators to bypass school boundaries (NEW Nov 2025).

**Start Convex FIRST**: `npx convex dev` (must be running before `npm run dev`)

---

**For complete documentation on each topic, see the linked files in the sections above.**
