# Security Reviews - Comprehensive Analysis

**Last Updated**: October 24, 2025  
**Status**: Production deployment requires critical fixes

---

## Critical Vulnerabilities (Must Fix Before Production)

### 1. Schools Management - No Permission Checks

**File**: convex/schools.ts  
**Severity**: CRITICAL

**Problem**: ANY authenticated user can create/delete schools and assign moderators

**Attack Scenarios**:

- Teacher creates fake school  assigns self as moderator  gains elevated privileges
- Malicious user deletes all schools  system data loss

**Required Fix**:

```typescript
export const create = mutation({
  args: { 
    name: v.string(), 
    nameTh: v.string(),
    adminId: v.id(\"users\")
  },
  handler: async (ctx, args) => {
    // Verify admin role
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== \"admin\") {
      throw new Error(\"Unauthorized: Admin access required\");
    }
    
    // Rate limiting
    await checkRateLimit(ctx, {
      key: \school-create-\\,
      limit: 10,
      windowMs: 60000
    });
    
    // Audit log
    await logAudit(ctx, {
      userId: args.adminId,
      action: AuditActions.CREATE_SCHOOL,
      targetType: AuditTargetTypes.SCHOOLS,
      targetName: args.name
    });
    
    // Create school logic...
  }
});
```

---

### 2. Students Management - No Permission Checks

**File**: convex/students.ts  
**Severity**: CRITICAL

**Problem**: ANY user can create/modify ANY student

**Attack Scenarios**:

- Teacher from School A modifies students from School B
- Malicious user changes guardian information

**Required Fix**:

```typescript
export const update = mutation({
  args: {
    id: v.id(\"students\"),
    updatedBy: v.id(\"users\"),
    // ... other fields
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.id);
    const user = await ctx.db.get(args.updatedBy);
    
    if (!student || !user) {
      throw new Error(\"Student or user not found\");
    }
    
    // Permission checks
    if (user.role === \"teacher\" || user.role === \"moderator\") {
      if (student.schoolId !== user.schoolId) {
        throw new Error(\"Unauthorized: Cannot modify students from other schools\");
      }
    } else if (user.role === \"guardian\") {
      if (student.guardianId !== user._id) {
        throw new Error(\"Unauthorized: Can only modify your own students\");
      }
    } else if (user.role !== \"admin\") {
      throw new Error(\"Unauthorized\");
    }
    
    // Update logic...
  }
});
```

---

## Implemented Security Features

### 1. Login Rate Limiting (24-Hour Lockout)

**Status**: Implemented October 2025

**Features**:

- Tracks failed login attempts
- **24-hour lockout** after 5 failed attempts
- Auto-unlock after cooldown period
- Admin can reset to Teacher{username} to unlock earlier
- Stores last 10 login sessions with device/browser info

**Schema** (convex/schema.ts):

```typescript
users: defineTable({
  // ... existing fields
  failedLoginAttempts: v.optional(v.number()),
  accountLockedUntil: v.optional(v.number()), // Unlock timestamp
  lastSuccessfulLogin: v.optional(v.number()),
  loginHistory: v.optional(v.array(v.object({
    timestamp: v.number(),
    userAgent: v.string(),
    deviceType: v.string(), // mobile/tablet/desktop
    platform: v.string(), // Windows/macOS/iOS/Android
    browser: v.string(), // Chrome/Safari/Firefox/Edge
  }))),
})
```

**User Experience**:

- Attempt 1-4: \"Invalid username or password. X attempt(s) remaining.\"
- Attempt 5: \"Account locked for 24 hours. Contact admin to reset.\"
- After 24hrs: Auto-unlock on next login

---

### 2. Bulk Deletion Security

**Status**: Implemented October 2025

**Features**:
 **Authorization Checks**:

- Only admins/moderators can bulk delete
- Moderators restricted to deleting teachers only
- Admins cannot delete other admins
- Users cannot delete themselves

 **Rate Limiting**:

- Bulk user deletion: 5 ops per minute
- Single user deletion: 10 ops per minute

 **Validation**:

