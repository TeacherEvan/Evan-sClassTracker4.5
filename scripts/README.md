# Scripts Directory

This directory contains automation scripts for maintenance, deployment, testing, and data migration tasks.

## 📦 Available Scripts

### 🔄 Migration Scripts

#### `run-guardian-migration.ps1` (NEW)

**Purpose**: Automate guardian-to-provider migration with safety checks and verification

**Features**:

- Pre-flight checks (Convex connection, backup verification)
- Interactive prompts with confirmations
- Dry-run mode to preview changes
- Live migration execution
- Cleanup of deprecated fields
- Post-migration verification

**Usage**:

```powershell
# Preview migration (recommended first step)
.\scripts\run-guardian-migration.ps1 -DryRun $true

# Run actual migration with backup
.\scripts\run-guardian-migration.ps1 -DryRun $false -Backup $true

# Cleanup deprecated fields (after migration verified)
.\scripts\run-guardian-migration.ps1 -Cleanup $true -CleanupPhase "all"
```

**Documentation**: See `docs/migrations/GUARDIAN_MIGRATION_RUNBOOK.md`

#### `test-guardian-migration.js` (NEW)

**Purpose**: Testing helper for local guardian migration

**Usage**:

```bash
node scripts/test-guardian-migration.js
```

Shows step-by-step instructions for testing migration in local development environment.

#### `validate-migration-script.mjs` (NEW)

**Purpose**: Automated validation of migration implementation against acceptance criteria

**Usage**:

```bash
node scripts/validate-migration-script.mjs
```

**Features**:

- Checks all 7 acceptance criteria
- Validates 38 implementation points
- Verifies file existence and code structure
- Provides detailed pass/fail report
- Exit code 0 on success, 1 on failure

**Output**: See `docs/migrations/MIGRATION_VALIDATION_REPORT_DEC_6_2025.md`

#### `migrate-bcrypt-passwords.ps1`

**Purpose**: Migrate legacy bcrypt password hashes to PBKDF2

**Usage**:

```powershell
.\scripts\migrate-bcrypt-passwords.ps1
```

---

### 💾 Backup & Restore Scripts

#### `backup-convex.ps1`

**Purpose**: Create timestamped JSON backup of Convex database

**Usage**:

```powershell
.\scripts\backup-convex.ps1
```

Creates backup in `backups/` directory with format: `convex-backup-YYYY-MM-DD-HH-MM-SS.json`

#### `backup-to-mongodb.ts`

**Purpose**: Advanced backup to MongoDB Atlas

**Usage**:

```bash
npx tsx scripts/backup-to-mongodb.ts
```

#### `restore-from-mongodb.ts`

**Purpose**: Restore database from MongoDB backup

**Usage**:

```bash
npx tsx scripts/restore-from-mongodb.ts
```

#### `check-restored-data.ts`

**Purpose**: Verify restored data integrity

**Usage**:

```bash
npx tsx scripts/check-restored-data.ts
```

---

### 🧪 Testing Scripts

#### `run-e2e-tests.ps1`

**Purpose**: Run Playwright E2E tests

**Usage**:

```powershell
# Run all tests
.\scripts\run-e2e-tests.ps1

# Run specific test file
.\scripts\run-e2e-tests.ps1 -TestFile "class-booking.spec.ts"
```

#### `simple-e2e-test.ps1`

**Purpose**: Quick E2E smoke test

**Usage**:

```powershell
.\scripts\simple-e2e-test.ps1
```

#### `setup-testing-env.ps1`

**Purpose**: Configure testing environment

**Usage**:

```powershell
.\scripts\setup-testing-env.ps1
```

---

### 📊 Data Management Scripts

#### `seed-db.ts`

**Purpose**: Seed development database with test data

**Usage**:

```bash
npx tsx scripts/seed-db.ts
```

#### `import-sangsom-k19.ts`

**Purpose**: Import Sangsom K19 student data

**Usage**:

```bash
npx tsx scripts/import-sangsom-k19.ts
```

---

### 📱 App Update Scripts

#### `create-app-update.ts`

**Purpose**: Create app update announcements automatically

**Usage**:

```bash
npm run create-update
```

Reads implementation summaries and creates bilingual update announcements.

**Features**:

- Extracts user-friendly features
- Creates bilingual (English/Thai) content
- Deactivates old updates
- Auto-increments version numbers

**See Full Documentation**: Top of this README (original content preserved)

---

### 🔧 Utility Scripts

#### `sync-assets.ts`

**Purpose**: Synchronize asset files

**Usage**:

```bash
npx tsx scripts/sync-assets.ts
```

#### `verify-patterns.ts`

**Purpose**: Verify code patterns and best practices

**Usage**:

```bash
npx tsx scripts/verify-patterns.ts
```

#### `setup-windows-backup-task.ps1`

**Purpose**: Create scheduled Windows backup task

**Usage**:

```powershell
.\scripts\setup-windows-backup-task.ps1
```

#### `start-test-servers.ps1`

