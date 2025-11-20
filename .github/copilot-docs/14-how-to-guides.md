# Practical How-To Guides

[← Back to Index](../copilot-instructions.md)

---

## 📚 Purpose

Step-by-step operational procedures for common tasks. Copy-paste ready commands with real examples from this project.

**When to Use**: Daily operations, onboarding new developers, troubleshooting, maintenance tasks

---

## How-To #1: Deploy to Production

### Complete Deployment Workflow

**Time Required**: 15-20 minutes  
**Prerequisites**: Code pushed to GitHub, tests passing

### Step 1: Pre-Deployment Checks (5 minutes)

```powershell
# 1. Verify local build works
npm run build
# ✅ Should complete without errors

# 2. Run TypeScript check
npx tsc --noEmit
# ✅ Should show "0 errors"

# 3. Check for uncommitted changes
git status
# ✅ Should be "nothing to commit, working tree clean"

# 4. Verify you're on main branch
git branch
# ✅ Should show "* main"

# 5. Pull latest changes
git pull origin main
# ✅ Should be "Already up to date"
```

### Step 2: Deploy Convex Backend (5 minutes)

```powershell
# 1. Deploy Convex functions
npx convex deploy

# Expected output:
# ✓ Deploying functions...
# ✓ Deployed successfully
# Deployment URL: https://your-deployment.convex.cloud

# 2. Verify deployment in dashboard
# Visit: https://dashboard.convex.dev
# Check:
# - Functions deployed (green checkmarks)
# - No errors in recent logs
# - Schema matches local (convex/schema.ts)

# 3. Test critical queries manually
# Dashboard → Functions → Run
# Test: users.getById with admin ID
# Test: schools.list
# ✅ Both should return data without errors
```

### Step 3: Deploy Vercel Frontend (5 minutes)

```powershell
# 1. Deploy to production
vercel --prod

# Expected output:
# Deploying ~/class-tracker
# ✓ Production deployment ready
# https://your-app.vercel.app

# 2. Wait for deployment (usually 2-3 minutes)
# Watch build logs in terminal

# 3. Verify deployment succeeded
curl https://your-app.vercel.app
# ✅ Should return HTML (not 404)

# Or visit in browser
start https://your-app.vercel.app  # Windows
open https://your-app.vercel.app   # Mac
```

### Step 4: Post-Deployment Verification (5 minutes)

```powershell
# 1. Smoke test critical paths
# In browser, test:
✅ Login page loads
✅ Admin can login (admin / TeacherAdmin)
✅ Can view schools list
✅ Can view classes list
✅ Real-time updates work (open two tabs, book class in one, see update in other)
✅ Toast notifications appear

# 2. Check production logs
vercel logs --prod
# ✅ Should not show errors

# 3. Check Convex logs
# Dashboard → Logs → Last 15 minutes
# ✅ Should not show errors

# 4. Test on mobile (optional but recommended)
# Open on phone, verify:
# - Page loads quickly
# - Forms work
# - Responsive design looks good
```

### Step 5: Rollback (If Something Goes Wrong)

```powershell
# Rollback Convex (if backend broken)
# Dashboard → Deployments → Select previous deployment → Promote

# Rollback Vercel (if frontend broken)
vercel rollback
# Or use dashboard:
# Dashboard → Deployments → Previous deployment → Promote to Production

# Verify rollback worked
curl https://your-app.vercel.app
# Test login and core features
```

### Deployment Checklist

```markdown
Pre-Deployment:
- [ ] Local build succeeds (npm run build)
- [ ] TypeScript check passes (npx tsc --noEmit)
- [ ] Tests pass (npm run test:e2e) - optional for hotfixes
- [ ] Changes committed and pushed to main
- [ ] CHANGELOG.md updated with version and changes

Deployment:
- [ ] Convex deployed (npx convex deploy)
- [ ] Convex functions show green in dashboard
- [ ] Vercel deployed (vercel --prod)
- [ ] Deployment URL accessible

Post-Deployment:
- [ ] Login works
- [ ] Critical features tested (book class, view students)
- [ ] Real-time updates work
- [ ] No errors in logs (Vercel + Convex)
- [ ] Mobile-friendly (quick check on phone)

Documentation:
- [ ] Update version in README.md
- [ ] Create implementation summary (if new features)
- [ ] Create app update notification (npm run create-update)
- [ ] Tag release in Git (git tag v4.5.17; git push --tags)
```

