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
- Current auth patterns (localStorage, btoa()) are acceptable given the environment
- Focus is on usability and functionality over hardening against public threats

---

## Known Limitations (NOT Production-Ready)

This project has **known security issues** suitable for development/testing only:

### 1. Password Hashing: `btoa()` is NOT SECURE

- **Location**: `convex/users.ts`
- **Issue**: Base64 encoding is reversible - `atob(hash)` reveals password
- **TODO**: Migrate to bcrypt before production deployment
- **Impact**: Database compromise = all passwords exposed

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
- ❌ Login attempts: unlimited (vulnerable)
- ❌ Password changes: unlimited (DoS risk)

---

## Production Deployment Checklist

**⚠️ Do NOT deploy to production without addressing items 1-3 above**

Before production deployment:

1. Migrate password hashing to bcrypt
2. Implement HttpOnly cookie sessions
3. Add progressive login rate limiting
4. Add CSRF protection
5. Enable HTTPS only
6. Review audit logs
7. Security penetration testing

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
