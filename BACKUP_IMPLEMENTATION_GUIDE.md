# Convex Backup Implementation Guide

**Quick Start Guide for Immediate Implementation**

---

## ⚡ Quick Setup (15 Minutes)

### Step 1: Upgrade to Convex Pro (5 minutes)

1. **Go to Convex Dashboard**:
   ```
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
```
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

## ☁️ Cloud Storage Setup (15-30 Minutes)

### Option A: Cloudflare R2 (Recommended - Cheapest)

**Pricing**: $0.015/GB/month (100GB = $1.50/month)

1. **Create Cloudflare account**: https://dash.cloudflare.com

2. **Create R2 bucket**:
   - Go to R2 → Create bucket
   - Name: `class-tracker-backups`
   - Location: Automatic

3. **Create API token**:
   - R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Copy Access Key ID and Secret Access Key

4. **Configure environment variables**:
   ```powershell
   # .env.local (DO NOT COMMIT)
   R2_BUCKET=class-tracker-backups
   R2_ACCESS_KEY_ID=your-access-key-id
   R2_SECRET_ACCESS_KEY=your-secret-access-key
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   ```

5. **Install rclone** (for uploads):
   ```powershell
   # Windows (via Chocolatey)
   choco install rclone
   
   # Or download from https://rclone.org/downloads/
   ```

6. **Test upload**:
   ```powershell
   npm run backup:convex:r2
   ```

---

### Option B: AWS S3

**Pricing**: $0.023/GB/month (100GB = $2.30/month)

1. **Create AWS account**: https://aws.amazon.com

2. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://class-tracker-backups --region us-east-1
   ```

3. **Create IAM user** with S3 permissions:
   - IAM → Users → Add user
   - Permissions: AmazonS3FullAccess
   - Copy Access Key ID and Secret Access Key

4. **Configure AWS CLI**:
   ```powershell
   aws configure
   # AWS Access Key ID: [paste]
   # AWS Secret Access Key: [paste]
   # Default region: us-east-1
   # Default output format: json
   ```

5. **Configure environment**:
   ```powershell
   # .env.local
   AWS_S3_BUCKET=class-tracker-backups
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   ```

6. **Test upload**:
   ```powershell
   npm run backup:convex:s3
   ```

---

### Option C: Local Only (Free)

**Skip cloud upload**, just keep local backups:

```powershell
# Run daily manually
npm run backup:convex

# Or schedule with Windows Task Scheduler
# (see Automation section below)
```

**Pros**: Free, simple  
**Cons**: No off-site backup (risk of data loss if computer fails)

---

## 🤖 Automation Options

### Option A: GitHub Actions (Recommended)

**Already configured** in `.github/workflows/backup-convex.yml`

1. **Add GitHub Secrets**:
   - Go to repo → Settings → Secrets and variables → Actions
   - Add secrets:
     ```
     CONVEX_DEPLOYMENT=your-deployment-url
     
     # For S3 (if using)
     AWS_ACCESS_KEY_ID=your-key
     AWS_SECRET_ACCESS_KEY=your-secret
     AWS_S3_BUCKET=class-tracker-backups
     
     # For R2 (if using)
     R2_ACCESS_KEY_ID=your-key
     R2_SECRET_ACCESS_KEY=your-secret
     R2_BUCKET=class-tracker-backups
     R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
     
     # For notifications (optional)
     SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
     NOTIFICATION_EMAIL=admin@yourdomain.com
     ```

2. **Test workflow**:
   - Go to Actions tab
   - Select "Daily Convex Backup"
   - Click "Run workflow"
   - Verify success

3. **Scheduled backups**:
   - Runs automatically at 2 AM UTC daily
   - No further action needed!

---

### Option B: Windows Task Scheduler

1. **Open Task Scheduler**: `taskschd.msc`

2. **Create Task**:
   - Name: "Daily Convex Backup"
   - Trigger: Daily at 2 AM
   - Action: `powershell.exe`
   - Arguments: `-File "C:\path\to\project\scripts\backup-convex.ps1"`

3. **Configure conditions**:
   - Run whether user is logged on or not
   - Run with highest privileges
   - Wake computer to run

---

### Option C: Cron (macOS/Linux)

```bash
# Edit crontab
crontab -e

# Add line (runs at 2 AM daily)
0 2 * * * cd /path/to/project && npm run backup:convex >> /var/log/convex-backup.log 2>&1
```

---

## 🚨 Disaster Recovery Procedure

### Scenario: Convex down for >4 hours

**Recovery Time**: 2-4 hours (manual process)

#### Step 1: Download Latest Backup (5 minutes)

```powershell
# From S3
aws s3 cp s3://class-tracker-backups/convex-backups/convex-backup-2025-11-04-0200.zip ./

# From R2
rclone copy r2:class-tracker-backups/convex-backups/convex-backup-2025-11-04-0200.zip ./