---

## How-To #2: Rollback to Previous Version

### Emergency Rollback (When Production is Broken)

**Time Required**: 5-10 minutes  
**When to Use**: Critical bugs in production, deployment failed, data corruption

### Quick Rollback (Frontend Only)

```powershell
# 1. Identify last working deployment
vercel ls
# Output shows recent deployments:
# class-tracker-abc123.vercel.app (Production) ❌ Current (broken)
# class-tracker-xyz789.vercel.app              ✅ Previous (working)

# 2. Promote previous deployment
vercel promote class-tracker-xyz789.vercel.app

# Or use domain directly
vercel alias set class-tracker-xyz789.vercel.app yourdomain.com

# 3. Verify rollback
curl https://yourdomain.com
# ✅ Should return working version

# 4. Test core features
# Login, view classes, book class
```

### Full Rollback (Frontend + Backend)

```powershell
# 1. Rollback Convex FIRST (data layer)
# Dashboard → Deployments → Find last working deployment
# Click "..." → "Promote to Production"

# 2. Verify Convex rollback
# Dashboard → Functions → Test queries
# users.list should work

# 3. Rollback Vercel (frontend)
vercel promote <previous-deployment-url>

# 4. Full smoke test
# Login → View classes → Book class → View students
```

### Rollback with Data Restore

```powershell
# If data was corrupted, restore from backup

# 1. STOP ALL WRITE OPERATIONS FIRST
# Comment out mutation buttons in UI temporarily

# 2. List available backups
npm run backup:list

# Output:
# 1. Backup from 2025-11-02 10:00 AM (2 hours ago)
# 2. Backup from 2025-11-01 10:00 AM (1 day ago)
# 3. Backup from 2025-10-31 10:00 AM (2 days ago)

# 3. Restore from backup (CAREFUL!)
npm run backup:restore
# Select backup number
# Confirm restoration

# 4. Verify data integrity
# Dashboard → Data → Spot check:
# - users table has correct count
# - classes table looks normal
# - schools table intact

# 5. Re-enable write operations
# Uncomment mutation buttons

# 6. Test thoroughly
# Try creating user, booking class, etc.
```

### Partial Rollback (Just One Feature)

```powershell
# If only one feature is broken, cherry-pick the fix

# 1. Identify the commit that broke it
git log --oneline -10
# Find the bad commit hash

# 2. Revert specific commit
git revert <bad-commit-hash>

# 3. Push to trigger auto-deploy
git push origin main

# 4. Wait for deploy and verify
vercel ls  # Check new deployment
```

---

## How-To #3: User Management

### Create New User (Admin Task)

**Time Required**: 5 minutes per user

#### Via Admin UI (Recommended)

```text
1. Login as admin
2. Navigate to school management (if moderator) or user list (if teacher)
3. Click "Add User" or "Create User"
4. Fill form:
   - Username: teacher1
   - Password: TeacherTeacher1 (follow pattern)
   - Role: teacher / moderator / guardian
   - School: Select from dropdown (for moderators/teachers)
   - Require Password Change: ✅ (checked)
5. Click "Create User"
6. Verify success toast
7. Give credentials to user (username + default password)
```

#### Via Convex Dashboard (Direct)

```text
1. Visit https://dashboard.convex.dev
2. Select your deployment
3. Click "Data" in sidebar
4. Click "users" table
5. Click "+ Add Document"
6. Paste JSON:

{
  "username": "teacher1",
  "passwordHash": "$2b$10$...", // Generate with bcrypt (see below)
  "role": "teacher",
  "schoolId": "<school_id_from_schools_table>",
  "requirePasswordChange": true,
  "createdAt": 1699012800000, // Current timestamp
  "failedLoginAttempts": 0
}

7. Click "Save"
```

#### Generate Password Hash

```powershell
# Using Node.js
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TeacherTeacher1', 10, (e,h) => console.log(h));"

# Output: $2b$10$...
# Copy this into passwordHash field
```

### Reset User Password

#### Method 1: Via Admin UI

