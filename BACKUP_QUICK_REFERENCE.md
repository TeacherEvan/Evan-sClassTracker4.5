# Backup System - Quick Reference Card

**Version:** 4.5.12 | **Date:** October 31, 2025

---

## ⚡ Quick Commands

```powershell
# One-time setup (requires Admin PowerShell)
.\scripts\setup-windows-backup-task.ps1

# Manual operations
npm run backup          # Create backup now
npm run backup:list     # View all backups
npm run backup:restore  # Restore from latest
npm run backup:cleanup  # Delete old backups

# Verification
schtasks /query /tn ConvexBackupToMongoDB  # Check task status
```

---

## 🔧 Quick Setup (3 Steps)

### 1. Configure MongoDB URI

**Option A: MongoDB Atlas (Free - Recommended)**

- Go to <https://mongodb.com/cloud/atlas>
- Create free cluster → Get connection string
- Add to `.env.local`:

```env
MONGODB_BACKUP_URI=mongodb+srv://user:password@cluster.mongodb.net
```

**Option B: Local MongoDB**

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

## 🆘 Disaster Recovery (If Convex Crashes)

### Step 1: Find Latest Backup

```powershell
npm run backup:list
```

Note the `backupId` of the latest successful backup.

### Step 2: Access MongoDB

```javascript
// Connect to MongoDB (use MongoDB Compass or mongosh)
const client = new MongoClient(process.env.MONGODB_BACKUP_URI);
await client.connect();
const db = client.db("convex_backups");

// Get latest backup
const backup = await db.collection("backups")
  .find({ "metadata.status": "completed" })
  .sort({ "metadata.timestamp": -1 })
  .limit(1)
  .toArray();

// All your data is in backup[0].data
console.log(backup[0].data.users);     // All users
console.log(backup[0].data.classes);   // All classes
console.log(backup[0].data.students);  // All students
// ... etc for all 19 tables
```

### Step 3: Restore to Convex

1. Go to <https://dashboard.convex.dev>
2. Select your deployment
3. For each table, click "Import" and upload JSON from MongoDB backup
4. Verify data integrity

---

## 📊 What Gets Backed Up

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

## ⚠️ Important Notes

### Security

- Backups contain **ALL user data** (including password hashes)
- Use encrypted MongoDB connections (TLS/SSL)
- Restrict MongoDB access (IP whitelist)

### Storage

- **MongoDB Atlas Free Tier:** 512 MB (enough for ~100 backups at 5 MB each)
- **Retention:** Default 30 days (adjust via `BACKUP_RETENTION_DAYS`)

### Testing

- **Always test restore** before relying on backups
- **Monthly verification:** Run `npm run backup:list` to check health

---

## 🔍 Monitoring

### Check Task Status

```powershell
Get-ScheduledTask -TaskName "ConvexBackupToMongoDB" | Get-ScheduledTaskInfo
```

### View Backup History

```powershell
npm run backup:list
```

### MongoDB Health

```javascript
// In MongoDB Compass or mongosh
use convex_backups
db.backups.countDocuments({ "metadata.status": "completed" })
```

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "MONGODB_BACKUP_URI not set" | Add to `.env.local` |
| "Unable to connect to MongoDB" | Check MongoDB is running |
| "Convex 503 error" | Convex service down - retry later |
| Task not running | Check Task Scheduler with Admin PowerShell |

---

## 📞 Need Help?

1. Read full guide: `docs/BACKUP_SYSTEM_GUIDE.md`
2. Check troubleshooting section
3. Test manually: `npm run backup`

---

**Remember:** This backup system protects against Convex data loss. Test restore process to ensure it works when you need it!
