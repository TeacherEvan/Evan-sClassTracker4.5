# Quick Reference Guide - Optimizations

**For Developers Working on Evan's Class Tracker 4.5**

---

## 🚀 Using New Features

### Toast Notifications

Replace all `alert()` calls with toast notifications:

```typescript
import { toast } from "@/lib/toast";

// Success message
toast.success("Operation completed!", "ดำเนินการเสร็จสิ้น!");

// Error message
toast.error("Something went wrong", "เกิดข้อผิดพลาด");

// Warning
toast.warning("Please check your input", "กรุณาตรวจสอบข้อมูล");

// Info
toast.info("Processing...", "กำลังดำเนินการ...");
```

**Always provide both English and Thai translations.**

---

### Rate Limiting

When creating new mutations, add rate limiting:

```typescript
import { checkRateLimit, validateLength } from "./rateLimit";

export const myMutation = mutation({
  handler: async (ctx, args) => {
    // Rate limit: X requests per minute
    await checkRateLimit(ctx, {
      key: `action-name:${args.userId}`,
      limit: 20,
      windowMs: 60000, // 1 minute
    });
    
    // Validate inputs
    validateLength(args.text, "Field name", 500, 1);
    
    // ... rest of logic
  }
});
```

**Recommended limits:**

- Messages: 20/minute
- Heavy operations: 10/minute
- Class bookings: 30/minute

---

### Code Splitting

When adding new large components (>200 lines):

```typescript
// app/page.tsx or other route
import { lazy, Suspense } from "react";

const MyHeavyComponent = lazy(() => 
  import("@/components/my-heavy-component").then(m => ({ 
    default: m.MyHeavyComponent 
  }))
);

// Usage with loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <MyHeavyComponent {...props} />
</Suspense>
```

**When to lazy load:**

- ✅ Admin-only features
- ✅ Components not visible on first render
- ✅ Large components (>200 lines)
- ❌ Small utilities (<50 lines)
- ❌ Components always visible

---

### Pagination

Use paginated queries for large lists:

```typescript
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("myTable")
      .withIndex("by_created_at")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

**Frontend usage:**

```typescript
import { usePaginatedQuery } from "convex/react";

const { results, status, loadMore } = usePaginatedQuery(
  api.myTable.listPaginated,
  {},
  { initialNumItems: 50 }
);

// Render with "Load More"
{status === "CanLoadMore" && (
  <button onClick={() => loadMore(50)}>Load More</button>
)}
```

---

## 🔍 Finding Things to Fix

### Find remaining alert() calls

```powershell
# Search all components
Get-ChildItem -Path .\components -Recurse -Filter *.tsx | Select-String -Pattern "alert\("

# Search all Convex functions
Get-ChildItem -Path .\convex -Recurse -Filter *.ts | Select-String -Pattern "alert\("
```

### Check bundle size

```powershell
npm run build
# Check output for chunk sizes
```

### Run type checking

```powershell
npx tsc --noEmit
```

---

## 📋 Before Committing

### Checklist

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console.log statements (unless needed)
- [ ] Toast notifications used (not alert)
- [ ] Rate limiting on mutations (if applicable)
- [ ] Input validation on text fields
- [ ] Lazy loading for large components
- [ ] Bilingual support (English + Thai)
- [ ] Tested locally

---

## 🐛 Common Issues

### "Rate limit exceeded" during development

Restart the Convex dev server to reset in-memory counters:

```powershell
# Stop convex dev (Ctrl+C)
npx convex dev
```

### Component not lazy loading

Check for:

1. Proper `React.lazy()` syntax
2. Suspense boundary present
3. Component exported correctly
4. No circular dependencies

### Toast not appearing

Check:

1. Toast manager subscribed in page.tsx
2. ToastContainer rendered
3. No JavaScript errors in console

---

## 📊 Performance Monitoring

### Check initial bundle size

1. `npm run build`
2. Look for `page.js` size in output
3. Should be ~150KB (was 350KB)

### Check lazy loaded chunks

1. Build the app
2. Look in `.next/static/chunks/`
3. Should see separate files for each component

### Verify rate limiting

1. Open browser console
2. Try rapid-fire actions (20+ times)
3. Should see rate limit error after threshold

---

## 🎯 Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| Initial bundle | <200KB | `npm run build` |
| Time to Interactive | <2s | Lighthouse audit |
| Message loading | <100ms | Network tab |
| Rate limit active | Yes | Try 20+ messages |

---

## 📚 Key Documents

- `PHASE_1_COMPLETE.md` - What was accomplished
- `OPTIMIZATION_IMPLEMENTATION_SUMMARY.md` - Technical details
- `OPTIMIZATION_CHECKLIST.md` - Testing guide
- `PENDING_OPTIMIZATIONS.md` - What's next

---

## 🆘 Getting Help

### TypeScript errors

1. Run `npx tsc --noEmit` to see all errors
2. Fix type issues at source
3. Avoid using `any` type

### Performance issues

1. Check Network tab for large bundles
2. Look for N+1 queries (multiple DB calls)
3. Consider pagination for large lists

### Rate limiting too strict

1. Edit `convex/rateLimit.ts`
2. Adjust `limit` values
3. Redeploy Convex functions

---

**Last Updated:** October 21, 2025  
**Phase:** 1 Complete, Phase 2 In Progress
