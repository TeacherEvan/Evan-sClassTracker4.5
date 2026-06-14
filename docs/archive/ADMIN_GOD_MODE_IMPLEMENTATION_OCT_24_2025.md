# Admin "God Mode" Implementation - October 24, 2025

## Overview

Implemented unrestricted admin deletion powers to enable cleanup of test data and legacy accounts. Admins now have "God mode" capabilities that bypass all safety restrictions when performing bulk operations.

## Problem Statement

**User Report**: "When I attempt to delete things like bulk accounts and redundant test classes, it's giving me an error! I need to do spring cleaning. Admin has God mode powers and nothing can say no to him."

### Issues Identified

1. ❌ **Past Class Deletion Blocked** - Line 909 in `classes.ts` prevented deletion of classes with past dates
2. ❌ **No Bulk Class Deletion** - No `bulkDeleteClass` mutation existed
3. ❌ **Admin-to-Admin Deletion Blocked** - Line 545 in `users.ts` prevented admins from deleting other admin accounts
4. ❌ **Student Deletion with Classes** - `bulkDeleteStudents` blocked deletion of students with class history

## Implementation Changes

### 1. Single Class Deletion - Admin Override (convex/classes.ts)

**Before** (Line 909):

```typescript
// Check if class date has not passed yet
const currentTime = Date.now();
if (classData.scheduledDate < currentTime) {
  throw new Error("Cannot delete classes whose dates have already passed");
}
```

**After**:

```typescript
// Get user once for all checks (admins have God mode)
const user = await ctx.db.get(args.userId);

// Check if class date has not passed yet (EXCEPT for admins - they have God mode)
if (user?.role !== "admin") {
  const currentTime = Date.now();
  if (classData.scheduledDate < currentTime) {
    throw new Error("Cannot delete classes whose dates have already passed");
  }
}
```

**Impact**: Admins can now delete past classes to clean up old test data. Moderators still restricted to future classes only.

---

### 2. NEW: Bulk Class Deletion (convex/classes.ts)

**Location**: End of file (after `mergeClasses` mutation)

**Function**: `bulkDeleteClasses`

**Features**:

- ✅ **Admin-only** - Requires `role: "admin"`
- ✅ **God Mode** - No date restrictions, no approval checks
- ✅ **Rate Limited** - 5 deletions per minute per admin
- ✅ **Batch Size** - Maximum 100 classes per operation
- ✅ **Audit Logging** - All deletions logged via `logAudit()`
- ✅ **Error Handling** - Returns success/failed arrays with details

**Example Usage** (from frontend):

```typescript
const result = await bulkDeleteClasses({
  classIds: [id1, id2, id3, ...],
  userId: adminId,
  reason: "Cleaning up test classes from October 2024"
});

// Result: { successful: string[], failed: { classId: string, error: string }[] }
```

**Implementation**:

```typescript
export const bulkDeleteClasses = mutation({
  args: {
    classIds: v.array(v.id("classes")),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, {
      key: `bulkDeleteClasses-${args.userId}`,
      limit: 5,
      windowMs: 60000,
    });

    // Admin verification
    const admin = await ctx.db.get(args.userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Batch size validation
    if (args.classIds.length > 100) {
      throw new Error("Maximum 100 classes per deletion");
    }

    // Delete loop with audit logging
    // ...
  },
});
```

---

### 3. Admin-to-Admin Deletion Enabled (convex/users.ts)

**Before** (Line 545):

```typescript
// Admin-specific validation: cannot delete other admins
if (admin.role === "admin" && userToDelete.role === "admin" && args.adminOrModeratorId !== userIdToDelete) {
  throw new Error("Admins cannot delete other admin accounts");
}
```

**After**:

```typescript
// Admin has God mode - no restrictions on deleting other admins
// (Removed admin-to-admin deletion restriction)
```

**Impact**: Admins can now delete test admin accounts created during development. Security note: This assumes production environments properly secure admin account creation.

---

### 4. Student Force Deletion (convex/bulkOperations.ts)

**Added Parameter**: `force: v.optional(v.boolean())`

**Before**:

```typescript
// Check if student has associated classes
const classCount = await ctx.db
  .query("classes")
  .withIndex("by_student", (q) => q.eq("studentId", studentId))
  .collect()
  .then((classes) => classes.length);

if (classCount > 0) {
  errors.push({
    error: `Cannot delete student with ${classCount} associated classes`,
  });
  continue;
}
```

**After**:

```typescript
// Check if student has associated classes (unless force=true for admin God mode)
if (!operationArgs.force) {
  const classCount = await ctx.db
    .query("classes")
    .withIndex("by_student", (q) => q.eq("studentId", studentId))
    .collect()
    .then((classes) => classes.length);

  if (classCount > 0) {
    errors.push({
      error: `Cannot delete student with ${classCount} associated classes (use force option to override)`,
    });
    continue;
  }
}
```

**Impact**: Admins can use `force: true` to delete students even if they have class history, enabling cleanup of test students.

---

## Security Considerations

### ⚠️ God Mode Powers - Use Responsibly

These changes give admins **UNRESTRICTED** deletion capabilities:

1. **Past Class Deletion**: Can delete historical class data
2. **Bulk Operations**: Can delete up to 100 items per minute
3. **Admin Account Deletion**: Can delete other admin accounts
4. **Force Student Deletion**: Can delete students with class associations

