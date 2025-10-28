# Development Workflow

[← Back to Index](../copilot-instructions.md)

---

## Local Development (PowerShell)

```powershell
npm install          # Install dependencies
npx convex dev       # Start Convex FIRST (required!)
npm run dev          # Start Next.js with Turbopack (after Convex is running)
```

**CRITICAL**: Convex must be running before Next.js starts (Next.js needs `NEXT_PUBLIC_CONVEX_URL`).

---

## Convex Schema Changes & Migrations

**When modifying `convex/schema.ts`**:

1. **Add new fields as optional first** - prevents breaking existing data
2. **Convex auto-regenerates** `convex/_generated/` on schema save - never edit these files
3. **Create migration mutations** for data transformations (see `convex/migrateSangsomStudentsToEvents.ts`)
4. **Run migrations via Convex dashboard** - never run in production code automatically
5. **Add indexes BEFORE querying** - Convex errors if you query without index

**Migration Pattern**:

```typescript
export const migrateFieldName = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Verify admin authorization
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can run migrations");
    }
    
    // 2. Fetch records using indexed query
    const records = await ctx.db.query("table")
      .withIndex("by_field", q => q.eq("field", value))
      .collect();
    
    // 3. Transform and update
    for (const record of records) {
      await ctx.db.patch(record._id, {
        newField: transformOldData(record.oldField)
      });
    }
    
    return { migrated: records.length };
  }
});
```

---

## Debugging Real-Time Updates

**Convex uses reactive queries** - components auto-update when data changes.

**5-Point Checklist**:

1. **Check Convex Dev Dashboard** (`https://dashboard.convex.dev`)
   - View live query subscriptions
   - Monitor mutation calls
   - Check function logs

2. **Verify query arguments** - queries re-run when args change
   - ✅ Stable: `useQuery(api.classes.list, { schoolId })`
   - ❌ Unstable: `useQuery(api.classes.list, { filter: { schoolId } })` (new object each render)

3. **Use "skip" for conditional queries**

   ```tsx
   const user = useQuery(
     api.users.getById,
     userId ? { id: userId } : "skip"
   );
   ```

4. **Check for infinite loops** - mutation → query update → useEffect → mutation
   - ✅ Correct: Empty deps `useEffect(() => { ... }, [])`
   - ❌ Wrong: Depends on query result `useEffect(() => { ... }, [data])`

5. **Real-time not working?**
   - Convex dev server running?
   - Browser WebSocket errors?
   - `NEXT_PUBLIC_CONVEX_URL` in `.env.local`?
   - Component has `"use client"` directive?

---

## Debugging Toast Notifications

**Toast system** (`lib/toast.ts`) uses event subscription pattern.

**4-Point Checklist**:

1. **Toast not appearing?**
   - `<DesktopNotificationToast />` mounted in `app/layout.tsx`?
   - Toast called with bilingual messages?
   - Browser console errors?
   - Z-index conflicts? (toast uses `z-50`)

2. **Test toast manually** in browser console:

   ```javascript
   const { toast } = await import('/lib/toast.ts');
   toast.success("Test message", "ข้อความทดสอบ");
   ```

3. **Error context for debugging**:

   ```typescript
   toast.error("Save failed", "บันทึกล้มเหลว", "Error", "ข้อผิดพลาด", {
     errorOrigin: "class-booking.tsx",
     errorFunction: "handleSubmit",
     userAction: "Attempted to book class",
     stackTrace: error.stack,
   });
   // Shows "Send to Admin" button if errorContext provided
   ```

4. **Toast duration**:
   - Success/Info/Warning: 5 seconds (default)
   - Error: 8 seconds (longer for reading)
   - Override: `toast.show({ duration: 10000, ... })`

---

## Build & Deploy

```powershell
npm run build        # Next.js build with --turbopack flag
npx convex deploy    # Deploy Convex functions to production
npx tsc --noEmit     # Typecheck without emitting files
```

**Turbopack is required** - do not remove `--turbopack` flags from `package.json` scripts.

---

## CI/CD Pipeline (Automated)

**GitHub Actions workflows**:

```yaml
.github/workflows/
├── ci.yml                    # TypeScript + ESLint checks on PRs
├── e2e-tests.yml             # Playwright E2E tests on staging
├── deploy-staging.yml        # Auto-deploy develop branch
└── deploy-production.yml     # Auto-deploy main branch
```

**Workflow triggers**:

- CI checks run on all PRs and pushes
- E2E tests run after staging deployment
- Staging deploys automatically on push to `develop`
- Production deploys automatically on push to `main`

**Environment variables** (critical for CI):

- `NEXT_PUBLIC_CONVEX_URL` - Convex backend URL (required)
- `NEXT_TELEMETRY_DISABLED=1` - Prevents telemetry.nextjs.org firewall blocks

**Setup**: See `docs/CI_CD_SETUP_GUIDE.md`

---

## Environment Setup

- `.env.local` contains `NEXT_PUBLIC_CONVEX_URL` (auto-created by `npx convex dev`)
- Already in `.gitignore` - never commit
- Production: Set `NEXT_PUBLIC_CONVEX_URL` in Vercel dashboard

---

## Testing New Features

**Quick test workflow**:

1. **Start services**: `npx convex dev` + `npm run dev`
2. **Login with test users**:
   - Admin: `admin` / `TeacherAdmin`
   - Moderator: `moderator1` / `TeacherModerator1`
   - Teacher: `Evan` / `TeacherEvan`
3. **Test bilingual behavior**: Use language switcher (🇬🇧/🇹🇭 icon)
4. **Verify toast notifications**: Check bottom-right corner
5. **Check role-based access**: Features should appear/hide based on role
6. **Test real-time updates**: Open two browser windows with different users

**Common test scenarios**:

- Class booking → moderator notification → approval/rejection
- Message sending → unread badge → read status update
- Student creation → auto-generated ID → appears in dropdown

---

## Next Steps

- **Write E2E tests** → [E2E Testing Guide](./07-testing.md)
- **Avoid pitfalls** → [Common Pitfalls](./08-pitfalls.md)
- **Post-implementation** → [Procedures](./09-procedures.md)

---

[← Back to Index](../copilot-instructions.md)