```text
1. Login as admin
2. Find user in list
3. Click "Reset Password"
4. System generates: Teacher{username}
5. Set requirePasswordChange: true
6. User must change on first login
```

#### Method 2: Via Convex Dashboard

```text
1. Dashboard → Data → users
2. Find user by username
3. Click Edit
4. Update fields:
   - passwordHash: <new_bcrypt_hash>
   - requirePasswordChange: true
   - failedLoginAttempts: 0
   - accountLockedUntil: (delete field)
5. Save
6. Inform user of new password
```

### Unlock Locked Account

```powershell
# Account locks after 5 failed login attempts

# Via Convex Dashboard:
1. Data → users → Find user
2. Edit user
3. Set:
   - failedLoginAttempts: 0
   - accountLockedUntil: (delete field)
4. Save

# Account is now unlocked
# User can login immediately
```

### Delete User (Soft Delete)

```typescript
// Via Convex mutation
await ctx.db.patch(userId, {
  isActive: false,
  deletedAt: Date.now()
});

// User cannot login
// Data preserved for audit trail
// Can be restored later if needed
```

### Bulk User Creation (Import)

```powershell
# Create CSV file: users.csv
username,role,schoolId,defaultPassword
teacher1,teacher,school123,TeacherTeacher1
teacher2,teacher,school123,TeacherTeacher2
moderator1,moderator,school123,TeacherModerator1

# Create import script: scripts/import-users.ts
import { ConvexHttpClient } from "convex/browser";
import bcrypt from "bcrypt";
import fs from "fs";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const csv = fs.readFileSync("users.csv", "utf-8");
const lines = csv.split("\n").slice(1); // Skip header

for (const line of lines) {
  const [username, role, schoolId, password] = line.split(",");
  const passwordHash = await bcrypt.hash(password, 10);
  
  await client.mutation("users:create", {
    username,
    passwordHash,
    role,
    schoolId,
    requirePasswordChange: true,
    createdAt: Date.now()
  });
  
  console.log(`✅ Created user: ${username}`);
}

# Run import
npx tsx scripts/import-users.ts
```

---

## How-To #4: Debug Production Issues

### Step 1: Gather Information (5 minutes)

```markdown
When user reports issue, collect:
1. What were they trying to do? (e.g., "Book a class")
2. What happened? (e.g., "Infinite loading spinner")
3. What did they expect? (e.g., "Class booking confirmation")
4. When did it happen? (exact time if possible)
5. What device/browser? (Chrome on Windows, Safari on iPhone, etc.)
6. Can they reproduce it? (Try again and see if same error)
```

### Step 2: Check Logs (10 minutes)

```powershell
# 1. Check Convex logs (backend errors)
# Dashboard → Logs → Last 1 hour
# Filter by error level
# Search for user's userId or timestamp

# 2. Check Vercel logs (frontend errors)
vercel logs --since 1h
# Or use dashboard → Deployments → Latest → Function Logs

# 3. Check admin error reports
# Login as admin → Error Reports tab
# Filter by:
# - Time range (last hour)
# - User (if known)
# - Component (e.g., ClassBooking)
```

### Step 3: Reproduce Locally (15 minutes)

```powershell
# 1. Get fresh data
npm run backup
# Restore to local development

# 2. Start dev servers
npx convex dev
npm run dev

# 3. Login as affected user
# Use their username and reset password if needed

# 4. Follow exact steps they reported
# Try to reproduce the error

# 5. Check browser console
# F12 → Console tab
# Look for red errors

# 6. Check network tab
# F12 → Network → Filter XHR
# Look for failed requests (red)
```

### Step 4: Isolate the Problem

```typescript
// Add console.logs to narrow down issue

// Example: Class booking not working
export const book = mutation({
  handler: async (ctx, args) => {
    console.log("1. book mutation called", { args });
    
    const teacher = await ctx.db.get(args.teacherId);
    console.log("2. teacher fetched", { teacher });
    
    const student = await ctx.db.get(args.studentId);
    console.log("3. student fetched", { student });
    
    // ... rest of function
    
    console.log("4. about to insert class");
    const classId = await ctx.db.insert("classes", data);
    console.log("5. class inserted", { classId });
    
    return classId;
  }
});

// Deploy with logs
npx convex deploy

// Try again, check logs
// See which console.log didn't appear = where it failed
```

