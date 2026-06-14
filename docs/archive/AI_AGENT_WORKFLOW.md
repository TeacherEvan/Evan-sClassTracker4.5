# AI Agent Workflow Integration

## Auto-Update Announcement at End of Tasks

When completing work on this project, AI agents should automatically create user-facing update announcements.

## Required Steps at End of Todo List

### 1. Install Dependencies (First Time Only)

## Integration with Copilot Instructions

The `.github/copilot-instructions.md` file now includes:

```markdown
## Post-Implementation Procedures

### ⚠️ CRITICAL: Update Notification After Each Feature Implementation

**REQUIRED STEP** - After completing ANY significant feature or improvement:
```

## Example AI Agent Checklist

At end of work session:

- [ ] ✅ Complete all implementation tasks
- [ ] ✅ Update documentation (IMPLEMENTATION*SUMMARY*\*.md)
- [ ] ✅ Commit changes

## Manual Verification

After running the script, verify:

1. **Check Admin UI**:
   - Login as admin
   - Go to "App Updates" tab
   - Verify new update appears with correct version

## Customizing Update Content

Edit `scripts/create-app-update.ts` to change:

- **Default Features**: Update the `features` array with your completed work
- **Version Number**: Change version extraction logic
- **Title/Description**: Modify bilingual titles and descriptions
- **Icon Selection**: Choose appropriate icons for each feature type

### Available Icons

Common icons for updates:

- `CheckCircle2` - Completed features
- `Edit3` - Editing improvements
- `Sparkles` - New features
- `Zap` - Performance improvements
- `Shield` - Security enhancements
- `FileText` - Documentation/logs
- `Users` - User management
- `Calendar` - Calendar/scheduling
- `Bell` - Notifications
- `Settings` - Configuration changes

## Best Practices

### ✅ DO

- Run script after completing significant features (3+ changes)
- Use user-friendly language ("Easier booking" not "Refactored mutation")
- Include bilingual content (English + Thai)
- Test update appears correctly before committing
- Document changes in IMPLEMENTATION*SUMMARY*\*.md first

### ❌ DON'T

- Run for every tiny change (batch updates)
- Use technical jargon users won't understand
- Forget to verify update appears to users
- Skip bilingual translations
- Create updates without testing

## Troubleshooting

### "tsx: command not found"

```bash
npm install
```

### "No admin users found"

First time setup - create admin user via database init:

1. Login to app
2. Click "Initialize Database"
3. Admin user will be created

### "NEXT_PUBLIC_CONVEX_URL not found"

Ensure Convex is running:

```bash
npx convex dev
```

### Update not showing to users

1. Check admin UI - is update marked "active"?
2. Check notification window priority (100 = highest)
3. Verify user hasn't already dismissed it
4. Clear browser localStorage and refresh

## Future Enhancements

Potential automation improvements:

- [ ] AI-powered feature description generation
- [ ] Auto-parse git commits for changes
- [ ] Screenshot attachment support
- [ ] Scheduled release dates
- [ ] Email notifications to users
- [ ] Integration with GitHub Actions
- [ ] Slack/Teams notifications
- [ ] Multi-language support (beyond EN/TH)

## Questions?

See:

- `scripts/README.md` - Detailed script documentation
- `scripts/create-app-update.ts` - Script source code
- `components/admin-app-updates.tsx` - Admin UI for manual updates
- `.github/copilot-instructions.md` - Full AI agent instructions
