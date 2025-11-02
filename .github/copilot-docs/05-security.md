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
- Current auth patterns (localStorage, bcrypt) are acceptable given the environment
- Focus is on usability and functionality over hardening against public threats

---

## Known Limitations (1 Resolved, 3 Remaining)

This project has **known security issues** suitable for development/testing only:

### 1. Password Hashing: ✅ RESOLVED (Nov 1, 2025)

- **Status**: ✅ **MIGRATED to bcrypt** - Industry-standard hashing deployed
- **Location**: `convex/users.ts`
- **Solution**: Bcrypt with salt (10 rounds), one-way hashing, OWASP compliant
- **Migration**: Soft migration in progress - hybrid verification supports both hash types
- **Timeline**: 2-4 weeks for full migration as users login naturally
- **Security Impact**: Database compromise no longer exposes passwords
- **Documentation**: `docs/archive/implementations/IMPLEMENTATION_SUMMARY_BCRYPT_MIGRATION_NOV_1_2025.md`

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

**⚠️ Do NOT deploy to production without addressing items 2-4 above**

Before production deployment:

1. ✅ ~~Migrate password hashing to bcrypt~~ **DONE (Nov 1, 2025)**
2. Implement HttpOnly cookie sessions
3. Add progressive login rate limiting (consider 1-hour lockout with progressive delays)
4. Add rate limiting for password changes
5. Add CSRF protection
6. Enable HTTPS only
7. Review audit logs
8. Security penetration testing

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
