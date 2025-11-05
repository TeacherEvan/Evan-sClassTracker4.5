# Automated Convex to MongoDB Backup System

**Version:** 4.5.12  
**Last Updated:** October 31, 2025  
**Status:** Production Ready

---

## 📋 Overview

This system provides **complete disaster recovery** for your Convex data by automatically backing up all tables to MongoDB every night at midnight. If Convex ever crashes or loses data, you can restore from the most recent backup.

### Key Features

- ✅ **Automated Daily Backups** - Runs at 00:00 (midnight) via Windows Task Scheduler
- ✅ **Complete Data Export** - Backs up all 19 Convex tables
- ✅ **MongoDB Storage** - Reliable, indexed, queryable backups
- ✅ **30-Day Retention** - Automatic cleanup of old backups
- ✅ **Manual Restore** - Safe restoration process with admin oversight
- ✅ **Backup Verification** - List and inspect all backups
- ✅ **Zero Downtime** - Runs in background without affecting app

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install MongoDB

**Option A: MongoDB Atlas (Recommended - Free Tier)**

1. Sign up at <https://www.mongodb.com/cloud/atlas>
2. Create a free M0 cluster (512MB storage)
3. Create database user: `backup-user` with password
4. Whitelist IP: `0.0.0.0/0` (allow all IPs)
5. Get connection string from "Connect" button

**Option B: Local MongoDB (Development)**

```powershell
# Download and install from https://www.mongodb.com/try/download/community
# MongoDB will auto-start on localhost:27017
```

### Step 2: Configure Environment

```powershell
# Copy example file
cp .env.backup.example .env.local

# Edit .env.local and add MongoDB URI
# For Atlas:
MONGODB_BACKUP_URI=mongodb+srv://backup-user:PASSWORD@cluster0.xxxxx.mongodb.net

# For Local:
MONGODB_BACKUP_URI=mongodb://localhost:27017
```

### Step 3: Install Dependencies

```powershell
npm install
```

### Step 4: Test Manual Backup

```powershell
npm run backup
```

Expected output:

```
📡 Connecting to Convex...
📥 Exporting table: users...
   ✅ Exported 15 records from users
📥 Exporting table: classes...
   ✅ Exported 247 records from classes
...
✅ Backup completed successfully!
📊 Statistics:
   - Backup ID: backup_1730419200000
   - Total Tables: 19
   - Total Records: 1,532
   - Duration: 2.34s
   - Size: 4.7 MB
```

### Step 5: Set Up Automated Daily Backups

**Open PowerShell as Administrator** and run:

```powershell
.\scripts\setup-windows-backup-task.ps1
```

This creates a Windows Task Scheduler task that runs `npm run backup` daily at midnight.

---

## 📚 Usage Guide

### Available Commands

```powershell
# Create backup now
npm run backup

# List all backups
npm run backup:list

# Restore from latest backup
npm run backup:restore

# Restore from specific backup
npm run backup:restore backup_1730419200000

# Clean up old backups (older than 30 days)
npm run backup:cleanup

# Start automated scheduler (runs until stopped)
npm run backup:schedule
```

### Example: List Backups

```powershell
npm run backup:list
```

Output:

```
============================================================
📋 Available Backups
============================================================

✅ backup_1730419200000
   Date: 2025-10-31T00:00:00.000Z
   Status: completed
   Records: 1,532
   Size: 4.7 MB
   Duration: 2.34s

✅ backup_1730332800000
   Date: 2025-10-30T00:00:00.000Z
   Status: completed
   Records: 1,498
   Size: 4.5 MB
   Duration: 2.18s
```

---

## 🗄️ MongoDB Structure

### Database: `convex_backups`

```typescript
// Collection: backups
{
  _id: ObjectId("..."),
  metadata: {
    backupId: "backup_1730419200000",
    timestamp: 1730419200000,
    date: "2025-10-31T00:00:00.000Z",
    convexDeploymentUrl: "https://resolute-basilisk-801.convex.cloud",
    tableCount: 19,
    totalRecords: 1532,
    status: "completed",
    duration: 2340, // milliseconds
    tables: [
      { name: "users", recordCount: 15, sizeBytes: 24680 },
      { name: "classes", recordCount: 247, sizeBytes: 385920 },
      // ... all tables
    ]
  },
  data: {
    users: [ /* all user records */ ],
    classes: [ /* all class records */ ],
    students: [ /* all student records */ ],
    // ... all 19 tables
  }
}
```