- User existence check before deletion
- Role-based permission validation
- School moderator cleanup when deleting moderators

 **UI Safeguards**:

- Double confirmation modal
- Selected items highlighted
- Clear count of affected items
- Warning about irreversible action

**Files**: convex/users.ts, components/student-management.tsx

---

### 3. Sangsom Project Import Security

**Status**: Reviewed - No vulnerabilities

**Findings**:
 **Authorization**: Admin-only access via UI
 **Input Validation**: All data hardcoded (no user input)
 **NoSQL Injection**: Type-safe Convex operations
 **Rate Limiting**: Prevents rapid re-seeding (5 ops/min)

**Recommendation**: Add backend role verification for defense-in-depth

---

### 4. Message Attachment Security

**Status**: Implemented October 2025

**Features**:

- File uploads via Convex Storage (CDN-backed)
- Automatic cleanup after 14 days
- MIME type validation
- File size limits (enforced by Convex)
- Soft deletes with isActive flag

**Storage Limits**:

- Free tier: 1GB storage, 5GB bandwidth/month
- Estimated cost: <\.10/month typical usage

**Files**: convex/messages.ts, convex/schema.ts

---

## Known Limitations (Development Only)

### 1. Password Hashing with btoa()

**Status**: **NOT PRODUCTION SECURE**

**Issue**: toa() is Base64 encoding - reversible with tob()

**Impact**: Database compromise = all passwords exposed

**TODO**: Migrate to bcrypt before production

**Location**: convex/users.ts

---

### 2. localStorage for Sessions

**Status**: Vulnerable to XSS

**Issue**: Sessions accessible to any JavaScript, no HttpOnly protection

**Impact**: Session hijacking possible

**TODO**: Add session expiration or migrate to secure cookies

**Location**: lib/language-context.tsx, login components

---

### 3. Missing Rate Limits

**Protected**:

- Class bookings: 30/min
- Messages: 20/min
- Bulk user delete: 5/min

**Unprotected**:

- Login attempts: unlimited (mitigated by 24hr lockout)
- Password changes: unlimited (DoS risk)
- Bulk student delete: unlimited

**TODO**: Add rate limiting to unprotected endpoints

---

## Security Checklist

### Before Production Deployment

- [ ] Implement admin role checks in convex/schools.ts
- [ ] Implement permission checks in convex/students.ts
- [ ] Replace toa() with bcrypt password hashing
- [ ] Add session expiration (e.g., 24 hours)
- [ ] Add rate limiting to password changes
- [ ] Add rate limiting to bulk student deletion
- [ ] Enable CORS restrictions in Convex
- [ ] Set up error monitoring (Sentry)
- [ ] Configure security headers in Vercel
- [ ] Audit all mutations for role checks

### Ongoing Maintenance

- [ ] Weekly dependency vulnerability scans (
pm audit)
- [ ] Monthly security review of new features
- [ ] Monitor Convex access logs for anomalies
- [ ] Review audit logs for suspicious activity
- [ ] Update rate limit thresholds based on usage

---

## Testing & Validation

### Critical Security Tests

1. **Permission Isolation**:
   - Teacher A cannot modify School B resources
   - Moderator cannot delete admins
   - Guardian can only modify own students

2. **Rate Limiting**:
   - Trigger 6 failed logins  account locks for 24 hours
   - Attempt 6 bulk deletions in 1 minute  rate limit error
   - Send 21 messages in 1 minute  rate limit error

3. **Audit Trail**:
   - All admin actions logged with timestamp, user, reason
   - Bulk operations recorded with affected count
   - Logs exportable as CSV for compliance

---

## Related Documentation

- [AUDIT_LOGGING_IMPLEMENTATION.md](AUDIT_LOGGING_IMPLEMENTATION.md) - Audit trail system
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Security best practices
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Security test procedures
- convex/auditHelpers.ts - Audit logging helpers
- convex/rateLimit.ts - Rate limiting implementation

---

**Priority**: CRITICAL issues must be resolved before production use  
**Responsibility**: Development team + security review  
**Review Frequency**: Before each major feature release
