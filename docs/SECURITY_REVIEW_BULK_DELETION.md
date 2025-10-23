# Security Review: Bulk Deletion Features

## Overview
This document reviews the security implications of the bulk deletion features added for users and students.

## Changes Made

### 1. Bulk User Deletion (`convex/users.ts`)
- **Mutation**: `bulkDeleteUsers`
- **Authorization**: Admin OR Moderator roles
- **Rate Limiting**: 5 bulk operations per minute

#### Security Controls

✅ **Authorization Checks**:
- Only admins and moderators can access this mutation
- Moderators restricted to deleting teachers only
- Admins cannot delete other admin accounts
- Users cannot delete themselves

✅ **Rate Limiting**:
- Implemented via `checkRateLimit` with key `bulk-delete-users-${adminOrModeratorId}`
- Limit: 5 bulk operations per minute
- Prevents DoS attacks and accidental mass deletions

✅ **Validation**:
- User existence check before deletion
- Role-based permission validation per user
- School moderator cleanup when deleting moderators

✅ **Audit Trail**:
- Returns detailed results with success/failure counts
- Error messages logged with context
- Failed deletions tracked in errors array

#### Security Concerns & Mitigations

⚠️ **Permanent Data Loss**: Bulk deletion is irreversible
- **Mitigation**: Double confirmation modal in UI (similar to single user deletion)
- **Recommendation**: Consider implementing soft deletes or a grace period for recovery

⚠️ **Cascading Effects**: Deleting users may orphan related data
- **Current**: Moderator-school relationship is cleaned up
- **Gap**: Classes, students created by user, notifications, etc. are not addressed
- **Recommendation**: Document cascade behavior or implement cascade deletion/reassignment

### 2. Bulk Student Deletion (`components/student-management.tsx`)
- **Uses existing mutation**: `api.bulkOperations.bulkDeleteStudents`
- **No authorization changes needed** (existing mutation handles this)

#### Security Controls

✅ **Existing Protection** (from `convex/bulkOperations.ts`):
- Checks for associated classes before deletion
- Students with classes cannot be deleted
- Prevents accidental deletion of active students

✅ **UI Safeguards**:
- Selection checkboxes prevent accidental clicks
- Bulk confirmation modal warns about irreversible action
- Clear messaging about class-association restriction

### 3. Student Creation Fix (`components/weekly-calendar.tsx`)
- **Change**: Added grade and class validation to inline student form
- **Security Impact**: None (data integrity improvement)

#### Data Integrity Improvements

✅ **Required Fields**:
- Grade (K1-P6)
- Class (/1-/10)
- Nickname

✅ **Validation**:
- Client-side validation before submission
- Error messages for missing fields
- Prevents creation of incomplete student records

## Rate Limiting Summary

| Operation | Limit | Window | Key Pattern |
|-----------|-------|--------|-------------|
| Bulk User Delete | 5 ops | 60s | `bulk-delete-users-{userId}` |
| Single User Delete | 10 ops | 60s | `delete-user-{adminId}` |
| Bulk Student Delete | N/A | N/A | No explicit rate limit |

**Recommendation**: Add rate limiting to `bulkDeleteStudents` mutation in `convex/bulkOperations.ts`

```typescript
await checkRateLimit(ctx, {
  key: `bulk-delete-students-${userId}`,
  limit: 10,
  windowMs: 60000, // 10 operations per minute
});
```

## UI Security

### User Management
✅ **Visual Indicators**:
- Selected users highlighted
- Selection count displayed
- Clear action buttons

✅ **Permissions Display**:
- Only shows checkboxes for deletable users
- Hides own account from selection
- Role-appropriate filtering (moderators see only teachers)

### Student Management
✅ **Bulk Selection Controls**:
- Select all / deselect all
- Visual feedback for selections
- Confirmation modal with warning text

## Recommendations

### High Priority
1. ⚠️ **Add rate limiting to `bulkDeleteStudents`** - Currently unprotected against abuse
2. ⚠️ **Document cascade deletion behavior** - Users need to know what happens to related data
3. ⚠️ **Consider soft deletes** - Allow recovery window for accidental deletions

### Medium Priority
4. 📝 **Add audit logging** - Track who deleted what and when for compliance
5. 📝 **Export before delete** - Option to export user/student data before deletion
6. 📝 **Batch size limits** - Prevent deleting more than X items at once

### Low Priority
7. 💡 **Undo functionality** - Time-limited restore capability
8. 💡 **Email notifications** - Alert admins when bulk deletions occur
9. 💡 **Required reason field** - Ask why bulk deletion is being performed

## Testing Checklist

- [x] Build succeeds with no errors
- [x] ESLint passes with no new warnings
- [ ] Manual testing: Admin can bulk delete teachers
- [ ] Manual testing: Admin cannot bulk delete other admins
- [ ] Manual testing: Moderator can bulk delete teachers
- [ ] Manual testing: Moderator cannot bulk delete non-teachers
- [ ] Manual testing: Users cannot select themselves
- [ ] Manual testing: Rate limiting triggers after 5 operations
- [ ] Manual testing: Student deletion fails for students with classes
- [ ] Manual testing: Weekly calendar student creation requires all fields
- [ ] Manual testing: Error messages display correctly
- [ ] Manual testing: Confirmation modals work properly

## Conclusion

The bulk deletion features implement appropriate security controls:
- ✅ Authorization checks
- ✅ Rate limiting (users only)
- ✅ UI safeguards
- ✅ Validation

**Areas requiring attention**:
- ⚠️ Add rate limiting to student bulk deletion
- ⚠️ Consider soft delete implementation
- ⚠️ Document cascade behavior

**Overall Risk Level**: **MEDIUM**
- Low risk of unauthorized access (good auth)
- Medium risk of data loss (permanent deletions)
- Low risk of abuse (rate limiting in place for users)

---
**Reviewed Date**: 2025-10-23  
**Reviewer**: AI Assistant (Copilot)  
**Changes**: Bulk user deletion, bulk student deletion UI, student creation fix
