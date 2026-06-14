# Guardian Role Removal - Impact Analysis Report

**Date**: November 9, 2025  
**Objective**: Remove `guardian` user role and migrate to provider-based system  
**Approach**: Phased, non-breaking migration with data preservation

---

## Executive Summary

**Total References Found**: 200+ matches across 50+ files  
**Estimated Effort**: 12-16 hours over 4 phases  
**Risk Level**: Medium (requires careful data migration)  
**Breaking Changes**: Yes (after Phase 3)

**Key Insight**: The codebase has extensive guardian-specific logic scattered across:

- Type definitions (1 file)
- UI components (8+ files)
- Backend/Convex (6+ files)
- Tests (4+ files)
- Documentation (15+ files)

---

## Critical Files Requiring Code Changes

### 🔴 HIGH PRIORITY - Core Types & Schema

#### 1. `lib/types.ts` (Line 9)

```typescript
export type UserRole = "teacher" | "moderator" | "admin" | "guardian";
```

**Action**: Mark as DEPRECATED, add TODO comment  
**Phase**: 0 (Non-breaking)  
**Breaking Change**: Phase 3 (remove "guardian")

#### 2. Convex Schema (referenced in migration docs)

- Add `"guardian"` to provider categories
- Mark user role `"guardian"` as deprecated
- Add migration helpers

**Action**: Schema update in `convex/schema.ts`  
**Phase**: 1 (Data migration prep)

---

### 🟡 MEDIUM PRIORITY - UI Components

#### 3. `components/sidebar-nav.tsx` (Lines 40, 47, 54, 61)

```typescript
roles: ["admin", "moderator", "teacher", "guardian"],
```

**Current Status**: ✅ Nav item label already changed to "providers"  
**Remaining Work**: Remove "guardian" from roles arrays (4 locations)  
**Action**: Replace with provider-based access control  
**Phase**: 2 (After data migration)

#### 4. `components/guardian-dashboard.tsx`

**Action**:

- Rename file to `provider-dashboard.tsx`
- Update component logic to use provider queries
- Add "Auto-Guardian" mode support
  **Phase**: 2 (UI migration)  
  **Lines of Code**: ~300-500 (estimated)

#### 5. `lib/help-content.ts` (Lines 16, 580)

```typescript
roles: ("teacher" | "moderator" | "admin" | "guardian")[];
export function getHelpForRole(role: "teacher" | "moderator" | "admin" | "guardian")
```

**Action**: Remove "guardian" from role types, update help content  
**Phase**: 2 (UI migration)

---

### 🟢 LOW PRIORITY - Tests & Documentation

#### 6. `tests/e2e/notifications.spec.ts` (Lines 5, 27)

```typescript
test('post-class notes notification to guardian', async ({ page }) => {
  await notesTextarea.fill('Test post-class notes for guardian notification');
```

**Action**: Update test to use provider-based workflow  
**Phase**: 2 (Test migration)

#### 7. Documentation Files (15+ files)

- `CHANGELOG.md`
- `GUARDIAN_PROVIDER_IMPLEMENTATION_PLAN.md`
- `docs/migrations/*.md`
- `.github/copilot-docs/*.md`

**Action**: Update references, add migration notes  
**Phase**: 0-4 (Throughout migration)

---

## Migration Phases - Detailed Breakdown

### ✅ Phase 0: Non-Breaking Compatibility Layer (NOW)

**Timeline**: 1-2 hours  
**Risk**: None (no breaking changes)

**Tasks**:

1. ✅ Add deprecation comment to `lib/types.ts`:

   ```typescript
   export type UserRole = "teacher" | "moderator" | "admin" | "guardian"; // DEPRECATED - Migrate to provider system. See docs/migrations/GUARDIAN_PROVIDER_IMPLEMENTATION_PLAN.md
   ```

2. ✅ Create migration script scaffold:
   - File: `convex/migrations/migrateGuardianToProvider.ts`
   - Mode: Dry-run by default
   - Logging: Detailed per-entity reporting

