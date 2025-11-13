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

## Known Limitations (1 CRITICAL - Immediate Action Required!)

### 🚨 CRITICAL: Bcrypt Users Can Login with ANY Password (Nov 9, 2025)

- **Status**: 🔴 **EMERGENCY MIGRATION REQUIRED**
- **Issue**: Bcrypt hashes cannot be verified in Convex runtime (no Node.js)
- **Current Workaround**: `convex/users.ts` line 128 returns `true` for ALL bcrypt password attempts
- **Security Impact**: **ANY password works for bcrypt users** - immediate security vulnerability
- **Affected Users**: All users with bcrypt password hashes (check via `migrateBcryptPasswords:countBcryptUsers`)
- **Timeline**: **MUST run migration IMMEDIATELY after deployment**

**Migration Required**:

1. Run PowerShell script: `.\scripts\migrate-bcrypt-passwords.ps1`
2. OR manually via Convex Dashboard: `migrateBcryptPasswords:resetAllBcryptPasswords`
3. All affected users get password reset to `Teacher{username}` pattern
4. Users forced to change password on first login (`requirePasswordChange: true`)

**Migration Tools**:

- Query: `migrateBcryptPasswords:countBcryptUsers` - Check affected user count
- Mutation: `migrateBcryptPasswords:resetAllBcryptPasswords` - Run migration (supports dry-run)
- Mutation: `migrateBcryptPasswords:resetSingleUserPassword` - Fix individual users
- Script: `scripts/migrate-bcrypt-passwords.ps1` - Guided migration workflow

**Why This Happened**:

- PBKDF2 upgrade (v4.5.18, Nov 2, 2025) eliminated bcrypt dependency
- Bcrypt requires Node.js `crypto` module - unavailable in Convex runtime
- Legacy bcrypt hashes cannot be verified without external library
- Temporary bypass added to allow migration without disrupting all users simultaneously

**Resolution Timeline**:

1. ✅ PBKDF2 implementation deployed (Nov 2, 2025)
2. ✅ Auto-upgrade on login for btoa users (working)
3. 🔴 **Bcrypt verification failure discovered** (Nov 9, 2025)
4. ✅ Emergency migration tool created (Nov 9, 2025)
5. ⏳ **PENDING**: Run migration to reset all bcrypt passwords
6. ⏳ **TODO**: Remove `return true` bypass after migration complete

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

**⚠️ CRITICAL: Run bcrypt migration BEFORE production deployment!**

**Immediate Actions (Before ANY deployment)**:

1. 🔴 **RUN BCRYPT MIGRATION** - `.\scripts\migrate-bcrypt-passwords.ps1`
2. ✅ Verify all users migrated - `migrateBcryptPasswords:countBcryptUsers` should show 0 bcrypt users
3. ✅ Test logins with default passwords - Verify `Teacher{username}` pattern works
4. ✅ Remove temporary bypass - Delete `return true` in `convex/users.ts` line 128 (after migration)

**Before production deployment**:

1. ✅ ~~Migrate password hashing to PBKDF2~~ **DONE (Nov 2, 2025)** - ⚠️ MUST complete bcrypt migration first!
2. Implement HttpOnly cookie sessions
3. Add progressive login rate limiting (consider 1-hour lockout with progressive delays)
4. Add rate limiting for password changes
5. Add CSRF protection
6. Enable HTTPS only
7. Review audit logs
8. Security penetration testing
9. ✅ Remove all emergency migration code (after bcrypt users = 0)

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
