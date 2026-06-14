# 🧪 Bcrypt Migration Testing Guide

**Quick Reference**: Step-by-step testing checklist for bcrypt migration validation

---

## 🚀 Pre-Test Setup

### 1. Verify Deployment

```powershell
# Check Convex deployment status
npx convex dev  # Should show "Synced successfully"

# Verify Next.js builds
npm run build   # Should exit with code 0
```

### 2. Open Convex Dashboard

- Navigate to: `https://dashboard.convex.dev`
- Select your project
- Go to "Functions" tab
- Locate `users.ts` functions

---

## ✅ Test Scenarios

### Test 1: Auto-Upgrade Existing User (CRITICAL)

**Purpose**: Verify legacy btoa hashes auto-upgrade to bcrypt on login

**Steps**:

1. Open application: `http://localhost:3000`
2. Login with **existing user** (has btoa hash):
   - Username: `Evan`
   - Password: `TeacherEvan`
3. Open browser console (F12)
4. **Expected Console Log**: `🔄 Auto-upgrading password hash for user: Evan`
5. Logout
6. Login again with same credentials
7. **Expected**: Login succeeds, **NO auto-upgrade log** (already migrated)

**Validation via Convex Dashboard**:

- Go to "Data" tab → "users" table
- Find user `Evan`
- Check `passwordHash` field
- **Before**: `VGVhY2hlckV2YW4=` (btoa - Base64)
- **After**: `$2b$10$N9qo8uLOickgx2ZMRZoMye...` (bcrypt hash)

**Status**: [ ] Pass / [ ] Fail

---

### Test 2: Verify bcrypt Hash Generation

**Purpose**: Confirm new users get bcrypt hashes (not btoa)

**Steps**:

1. Login as **admin** (`admin` / `TeacherAdmin`)
2. Navigate to "Users" tab
3. Create new user:
   - Username: `test_bcrypt_user`
   - Role: `teacher`
   - School: Select any
4. Go to Convex Dashboard → "Data" → "users" table
5. Find `test_bcrypt_user`
6. Check `passwordHash` field
7. **Expected**: Starts with `$2b$10$` (bcrypt hash)

**Status**: [ ] Pass / [ ] Fail

---

### Test 3: Change Password (Existing User)

**Purpose**: Verify password changes use bcrypt

**Steps**:

1. Login as `Evan` / `TeacherEvan`
2. Click profile icon → "Change Password"
3. Fill in:
   - Current: `TeacherEvan`
   - New: `NewSecurePassword123`
   - Confirm: `NewSecurePassword123`
4. Submit
5. Go to Convex Dashboard → "users" table → `Evan`
6. Check `passwordHash` field
7. **Expected**: **NEW** bcrypt hash (different from previous)

**Validation**:

- Logout
- Login with `Evan` / `NewSecurePassword123`
- **Expected**: Login succeeds

**Status**: [ ] Pass / [ ] Fail

---

### Test 4: Reset Password (Admin Function)

**Purpose**: Verify admin password reset uses bcrypt

**Steps**:

1. Login as **admin**
2. Go to "Users" tab
3. Find user `moderator1`
4. Click "Reset Password" (sets to `TeacherModerator1`)
5. Go to Convex Dashboard → "users" → `moderator1`
6. Check `passwordHash` field
7. **Expected**: **NEW** bcrypt hash starting with `$2b$10$`

**Validation**:

- Logout
- Login with `moderator1` / `TeacherModerator1`
- **Expected**: Login succeeds

**Status**: [ ] Pass / [ ] Fail

---

### Test 5: Migration Statistics Query

**Purpose**: Verify admin can track migration progress

**Steps**:

1. Open Convex Dashboard
2. Go to "Functions" tab
3. Find `users:getMigrationStats`
4. Click "Run" (no arguments needed)
5. **Expected Output**:

```json
{
  "total": 120,
  "migrated": 2,     // Evan + test_bcrypt_user
  "pending": 118,
  "percentage": 1,
  "legacyUsernames": ["admin", "moderator1", "moderator2", ...]
}
```

**Validation**:

- `total` = total users in database
- `migrated` = users with bcrypt hashes
- `pending` = users with legacy btoa hashes
- `percentage` = (migrated / total) \* 100

**Status**: [ ] Pass / [ ] Fail

---

### Test 6: Account Lockout (Unchanged)

**Purpose**: Verify bcrypt migration didn't break lockout mechanism

**Steps**:

1. Logout completely
2. Try to login with **WRONG** password 5 times:
   - Username: `Evan`
   - Password: `WrongPassword123` (x5)
3. **Expected**: After 5th attempt, toast error: "Account locked. Try again later or contact admin."
4. Try to login with **CORRECT** password:
   - Username: `Evan`
   - Password: `NewSecurePassword123` (from Test 3)
5. **Expected**: Login **FAILS** (account locked for 24 hours)

