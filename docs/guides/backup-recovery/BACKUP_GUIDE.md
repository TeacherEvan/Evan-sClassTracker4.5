# Backup System Guide - Evan's Class Tracker

## Complete guide for Convex backup automation and disaster recovery

**Version:** 4.5.18 | **Last Updated:** November 5, 2025

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Quick Setup (3 Steps)](#quick-setup-3-steps)
- [Implementation Guide](#implementation-guide)
- [Cloud Storage Setup](#cloud-storage-setup)
- [Disaster Recovery](#disaster-recovery)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Quick Reference

### ⚡ Quick Commands

```powershell
# Manual operations
npm run backup          # Create backup now
npm run backup:list     # View all backups
npm run backup:restore  # Restore from latest
npm run backup:cleanup  # Delete old backups

# One-time setup (requires Admin PowerShell)
.\scripts\setup-windows-backup-task.ps1

# Verification
schtasks /query /tn ConvexBackupToMongoDB  # Check task status
```

### 📊 What Gets Backed Up

✅ **All 19 Convex tables** (complete snapshot):

- users, schools, providers
- classes, students, locations
- teacherResources, messages, notifications
- notificationWindows, appUpdates
- postClassNotes, teacherClassCountCycles
- adminContactRequests, errorReports
- auditLogs, teacherLogs
- sangsomEvents, sangsomDeletedStudents

🕐 **When:** Every day at 00:00 (midnight)  
💾 **Where:** MongoDB database `convex_backups`  
🗑️ **Retention:** 30 days (configurable)

---

## Quick Setup (3 Steps)

### 1. Configure MongoDB URI

#### Option A: MongoDB Atlas (Free - Recommended)

- Go to <https://mongodb.com/cloud/atlas>
- Create free cluster → Get connection string
- Add to `.env.local`:

```env
MONGODB_BACKUP_URI=mongodb+srv://user:password@cluster.mongodb.net
```

#### Option B: Local MongoDB

- Install from <https://mongodb.com/try/download/community>
- Add to `.env.local`:

```env
MONGODB_BACKUP_URI=mongodb://localhost:27017
```

### 2. Test Backup

```powershell
npm run backup
```

Expected: `✅ Backup completed successfully!`

### 3. Set Up Automation

**Open PowerShell as Administrator:**

```powershell
.\scripts\setup-windows-backup-task.ps1
```

✅ Done! Backups run automatically at midnight.

---

## Implementation Guide

### Step 1: Upgrade to Convex Pro (5 minutes)

1. **Go to Convex Dashboard**:

   ```text
   https://dashboard.convex.dev/t/your-team/your-project/settings
   ```

2. **Click "Upgrade to Pro"**

3. **Enter payment details** ($25/month)

4. **Verify upgrade successful**

**Benefit**: Priority incident recovery (30-90 min vs 4-8+ hours)

---

### Step 2: Test Manual Backup (5 minutes)

```powershell
# 1. Create backup directory
New-Item -ItemType Directory -Path ./backups -Force

# 2. Run manual export
npx convex export --path ./backups/test-backup.zip --include-file-storage --prod

# 3. Verify backup created
Get-Item ./backups/test-backup.zip | Select-Object Name, Length, LastWriteTime
```

**Expected output**:

```text
Name               Length         LastWriteTime
----               ------         -------------
test-backup.zip    52428800      11/4/2025 10:30:00 AM
```

---

### Step 3: Add Backup Scripts to package.json (2 minutes)

```json
{
  "scripts": {
    "backup:convex": "pwsh -File scripts/backup-convex.ps1",
    "backup:convex:now": "npx convex export --path ./backups/manual-backup-$(date +%Y-%m-%d).zip --include-file-storage --prod",
    "backup:convex:s3": "pwsh -File scripts/backup-convex.ps1 -UploadToCloud -CloudProvider s3",
    "backup:convex:r2": "pwsh -File scripts/backup-convex.ps1 -UploadToCloud -CloudProvider r2"
  }
}
```

**Test**:

```powershell
npm run backup:convex:now
```

---

### Step 4: Configure .gitignore (1 minute)

Add to `.gitignore`:

```gitignore
# Convex backups (sensitive data)
backups/
*.zip

# Environment variables (cloud credentials)
.env.local
.env.production
```

---

## Cloud Storage Setup

### Option A: Cloudflare R2 (Recommended - Cheapest)

**Pricing**: $0.015/GB/month (100GB = $1.50/month)

1. **Create Cloudflare account**: <https://dash.cloudflare.com>

2. **Create R2 bucket**:
   - Go to R2 → Create bucket
   - Name: `class-tracker-backups`
   - Location: Automatic

3. **Create API token**:
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Copy: Access Key ID, Secret Access Key

4. **Add to .env.local**:

```env
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=class-tracker-backups
```

1. **Test upload**:

```powershell
npm run backup:convex:r2
```

---

### Option B: AWS S3

**Pricing**: $0.023/GB/month (100GB = $2.30/month)

1. **Create S3 bucket**: <https://console.aws.amazon.com/s3>
2. **Create IAM user** with S3 access
3. **Add to .env.local**:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=class-tracker-backups
```

1. **Test upload**:

```powershell
npm run backup:convex:s3
```

---

## Disaster Recovery

### 🆘 If Convex Crashes - Recovery Steps

#### Step 1: Find Latest Backup

```powershell
npm run backup:list
```

Note the `backupId` of the latest successful backup.

---

#### Step 2: Access MongoDB

```javascript
// Connect to MongoDB (use MongoDB Compass or mongosh)
const client = new MongoClient(process.env.MONGODB_BACKUP_URI);
await client.connect();
const db = client.db("convex_backups");

// Get latest backup
const backup = await db.collection("backups").find({ "metadata.status": "completed" }).sort({ "metadata.timestamp": -1 }).limit(1).toArray();

// All your data is in backup[0].data
console.log(backup[0].data.users); // All users
console.log(backup[0].data.classes); // All classes
console.log(backup[0].data.students); // All students
// ... etc for all 19 tables
```

---

#### Step 3: Restore to Convex

1. Go to <https://dashboard.convex.dev>
2. Select your deployment
3. For each table, click "Import" and upload JSON from MongoDB backup
4. Verify data integrity

---

## Monitoring & Maintenance

### Check Task Status

```powershell
Get-ScheduledTask -TaskName "ConvexBackupToMongoDB" | Get-ScheduledTaskInfo
```

### View Backup History

```powershell
npm run backup:list
```

### MongoDB Health Check

```javascript
// In MongoDB Compass or mongosh
use convex_backups
db.backups.countDocuments({ "metadata.status": "completed" })
```

### Monthly Verification Checklist

- [ ] Run `npm run backup:list` - verify recent backups exist
- [ ] Check MongoDB storage usage (Atlas free tier = 512 MB)
- [ ] Test restore process on staging environment
- [ ] Review backup logs for errors
- [ ] Verify scheduled task is running (Task Scheduler)

---

## Troubleshooting

### Common Issues

| Issue                          | Solution                                             |
| ------------------------------ | ---------------------------------------------------- |
| "MONGODB_BACKUP_URI not set"   | Add to `.env.local`                                  |
| "Unable to connect to MongoDB" | Check MongoDB is running                             |
| "Convex 503 error"             | Convex service down - retry later                    |
| Task not running               | Check Task Scheduler with Admin PowerShell           |
| "Backup too large"             | MongoDB Atlas free tier = 512 MB, consider upgrading |
| "Connection refused"           | Check MongoDB IP whitelist settings                  |

### Debug Mode

Run backup manually with verbose output:

```powershell
$env:DEBUG="true"; npm run backup
```

### Cleanup Old Backups

Manually clean up backups older than 30 days:

```powershell
npm run backup:cleanup
```

Or configure auto-cleanup via environment variable:

```env
BACKUP_RETENTION_DAYS=30
```

---

## Security Best Practices

### ⚠️ Important Notes

- Backups contain **ALL user data** (including password hashes)
- Use encrypted MongoDB connections (TLS/SSL)
- Restrict MongoDB access (IP whitelist)
- Never commit `.env.local` to Git
- Use strong MongoDB credentials
- Enable 2FA on MongoDB Atlas account

### Backup Encryption (Optional)

For extra security, encrypt backup files before cloud upload:

```powershell
# Encrypt backup
.\scripts\encrypt-backup.ps1 -BackupFile ./backups/latest.zip -Password "strong-password"

# Decrypt for restore
.\scripts\decrypt-backup.ps1 -EncryptedFile ./backups/latest.zip.enc -Password "strong-password"
```

---

## Storage Capacity Planning

### MongoDB Atlas Free Tier

- **Limit:** 512 MB
- **Typical backup size:** ~5 MB per backup
- **Capacity:** ~100 backups (30 days at 3 backups/day)
- **Recommendation:** Clean up old backups weekly

### Cloud Storage (R2/S3)

- **R2 pricing:** $0.015/GB/month
- **S3 pricing:** $0.023/GB/month
- **100 backups @ 5 MB each:** 500 MB = $0.75-$1.15/month

### Backup Size Estimation

Current database size: ~2,847 classes, 892 students, 150 users = **~4-6 MB compressed**

---

## Advanced Usage

### Custom Retention Policy

```env
# Keep backups for 90 days instead of 30
BACKUP_RETENTION_DAYS=90
```

### Multi-Region Backups

Backup to multiple clouds for disaster recovery:

```powershell
# Backup to both R2 and S3
npm run backup:convex:r2
npm run backup:convex:s3
```

### Incremental Backups

For very large databases, consider incremental backups:

```powershell
# Full backup weekly
# Incremental daily (only changed tables)
# See scripts/backup-convex-incremental.ps1
```

---

## Cost Analysis

### Current Setup (Recommended)

- **Convex Pro:** $25/month
- **Cloudflare R2:** $1.50/month (100GB)
- **Total:** $26.50/month

### ROI Analysis

- **Downtime cost:** ~$17,682/year (estimated)
- **Backup cost:** $318/year
- **ROI:** 5,460% return on investment
- **Payback period:** ~6.5 days

---

## Related Documentation

- [Disaster Recovery Protocols](.github/copilot-docs/11-disaster-recovery.md)
- [How-To Guides - Backup & Restore](.github/copilot-docs/14-how-to-guides.md#how-to-5-backup-and-restore-data)
- [Convex Reliability Analysis](./CONVEX_RELIABILITY_AND_MIGRATION_ANALYSIS.md)

---

**Remember:** This backup system protects against Convex data loss. Test restore process monthly to ensure it works when you need it!
