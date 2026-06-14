# Disaster Recovery Protocols

[← Back to Index](../copilot-instructions.md)

---

## 🚨 Emergency Response Guide

**Purpose**: Step-by-step recovery procedures for critical system failures.

**When to Use**: System down, users locked out, data corruption, or infrastructure failures.

**Response Time Goals**:

- **Critical (P0)**: Admin login failure, Convex offline - 15 minutes
- **High (P1)**: Vercel offline, users logged out - 1 hour
- **Medium (P2)**: MongoDB backup issues, slow performance - 4 hours

---

## Protocol 1: Convex Backend Offline 🔴

**Symptoms**: "Failed to connect to Convex", queries timeout, real-time updates stopped

**Impact**: Complete application failure - NO functionality works without Convex

### Immediate Actions (0-5 minutes)

```powershell
# 1. Check Convex Status
# Visit: https://status.convex.dev
# Check Twitter: @convex_dev

# 2. Verify Local Configuration
Get-Content .env.local | Select-String "NEXT_PUBLIC_CONVEX_URL"
# Should show: NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# 3. Test Convex Dashboard Access
# Visit: https://dashboard.convex.dev
# Can you see your deployment? If YES → Convex is UP, issue is local
```

### Diagnosis (5-10 minutes)

```powershell
# Check deployment health
npx convex deploy --dry-run

# View recent Convex logs
# Go to: https://dashboard.convex.dev → Your Deployment → Logs
# Look for errors in last 1 hour

# Test local Convex connection
npx convex dev --once
# If fails: Check firewall, VPN, network
```

### Recovery Steps

**Scenario A: Convex Service Outage (External)**

1. ✅ **Communicate to users** (use backup channel - email/SMS)
   - ETA based on status.convex.dev
   - Point users to static status page

2. ✅ **Enable maintenance mode** (if Vercel is still up)

   ```tsx
   // In app/page.tsx - temporary addition
   if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true") {
     return <MaintenancePage expectedResolution="15 minutes" />;
   }
   ```

3. ✅ **Monitor Convex status** - refresh every 5 minutes
4. ✅ **Test recovery** once service is restored

   ```powershell
   npx convex dev --once
   npm run build
   ```

**Scenario B: Configuration Error (Your Deployment)**

1. ✅ **Check environment variables**

   ```powershell
   # Vercel production
   vercel env pull .env.vercel.production

   # Compare with local
   Compare-Object (Get-Content .env.local) (Get-Content .env.vercel.production)
   ```

2. ✅ **Redeploy Convex functions**

   ```powershell
   npx convex deploy --prod
   # Watch deployment logs in dashboard
   ```

3. ✅ **Verify schema integrity**

   ```powershell
   # Check for schema errors
   npx convex dev --once
   # Look for "Schema validation failed" messages
   ```

**Scenario C: Rate Limiting / Quota Exceeded**

1. ✅ **Check Convex dashboard** → Usage tab
   - Database reads/writes
   - Function execution time
   - Bandwidth usage

2. ✅ **Identify expensive queries**
   - Go to Logs → Sort by execution time
   - Look for queries taking >1 second
   - Check for N+1 query patterns

3. ✅ **Temporary mitigation**
   - Disable non-critical features
   - Add aggressive client-side caching
   - Contact Convex support for quota increase

### Prevention