### Step 5: Fix and Test

```powershell
# 1. Fix the bug locally
# Edit code

# 2. Test fix locally
npm run dev
# Verify issue resolved

# 3. Test edge cases
# Try with different data
# Try as different user roles

# 4. Deploy fix
npx convex deploy  # If backend fix
vercel --prod       # If frontend fix

# 5. Verify in production
# Test as the affected user (if possible)
# Check logs for errors

# 6. Inform user
# "Issue fixed, please try again"
```

### Common Issues & Quick Fixes

#### Issue: Infinite Loading Spinner

```javascript
// Check browser console (F12)
// Look for:

// 1. Convex connection error
// Fix: Verify NEXT_PUBLIC_CONVEX_URL in .env.local

// 2. Query never returns
// Fix: Check query has .withIndex() and index exists

// 3. useQuery in useEffect creating loop
// Fix: Remove useQuery from useEffect

// 4. Filter object re-created every render
const filter = useMemo(() => ({ schoolId }), [schoolId]);
const data = useQuery(api.classes.list, filter);
```

#### Issue: "User not found" error

```powershell
# Check user exists
# Dashboard → Data → users → Search by username

# If missing, restore from backup
npm run backup:restore

# If exists, check:
# - isActive: true (not soft-deleted)
# - schoolId is valid (school exists)
# - role is valid (teacher/moderator/admin/guardian)
```

#### Issue: Changes not saving

```typescript
// Add error handling to mutation
export const update = mutation({
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.id, args.updates);
      console.log("✅ Update succeeded", { id: args.id });
      return { success: true };
    } catch (error) {
      console.error("❌ Update failed", {
        error: error.message,
        stack: error.stack,
        args
      });
      throw new Error(`Update failed: ${error.message}`);
    }
  }
});

// Deploy and check error message
```

### Step 6: Document and Prevent

```markdown
1. Update CHANGELOG.md with bug fix
2. Add E2E test to prevent regression
3. Update documentation if workflow changed
4. Consider if error handling could be improved
5. Check if similar bugs exist elsewhere (same pattern)
```

---

## How-To #5: Backup and Restore Data

### Daily Backup (Automated)

#### Setup Automated Backups (Recommended)

Use the provided PowerShell script to automatically configure Windows Task Scheduler:

```powershell
# Run the setup script (requires Administrator privileges)
.\scripts\setup-windows-backup-task.ps1
```

This script will:

1. Create a task named "ClassTrackerBackup"
2. Schedule it to run daily at 02:00 AM
3. Configure it to run hidden (no popup window)
4. Ensure it runs whether user is logged in or not

#### Manual Setup (Alternative)

```powershell
# Windows Task Scheduler
# 1. Open Task Scheduler
# 2. Create Basic Task
# 3. Name: "Class Tracker Daily Backup"
# 4. Trigger: Daily at 2:00 AM
# 5. Action: Start a program
#    Program: powershell.exe
#    Arguments: -File "C:\path\to\backup-script.ps1"
```

#### Manual Backup

```powershell
# 1. Run backup command
npm run backup

# Expected output:
# ✅ Connecting to Convex...
# ✅ Fetching data from Convex...
# ✅ Connecting to MongoDB...
# ✅ Backing up users... (150 documents)
# ✅ Backing up classes... (2,847 documents)
# ✅ Backing up students... (892 documents)
# ✅ Backing up schools... (12 documents)
# ✅ Backup completed successfully
# 📦 Backup ID: 20251102_100523
# 📁 Location: MongoDB Atlas → backups → 20251102_100523

# 2. Verify backup in MongoDB
# Atlas → Database → Collections → backups
# Check latest document has today's date
```

### List Available Backups

```powershell
npm run backup:list

# Output:
# Available backups:
# 1. 2025-11-02 10:05 AM - 150 users, 2847 classes, 892 students, 12 schools
# 2. 2025-11-01 10:00 AM - 148 users, 2801 classes, 885 students, 12 schools
# 3. 2025-10-31 10:00 AM - 145 users, 2756 classes, 878 schools, 12 schools
# 4. 2025-10-30 10:00 AM - 143 users, 2699 classes, 870 students, 12 schools
# 5. 2025-10-29 10:00 AM - 140 users, 2650 classes, 865 students, 12 schools
```