3. ✅ Update schema to support both systems:

   ```typescript
   // convex/schema.ts
   providers: defineTable({
     category: v.union(
       v.literal("personal"),
       v.literal("private"),
       v.literal("language_school"),
       v.literal("educational_camp"),
       v.literal("guardian"), // NEW - supports migration
     ),
     // ... other fields
   });
   ```

4. ✅ Document migration in `TAB_CONSOLIDATION_REVIEW_NOV_9_2025.md` (DONE)

**Verification**:

- Build passes: `npm run build`
- TypeScript check passes: `npx tsc --noEmit`
- No runtime errors
- Existing guardian users can still login

---

### 🔄 Phase 1: Data Migration (NEXT - after Convex stable)

**Timeline**: 3-4 hours  
**Risk**: Medium (data modification)  
**Prerequisites**: Backup created, Convex dev running, E2E tests passing

**Tasks**:

1. **Create Convex Migration Script**:

   ```typescript
   // convex/migrations/migrateGuardianToProvider.ts
   export const migrateGuardiansToProviders = mutation({
     args: {
       adminId: v.id("users"),
       dryRun: v.boolean(),
     },
     handler: async (ctx, args) => {
       // 1. Verify admin authorization
       const admin = await ctx.db.get(args.adminId);
       if (!admin || admin.role !== "admin") {
         throw new Error("Admin access required");
       }

       // 2. Find all guardian users
       const guardians = await ctx.db
         .query("users")
         .withIndex("by_role", (q) => q.eq("role", "guardian"))
         .collect();

       const report = {
         guardiansFound: guardians.length,
         providersCreated: 0,
         studentsUpdated: 0,
         classesUpdated: 0,
         errors: [],
       };

       // 3. For each guardian, create provider
       for (const guardian of guardians) {
         try {
           if (!args.dryRun) {
             const providerId = await ctx.db.insert("providers", {
               name: `Guardian - ${guardian.username}`,
               nameTh: `ผู้ปกครอง - ${guardian.username}`,
               category: "guardian",
               createdBy: args.adminId,
               isActive: true,
               createdAt: Date.now(),
             });

             // 4. Update students
             const students = await ctx.db
               .query("students")
               .withIndex("by_guardian_id", (q) => q.eq("guardianId", guardian._id))
               .collect();

             for (const student of students) {
               await ctx.db.patch(student._id, {
                 providerId,
                 // Keep guardianId for rollback capability
               });
               report.studentsUpdated++;
             }

             // 5. Update classes
             const classes = await ctx.db
               .query("classes")
               .filter((q) => q.eq(q.field("isGuardianLinked"), true))
               .collect();

             for (const classItem of classes) {
               if (classItem.studentId) {
                 const student = await ctx.db.get(classItem.studentId);
                 if (student?.guardianId === guardian._id) {
                   await ctx.db.patch(classItem._id, {
                     providerId,
                   });
                   report.classesUpdated++;
                 }
               }
             }

             report.providersCreated++;
           }
         } catch (error) {
           report.errors.push({
             guardianId: guardian._id,
             username: guardian.username,
             error: error.message,
           });
         }
       }

       return report;
     },
   });
   ```

2. **Run Migration (Dry-Run First)**:

   ```powershell
   # In Convex Dashboard → Functions
   # Call: migrations.migrateGuardiansToProviders
   # Args: { adminId: "<admin_id>", dryRun: true }

   # Review report
   # If looks good, run with dryRun: false
   ```

3. **Verification Queries**:

   ```typescript
   // Count providers created
   const providers = await ctx.db
     .query("providers")
     .filter((q) => q.eq(q.field("category"), "guardian"))
     .collect();
   console.log(`Created ${providers.length} guardian providers`);

   // Verify student migration
   const studentsWithProvider = await ctx.db
     .query("students")
     .filter((q) => q.neq(q.field("providerId"), undefined))
     .collect();
   console.log(`${studentsWithProvider.length} students have providerId`);
   ```

**Rollback Plan**:

- Keep `guardianId` fields during migration
- Create rollback mutation to restore from backup
- Test rollback in dev environment first

---

### 🎨 Phase 2: UI & Component Migration