# From local
# Already in ./backups/ directory
```

#### Step 2: Create Supabase Project (15 minutes)

1. **Sign up**: https://supabase.com

2. **Create project**:
   - Name: `class-tracker-emergency`
   - Database password: [generate strong password]
   - Region: Closest to users

3. **Copy connection details**:
   - URL: `https://xxx.supabase.co`
   - Anon key: `eyJ...`
   - Service role key: `eyJ...`

#### Step 3: Import Data to Supabase (1-2 hours)

```powershell
# 1. Extract backup
Expand-Archive -Path ./convex-backup-2025-11-04-0200.zip -DestinationPath ./extracted

# 2. Run conversion script (if prepared)
node scripts/convex-to-postgres.js ./extracted

# 3. Import to Supabase
psql postgresql://postgres:password@db.xxx.supabase.co:5432/postgres < converted-backup.sql
```

**Note**: Full conversion script not included in quick start. For full migration, see detailed guide in `CONVEX_RELIABILITY_AND_MIGRATION_ANALYSIS.md`

#### Step 4: Deploy Emergency Frontend (30 minutes)

```powershell
# 1. Checkout emergency branch (if prepared)
git checkout emergency-supabase

# 2. Configure environment
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 3. Deploy to Vercel
vercel --prod
```

#### Step 5: Notify Users (10 minutes)

Email/SMS: "Service restored on backup infrastructure. Some features may be limited."

---

## 📊 Monitoring & Verification

### Daily Checks (5 minutes)

```powershell
# 1. Verify latest backup exists
Get-ChildItem ./backups -Filter "convex-backup-*.zip" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -First 1 | 
  Select-Object Name, Length, LastWriteTime

# 2. Check cloud storage (if using S3)
aws s3 ls s3://class-tracker-backups/convex-backups/ --recursive | 
  Sort-Object -Property LastWriteTime -Descending | 
  Select-Object -First 5

# 3. Test restore (monthly)
npx convex import --path ./backups/latest-backup.zip --dry-run
```

### Weekly Reports

**Script**: `scripts/backup-report.ps1`

```powershell
# Generate weekly backup report
$backups = Get-ChildItem ./backups -Filter "convex-backup-*.zip" | 
  Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }

Write-Host "📊 Weekly Backup Report ($(Get-Date -Format 'yyyy-MM-dd'))"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "Total backups: $($backups.Count)"
Write-Host "Total size: $([math]::Round(($backups | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB"
Write-Host "Oldest backup: $(($backups | Sort-Object LastWriteTime | Select-Object -First 1).LastWriteTime)"
Write-Host "Latest backup: $(($backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime)"
```

---

## 📝 Checklist

### Immediate (This Week) ✅

- [ ] Upgrade to Convex Pro ($25/month)
- [ ] Test manual backup (`npm run backup:convex:now`)
- [ ] Add scripts to package.json
- [ ] Configure .gitignore (exclude backups/)
- [ ] Choose cloud storage provider (R2 recommended)
- [ ] Configure cloud storage credentials (.env.local)
- [ ] Test cloud upload
- [ ] Set up GitHub Actions workflow
- [ ] Add GitHub Secrets
- [ ] Test automated backup (manual trigger)
- [ ] Document recovery procedure

### This Month 🟡

- [ ] Create Supabase account (free tier)
- [ ] Create emergency Supabase project
- [ ] Write data conversion script (convex-to-postgres.js)
- [ ] Test conversion with sample backup
- [ ] Create emergency frontend branch
- [ ] Test emergency deployment locally
- [ ] Print recovery playbook (offline copy)
- [ ] Share plan with team/stakeholders

### Ongoing 📅

- [ ] Monitor daily backups (verify success)
- [ ] Review weekly backup reports
- [ ] Test restore procedure monthly
- [ ] Track Convex incident frequency
- [ ] Clean up old backups (>30 days)
- [ ] Review costs quarterly

---

## 💰 Cost Summary

| Item | Monthly | Annual | Notes |
|------|---------|--------|-------|
| **Convex Pro** | $25 | $300 | Priority recovery |
| **Cloudflare R2 (100GB)** | $1.50 | $18 | Backup storage |
| **Supabase (Free)** | $0 | $0 | Emergency hot-swap |
| **GitHub Actions** | $0 | $0 | Free tier (2,000 min/month) |
| **TOTAL** | **$26.50** | **$318** | **95% risk reduction** |

**ROI**: $17,682/year in downtime savings (estimated)

---

## 🆘 Support

### Convex Support

- Email: support@convex.dev
- Discord: https://discord.gg/convex
- Status: https://status.convex.dev

### Supabase Support

- Email: support@supabase.io
- Discord: https://discord.supabase.com
- Status: https://status.supabase.com

### This Project

- Main doc: `CONVEX_RELIABILITY_AND_MIGRATION_ANALYSIS.md`
- GitHub Issues: [link to repo issues]
- Emergency contact: [your contact info]

---

**Last Updated**: November 4, 2025  
**Next Review**: December 4, 2025
