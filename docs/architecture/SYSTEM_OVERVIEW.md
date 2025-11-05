# System Overview - Evan's Class Tracker 4.5

## Executive Summary

**Bilingual (English/Thai) class tracking system** built with modern web technologies, optimized for performance and developer experience.

### Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind v4, TypeScript 5
- **Backend:** Convex (real-time database + edge functions)
- **Build:** Turbopack (required for dev & build)
- **Deployment:** Vercel (frontend) + Convex Cloud (backend)

### Performance Achievements (Oct 2025)

- 40-50% faster initial load
- 10-100x faster database queries
- Native database-level pagination
- Rate limiting & input validation
- Toast notification system

---

## Key Documentation

### For Developers

| Document | Purpose |
|----------|---------|
| [.github/copilot-instructions.md](../.github/copilot-instructions.md) | **START HERE** - AI agent guidelines, critical patterns |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System diagrams, data flows, tech stack details |
| [OPTIMIZATION_ANALYSIS_2025.md](OPTIMIZATION_ANALYSIS_2025.md) | Performance fixes, N+1 elimination, benchmarks |
| [FEATURES_DOCUMENTATION.md](FEATURES_DOCUMENTATION.md) | API reference, all Convex functions |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide |

### For Users

| Document | Purpose |
|----------|---------|
| [../README.md](../README.md) | Quick start, setup, default credentials |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | User guide for all roles |
| [MOBILE_UI_GUIDE.md](MOBILE_UI_GUIDE.md) | Mobile device usage |

### For Project Management

| Document | Purpose |
|----------|---------|
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Complete file listing with summaries |
| [IMPLEMENTATION_REVIEW_2025.md](IMPLEMENTATION_REVIEW_2025.md) | Latest status review |
| [FEATURE_COMPLETION_SUMMARY.md](FEATURE_COMPLETION_SUMMARY.md) | What's been built |

---

## Critical Patterns (Must Follow)

### 1. Provider Hierarchy (DO NOT REORDER)

Order in `app/layout.tsx` is **load-bearing**:

```
ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider
```

Reordering causes runtime failures.

### 2. Bilingual-First Development

Every user-facing string needs **English + Thai**:

- Schema: `title` + `titleTh`
- Forms: parallel input fields
- Helper: `const { t } = useLanguage()`

### 3. Index-First Queries (Performance Critical)

**Always** use `.withIndex()` to avoid table scans:

```typescript
// ✅ CORRECT
ctx.db.query("classes")
  .withIndex("by_school_and_date", q => 
    q.eq("schoolId", schoolId).gte("scheduledDate", start)
  )

// ❌ WRONG
ctx.db.query("classes").collect()
  .filter(c => c.schoolId === schoolId)
```

### 4. No N+1 Queries

**NEVER** query inside loops. Use batch fetch + lookup map:

```typescript
// ❌ BAD
for (const msg of messages) {
  const user = await ctx.db.get(msg.senderId); // N+1!
}

// ✅ GOOD
const userIds = new Set(messages.map(m => m.senderId));
const users = await Promise.all([...userIds].map(id => ctx.db.get(id)));
const userMap = new Map(users.map(u => [u._id, u]));
```

### 5. Custom Authentication

Uses **custom session-based auth**, NOT Convex's built-in `ctx.auth.getUserIdentity()`.

Always pass `userId` from client as parameter to mutations/queries.

### 6. Soft Deletes Only

Use `isActive: boolean` flag. Never hard delete records.

### 7. Toast Notifications

**Never** use `alert()` or `confirm()`. Always use `toast` from `lib/toast.ts`.

### 8. Rate Limiting

Protect mutations with `checkRateLimit(ctx, { key, limit, windowMs })`.

---

## Development Workflow

### Local Development (PowerShell)

```powershell
npm install              # Install dependencies
npx convex dev           # Start Convex FIRST (required!)
npm run dev              # Start Next.js with Turbopack
npx tsc --noEmit         # Type check
```

**CRITICAL:** Convex must be running before Next.js starts.

