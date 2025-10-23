# Auto-Update Script for AI Agents

This directory contains scripts for automatically creating app update announcements after completing work.

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

```
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

```
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

**Error: "No admin users found"**

- Solution: Create admin user first via database init

**Error: "NEXT_PUBLIC_CONVEX_URL not found"**

- Solution: Ensure `.env.local` exists with Convex URL

**Error: "Failed to create app update"**

- Solution: Check admin user permissions, verify Convex connection

## Future Enhancements

- [ ] Auto-parse git commits for feature extraction
- [ ] AI-powered feature description generation
- [ ] Screenshot attachment support
- [ ] Scheduled release dates
- [ ] Multi-version update history
- [ ] Email notifications to users
