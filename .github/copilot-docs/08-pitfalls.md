# Common Pitfalls

[← Back to Index](../copilot-instructions.md)

---

## ❌ DO NOT DO (8 Critical Warnings)

### 1. Reorder Providers in `app/layout.tsx`

**Why**: Provider hierarchy is load-bearing - reordering causes runtime failures

**Correct order**: ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider

### 2. Edit `convex/_generated/`

**Why**: Auto-regenerated on every schema change - all manual edits will be lost

**Solution**: Modify `convex/schema.ts` instead

### 3. Remove `--turbopack` from Build Scripts

**Why**: Required for this project - removal causes build failures

**Location**: `package.json` scripts

### 4. Remove Bilingual Support

**Why**: Core requirement - every user-facing string needs English + Thai

**Solution**: Use `BilingualInput` component and `t()` helper

### 5. Use `alert()` or `confirm()`

**Why**: Replaced by toast notification system

**Solution**: Use `toast.success()`, `toast.error()`, etc.

### 6. Query in Loops (N+1 Queries)

**Why**: Performance killer - 100 classes = 100 student queries

**Solution**: Use batch fetch + Map lookup pattern

### 7. Commit `.env.local`

**Why**: Contains sensitive Convex URL

**Status**: Already in `.gitignore` - verify before committing

### 8. Use Convex Built-in Auth

**Why**: This project uses custom session auth with explicit userId passing

**Solution**: See `lib/session-utils.ts` for session management

---

## ✅ SAFE CHANGES

You can safely:

- **Add bilingual fields** to UI forms (parallel inputs + update mutation)
- **Implement indexed Convex queries** (match `.withIndex()` pattern)
- **Fix N+1 queries** using batch fetch pattern
- **Add soft delete logic** to tables (`isActive` boolean)
- **Implement edit audit trails** (see `classes.editHistory` pattern)
- **Add rate limiting** to mutations (see `convex/rateLimit.ts`)
- **Convert `alert()`/`confirm()`** calls to toast notifications

---

## ⚠️ ASK FIRST

**Before making these changes, consult documentation or ask**:

- Changing provider order or removing ErrorBoundary
- Modifying schema indexes or student ID generation
- Removing bilingual requirements
- Large-scale refactoring of Convex queries
- Changing authentication system
- Modifying rate limit values
- Deploying to production (see [Security Considerations](./05-security.md))

---

## Quick Verification Checklist

After making changes:

1. ✅ Convex dev server running (`npx convex dev`)
2. ✅ Next.js builds without errors (`npm run build`)
3. ✅ TypeScript checks pass (`npx tsc --noEmit`)
4. ✅ Bilingual strings provided (English + Thai)
5. ✅ Queries use `.withIndex()` (no table scans)
6. ✅ Toast notifications instead of `alert()`
7. ✅ Components have `"use client"` directive
8. ✅ Real-time updates work (test with two browser windows)

---

## Next Steps

- **Post-implementation** → [Procedures](./09-procedures.md)
- **Security review** → [Security Considerations](./05-security.md)
- **Development workflow** → [Development Workflow](./06-development.md)

---

[← Back to Index](../copilot-instructions.md)