### Environment Setup

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)
- Already in `.gitignore` - never commit
- Production: Set in Vercel dashboard

### Build System

**Turbopack is required** - do not remove `--turbopack` flags from `package.json` scripts.

---

## Forbidden Changes

1. ❌ Do not reorder providers in `app/layout.tsx`
2. ❌ Do not edit `convex/_generated/` files
3. ❌ Do not remove `--turbopack` from npm scripts
4. ❌ Do not remove bilingual support
5. ❌ Do not replace Convex with REST/direct DB
6. ❌ Do not commit `.env.local` or secrets
7. ❌ Do not use `alert()` or `confirm()` - use toast
8. ❌ Do not query in loops - use batch fetching

---

## Architecture Highlights

### Provider Hierarchy

```
ErrorBoundary (catches all errors)
  └─ ConvexClientProvider (DB connection)
     └─ DeviceProvider (device detection)
        └─ DataProvider (shared data layer)
           └─ LanguageProvider (i18n - innermost)
```

### Database Schema

8 main tables:

- `users` - Authentication & roles
- `schools` - School management
- `classes` - Bookings with audit trails
- `students` - Unique IDs, 11 optional fields
- `notifications` - Bilingual alerts
- `locations` - School locations (soft delete)
- `postClassNotes` - Teacher feedback
- `appUpdates` - Announcement tracking

All bilingual fields follow `name` + `nameTh` pattern.

### Key Components

- **class-booking.tsx** - Multi-date booking, 10 optional fields
- **edit-class-modal.tsx** - Full edit with audit trail tracking
- **student-management.tsx** - 11 collapsible optional fields
- **desktop-notification-toast.tsx** - Toast UI component
- **post-class-notes-modal.tsx** - Multi-class feedback wizard
- **update-announcement-modal.tsx** - One-time view tracking

### Key Backend Files

- **convex/schema.ts** - Source of truth for DB structure & indexes
- **convex/classes.ts** - State machine, workflow, audit trails
- **convex/students.ts** - Unique ID generation (do not replace!)
- **convex/pagination.ts** - Native database pagination
- **convex/rateLimit.ts** - Rate limiting & validation
- **lib/toast.ts** - Toast notification manager

---

## Quick Reference Links

### Critical Files

```
.github/copilot-instructions.md  # AI agent guide (START HERE)
app/layout.tsx                   # Provider hierarchy (critical order)
convex/schema.ts                 # Database schema (source of truth)
lib/toast.ts                     # Toast notifications
lib/language-context.tsx         # Bilingual helper
```

### Key Patterns

```
components/class-booking.tsx     # Multi-date booking pattern
components/edit-class-modal.tsx  # Edit audit trail pattern
convex/classes.ts                # State machine implementation
convex/pagination.ts             # Native pagination pattern
convex/rateLimit.ts              # Rate limiting pattern
```

### Documentation

```
docs/ARCHITECTURE.md             # This file
docs/OPTIMIZATION_ANALYSIS_2025.md  # Performance improvements
docs/FEATURES_DOCUMENTATION.md   # Complete API reference
```

---

## For AI Agents

**Primary Reference:** `.github/copilot-instructions.md`

Contains:

- Architecture essentials
- 6 non-negotiable patterns
- Development workflow commands
- 8 common pattern examples with code
- Forbidden changes list
- Safe vs risky tasks
- Key file reference table

**Secondary References:**

- `docs/ARCHITECTURE.md` - System diagrams
- `docs/OPTIMIZATION_ANALYSIS_2025.md` - Performance details
- `convex/schema.ts` - Database structure

---

## Getting Help

1. **For coding patterns:** Check `.github/copilot-instructions.md`
2. **For system overview:** Read `docs/ARCHITECTURE.md`
3. **For API details:** See `docs/FEATURES_DOCUMENTATION.md`
4. **For performance:** Read `docs/OPTIMIZATION_ANALYSIS_2025.md`
5. **For deployment:** Follow `docs/DEPLOYMENT.md`

---

*Last Updated: October 22, 2025*
