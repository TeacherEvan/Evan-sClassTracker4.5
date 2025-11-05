# Guardian to Provider Migration Plan

**Date**: November 6, 2025  
**Objective**: Merge guardian functionality into the provider system to reduce complexity and improve maintainability.

## Executive Summary

Guardian and Provider are essentially the same concept - both represent non-school education entities. Having both systems creates unnecessary complexity. This migration consolidates them into a single provider-based system.

## Current State Analysis

### Guardian System

- **User Role**: "guardian" is a separate role in users table
- **Student Linking**: `guardianId` field on students
- **Class Linking**: `isGuardianLinked` flag and `guardianTitle` on classes
- **Auto-Approval**: Guardian-linked classes bypass moderator approval
- **Student ID**: Area-based format `AREA-NAMEHASH-BIRTHDATE-RANDOM`

### Provider System

- **Entity Table**: Separate providers table
- **Categories**: personal, private, language_school, educational_camp
- **Student Linking**: `providerId` field on students
- **Class Linking**: `providerId` field on classes
- **Auto-Approval**: Provider classes bypass moderator approval
- **Access Control**: Teachers can create own providers, admins see all

### Redundancy Issues

1. Two systems doing the same thing
2. Duplicate auto-approval logic
3. Confusing data model (guardian role vs provider entity)
4. Extra fields and indexes
5. Complex conditional logic in UI

## Proposed Solution

### Core Changes

1. **Add "guardian" as a provider category**
2. **Remove "guardian" user role**
3. **Migrate guardian users → provider entities**
4. **Use providerId for all non-school students/classes**
5. **Optional provider**: Auto-generate if not specified

### New Student ID Format

- **With Provider**: `PROV{ID}-{hash}-{timestamp}`
- **Auto-Guardian** (no provider): `GUA-{timestamp}-{hash}`
- **With School**: Existing format `SCHOOL-{hash}-{timestamp}-{random}`

## Implementation Phases

### PHASE 1: Schema Updates (Breaking Changes)

**File**: `convex/schema.ts`

1. Add "guardian" to provider categories:

```typescript
providers: defineTable({
  category: v.union(
    v.literal("personal"),
    v.literal("private"),
    v.literal("language_school"),
    v.literal("educational_camp"),
    v.literal("guardian") // NEW
  ),
  // ... rest
})
```