- ✅ **Monitor Convex usage** weekly (dashboard → Usage)
- ✅ **Set up alerts** for quota usage >80%
- ✅ **Optimize queries** using indexes (see Pattern #3)
- ✅ **Load test** before major releases

---

## Protocol 2: Vercel Deployment Offline 🟠

**Symptoms**: 404 errors, "This site can't be reached", deployment failed

**Impact**: Users cannot access application (but Convex data is safe)

### Immediate Actions (0-5 minutes)

```powershell
# 1. Check Vercel Status
# Visit: https://www.vercel-status.com

# 2. Check recent deployments
vercel ls
# Look for failed deployments

# 3. Check production URL
curl https://your-app.vercel.app/api/health
# Or visit in browser
```

### Diagnosis

```powershell
# View deployment logs
vercel logs your-deployment-url

# Check build logs
vercel logs --scope=build

# Inspect latest deployment
vercel inspect your-deployment-url
```

### Recovery Steps

**Scenario A: Vercel Service Outage**

1. ✅ **Verify outage** at <https://www.vercel-status.com>
2. ✅ **Check if previous deployment is accessible**

   ```powershell
   vercel ls --limit 5
   # Visit second-to-last deployment URL
   ```

3. ✅ **Promote previous working deployment**

   ```powershell
   vercel alias set your-previous-deployment.vercel.app your-domain.com
   ```

**Scenario B: Failed Deployment**

1. ✅ **Rollback to previous version**

   ```powershell
   # List recent deployments
   vercel ls

   # Promote stable version
   vercel promote your-stable-deployment-url
   ```

2. ✅ **Fix build errors locally**

   ```powershell
   npm run build
   # Fix any TypeScript/ESLint errors

   # Test production build locally
   npm run start
   ```

3. ✅ **Redeploy**

   ```powershell
   vercel --prod
   ```

**Scenario C: Environment Variables Missing**

1. ✅ **Verify environment variables**

   ```powershell
   vercel env ls
   # Ensure NEXT_PUBLIC_CONVEX_URL exists for Production
   ```

2. ✅ **Add missing variables**

   ```powershell
   vercel env add NEXT_PUBLIC_CONVEX_URL production
   # Paste your Convex URL
   ```

3. ✅ **Trigger new deployment**

   ```powershell
   vercel --prod --force
   ```

### Prevention

- ✅ **Test builds locally** before deploying: `npm run build`
- ✅ **Use preview deployments** for testing (automatic on PRs)
- ✅ **Keep environment variables documented** in `.env.example`
- ✅ **Set up Vercel deployment notifications** (Slack/Discord)

---

## Protocol 3: Mass User Logout / Session Expiration 🟡

**Symptoms**: All users reporting login screen, sessions expired simultaneously

**Impact**: Productivity loss, user frustration, potential data entry loss

### Immediate Actions

```powershell
# 1. Verify it's not a code issue
# Check if localStorage is being cleared unexpectedly

# 2. Check session expiration logic
# File: lib/session-utils.ts
# Verify SESSION_DURATION_MS = 24 hours (not minutes!)

# 3. Test login functionality
npm run dev
# Login as test user, verify session persists
```

### Diagnosis

**Check for these common causes**:

1. **Code deployment changed session structure**
   - Review recent commits to `lib/session-utils.ts`
   - Check if `saveUserSession` signature changed

2. **localStorage quota exceeded**
   - Browser DevTools → Application → Local Storage
   - Check size of stored data

3. **Browser security policy change**
   - Check if running on HTTP instead of HTTPS
   - Verify domain hasn't changed

### Recovery Steps

**Scenario A: Session Structure Changed**

1. ✅ **Add migration logic**

   ```typescript
   // In lib/session-utils.ts
   export function loadUserSession(): User | null {
     const stored = localStorage.getItem("classTrackerUser");
     if (!stored) return null;

     try {
       const data = JSON.parse(stored);

       // Migration for old format
       if (data.user && !data.expiresAt) {
         const migrated = {
           ...data.user,
           expiresAt: Date.now() + SESSION_DURATION_MS,
         };
         saveUserSession(migrated);
         return migrated;
       }

       return data;
     } catch {
       return null;
     }
   }
   ```

2. ✅ **Deploy fix**
3. ✅ **Communicate to users** - they'll need to login once

**Scenario B: Accidental Logout All Users**

1. ✅ **No technical fix needed** - sessions are client-side
2. ✅ **Communicate via notification window**

   ```typescript
   // Create emergency notification
   await ctx.db.insert("notificationWindows", {
     title: "Brief Disruption",
     titleTh: "การหยุดชะงักสั้นๆ",
     message: "Please log in again. Your data is safe.",
     messageTh: "กรุณาเข้าสู่ระบบอีกครั้ง ข้อมูลของคุณปลอดภัย",
     type: "info",
     priority: "high",
     targetRole: "all",
     showInWindow: true,
     createdAt: Date.now(),
   });
   ```

### Prevention

- ✅ **Never change session structure** without migration
- ✅ **Test session persistence** in E2E tests
- ✅ **Add version field** to session data for future migrations
- ✅ **Document breaking changes** in CHANGELOG.md

---

## Protocol 4: Admin Account Compromised 🔴

**Symptoms**: Unauthorized changes, unknown users created, suspicious activity logs

**Impact**: CRITICAL - Full system access, potential data breach

### Immediate Actions (0-15 minutes) - DO NOT DELAY

```powershell
# 1. IMMEDIATELY reset admin password in Convex dashboard
# Dashboard → Data → users table → Find admin → Edit passwordHash

# 2. Generate new secure hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NEW_SECURE_PASSWORD_HERE', 10, (e,h) => console.log(h));"

# 3. Update passwordHash in database
# Paste hash into Convex dashboard

# 4. Force password change on next login
# Set requirePasswordChange: true in database
```

### Diagnosis

```typescript
// Check audit logs for unauthorized actions
const suspiciousLogs = await ctx.db
  .query("auditLog")
  .filter((q) =>
    q.and(
      q.eq(q.field("userId"), adminId),
      q.gte(q.field("timestamp"), Date.now() - 86400000), // Last 24hr
    ),
  )
  .collect();

// Check for:
// - Bulk deletions
// - User creations
// - Password resets
// - School modifications
```

### Recovery Steps

1. ✅ **Lock the account**

   ```typescript
   // In Convex dashboard or via mutation
   await ctx.db.patch(adminId, {
     accountLockedUntil: Date.now() + 24 * 60 * 60 * 1000,
     failedLoginAttempts: 5,
   });
   ```

2. ✅ **Review all recent changes**
   - Check audit logs (last 7 days)
   - Verify user creations
   - Check for deleted records
   - Review modified school data

3. ✅ **Restore from backup if needed**

   ```powershell
   # List available backups
   npm run backup:list

   # Restore from specific backup
   npm run backup:restore
   # Select backup from before compromise
   ```

4. ✅ **Create new admin account**

   ```typescript
   // Via Convex dashboard - insert into users table
   {
     username: "admin2",
     passwordHash: await bcrypt.hash("STRONG_PASSWORD", 10),
     role: "admin",
     requirePasswordChange: true,
     createdAt: Date.now()
   }
   ```

5. ✅ **Audit all moderator accounts**
   - Reset passwords for all moderators
   - Check for suspicious moderator activity

### Prevention

- ✅ **Use 2FA for Convex dashboard** access
- ✅ **Rotate admin password** every 90 days
- ✅ **Monitor audit logs** weekly
- ✅ **Limit admin account usage** - use moderator for daily tasks
- ✅ **Never share admin credentials**
- ✅ **Enable Convex access logs**

---

## Protocol 5: Admin Cannot Login (Locked Out) 🟠

**Symptoms**: Admin login fails, account locked, password not working

**Impact**: HIGH - Cannot manage system, users, or handle emergencies

### Immediate Actions

**Option 1: Use Convex Dashboard (Recommended)**

```powershell
# 1. Login to Convex Dashboard
# Visit: https://dashboard.convex.dev

# 2. Navigate to your deployment → Data → users table

# 3. Find admin user, click Edit

# 4. Reset fields:
# - failedLoginAttempts: 0
# - accountLockedUntil: undefined (delete field)
# - lastSuccessfulLogin: <current timestamp>

# 5. If password forgotten, reset passwordHash:
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Teacher admin', 10, (e,h) => console.log(h));"
# Copy hash, update passwordHash field
```

**Option 2: Create New Admin (If Dashboard Locked)**

```typescript
// Via Convex Dashboard → Data → users → Add Document
{
  "username": "emergency_admin",
  "passwordHash": "<bcrypt_hash_here>",
  "role": "admin",
  "requirePasswordChange": true,
  "createdAt": <current_timestamp>,
  "failedLoginAttempts": 0
}
```

**Option 3: Recovery via Code**

```powershell
# Create one-time recovery mutation
# In convex/users.ts - add temporarily

export const emergencyAdminReset = mutation({
  args: {},
  handler: async (ctx) => {
    // Find admin
    const admin = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("role"), "admin"))
      .first();

    if (!admin) throw new Error("No admin found");

    // Reset lockout
    await ctx.db.patch(admin._id, {
      failedLoginAttempts: 0,
      accountLockedUntil: undefined,
    });

    return { success: true, username: admin.username };
  }
});

# Run from Convex dashboard Functions tab
# Then REMOVE this mutation after use!
```

### Prevention

- ✅ **Keep Convex dashboard access** credentials safe (separate from app)
- ✅ **Document default password pattern** (Teacher{username})
- ✅ **Create backup admin account** before locking main admin
- ✅ **Test admin login** after security changes
- ✅ **Keep recovery script** in docs (not in codebase)

---

## Protocol 6: User Account Not Found Error 🟡

**Symptoms**: "User not found", login fails for existing user

**Impact**: MEDIUM - Individual user locked out, but system operational

### Diagnosis

```powershell
# 1. Verify user exists in database
# Convex Dashboard → Data → users → Search by username

# 2. Check for soft deletion
# Look for isActive: false or deletedAt field

# 3. Verify schoolId is valid
# Check if school still exists in schools table
```

### Recovery Steps

**Scenario A: User Soft-Deleted**

```typescript
// Via Convex dashboard
await ctx.db.patch(userId, {
  isActive: true,
  deletedAt: undefined,
});
```

**Scenario B: User Truly Doesn't Exist**

```typescript
// Recreate user via Convex dashboard or admin UI
{
  username: "username_here",
  passwordHash: await bcrypt.hash("TeacherUsername", 10),
  role: "teacher", // or moderator/guardian
  schoolId: "<valid_school_id>",
  requirePasswordChange: true,
  createdAt: Date.now()
}
```

**Scenario C: School Reference Broken**

```typescript
// Update user's schoolId to valid school
await ctx.db.patch(userId, {
  schoolId: validSchoolId,
});
```

### Prevention

- ✅ **Use soft deletes** (isActive flag) not hard deletes
- ✅ **Validate foreign keys** before deletion
- ✅ **Regular backup** (npm run backup) - daily
- ✅ **Audit user deletions** in admin dashboard

---

## Protocol 7: Moderator Account Not Found 🟡

**Symptoms**: School has no moderator, moderator-specific features broken

**Impact**: MEDIUM - School operations disrupted, classes can't be approved

### Diagnosis

```powershell
# Check school's moderator assignment
# Convex Dashboard → Data → schools → Find school
# Check moderatorId field - is it valid?

# Verify moderator exists
# Data → users → Look up moderatorId
# Check role: "moderator" and schoolId matches
```

### Recovery Steps

**Option 1: Assign Existing Moderator**

```typescript
// Find available moderator
const availableModerator = await ctx.db
  .query("users")
  .withIndex("by_role", (q) => q.eq("role", "moderator"))
  .first();

// Assign to school
await ctx.db.patch(schoolId, {
  moderatorId: availableModerator._id,
});

// Update moderator's school
await ctx.db.patch(availableModerator._id, {
  schoolId: schoolId,
});
```

**Option 2: Create New Moderator**

```typescript
// Via admin UI or Convex dashboard
const newModerator = await ctx.db.insert("users", {
  username: "moderator_schoolname",
  passwordHash: await bcrypt.hash("TeacherModeratorSchoolname", 10),
  role: "moderator",
  schoolId: schoolId,
  requirePasswordChange: true,
  createdAt: Date.now(),
});

// Assign to school
await ctx.db.patch(schoolId, {
  moderatorId: newModerator,
});
```

**Option 3: Temporary Admin Override**

```typescript
// Admin can approve classes directly
// In convex/classes.ts - add admin bypass
if (user.role === "admin") {
  // Admin can approve any class
  await ctx.db.patch(classId, { status: "approved" });
}
```

### Prevention

- ✅ **Each school MUST have moderator** before activation
- ✅ **Validate moderator exists** when creating school
- ✅ **Alert if moderator deleted** (pre-delete check)
- ✅ **Regular audit** of school-moderator relationships

---

## Protocol 8: MongoDB Backup Not Connecting 🟡

**Symptoms**: `npm run backup` fails, "Connection refused", timeout errors

**Impact**: MEDIUM - Can't create backups, but app still functional

### Diagnosis

```powershell
# 1. Check MongoDB connection string
Get-Content .env.local | Select-String "MONGODB_URI"

# 2. Test connection manually
node -e "const { MongoClient } = require('mongodb'); const client = new MongoClient('YOUR_URI'); client.connect().then(() => console.log('Connected')).catch(e => console.error(e));"

# 3. Check MongoDB Atlas status
# Visit: https://status.mongodb.com
```

### Recovery Steps

**Scenario A: Wrong Connection String**

```powershell
# Get new connection string from MongoDB Atlas
# Atlas → Database → Connect → Connect your application
# Copy connection string

# Update .env.local
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/

# Test connection
npm run backup:list
```

**Scenario B: IP Whitelist Issue**

1. ✅ **Add current IP to whitelist**
   - MongoDB Atlas → Network Access
   - Add IP Address → Add Current IP Address
   - Or allow all: 0.0.0.0/0 (development only!)

2. ✅ **Test connection**

   ```powershell
   npm run backup:list
   ```

**Scenario C: Credentials Expired**

1. ✅ **Reset database user password**
   - MongoDB Atlas → Database Access
   - Edit user → Update password

2. ✅ **Update connection string** in `.env.local`

**Scenario D: Use Convex Export as Backup**

```powershell
# If MongoDB unavailable, use Convex export
# Dashboard → Settings → Export Data
# Downloads JSON export of all tables

# Or use Convex snapshot API
npx convex export --path ./backup-$(Get-Date -Format yyyy-MM-dd).zip
```

### Prevention

- ✅ **Test backup weekly**: `npm run backup`
- ✅ **Keep MongoDB credentials** documented securely
- ✅ **Monitor Atlas email alerts** for security issues
- ✅ **Use Convex snapshots** as secondary backup
- ✅ **Set up automatic backups** (npm run backup:schedule)

---

## Protocol 9: Loading Screen Stuck / Not Progressing 🟡

**Symptoms**: Infinite loading spinner, app never finishes loading

**Impact**: MEDIUM - User frustration, perceived downtime (but might be client-side)

### Diagnosis

```javascript
// 1. Open Browser DevTools (F12)
// 2. Check Console tab for errors
// Look for:
// - Convex connection errors
// - Failed to fetch
// - CORS errors
// - JavaScript exceptions

// 3. Check Network tab
// Look for:
// - Failed requests (red)
// - Pending requests (never complete)
// - 404 on NEXT_PUBLIC_CONVEX_URL

// 4. Check Application tab → Local Storage
// Verify session data exists and is valid
```

### Recovery Steps

**Scenario A: Convex Connection Failed**

```javascript
// Browser Console
localStorage.removeItem("classTrackerUser");
location.reload();

// If persists, check Convex URL
console.log(process.env.NEXT_PUBLIC_CONVEX_URL);
// Should log: https://your-deployment.convex.cloud
```

**Scenario B: Corrupted localStorage**

```javascript
// Clear all app data
localStorage.clear();
sessionStorage.clear();
location.reload();

// User will need to login again
```

**Scenario C: Infinite Query Loop**

```typescript
// Check for useQuery without proper deps
// BAD:
useEffect(() => {
  const data = useQuery(api.classes.list, { filter: { schoolId } });
  // This creates new object every render!
}, []);

// GOOD:
const queryArgs = useMemo(() => ({ schoolId }), [schoolId]);
const data = useQuery(api.classes.list, queryArgs);
```

**Scenario D: Missing Provider**

```typescript
// Check app/layout.tsx provider order
// Must be:
<ErrorBoundary>
  <ConvexClientProvider>
    <DeviceProvider>
      <DataProvider>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </DataProvider>
    </DeviceProvider>
  </ConvexClientProvider>
</ErrorBoundary>
```

### User Recovery Instructions

```markdown
If you see infinite loading:

1. **Refresh the page** (Ctrl+R or Cmd+R)
2. **Clear browser cache**: Ctrl+Shift+Delete → Clear browsing data
3. **Try incognito/private mode**: Ctrl+Shift+N
4. **Try different browser**: Chrome, Firefox, Edge
5. **Check internet connection**: Can you access other websites?

If still stuck:

- Contact admin with screenshot
- Note time when issue started
- Note which page you were trying to access
```

### Prevention

- ✅ **Add loading timeout** (show error after 30 seconds)
- ✅ **Add retry logic** for failed queries
- ✅ **Test on slow connections** (DevTools → Network → Slow 3G)
- ✅ **Monitor error rates** in production
- ✅ **Add health check endpoint**: `/api/health`

---

## Protocol 10: Database Corruption / Invalid Data 🔴

**Symptoms**: Queries fail, type errors, "undefined is not an object"

**Impact**: CRITICAL - Application unstable, data integrity at risk

### Immediate Actions

```powershell
# 1. STOP all writes immediately
# Comment out all mutation calls temporarily

# 2. Create snapshot before any fixes
npm run backup
# Note backup ID for rollback

# 3. Identify corrupted records
# Check Convex dashboard logs for failing queries
```

### Diagnosis

```typescript
// Find records with missing required fields
const invalidClasses = await ctx.db
  .query("classes")
  .collect()
  .then((classes) => classes.filter((c) => !c.teacherId || !c.studentId || !c.status));

// Check for orphaned references
const classesWithInvalidStudent = await ctx.db
  .query("classes")
  .collect()
  .then(async (classes) => {
    const checks = await Promise.all(
      classes.map(async (c) => ({
        classId: c._id,
        studentExists: (await ctx.db.get(c.studentId)) !== null,
      })),
    );
    return checks.filter((c) => !c.studentExists);
  });
```

### Recovery Steps

**Step 1: Create Data Repair Script**

```typescript
// convex/dataRepair.ts (temporary file)
export const repairCorruptedClasses = mutation({
  args: { adminId: v.id("users"), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    // Verify admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin only");
    }

    const repairs: any[] = [];
    const classes = await ctx.db.query("classes").collect();

    for (const classItem of classes) {
      const issues: string[] = [];

      // Check student exists
      if (classItem.studentId) {
        const student = await ctx.db.get(classItem.studentId);
        if (!student) issues.push("Invalid studentId");
      }

      // Check school exists (if not provider)
      if (classItem.schoolId) {
        const school = await ctx.db.get(classItem.schoolId);
        if (!school) issues.push("Invalid schoolId");
      }

      // Check required fields
      if (!classItem.status) issues.push("Missing status");

      if (issues.length > 0) {
        repairs.push({ classId: classItem._id, issues });

        if (!args.dryRun) {
          // Apply fixes
          if (!classItem.status) {
            await ctx.db.patch(classItem._id, {
              status: "pending",
            });
          }
        }
      }
    }

    return { repairsNeeded: repairs.length, repairs };
  },
});
```

**Step 2: Run Repair (Dry Run First)**

```powershell
# Dry run to see what would be fixed
# In Convex dashboard → Functions tab
# Run: dataRepair.repairCorruptedClasses
# Args: { adminId: "admin_id_here", dryRun: true }

# Review output carefully!

# If safe, run actual repair
# Args: { adminId: "admin_id_here", dryRun: false }
```

**Step 3: Restore from Backup (If Repair Failed)**

```powershell
npm run backup:restore
# Select backup from before corruption
# Confirm restoration

# Verify data integrity after restore
```

### Prevention

- ✅ **Validate data at mutation boundaries** (use Zod schemas)
- ✅ **Add database constraints** in schema.ts
- ✅ **Test migrations thoroughly** before production
- ✅ **Daily backups** (npm run backup:schedule)
- ✅ **Monitor error rates** in Convex dashboard
- ✅ **Add data validation queries** to run weekly
- ✅ **Use TypeScript strictly** (no `any` types)

---

## Quick Reference: Emergency Contacts & Resources

### Status Pages

- **Convex**: <https://status.convex.dev>
- **Vercel**: <https://www.vercel-status.com>
- **MongoDB Atlas**: <https://status.mongodb.com>
- **GitHub**: <https://www.githubstatus.com>

### Dashboards

- **Convex**: <https://dashboard.convex.dev>
- **Vercel**: <https://vercel.com/dashboard>
- **MongoDB Atlas**: <https://cloud.mongodb.com>

### Support Channels

- **Convex**: Discord (<https://convex.dev/community>)
- **Vercel**: Support (<https://vercel.com/support>)
- **MongoDB**: Support (<https://support.mongodb.com>)

### Key Commands

```powershell
# Emergency backup
npm run backup

# Restore backup
npm run backup:restore

# Deploy Convex
npx convex deploy

# Deploy Vercel
vercel --prod

# Build locally
npm run build

# Check logs
vercel logs
# Convex: Use dashboard
```

---

## Escalation Path

1. **Level 1**: Developer (troubleshoot using this guide - 15 min)
2. **Level 2**: Check service status pages (5 min)
3. **Level 3**: Review recent deployments and rollback (15 min)
4. **Level 4**: Contact platform support (Convex/Vercel)
5. **Level 5**: Community forums (Discord/GitHub Discussions)

**Maximum total time before external help**: 1 hour for P0 issues

---

[← Back to Index](../copilot-instructions.md)