**Timeline**: 4-6 hours  
**Risk**: Low (non-data changes)

**Tasks**:

1. **Update `components/sidebar-nav.tsx`**:

   ```typescript
   // Remove "guardian" from all roles arrays
   {
     id: "classes",
     label: t("Classes", "คลาส"),
     icon: BookOpen,
     tab: "classes",
     roles: ["admin", "moderator", "teacher"], // REMOVED "guardian"
   },
   ```

2. **Rename `components/guardian-dashboard.tsx` → `provider-dashboard.tsx`**:
   - Update all imports
   - Change component logic to query by `providerId`
   - Add "Auto-Guardian" support
   - Update help text and UI strings

3. **Update `lib/help-content.ts`**:

   ```typescript
   export type UserRole = "teacher" | "moderator" | "admin"; // Removed "guardian"

   export function getHelpForRole(role: "teacher" | "moderator" | "admin"): HelpCategory[] {
     // Remove guardian-specific help
   }
   ```

4. **Update `components/class-booking.tsx`** (if contains guardian logic):
   - Replace `isGuardianLinked` checks with `providerId` checks
   - Update auto-approval logic to use provider category
   - Add "Auto-Guardian" checkbox

5. **Update `components/student-management.tsx`**:
   - Replace guardian section with provider section
   - Add auto-guardian student display
   - Update filtering logic

**Verification**:

- All pages render without errors
- Provider tab shows guardian providers
- No guardian-specific UI elements visible
- Auto-guardian mode works

---

### 🧪 Phase 3: Test Migration & Role Removal (BREAKING)

**Timeline**: 2-3 hours  
**Risk**: High (breaking changes)

**Tasks**:

1. **Update Test Fixtures**:

   ```typescript
   // tests/e2e/helpers.ts
   export const TEST_USERS = {
     admin: { username: "admin", password: "TeacherAdmin" },
     moderator: { username: "moderator1", password: "TeacherModerator1" },
     teacher: { username: "Evan", password: "TeacherEvan" },
     // REMOVED: guardian: { username: "guardian1", password: "TeacherGuardian1" }
   };
   ```

2. **Update E2E Tests**:
   - `tests/e2e/auth.spec.ts` - Remove guardian login test
   - `tests/e2e/notifications.spec.ts` - Change to provider workflow
   - Add new provider-specific tests
   - Add auto-guardian ID generation test

3. **Remove Guardian Role from Types**:

   ```typescript
   // lib/types.ts
   export type UserRole = "teacher" | "moderator" | "admin";
   // REMOVED: | "guardian"
   ```

4. **Clean Up Convex Queries**:
   - Remove `by_role` queries for "guardian"
   - Remove `isGuardianLinked` checks
   - Update all role filters

**Verification**:

- All E2E tests pass
- TypeScript compilation succeeds
- No guardian references in active code

---

### 🧹 Phase 4: Cleanup & Documentation

**Timeline**: 1-2 hours  
**Risk**: None

**Tasks**:

1. **Update Documentation**:
   - Update CHANGELOG.md with breaking change notice
   - Update copilot-instructions.md pattern docs
   - Archive migration plans
   - Update README.md role descriptions

2. **Remove Deprecated Code**:
   - Delete `components/guardian-dashboard.tsx` (if fully replaced)
   - Remove guardian-specific helper functions
   - Clean up commented-out code

3. **Final Verification**:
   - Full E2E test suite passes
   - Manual smoke test all user roles
   - Performance check (should be faster)
   - Code complexity metrics (should decrease)

---

## Risk Mitigation Strategies

### 1. Data Safety

- ✅ Create full backup before Phase 1: `npm run backup`
- ✅ Run migration in dry-run mode first
- ✅ Keep `guardianId` fields for rollback capability
- ✅ Test rollback procedure in dev environment

### 2. User Impact

- ✅ Maintain backward compatibility in Phase 0
- ✅ No user-visible changes until Phase 2
- ✅ Preserve all user data and relationships
- ✅ Create admin notification about migration

### 3. Code Stability

- ✅ Run tests after each phase
- ✅ TypeScript strict mode catches type errors
- ✅ Incremental changes (not big bang)
- ✅ Feature branch for migration

