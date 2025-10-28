# Post-Implementation Procedures

[← Back to Index](../copilot-instructions.md)

---

## ⚠️ CRITICAL: Update Notification After Each Feature Implementation

**REQUIRED STEP** - After completing ANY significant feature or improvement:

### Automated Method (Recommended for AI Agents)

```bash
npm run create-update
```

**This script automatically**:

- ✅ Reads recent implementation summaries
- ✅ Extracts user-friendly features
- ✅ Creates bilingual app update in database
- ✅ Deactivates old updates
- ✅ Notifies users of improvements

**How it works** (`scripts/create-app-update.ts`):

1. **Scans for `IMPLEMENTATION_SUMMARY_*.md` files** in project root
2. **Sorts by date** and reads most recent summary
3. **Extracts version** from filename (e.g., `IMPLEMENTATION_SUMMARY_v4.5.3.md`)
4. **Parses features** from markdown (future enhancement - currently uses defaults)
5. **Creates bilingual update** via `appUpdates.create` mutation
6. **Deactivates old updates** to prevent notification spam

**Implementation Summary naming convention**:

- `IMPLEMENTATION_SUMMARY_[FEATURE]_[DATE].md` - Feature-specific
- `IMPLEMENTATION_SUMMARY_v[VERSION].md` - Version-specific
- Place in project root for auto-detection

**See**: `.github/AI_AGENT_WORKFLOW.md` for detailed integration guide

---

### Manual Method (Admin UI)

#### Option 1: Use Admin "App Updates" Tab

1. Login as admin
2. Go to "App Updates" tab
3. Click "Create New Update"
4. Fill in version, title, description, features (bilingual)
5. Click "Create Update"

#### Option 2: Use Convex Mutation Directly

```typescript
await ctx.db.insert("appUpdates", {
  version: "4.5.3",
  title: "Feature Name",
  titleTh: "ชื่อฟีเจอร์",
  description: "Brief description",
  descriptionTh: "คำอธิบายสั้น ๆ",
  features: [{ 
    icon: "CheckCircle2", 
    title: "...", 
    titleTh: "...", 
    description: "...", 
    descriptionTh: "..." 
  }],
  releaseDate: Date.now(),
  isActive: true,
  showInWindow: true
});
```

---

### Document in Implementation Summary

**Create** `IMPLEMENTATION_SUMMARY_[DATE].md` with:

- List all changed files
- New features added
- Breaking changes
- Testing checklist
- Verification steps

**Why This Matters**:

- Users won't know about new features unless notified
- Gold Tablet notification window shows app updates automatically when `showUpdateSummary: true`
- Maintains feature visibility and adoption
- Creates audit trail for version history

---

## School-Specific and Broadcast Notifications

The notification window system supports targeted distribution:

### Target Options

1. **By Role**: `targetRole: "teacher" | "moderator" | "admin" | "all"`
2. **By School**: `targetSchool: Id<"schools">` - School-specific
3. **Everyone**: `targetSchool: "everyone"` - Broadcast to all schools

### Schema Update Required

```typescript
// convex/schema.ts - notificationWindows table
notificationWindows: defineTable({
  // ... existing fields
  targetRole: v.optional(v.union(
    v.literal("all"),
    v.literal("teacher"),
    v.literal("moderator"),
    v.literal("admin")
  )),
  targetSchool: v.optional(v.union(
    v.id("schools"),
    v.literal("everyone") // Broadcast to all schools
  )),
  // ... rest of fields
})
.index("by_school", ["targetSchool"]) // Add index for school filtering
```

### Query Logic Update

```typescript
// convex/notificationWindows.ts - getActiveForUser
// Check school targeting
if (window.targetSchool) {
  if (window.targetSchool === "everyone") {
    // Show to all users regardless of school
  } else if (user.schoolId !== window.targetSchool) {
    continue; // Skip if user's school doesn't match
  }
}
```

### Use Cases

- **School-specific announcements** (maintenance, events)
- **Role-specific updates** (new moderator tools)
- **System-wide broadcasts** (major version updates)
- **Emergency notifications** to specific schools

---

## Implementation Summary Conventions

**File naming**: `IMPLEMENTATION_SUMMARY_[FEATURE]_[DATE].md`

**Required sections**:

1. **Overview** - What was implemented
2. **Files Changed** - List all modified files
3. **New Features** - User-facing improvements
4. **Technical Details** - Implementation notes
5. **Testing** - Verification steps
6. **Breaking Changes** - Migration notes (if any)

**Example**: See existing implementation summaries in project root

---

## Version Tracking & Changelog

**Update `CHANGELOG.md`** after each feature:

- Version number (semantic versioning)
- Release date
- Feature list
- Bug fixes
- Breaking changes

**Current version**: 4.5.6 (Oct 28, 2025)

---

## Next Steps

- **Review key files** → [Key Files Reference](./10-files.md)
- **Security review** → [Security Considerations](./05-security.md)
- **Development workflow** → [Development Workflow](./06-development.md)

---

[← Back to Index](../copilot-instructions.md)