2. Mark guardian role as deprecated (don't remove yet):

```typescript
users: defineTable({
  role: v.union(
    v.literal("teacher"),
    v.literal("moderator"),
    v.literal("admin"),
    // v.literal("guardian") // DEPRECATED - will be removed after migration
  ),
})
```

3. Mark guardian fields as deprecated in students:

```typescript
students: defineTable({
  providerId: v.optional(v.id("providers")), // Use this instead
  // guardianId: v.optional(v.id("users")), // DEPRECATED
  // Keep contact fields - they're generic:
  guardianTitle: v.optional(v.string()), // Keep as generic contact role
  guardianName: v.optional(v.string()),
  guardianPhone: v.optional(v.string()),
  guardianEmail: v.optional(v.string()),
})
```

4. Mark guardian fields as deprecated in classes:

```typescript
classes: defineTable({
  providerId: v.optional(v.id("providers")), // Use this instead
  // isGuardianLinked: v.optional(v.boolean()), // DEPRECATED - use providerId check
  guardianTitle: v.optional(v.string()), // Keep temporarily for display
})
```

### PHASE 2: Data Migration

**File**: `convex/migrations/guardianToProvider.ts` (NEW)

Create migration mutation:

```typescript
export const migrateGuardiansToProviders = mutation({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    // 1. Verify admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin only");
    }

    // 2. Find all guardian users
    const guardians = await ctx.db
      .query("users")
      .withIndex("by_role", q => q.eq("role", "guardian"))
      .collect();

    const migrationLog = [];

    // 3. For each guardian, create provider
    for (const guardian of guardians) {
      // Create provider entity
      const providerId = await ctx.db.insert("providers", {
        name: `Guardian - ${guardian.username}`,
        nameTh: `ผู้ปกครอง - ${guardian.username}`,
        category: "guardian",
        createdBy: args.adminId,
        isActive: true,
        createdAt: Date.now(),
      });

      // 4. Update students linked to this guardian
      const students = await ctx.db
        .query("students")
        .withIndex("by_guardian_id", q => q.eq("guardianId", guardian._id))
        .collect();

      for (const student of students) {
        await ctx.db.patch(student._id, {
          providerId,
          // Don't remove guardianId yet - keep for rollback
        });
      }

      // 5. Update classes for students
      for (const student of students) {
        const classes = await ctx.db
          .query("classes")
          .withIndex("by_student", q => q.eq("studentId", student._id))
          .filter(q => q.eq(q.field("isGuardianLinked"), true))
          .collect();

        for (const classItem of classes) {
          await ctx.db.patch(classItem._id, {
            providerId,
            // Don't remove isGuardianLinked yet - keep for rollback
          });
        }
      }

      migrationLog.push({
        guardianId: guardian._id,
        guardianUsername: guardian.username,
        providerId,
        studentsUpdated: students.length,
      });
    }

    return {
      success: true,
      guardiansProcessed: guardians.length,
      migrationLog,
    };
  },
});
```

### PHASE 3: Backend Updates

**Files to Update**:

1. **`convex/students.ts`**:
   - Remove `generateGuardianStudentId` function
   - Add `generateProviderStudentId` or `generateAutoGuardianId`
   - Update `create` mutation to use providerId
   - Add auto-provider generation logic

2. **`convex/classes.ts`**:
   - Remove `isGuardianLinked` checks
   - Use `providerId !== undefined` for auto-approval
   - Update approval logic

3. **`convex/providers.ts`**:
   - Add auto-creation for guardian category
   - Allow "guardian" category in create mutation

4. **`convex/bulkOperations.ts`**:
   - Remove guardian role checks
   - Update to use providerId

### PHASE 4: Frontend Updates

**Files to Update**:

1. **`components/class-booking.tsx`**:
   - Remove `isGuardianLocation` state
   - Add provider selector (optional)
   - Add "Auto-Guardian" checkbox (no provider)
   - Update booking mutation calls

2. **`components/student-management.tsx`**:
   - Remove guardian toggle
   - Add provider dropdown (optional)
   - Show auto-generated ID format when no provider

3. **`components/hierarchical-student-selector.tsx`**:
   - Change "Guardian Students" → "Provider Students"
   - Group by provider name
   - Show auto-guardian students separately

4. **`components/guardian-dashboard.tsx`**:
   - DELETE or rename to `components/provider-dashboard.tsx`
   - Update to show provider-linked students

### PHASE 5: E2E Test Updates

**Files to Update**:

1. **`tests/e2e/helpers.ts`**:
   - Remove guardian test user
   - Add provider creation helper
   - Update test data generation

2. **`tests/e2e/notifications.spec.ts`**:
   - Update "guardian" references to "provider"

3. **NEW: `tests/e2e/provider-booking.spec.ts`**:
   - Test provider-linked student creation
   - Test auto-guardian ID generation
   - Test provider class booking

### PHASE 6: Cleanup

1. **Remove deprecated fields from schema**:
   - Remove `guardianId` from students
   - Remove `isGuardianLinked` from classes
   - Remove "guardian" from user roles

2. **Remove old code**:
   - Delete guardian-specific functions
   - Remove guardian role checks

3. **Update documentation**:
   - Update copilot instructions
   - Update architecture docs
   - Add migration notes to CHANGELOG

## Migration Execution Plan

### Pre-Migration Checklist

- [ ] Backup database (`npm run backup`)
- [ ] Create feature branch: `feature/guardian-to-provider-migration`
- [ ] Review all guardian usage (grep search complete ✓)
- [ ] Notify users of upcoming changes

### Execution Steps

**Step 1: Schema Updates (Day 1)**

```powershell
# 1. Update schema.ts
# 2. Deploy schema
npx convex deploy
# 3. Verify deployment
```

**Step 2: Create Migration (Day 1)**

```powershell
# 1. Create migration file
# 2. Test migration on dev data
# 3. Deploy migration mutation
npx convex deploy
```

**Step 3: Run Migration (Day 2)**

```powershell
# 1. Backup production data
npm run backup

# 2. Run migration via Convex dashboard
# Dashboard → Functions → migrateGuardiansToProviders
# Pass adminId

# 3. Verify migration
# Check provider count matches guardian count
# Verify students have providerId
# Verify classes updated
```

**Step 4: Backend Updates (Day 2-3)**

```powershell
# 1. Update all backend files
# 2. Test locally
npm run dev
npx convex dev

# 3. Deploy
npx convex deploy
vercel --prod
```

**Step 5: Frontend Updates (Day 3-4)**

```powershell
# 1. Update UI components
# 2. Test locally
# 3. Deploy
```

**Step 6: E2E Tests (Day 4)**

```powershell
# 1. Update test files
# 2. Run tests
npm run test:e2e

# 3. Fix failures
# 4. Verify all pass
```

**Step 7: Cleanup (Day 5)**

```powershell
# 1. Remove deprecated code
# 2. Remove deprecated schema fields
npx convex deploy

# 3. Final testing
# 4. Merge to main
```

### Rollback Plan

If migration fails:

1. **Restore backup**:

```powershell
npm run backup:restore
# Select pre-migration backup
```

2. **Revert schema changes**:

```powershell
git revert <migration-commit>
npx convex deploy
```

3. **Verify rollback**:

```powershell
# Test login as guardian
# Verify guardian students visible
# Verify guardian classes work
```

## Risk Assessment

### High Risk

- ✅ Data loss during migration (Mitigated: Backup + keep old fields)
- ✅ Breaking user workflows (Mitigated: Gradual rollout + testing)

### Medium Risk

- ⚠️ E2E test failures (Mitigated: Update tests first)
- ⚠️ UI confusion (Mitigated: Clear provider vs school distinction)

### Low Risk

- Performance impact (Provider queries already indexed)
- User adoption (Auto-guardian option maintains existing workflow)

## Success Criteria

- [ ] All guardian users migrated to providers
- [ ] All guardian students have providerId
- [ ] All guardian classes have providerId
- [ ] No guardian role users remain
- [ ] E2E tests pass 100%
- [ ] No breaking changes for end users
- [ ] Documentation updated
- [ ] Performance maintained or improved

## Timeline

**Total Estimated Time**: 5-7 days

- **Day 1**: Schema updates + migration creation (4 hours)
- **Day 2**: Run migration + backend updates (6 hours)
- **Day 3**: Frontend updates (6 hours)
- **Day 4**: E2E test updates (4 hours)
- **Day 5**: Cleanup + documentation (4 hours)
- **Buffer**: 2 days for testing and fixes

## Post-Migration Benefits

1. **Simplified Codebase**: 30% reduction in guardian-specific code
2. **Clearer Data Model**: One system for non-school entities
3. **Easier Maintenance**: Fewer conditional paths
4. **Better UX**: Consistent provider selection
5. **More Flexible**: Easy to add new provider types

## Next Steps

1. Review and approve this plan
2. Create feature branch
3. Start Phase 1 implementation
4. Test each phase thoroughly
5. Deploy incrementally