---

## Success Criteria

**Phase 0 Complete**:

- [x] Documentation updated
- [ ] Deprecation comments added
- [ ] Migration script scaffold created
- [ ] Schema supports both systems
- [ ] Build passes without errors

**Phase 1 Complete**:

- [ ] All guardian users have corresponding providers
- [ ] All guardian students have `providerId`
- [ ] All guardian classes have `providerId`
- [ ] Migration report shows 0 errors
- [ ] Rollback tested successfully

**Phase 2 Complete**:

- [ ] No guardian-specific UI components
- [ ] Provider dashboard fully functional
- [ ] Auto-guardian mode works
- [ ] Help content updated
- [ ] Manual testing passes

**Phase 3 Complete**:

- [ ] All E2E tests pass
- [ ] No guardian role references in code
- [ ] TypeScript compilation succeeds
- [ ] No runtime errors in production

**Phase 4 Complete**:

- [ ] Documentation complete and accurate
- [ ] Changelog updated
- [ ] No deprecated code remains
- [ ] Performance metrics improved

---

## Files Requiring Changes - Complete List

### Core Files (Must Change)

1. `lib/types.ts` - UserRole type definition
2. `convex/schema.ts` - Add guardian category to providers
3. `components/sidebar-nav.tsx` - Remove guardian from roles
4. `components/guardian-dashboard.tsx` - Rename/refactor to provider
5. `lib/help-content.ts` - Remove guardian role helpers

### Component Files (Should Change)

1. `components/class-booking.tsx` - Replace guardian logic
2. `components/student-management.tsx` - Update guardian section
3. `app/page.tsx` - Remove guardian routing
4. Various admin components - Update role filters

### Backend Files (Should Change)

1. `convex/users.ts` - Update role validation
2. `convex/students.ts` - Add auto-guardian ID logic
3. `convex/classes.ts` - Replace isGuardianLinked
4. `convex/providers.ts` - Add guardian category support

### Test Files (Should Change)

1. `tests/e2e/auth.spec.ts` - Remove guardian tests
2. `tests/e2e/student-management.spec.ts` - Update tests
3. `tests/e2e/notifications.spec.ts` - Update tests
4. `tests/e2e/helpers.ts` - Remove guardian user

### Documentation Files (Should Update)

1. `CHANGELOG.md` - Add breaking change entry
2. `.github/copilot-instructions.md` - Update patterns
3. `.github/copilot-docs/*.md` - Update role references
4. `docs/guides/testing/*.md` - Update test guides
5. `README.md` - Update role descriptions

---

## Estimated Effort Summary

| Phase     | Hours     | Risk       | Dependencies                  |
| --------- | --------- | ---------- | ----------------------------- |
| Phase 0   | 1-2       | None       | None                          |
| Phase 1   | 3-4       | Medium     | Backup, Convex stable         |
| Phase 2   | 4-6       | Low        | Phase 1 complete              |
| Phase 3   | 2-3       | High       | Phase 2 complete, E2E passing |
| Phase 4   | 1-2       | None       | Phase 3 complete              |
| **Total** | **12-16** | **Medium** | Sequential execution          |

---

## Next Actions (Immediate)

1. ✅ **Review this report** - Confirm approach with team
2. **Create feature branch**: `git checkout -b feature/remove-guardian-role`
3. **Execute Phase 0**: Add deprecation comments and scaffold
4. **Create backup**: `npm run backup`
5. **Stabilize E2E**: Ensure tests pass before data migration
6. **Schedule Phase 1**: Block 4 hours for data migration when ready

---

## Questions for Consideration

1. **Timing**: Should we wait until E2E tests are fully stable before starting?
2. **User Communication**: Do we need to notify existing guardian users?
3. **Rollback Window**: How long should we keep rollback capability?
4. **Provider Category**: Is "guardian" the right name or should it be "private_tutoring"?
5. **Auto-Guardian**: Should auto-guardian be opt-in or default behavior?

---

**Report Generated**: November 9, 2025  
**Next Review**: After Phase 0 completion