### Safeguards Still in Place

✅ **Rate Limiting**: 5 bulk operations per minute
✅ **Audit Logging**: All deletions logged with timestamp, admin ID, reason
✅ **Batch Size Limits**: Maximum 100 items per operation
✅ **Role Verification**: All mutations verify admin role
✅ **Error Handling**: Failed deletions reported separately

### Production Deployment Checklist

Before deploying to production:

- [ ] Review audit log retention policy (see `convex/auditLogs.ts`)
- [ ] Verify admin account creation process is secure
- [ ] Test rate limiting thresholds under load
- [ ] Document admin deletion procedures for compliance
- [ ] Train admins on proper use of God mode powers
- [ ] Set up monitoring alerts for bulk deletion operations

---

## Testing Procedure

### Test 1: Delete Past Class

1. Login as admin
2. Find a class with `scheduledDate < Date.now()`
3. Call `deleteClass` mutation
4. **Expected**: Class deleted successfully (no date error)

### Test 2: Bulk Delete Classes

1. Login as admin
2. Create 5-10 test classes (mix of past/future dates)
3. Call `bulkDeleteClasses` with all class IDs
4. **Expected**: All classes deleted, audit logs created

### Test 3: Delete Admin Account

1. Login as admin (Admin A)
2. Create test admin account (Admin B)
3. Call `bulkDeleteUsers` with Admin B's ID
4. **Expected**: Admin B deleted successfully (no admin-to-admin error)

### Test 4: Force Delete Student with Classes

1. Login as admin
2. Find student with associated classes
3. Call `bulkDeleteStudents` with `force: true`
4. **Expected**: Student deleted despite class associations

### Test 5: Rate Limiting

1. Login as admin
2. Attempt 6 bulk deletions within 60 seconds
3. **Expected**: 6th operation blocked with rate limit error

---

## Files Modified

### convex/classes.ts

- **Line 4**: Added `import { logAudit } from "./auditHelpers";`
- **Line 909**: Added admin role check before past-date restriction
- **Line 1780+**: Added `bulkDeleteClasses` mutation (72 lines)

### convex/users.ts

- **Line 541**: Removed admin-to-admin deletion restriction

### convex/bulkOperations.ts

- **Line 211**: Added `force: v.optional(v.boolean())` parameter
- **Line 271**: Wrapped class check in `if (!operationArgs.force)` condition
- **Line 283**: Updated error message to mention force override

---

## API Reference

### New Mutation: `bulkDeleteClasses`

```typescript
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

const bulkDelete = useMutation(api.classes.bulkDeleteClasses);

// Usage
const result = await bulkDelete({
  classIds: [id1, id2, id3],
  userId: currentUser._id,
  reason: "Spring cleaning - removing October 2024 test data"
});

// Result shape
{
  successful: ["classId1", "classId2"],
  failed: [
    { classId: "classId3", error: "Class not found" }
  ]
}
```

### Updated Mutation: `bulkDeleteStudents`

```typescript
const result = await bulkDeleteStudents({
  studentIds: [id1, id2],
  userId: adminId,
  reason: "Removing test students",
  force: true, // NEW: Bypass class association check
});
```

---

## Rollback Procedure

If these changes cause issues:

1. **Revert class deletion changes**:

   ```typescript
   // Restore line 909 original logic:
   const currentTime = Date.now();
   if (classData.scheduledDate < currentTime) {
     throw new Error("Cannot delete classes whose dates have already passed");
   }
   ```

2. **Remove bulkDeleteClasses**:
   - Delete lines 1780-1852 in `convex/classes.ts`
   - Remove `import { logAudit }` if unused elsewhere

3. **Restore admin-to-admin protection**:

   ```typescript
   // Restore line 541 in users.ts:
   if (admin.role === "admin" && userToDelete.role === "admin" && args.adminOrModeratorId !== userIdToDelete) {
     throw new Error("Admins cannot delete other admin accounts");
   }
   ```

4. **Remove force parameter**:
   - Revert `bulkOperations.ts` to always check class associations

---

## Related Documentation

- `SECURITY_REVIEWS.md` - Security audit findings
- `docs/AUDIT_LOGGING_IMPLEMENTATION.md` - Audit log system
- `.github/copilot-instructions.md` - "Bulk Deletion Pattern" section
- `convex/auditHelpers.ts` - Audit logging utilities

---

## Success Metrics

After deployment:

- ✅ Admins can delete past classes without errors
- ✅ Bulk class deletion available in admin UI
- ✅ Test admin accounts can be cleaned up
- ✅ Students with class history can be force-deleted
- ✅ All deletions appear in audit logs
- ✅ Rate limiting prevents abuse

---

## Notes

**Why "God Mode"?**
User explicitly stated: "admin has God mode powers and nothing can say no to him." These changes implement that requirement while maintaining audit trails and rate limiting for accountability.

**Production Readiness**
These features are intended for development/testing cleanup. Production deployments should:

1. Document admin responsibilities
2. Implement backup/recovery procedures
3. Monitor audit logs for anomalous deletion patterns
4. Consider adding confirmation dialogs in UI for bulk operations

---

**Implementation Date**: October 24, 2025  
**Implemented By**: AI Agent (GitHub Copilot)  
**User Request**: "Spring cleaning - need to delete test accounts and old classes"