**Validation via Convex Dashboard**:

- Go to "Data" → "users" → `Evan`
- Check fields:
  - `failedLoginAttempts`: 5
  - `accountLockedUntil`: [timestamp 24 hours in future]

**Admin Unlock** (to continue testing):

1. Login as **admin**
2. Find `Evan` in users list
3. Click "Reset Password" (resets lockout)
4. Logout and login as `Evan` / `TeacherEvan` (default password)

**Status**: [ ] Pass / [ ] Fail

---

### Test 7: Hybrid Verification (Pending Users)

**Purpose**: Verify users who haven't logged in yet can still login (btoa fallback)

**Steps**:

1. Identify user who **hasn't logged in yet** (check Convex Dashboard for btoa hash)
   - Example: `moderator2` (if not auto-upgraded yet)
2. Login with legacy credentials:
   - Username: `moderator2`
   - Password: `TeacherModerator2`
3. **Expected**: Login succeeds
4. **Expected Console Log**: `🔄 Auto-upgrading password hash for user: moderator2`
5. Check Convex Dashboard → "users" → `moderator2`
6. **Expected**: `passwordHash` now starts with `$2b$10$` (auto-upgraded)

**Status**: [ ] Pass / [ ] Fail

---

## 📊 Migration Progress Tracking

### Week 1 Checklist (Nov 1-8, 2025)

- [ ] Day 1: Test all 7 scenarios above
- [ ] Day 2: Check migration stats (expect ~10-20% migrated)
- [ ] Day 3: Monitor Convex logs for errors
- [ ] Day 5: Check migration stats (expect ~30-40%)
- [ ] Day 7: Review any login issues

### Week 2-4 Checklist

- [ ] Week 2: Migration stats (expect ~60-70%)
- [ ] Week 3: Migration stats (expect ~80-90%)
- [ ] Week 4: Migration stats (expect ~95-100%)

### 100% Migration Checklist

- [ ] All users have bcrypt hashes
- [ ] No more "🔄 Auto-upgrading" logs in console
- [ ] `getMigrationStats` shows `pending: 0`
- [ ] Plan Phase 2 cleanup (remove btoa fallback)

---

## 🚨 Troubleshooting

### Issue: Login fails for ALL users

**Symptom**: No user can login, error: "Invalid credentials"

**Diagnosis**:

1. Check Convex deployment status
2. Verify `bcrypt` package installed: `npm list bcrypt`
3. Check Convex logs for errors

**Fix**:

```powershell
npm install bcrypt @types/bcrypt
npx convex deploy
```

---

### Issue: Auto-upgrade not happening

**Symptom**: User logs in successfully, but `passwordHash` still btoa

**Diagnosis**:

1. Check browser console for `🔄 Auto-upgrading` log
2. If missing, check Convex function logs
3. Verify `isBcryptHash()` function working

**Manual Check**:

- Open Convex Dashboard → "Functions"
- Run query manually: `users:login` with test credentials
- Check function logs for errors

---

### Issue: TypeError: bcrypt.hash is not a function

**Symptom**: Error when creating new user or changing password

**Diagnosis**: bcrypt package not installed correctly

**Fix**:

```powershell
npm uninstall bcrypt
npm install bcrypt
npm install --save-dev @types/bcrypt
npx convex deploy
```

---

### Issue: Migration stats show 0% after logins

**Symptom**: Users logged in, but `getMigrationStats` shows `migrated: 0`

**Diagnosis**:

1. Check if auto-upgrade logic applied
2. Verify database patch includes `passwordHash: updatedPasswordHash`
3. Check Convex logs for patch errors

**Manual Verification**:

- Query users table in Convex Dashboard
- Check individual user `passwordHash` fields
- Look for `$2b$10$` prefix

---

## ✅ Success Indicators

### Immediate (Day 1)

- ✅ Test 1-7 all pass
- ✅ No login failures
- ✅ No account lockout issues
- ✅ Console shows auto-upgrade logs

### Week 1

- ✅ 30-40% migration rate
- ✅ No increase in login failures
- ✅ No user complaints or helpdesk tickets

### Week 2-4

- ✅ 90%+ migration by week 3
- ✅ 100% migration by week 4
- ✅ Zero rollback requests

---

## 📞 Support

### For Issues

1. Check Convex Dashboard function logs
2. Review browser console errors
3. Query `getMigrationStats` for current state
4. Check `IMPLEMENTATION_SUMMARY_BCRYPT_MIGRATION_NOV_1_2025.md` for details

### Emergency Rollback

See "🚨 Rollback Plan" in implementation summary

---

**Testing Conducted By**: **\*\*\*\***\_**\*\*\*\***  
**Date**: **\*\*\*\***\_**\*\*\*\***  
**Overall Result**: [ ] Pass / [ ] Fail

---

**End of Testing Guide**