### Restore from Backup

```powershell
# ⚠️ WARNING: This REPLACES current data
# Create a backup BEFORE restoring!

# 1. Backup current state first
npm run backup

# 2. Run restore command
npm run backup:restore

# 3. Select backup to restore
# Enter backup number: 2

# 4. Confirm restoration
# Restore backup from 2025-11-01 10:00 AM? (y/n): y

# 5. Wait for restore (can take 5-10 minutes)
# ✅ Connecting to MongoDB...
# ✅ Fetching backup data...
# ✅ Connecting to Convex...
# ✅ Clearing current data... (⚠️ DESTRUCTIVE)
# ✅ Restoring users... (148/148)
# ✅ Restoring classes... (2801/2801)
# ✅ Restoring students... (885/885)
# ✅ Restoring schools... (12/12)
# ✅ Restore completed successfully

# 6. Verify data
# Login → Check user count, class count, etc.
# Dashboard → Data → Spot check records
```

### Partial Restore (Single Table)

```typescript
// Edit scripts/backup-to-mongodb.ts temporarily
// Comment out tables you DON'T want to restore

// Example: Only restore users table
async function restore(backupId: string) {
  // await restoreTable("classes", backup.classes);  // COMMENTED
  await restoreTable("users", backup.users);        // ONLY THIS
  // await restoreTable("students", backup.students); // COMMENTED
  // await restoreTable("schools", backup.schools);   // COMMENTED
}

// Run restore
npm run backup:restore
```

### Export Backup to File (Offline Backup)

```powershell
# Export from MongoDB to JSON

# 1. Connect to MongoDB
mongosh "your-mongodb-connection-string"

# 2. Export collections
mongoexport --uri="your-connection-string" --collection=backups --out=backups.json

# 3. Compress for archival
tar -czf backup-2025-11-02.tar.gz backups.json

# 4. Store offsite (USB drive, Google Drive, etc.)
```

### Disaster Recovery (Full System Restore)

```powershell
# Scenario: Convex deployment deleted, all data lost

# 1. Create new Convex deployment
npx convex dev --once
# Note new deployment URL

# 2. Update environment variable
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://new-deployment.convex.cloud

# 3. Deploy schema
npx convex deploy

# 4. Restore from MongoDB backup
npm run backup:restore
# Select most recent backup

# 5. Verify all data restored
# Dashboard → Data → Check all tables

# 6. Deploy frontend
vercel --prod

# 7. Test full application
# Login → Book class → Verify real-time updates
```

### Backup Best Practices

```markdown
✅ DO:
- Backup daily (automated)
- Keep 30 days of backups minimum
- Test restore quarterly (verify backups work)
- Store offsite backup weekly (export to file)
- Backup BEFORE major changes (schema updates, migrations)
- Document backup procedure for team

❌ DON'T:
- Rely on single backup location (use MongoDB + local files)
- Skip testing restores (verify backups are valid)
- Delete old backups without policy (keep 30-90 days)
- Restore without backing up current state first
- Ignore backup failures (fix immediately)
```

---

## Quick Reference Card

```markdown
┌─────────────────────────────────────────────────────┐
│  QUICK COMMANDS - Print This!                       │
├─────────────────────────────────────────────────────┤
│  Deploy to Production:                              │
│    npx convex deploy                                │
│    vercel --prod                                    │
│                                                     │
│  Rollback:                                          │
│    vercel rollback                                  │
│    (Convex: Use dashboard)                          │
│                                                     │
│  Backup:                                            │
│    npm run backup                                   │
│    npm run backup:list                              │
│    npm run backup:restore                           │
│                                                     │
│  Logs:                                              │
│    vercel logs --since 1h                           │
│    (Convex: dashboard.convex.dev → Logs)            │
│                                                     │
│  Build Test:                                        │
│    npm run build                                    │
│    npx tsc --noEmit                                 │
│                                                     │
│  Emergency:                                         │
│    1. Check status pages                            │
│    2. Check logs (Vercel + Convex)                  │
│    3. Rollback if needed                            │
│    4. See docs/11-disaster-recovery.md              │
└─────────────────────────────────────────────────────┘
```

---

[← Back to Index](../copilot-instructions.md)
