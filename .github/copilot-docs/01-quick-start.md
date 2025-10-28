# Quick Start Guide

[← Back to Index](../copilot-instructions.md)

---

## 🚀 Critical Rules (Read These First!)

**If you only read 5 things, read these:**

1. **NEVER reorder providers** in `app/layout.tsx` - the hierarchy is load-bearing (ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider). Reordering causes runtime failures.

2. **Everything is bilingual (English/Thai)** - Schema has `title` AND `titleTh`. Forms need parallel inputs. Use `BilingualInput` component. Validation: `&&` (AND) not `||` (OR) for optional fields.

3. **Always use `.withIndex()`** for Convex queries - check `convex/schema.ts` for indexes. NEVER query inside loops - use batch fetch + Map pattern. This is critical for performance.

4. **Custom auth, not Convex built-in** - Uses localStorage sessions (24hr expiry), `btoa()` password hashing (⚠️ NOT production-secure), and explicit userId passing. See `lib/session-utils.ts`.

5. **All components need `"use client"`** - Next.js App Router requires this directive for client-side hooks (`useQuery`, `useMutation`, `useState`).

6. **Guardian students auto-approve** - Classes with `isGuardianLinked: true` bypass moderator approval workflow (NEW Oct 2025).

**Start Convex FIRST**: `npx convex dev` (must be running before `npm run dev`)

---

## Tech Stack

- **Frontend**: Next.js 15 + React 19 (App Router)
- **Backend**: Convex (real-time serverless)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript + bilingual UI (English/Thai)

**Latest Version:** 4.5.6 (Oct 28, 2025)

**Recent Optimizations**: 40-50% faster loads and 10-100x faster queries via N+1 elimination (Oct 2025)

---

## Critical Files

- `convex/schema.ts` - Database schema (source of truth)
- `app/layout.tsx` - Provider hierarchy (DO NOT reorder)
- `.github/copilot-instructions.md` - This documentation index
- `lib/session-utils.ts` - Session management (24hr expiry)
- `lib/toast.ts` - Toast notification system (replaces alert/confirm)
- `lib/language-context.tsx` - Bilingual helper (`t()` function)

---

## Development Commands

```powershell
# Install dependencies
npm install

# Start Convex backend (REQUIRED - run this FIRST!)
npx convex dev

# Start Next.js dev server (after Convex is running)
npm run dev

# Build for production
npm run build

# Deploy Convex to production
npx convex deploy

# Type checking
npx tsc --noEmit

# E2E tests
npm run test:e2e
npm run test:e2e:ui     # With Playwright UI
```

**CRITICAL**: `npx convex dev` must be running before `npm run dev` - Next.js needs `NEXT_PUBLIC_CONVEX_URL`

---

## Test User Credentials

- **Admin**: `admin` / `TeacherAdmin` (God mode - full access)
- **Moderator**: `moderator1` / `TeacherModerator1` (School-scoped)
- **Teacher**: `Evan` / `TeacherEvan` (Multi-school)

**Default password pattern**: `Teacher{username}` (e.g., `TeacherEvan`)

---

## Quick Verification Checklist

After making changes, verify:

1. ✅ Convex dev server running (`npx convex dev`)
2. ✅ Next.js builds without errors (`npm run build`)
3. ✅ TypeScript checks pass (`npx tsc --noEmit`)
4. ✅ Bilingual strings provided (English + Thai)
5. ✅ Queries use `.withIndex()` (no table scans)
6. ✅ Toast notifications instead of `alert()`
7. ✅ Components have `"use client"` directive
8. ✅ Real-time updates work (open two browser windows)

---

## Next Steps

- **Understand architecture** → [Architecture Essentials](./02-architecture.md)
- **Learn patterns** → [Non-Negotiable Patterns](./03-patterns.md)
- **Debug issues** → [Development Workflow](./06-development.md)
- **Write tests** → [E2E Testing Guide](./07-testing.md)

---

[← Back to Index](../copilot-instructions.md)