**Purpose**: Start development servers for testing

**Usage**:

```powershell
.\scripts\start-test-servers.ps1
```

---

## 🚀 Quick Start Guides

### For Migration Work

1. **Preview migration**:

   ```powershell
   .\scripts\run-guardian-migration.ps1 -DryRun $true
   ```

2. **Read runbook**: `docs/migrations/GUARDIAN_MIGRATION_RUNBOOK.md`

3. **Test locally**: `node scripts/test-guardian-migration.js`

### For Backups

```powershell
# Quick backup
.\scripts\backup-convex.ps1

# Advanced backup (with MongoDB)
npx tsx scripts/backup-to-mongodb.ts
```

### For Testing

```powershell
# Setup test environment
.\scripts\setup-testing-env.ps1

# Run E2E tests
.\scripts\run-e2e-tests.ps1
```

---

## 📋 Requirements

- **PowerShell**: 5.1+ (Windows) or PowerShell Core (Mac/Linux)
- **Node.js**: 18+ with TypeScript support
- **Convex CLI**: `npm install -g convex`
- **Environment**: Valid `.env.local` with `NEXT_PUBLIC_CONVEX_URL`

---

## 🛡️ Safety Best Practices

1. **Always backup before migrations**
2. **Test on dev/staging first**
3. **Use dry-run mode before live operations**
4. **Read runbooks thoroughly**
5. **Keep backups for 90+ days**
6. **Verify changes after operations**

---

## 📚 Related Documentation

- **Migration Guide**: `docs/migrations/GUARDIAN_MIGRATION_RUNBOOK.md`
- **Backup Guide**: `docs/guides/backup-recovery/BACKUP_GUIDE.md`
- **Testing Guide**: `docs/guides/testing/E2E_TESTING_GUIDE.md`

---

## 🆘 Troubleshooting

See individual script documentation or runbooks for specific troubleshooting guides.

For urgent issues:

1. Check Convex Dashboard logs
2. Review script output for error messages
3. Consult relevant runbook
4. File GitHub issue with logs

---

**Last Updated**: December 6, 2025  
**New Scripts**: Guardian migration automation (v1.0)

## Purpose

When an AI agent completes a set of tasks, it should inform users about the improvements. This script automates that process.

## How It Works

1. **Reads Implementation Summaries**: Scans for `IMPLEMENTATION_SUMMARY_*.md` files
2. **Extracts User-Friendly Features**: Parses the summary for practical improvements
3. **Creates App Update**: Automatically creates bilingual update announcement in Convex
4. **Deactivates Old Updates**: Ensures only the latest update is shown

## Usage

### Manual Execution

```bash
npm run create-update
```

### For AI Agents

At the end of your todo list, add:

```text
- Run: npm run create-update (to notify users of improvements)
```

### What Gets Created

- Version number (extracted from summary filename or incremented)
- Title (English + Thai)
- Description (brief overview)
- Feature list (with icons, titles, descriptions in both languages)

## Customization

Edit `scripts/create-app-update.ts` to change:

- Default version numbering
- Feature extraction logic
- Icon selection
- Title/description generation

## Requirements

- Node.js with TypeScript support (`tsx` package)
- Valid Convex connection (NEXT_PUBLIC_CONVEX_URL)
- At least one admin user in database
- Implementation summary files in project root

## Example Output

```text
🚀 Auto-Create App Update Script
================================

📝 Update Version: 4.5.1
📝 Features: 4

🔍 Finding admin user...
✅ Admin user found: xxx

📤 Creating app update...
✅ App update created successfully!
Version: 4.5.1
Features: 4

✨ Done! Users will now see the latest updates.
```

## Integration with AI Workflow

### Option 1: Manual Trigger

AI agent tells user: "Run `npm run create-update` to notify users"

### Option 2: Automated (Recommended)

AI agent runs command at end of work:

```bash
npm run create-update
```

### Option 3: Git Hook

Add to `.git/hooks/post-commit`:

```bash
#!/bin/sh
npm run create-update
```

## Best Practices

1. **User-Focused Language**: Script should extract/generate user benefits, not technical details
2. **Bilingual**: All content must have English + Thai versions
3. **Icon Selection**: Match icons to feature types (CheckCircle2 for completions, Edit3 for improvements, etc.)
4. **Version Numbering**: Follow semantic versioning (major.minor.patch)
5. **Timing**: Run after completing significant features, not for every small change

## Troubleshooting

### Error: "No admin users found"

- Solution: Create admin user first via database init

### Error: "NEXT_PUBLIC_CONVEX_URL not found"

- Solution: Ensure `.env.local` exists with Convex URL

### Error: "Failed to create app update"

- Solution: Check admin user permissions, verify Convex connection

## Future Enhancements

- [ ] Auto-parse git commits for feature extraction
- [ ] AI-powered feature description generation
- [ ] Screenshot attachment support
- [ ] Scheduled release dates
- [ ] Multi-version update history
- [ ] Email notifications to users
