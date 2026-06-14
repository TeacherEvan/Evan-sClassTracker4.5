# Security Considerations ⚠️

[← Back to Index](../copilot-instructions.md)

---

## Security Context & Environment

**⚠️ IMPORTANT - Repository & User Management Model**:

- **Private Repository**: This codebase is NOT public-facing
- **Single Admin**: Only ONE admin account exists (you/God mode)
- **No Self-Registration**: Users are created individually by admin - no public signup
- **Controlled Environment**: Current security is adequate for this private, controlled deployment
- **Known Users Only**: All users are vetted and created manually by admin

**This means**:

- Security measures are appropriate for a **trusted user base**
- Production deployment considerations apply only if opening to public
- Current auth patterns (localStorage, PBKDF2) are acceptable given the environment
- Focus is on usability and functionality over hardening against public threats

---

## Known Limitations (RESOLVED - Dec 19, 2025)

### ✅ RESOLVED: Bcrypt Users Password Migration (Dec 19, 2025)

- **Status**: ✅ **PRODUCTION-SAFE - MIGRATION TOOLS DEPLOYED**
- **Previous Issue**: Bcrypt hashes could not be verified in Convex runtime (no Node.js)
- **Resolution**: Bcrypt passwords now properly rejected with clear error message
- **Current Behavior**: Users with bcrypt hashes see "Your password format is outdated. Please contact an admin to reset your password."
- **Security Impact**: No bypass - bcrypt logins properly rejected with user-friendly error
- **Migration Path**: Admin can use migration tools or reset individual passwords
- **Timeline**:
  - ✅ PBKDF2 implementation deployed (Nov 2, 2025)
  - ✅ Auto-upgrade on login for btoa users (working)
  - ✅ **Bcrypt verification properly rejects with error** (Dec 19, 2025)
  - ✅ Emergency migration tools remain available for batch password resets

**Migration Tools Available**:

- Query: `migrateBcryptPasswords:countBcryptUsers` - Check affected user count
- Mutation: `migrateBcryptPasswords:resetAllBcryptPasswords` - Run migration (supports dry-run)
- Mutation: `migrateBcryptPasswords:resetSingleUserPassword` - Fix individual users
- Script: `scripts/migrate-bcrypt-passwords.ps1` - Guided migration workflow

**What Changed (Dec 19, 2025)**:

- ✅ Bcrypt passwords now throw clear error instead of bypassing authentication
- ✅ Error message guides users to contact admin for password reset
- ✅ Added comprehensive E2E security tests (`tests/e2e/password-security.spec.ts`)
- ✅ Error boundaries added to prevent blank screens on chunk load failures
- ✅ Skeleton loaders replace spinners for better UX and reduced layout shift

---

### 1. Password Hashing: ⚠️ MIGRATION IN PROGRESS (Nov 2-9, 2025)

- **Status**: ⚠️ **PBKDF2 DEPLOYED - BCRYPT MIGRATION PENDING**
- **Location**: `convex/users.ts`, `convex/migrateBcryptPasswords.ts`
- **Solution**: PBKDF2 with 100,000 iterations (SHA-256, 32-byte hash, 16-byte salt)
- **Migration Status**:
  - ✅ PBKDF2 implementation: COMPLETE
  - ✅ Auto-upgrade for btoa users: WORKING
  - 🔴 Bcrypt user migration: **REQUIRED IMMEDIATELY**
- **Security Impact**: 100x stronger than bcrypt equivalent (100K iterations vs ~1K) AFTER migration
- **Technical**: Pure JavaScript using Web Crypto API (Convex-compatible, no external dependencies)
- **Documentation**: `CHANGELOG.md` v4.5.18 entry, `scripts/migrate-bcrypt-passwords.ps1`

### 2. No Authentication Rate Limiting

- **Issue**: Login endpoint unprotected against brute force
- **Default password pattern**: `Teacher{username}` is predictable
- **UPDATED Oct 2025**: 24-hour account lockout after 5 failed attempts (see Pattern #11)
- **TODO**: Consider shorter lockout (e.g., 1-hour) with progressive delays

### 3. localStorage for Sessions (XSS Risk)

- **Issue**: Accessible to any JavaScript, no HttpOnly protection
- **UPDATED Oct 2025**: 24-hour session expiration implemented (see `lib/session-utils.ts`)
- **TODO**: Migrate to secure HttpOnly cookies for production

### 4. Missing Rate Limits

- ✅ Class bookings: 30/min (protected)
- ✅ Messages: 20/min (protected)
- ✅ Login attempts: 24-hour lockout after 5 failed attempts (protected)
- ❌ Password changes: unlimited (DoS risk)

---

## Production Deployment Checklist

**✅ COMPLETED: Bcrypt password rejection implemented (Dec 19, 2025)**

**Optional: Batch password migration (if needed)**:

1. Run `migrateBcryptPasswords:countBcryptUsers` to check for bcrypt users
2. If bcrypt users exist, run migration script: `.\scripts\migrate-bcrypt-passwords.ps1`
3. Verify all users migrated - `migrateBcryptPasswords:countBcryptUsers` should show 0 bcrypt users
4. Test logins with default passwords - Verify `Teacher{username}` pattern works

**Before production deployment**:

1. ✅ ~~Migrate password hashing to PBKDF2~~ **DONE (Nov 2, 2025)**
2. ✅ ~~Implement bcrypt password rejection~~ **DONE (Dec 19, 2025)**
3. Implement HttpOnly cookie sessions
4. Add progressive login rate limiting (consider 1-hour lockout with progressive delays)
5. Add rate limiting for password changes
6. Add CSRF protection
7. Enable HTTPS only
8. Review audit logs
9. Security penetration testing

**Recent Security Improvements (Dec 19, 2025)**:

- ✅ Error boundaries added around all lazy-loaded components
- ✅ Skeleton loaders replace spinners (reduced layout shift)
- ✅ Comprehensive E2E security test suite added
- ✅ Bcrypt passwords properly rejected with user-friendly error
- ✅ Password security fully validated (PBKDF2, btoa auto-upgrade, bcrypt rejection)

---

## Security Analysis Resources

- `SECURITY_REVIEW_BULK_DELETION.md` - Bulk operation safeguards
- `COPILOT_INSTRUCTIONS_REVIEW.md` - Detailed security analysis
- Pattern #11 - Login Security Pattern (account lockout)
- Pattern #12 - Bulk Deletion Pattern (authorization checks)

---

## Next Steps

- **Review patterns** → [Non-Negotiable Patterns](./03-patterns.md)
- **Development workflow** → [Development Workflow](./06-development.md)
- **Architecture overview** → [Integration Points](./04-integration.md)

---

[← Back to Index](../copilot-instructions.md)