### Indexes

- `metadata.timestamp` (descending) - Fast lookup by date
- `metadata.status` - Filter by completed/failed
- `metadata.date` - Query by date range

---

## 🔄 Disaster Recovery Process

### Scenario: Convex Data Lost

**If Convex crashes and you lose data:**

1. **Verify Backup Exists**

   ```powershell
   npm run backup:list
   ```

2. **Review Backup Data in MongoDB**

   ```javascript
   // Connect to MongoDB
   const client = new MongoClient(process.env.MONGODB_BACKUP_URI);
   await client.connect();
   const db = client.db("convex_backups");
   
   // Find latest backup
   const backup = await db.collection("backups")
     .find({ "metadata.status": "completed" })
     .sort({ "metadata.timestamp": -1 })
     .limit(1)
     .toArray();
   
   // Inspect data
   console.log(backup[0].data.users); // All users
   console.log(backup[0].data.classes); // All classes
   ```

3. **Restore via Convex Dashboard**

   - Go to <https://dashboard.convex.dev>
   - Select your deployment
   - Go to "Data" tab
   - For each table:
     - Click "Import"
     - Upload JSON data from MongoDB backup
     - Map fields correctly
     - Confirm import

4. **Verify Data Integrity**

   ```powershell
   # Check record counts match
   npm run backup:list
   # Compare with current Convex data
   ```

**⚠️ Important:** Automated restore is intentionally NOT implemented for safety. Manual restoration ensures you review data before overwriting.

---

## ⚙️ Configuration Options

### Environment Variables (`.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_BACKUP_URI` | ✅ Yes | N/A | MongoDB connection string |
| `MONGODB_BACKUP_DB` | No | `convex_backups` | Database name for backups |
| `BACKUP_RETENTION_DAYS` | No | `30` | Days to keep old backups |

### Retention Policy

Backups older than `BACKUP_RETENTION_DAYS` are automatically deleted during:

- Scheduled backups (daily at midnight)
- Manual cleanup: `npm run backup:cleanup`

**Example:** With default 30-day retention:

- Backups from last 30 days: ✅ Kept
- Backups older than 30 days: ❌ Deleted

To keep backups forever: Set `BACKUP_RETENTION_DAYS=36500` (100 years)

---

## 🔧 Troubleshooting

### Error: "NEXT_PUBLIC_CONVEX_URL not found"

**Solution:** Make sure `.env.local` contains your Convex URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Error: "Unable to connect to MongoDB"

**Solution:** Check MongoDB is running:

```powershell
# For local MongoDB
mongod --version

# For Atlas
# Verify IP is whitelisted in Atlas dashboard
```

### Error: "Service temporarily unavailable" (Convex)

**Solution:** Convex service is down. Wait and retry:

```powershell
# Retry after 5 minutes
Start-Sleep -Seconds 300
npm run backup
```

### Backup Shows "failed" Status

**Solution:** Check MongoDB backup document for error details:

```javascript
const backup = await db.collection("backups")
  .findOne({ "metadata.status": "failed" });
console.log(backup.metadata.error);
```

### Task Scheduler Not Running

**Solution:** Check task status:

```powershell
Get-ScheduledTask -TaskName "ConvexBackupToMongoDB" | Get-ScheduledTaskInfo

# View task history
Get-ScheduledTaskInfo -TaskName "ConvexBackupToMongoDB"

# Run manually to test
schtasks /run /tn ConvexBackupToMongoDB
```

---

## 📊 Monitoring & Logs

### Check Last Backup Status

```powershell
npm run backup:list
```

### MongoDB Query Examples

```javascript
// Count total backups
db.backups.countDocuments()

// Get backup statistics
db.backups.aggregate([
  { $match: { "metadata.status": "completed" } },
  { $group: {
    _id: null,
    avgDuration: { $avg: "$metadata.duration" },
    avgRecords: { $avg: "$metadata.totalRecords" },
    totalSize: { $sum: { $sum: "$metadata.tables.sizeBytes" } }
  }}
])

// Find largest backup
db.backups.find().sort({ "metadata.totalRecords": -1 }).limit(1)

// Check backup frequency
db.backups.aggregate([
  { $group: {
    _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$metadata.timestamp" } } },
    count: { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
])
```

### Windows Event Log

Task Scheduler logs are in Windows Event Viewer:

- Event Viewer → Task Scheduler → Microsoft → Windows → TaskScheduler

---

## 🔒 Security Considerations

### MongoDB Authentication

**Production:** Always use authenticated connections:

```env
MONGODB_BACKUP_URI=mongodb+srv://backup-user:STRONG_PASSWORD@cluster.net
```

**Never** use unauthenticated MongoDB in production.

### Data Encryption

MongoDB Atlas provides:

- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS/SSL)
- ✅ Network isolation

For local MongoDB, enable authentication:

```powershell
# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "STRONG_PASSWORD",
  roles: ["root"]
})

# Restart with auth
mongod --auth
```

### Sensitive Data

Backups contain **ALL user data**, including:

- ⚠️ Password hashes (btoa-encoded - see security docs)
- ⚠️ Personal student information
- ⚠️ Class schedules and notes

**Recommendations:**

- Use encrypted connections (TLS)
- Restrict MongoDB access (IP whitelist)
- Regular security audits
- Comply with data protection laws (GDPR, PDPA)

---

## 📈 Performance & Scaling

### Backup Size Estimates

| Records | Avg Size | Duration |
|---------|----------|----------|
| 1,000 | ~3 MB | ~1.5s |
| 5,000 | ~15 MB | ~4s |
| 10,000 | ~30 MB | ~8s |
| 50,000 | ~150 MB | ~40s |

### MongoDB Storage Requirements

With 30-day retention:

- Daily backup size × 30 = Total storage needed
- Example: 5 MB/day × 30 = 150 MB

**MongoDB Atlas Free Tier:** 512 MB storage (enough for ~100 days at 5 MB/day)

### Optimization Tips

1. **Reduce Retention Period** if storage is limited:

   ```env
   BACKUP_RETENTION_DAYS=7  # Only keep 1 week
   ```

2. **Exclude Large Tables** (edit `scripts/backup-to-mongodb.ts`):

   ```typescript
   const TABLES_TO_BACKUP = [
     "users", "classes", "students",
     // Exclude: "auditLogs", "errorReports" (large tables)
   ];
   ```

3. **Compress Backups** (future enhancement):

   ```typescript
   // Store as compressed BSON
   await backupsCollection.insertOne({
     metadata,
     data: compress(JSON.stringify(data))
   });
   ```

---

## 🛠️ Advanced Usage

### Custom Backup Schedule

**Every 6 hours:**

```typescript
// In setup-windows-backup-task.ps1, change:
$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00"

// To:
$Trigger = @(
  New-ScheduledTaskTrigger -Daily -At "00:00"
  New-ScheduledTaskTrigger -Daily -At "06:00"
  New-ScheduledTaskTrigger -Daily -At "12:00"
  New-ScheduledTaskTrigger -Daily -At "18:00"
)
```

### Backup to Multiple Locations

```typescript
// In scripts/backup-to-mongodb.ts, add:
const BACKUP_LOCATIONS = [
  process.env.MONGODB_BACKUP_URI,
  process.env.MONGODB_BACKUP_URI_SECONDARY,
  process.env.MONGODB_BACKUP_URI_OFFSITE,
];

for (const uri of BACKUP_LOCATIONS) {
  await storeBackup(uri, backupData);
}
```

### Email Notifications on Failure

```typescript
// Add to runScheduledBackup():
import nodemailer from "nodemailer";

try {
  await createBackup();
} catch (error) {
  const transporter = nodemailer.createTransport(/* config */);
  await transporter.sendMail({
    to: "admin@example.com",
    subject: "❌ Backup Failed",
    text: `Backup failed: ${error.message}`
  });
}
```

---

## 📝 Next Steps

After setting up backups:

1. ✅ **Test restore process** - Verify you can actually restore from backup
2. ✅ **Document recovery plan** - Write down steps for your team
3. ✅ **Set up monitoring** - Get alerts if backups fail
4. ✅ **Review security** - Ensure MongoDB is properly secured
5. ✅ **Schedule audits** - Quarterly review of backup health

---

## 🤝 Support

For issues or questions:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review MongoDB Atlas docs: <https://docs.atlas.mongodb.com>
3. Check Convex docs: <https://docs.convex.dev>
4. Open issue in repository

---

## 📄 License

This backup system is part of Evan's Class Tracker 4.5.  
Use at your own risk. Always test restores before relying on backups!

---

**Last Updated:** October 31, 2025  
**Version:** 4.5.12
