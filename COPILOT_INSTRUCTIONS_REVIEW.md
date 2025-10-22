# Copilot Instructions Review & Security Analysis

**Date**: October 23, 2025  
**Review Status**: ✅ Completed

---

## 1. Summary of Changes

### What Improved ✅

**Before** → **After**

1. **Formatting & Readability**
   - Plain text → Markdown formatting with code blocks
   - Generic descriptions → Concrete code examples throughout
   - Loose organization → Structured sections with clear ❌ DO NOT / ✅ SAFE / ⚠️ ASK FIRST

2. **Architecture Details**
   - Missing provider hierarchy visualization → Added TSX structure with numbered sequence
   - Generic backend description → Specific Convex patterns with client examples
   - No auth details → Explicit localStorage usage, password patterns, security warnings

3. **Performance Patterns**
   - Vague "use indexes" → Concrete ✅/❌ examples with actual query syntax
   - No index list → Complete index inventory from schema.ts
   - Generic N+1 warning → Full batch fetch pattern with code example

4. **Code Examples Added**
   - Bilingual translation helper (`t()` function usage)
   - Index-first query patterns (correct vs wrong)
   - N+1 prevention with batch fetch + Map lookup
   - Toast notification imports and methods
   - Rate limiting implementation
   - Student ID generation function
   - Soft delete pattern

5. **Developer Experience**
   - Missing workflow → PowerShell commands with execution order
   - No environment setup → Explicit .env.local handling
   - Build requirements unclear → Turbopack requirement documented
   - No file reference → Key files organized by category

### What's Still Good ✅

- Bilingual-first requirement maintained
- Class booking state machine preserved
- Soft delete pattern emphasized
- Rate limiting examples retained
- Provider hierarchy warning kept critical

### What Was Removed ⚠️

- "Native Pagination" section (still exists in code, just not highlighted)
- "Form Submission Pattern" details (optimistic updates)
- Some redundant file references consolidated

---

## 2. Security Risk Analysis 🔐

### 🔴 CRITICAL Risks

#### 2.1 Password Hashing: `btoa()` is NOT SECURE

**Location**: `convex/users.ts`

```typescript
// CURRENT (INSECURE):
function hashPassword(password: string): string {
  return btoa(password); // Base64 encoding ≠ hashing
}
```

**Risk Level**: 🔴 **CRITICAL**

**Why It's Dangerous**:

- `btoa()` is **encoding, not hashing** - fully reversible
- `atob(btoa("TeacherEvan"))` → reveals the password
- Database compromise = all passwords exposed in plain text
- No salt, no iterations, no protection

**Attack Scenario**:

1. Attacker gains database read access (Convex dashboard leak, backup exposure)
2. Decodes all password hashes with simple `atob(hash)`
3. Gains access to all accounts

**Fix Required**:

```typescript
// RECOMMENDED: Use bcrypt
import bcrypt from "bcryptjs";

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
```

**Impact**: All 3 existing users (admin, moderator1, Evan) need password reset after migration

---

#### 2.2 No Authentication Rate Limiting

**Location**: `convex/users.ts` - `login` mutation

**Risk Level**: 🔴 **HIGH**

**Current State**:

- Rate limiting exists for class bookings (30/min) and messages (20/min)
- **NO rate limiting on login attempts**

**Why It's Dangerous**:

- Brute force attacks possible (try 1000s of passwords per second)
- Default password pattern `Teacher{username}` is predictable
- Account enumeration possible (different error for "user exists" vs "wrong password")

**Attack Scenario**:

```
Attacker knows usernames (visible in app after login)
Try: TeacherEvan, TeacherJohn, TeacherSarah, etc.
→ No rate limit = 1000s of attempts per minute
```

**Fix Required**:

```typescript
export const login = mutation({
  handler: async (ctx, args) => {
    // Add rate limiting FIRST
    await checkRateLimit(ctx, {
      key: `login-${args.username}`,
      limit: 5,        // 5 attempts
      windowMs: 300000 // per 5 minutes
    });
    
    // ... existing login logic
  }
});
```

---

#### 2.3 localStorage for Authentication (XSS Risk)

**Location**: `app/page.tsx`

```tsx
localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
```

**Risk Level**: 🟡 **MEDIUM**

**Why It's A Risk**:

- localStorage is accessible to any JavaScript on the domain
- XSS vulnerability → attacker can steal session: `localStorage.getItem("currentUser")`
- No HttpOnly flag protection (unlike cookies)
- Session persists across browser restarts (good UX, security trade-off)

**Better Alternative**:

- Use `sessionStorage` (cleared on tab close) for sensitive data
- Or use secure HttpOnly cookies (requires backend changes)
- Or implement session expiration (currently sessions never expire)

**Partial Fix** (low-hanging fruit):

```typescript
// Add session expiration
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
  const parsed = JSON.parse(savedUser);
  if (Date.now() - parsed.loginTime > SESSION_TIMEOUT) {
    localStorage.removeItem("currentUser");
    return; // Force re-login
  }
}
```

---

### 🟡 MEDIUM Risks

#### 2.4 No Input Sanitization on User Creation

**Location**: `convex/users.ts` - `create` mutation

**Current Validation**:

```typescript
if (!args.username.trim() || args.username.length < 3) {
  throw new Error("Username must be at least 3 characters");
}
```

**Missing**:

- No max length check (potential DoS)
- No special character validation
- No SQL injection protection (not applicable to Convex, but good practice)

**Fix**:

```typescript
import { validateLength } from "./rateLimit";

// In mutation:
validateLength(args.username, 3, 30, "Username");
if (!/^[a-zA-Z0-9_-]+$/.test(args.username)) {
  throw new Error("Username can only contain letters, numbers, underscores, and hyphens");
}
```

---

#### 2.5 Password Change Not Rate Limited

**Location**: `convex/users.ts` - `changePassword` mutation

**Risk**: Automated password changes to lock out users

**Fix**: Add rate limiting (5 changes per hour per user)

---

### 🟢 LOW Risks (Informational)

#### 2.6 No HTTPS Enforcement Documented

- Vercel likely handles this, but not documented
- Add to deployment docs

#### 2.7 No Session Invalidation on Password Change

- User changes password, old sessions remain valid
- Should clear localStorage on password change from other devices (requires backend tracking)

---

## 3. Copilot Instructions Review ✅

### What's Correct ✅

1. ✅ Provider hierarchy warning is accurate and critical
2. ✅ Index-first queries correctly emphasized
3. ✅ N+1 prevention pattern is correct
4. ✅ Toast notification pattern matches codebase
5. ✅ Student ID format matches implementation
6. ✅ Class booking state machine is accurate
7. ✅ Soft delete pattern matches codebase
8. ✅ Turbopack requirement is correct
9. ✅ Convex dev startup order is correct

### What Needs Fixing ⚠️

#### Issue 1: Authentication Storage Discrepancy

**Instructions say**: "Session stored in localStorage (not sessionStorage as docs claim)"

**Fix**: Clarify this was corrected from previous version:

```markdown
- **Session storage**: Uses `localStorage` for persistence across browser restarts
- **Security trade-off**: Convenience vs XSS risk (see Security section)
```

#### Issue 2: Missing Security Warnings Section

**Add new section**:

```markdown
## Security Considerations ⚠️

### Known Limitations (NOT Production-Ready)

1. **Password Hashing**: Uses `btoa()` - fully reversible (see `convex/users.ts`)
   - **TODO**: Migrate to bcrypt before production deployment
   
2. **No Authentication Rate Limiting**: Login endpoint unprotected
   - **TODO**: Add `checkRateLimit` to login mutation

3. **localStorage for Sessions**: XSS vulnerability surface
   - **TODO**: Add session expiration or migrate to HttpOnly cookies

4. **Default Password Pattern**: `Teacher{username}` is predictable
   - **Mitigation**: Forced password change on first login

**For production deployment**: Address items 1-3 BEFORE going live
```

#### Issue 3: Rate Limiting Section Incomplete

**Current**:

```markdown
**Existing limits** (from `convex/classes.ts`, `convex/messages.ts`):
- Class bookings: 30/min
- Messages: 20/min
```

**Add**:

```markdown
**Missing rate limits** (security gaps):
- ❌ Login attempts (allows brute force)
- ❌ Password changes (allows DoS)
- ❌ User creation (admin only, but still vulnerable)
```

---

## 4. Recommendations

### Immediate Actions (Before Production) 🚨

1. **Implement bcrypt password hashing**
   - Install `bcryptjs` package
   - Update `hashPassword()` and `verifyPassword()`
   - Migration script for existing users

2. **Add authentication rate limiting**
   - Login: 5 attempts per 5 minutes per username
   - Password change: 3 attempts per hour per user
   - User creation: 10 per hour per admin (DoS prevention)

3. **Add session expiration**
   - 8-hour timeout
   - Auto-logout on expiration
   - Clear localStorage on password change

### Nice-to-Have Improvements 💡

1. **Audit logging**: Log all authentication events
2. **2FA option**: For admin accounts at minimum
3. **Password complexity requirements**: Minimum 8 chars, require mix
4. **Account lockout**: After 5 failed login attempts
5. **Security headers**: Document Vercel security headers setup

### Documentation Updates 📝

1. **Add SECURITY.md**: Document known issues and roadmap
2. **Update README**: Add "Security Status: Dev Only" warning
3. **Deployment guide**: Checklist of security items before production

---

## 5. Verdict

### Copilot Instructions: ✅ APPROVED (with minor additions)

The updated instructions are significantly better than before:

- Concrete examples vs generic advice
- Correct technical details
- Clear do/don't structure
- Good file reference organization

**Recommended additions**:

1. Add "Security Considerations" section
2. Clarify localStorage usage
3. Document missing rate limits

### Security Status: ⚠️ DEV ONLY

**Do NOT deploy to production without**:

1. Replacing btoa() with bcrypt
2. Adding authentication rate limiting
3. Implementing session expiration

**Current state is acceptable for**:

- Local development
- Internal testing
- Proof of concept

**NOT acceptable for**:

- Public deployment
- Sensitive data
- Production use

---

## Summary

✅ **Copilot instructions are excellent** - clear, actionable, technically accurate

⚠️ **Security needs work** - 3 critical issues before production:

1. Password hashing (btoa → bcrypt)
2. Authentication rate limiting
3. Session management

🎯 **Next steps**:

1. Add security section to copilot-instructions.md
2. Create SECURITY.md with known issues
3. File issues for 3 critical security fixes
4. Implement PR #42 (class count badge)
