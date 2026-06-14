# 🔍 Post-Assessment Checklist - Evan's Class Tracker 4.5

**Date:** December 6, 2025  
**Reviewer:** TeacherEvan  
**Status:** ⚠️ CLEANUP REQUIRED

---

## 1️⃣ DUPLICATE ISSUES TO CLOSE

Close these duplicate issues (keep the **bolded** one):

### Migration Script: Guardian to Provider

- [ ] Close #108 (duplicate)
- [ ] Close #129 (duplicate)
- [ ] Close #143 (duplicate)
- [x] **Keep #148** ← Most recent

### Comprehensive Feature QA

- [ ] Close #146 (duplicate)
- [x] **Keep #145** ← Has Copilot assigned

### Dropdown Location System

- [ ] Close #134 (duplicate)
- [x] **Keep #144** ← Most recent

### Schema Update Guardian-as-School

- [ ] Close #109 (duplicate)
- [x] **Keep #132** ← Has Copilot assigned

### Student Merge Sync Soft-delete

- [ ] Close #114 (duplicate)
- [x] **Keep #136** ← Most recent clean version

### Moderator Ghost Role Analytics

- [ ] Close #111 (duplicate)
- [x] **Keep #141** ← Has Copilot assigned

**Total: Close 9 duplicate issues**

---

## 2️⃣ PULL REQUESTS TO REVIEW

### Priority 1: Merge These (No Conflicts)

- [ ] PR #96 - Lazy loading for admin components
- [ ] PR #103 - Fix TypeScript build failure

### Priority 2: Resolve Conflicts First

- [ ] PR #128 - Thailand location data (MERGE FIRST - most complete)
- [ ] PR #124 - Student merge system (after #128)

### Priority 3: Close as Duplicate/Superseded

- [ ] Close PR #133 - Superseded by #128 (Thailand data)
- [ ] Close PR #135 - Superseded by #128 (Thailand data)
- [ ] Close PR #118 - Superseded by #119 (Guardian migration)
- [ ] Close PR #121 - Superseded by #142 (Moderator role)
- [ ] Close PR #123 - Superseded by #124 (Student merge)

### Priority 4: Review WIP PRs

- [ ] PR #91 - Bilingual policy docs (6 days old, WIP)
- [ ] PR #119 - Guardian-as-School implementation
- [ ] PR #120 - Teacher Account restructure
- [ ] PR #126 - Remove guardian role
- [ ] PR #142 - Moderator role overhaul
- [ ] PR #147 - Feature QA (just created)
- [ ] PR #149 - Migration script (just created)

---

## 3️⃣ FINAL ISSUE COUNT (After Cleanup)

| #    | Issue                                          | Category     |
| ---- | ---------------------------------------------- | ------------ |
| #107 | Documentation: Admin & Moderator Feature Usage | 📚 Docs      |
| #110 | Teacher Account Restructure                    | 👨‍🏫 Teacher   |
| #113 | Frontend UI Overhaul                           | 🎨 Frontend  |
| #116 | Remove Legacy Guardian Role                    | 🧹 Cleanup   |
| #127 | Thailand Data Research                         | 📍 Data      |
| #132 | Schema Update Guardian-as-School               | 🔧 Backend   |
| #136 | Student Merge Sync Soft-delete                 | 🔧 Backend   |
| #141 | Moderator Ghost Role Analytics                 | 👻 Moderator |
| #144 | Dropdown Location System                       | 📍 Frontend  |
| #145 | Comprehensive Feature QA                       | ✅ QA        |
| #148 | Migration Script                               | 🔄 Migration |

**Target: 11 unique issues**

---

## 4️⃣ RECOMMENDED MERGE ORDER

```
1. PR #96  (Lazy loading) ────────────────────► MERGE
2. PR #103 (TypeScript fix) ──────────────────► MERGE
3. PR #128 (Thailand data - resolve conflicts) ► MERGE
4. Close PR #133, #135 (superseded by #128) ──► CLOSE
5. PR #124 (Student merge - rebase on main) ──► MERGE
6. Close PR #123 (superseded by #124) ────────► CLOSE
7. PR #119 (Guardian-as-School) ──────────────► REVIEW
8. Close PR #118, #120 (superseded) ──────────► CLOSE
9. PR #142 (Moderator role) ──────────────────► REVIEW
10. Close PR #121 (superseded by #142) ───────► CLOSE
11. PR #126 (Remove guardian role) ───────────► REVIEW
12. PR #147, #149 (QA/Migration) ─────────────► REVIEW WHEN READY
```

---

## 5️⃣ ROOT CAUSE ANALYSIS

### Why did duplicates occur?

1. **Draft issues saved multiple times** due to API errors
2. **No deduplication check** before creating issues
3. **Parallel PR creation** for same features
4. **Merge conflicts** caused multiple retry attempts

### Prevention for future:

- [ ] Check for existing issues before creating new ones
- [ ] Use issue templates to prevent duplicates
- [ ] Close old PRs before creating new ones for same feature
- [ ] Resolve merge conflicts before creating more PRs

---

## 6️⃣ CLEANUP COMMANDS

### Close duplicate issues via GitHub CLI:

```bash
# Close duplicate Migration Script issues
gh issue close 108 129 143 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #148"

# Close duplicate QA issue
gh issue close 146 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #145"

# Close duplicate Dropdown issue
gh issue close 134 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #144"

# Close duplicate Schema issue
gh issue close 109 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #132"

# Close duplicate Student Merge issue
gh issue close 114 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #136"

# Close duplicate Moderator issue
gh issue close 111 -R TeacherEvan/Evan-sClassTracker4.5 -c "Duplicate - keeping #141"
```

### Close superseded PRs:

```bash
gh pr close 133 135 118 121 123 -R TeacherEvan/Evan-sClassTracker4.5 -c "Superseded by more complete implementation"
```

---

## 7️⃣ DEPENDENCY GRAPH

```
┌──────────────────────���──────────────────────────────────────────┐
│                    ISSUE → PR DEPENDENCY MAP                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  #132 Schema ──────────► PR #119, #133 ──┐                      │
│  #127 Thailand Data ───► PR #128 ────────┼──► lib/thailand-     │
│  #144 Dropdown ────────► PR #135 ────────┘    locations.ts      │
│                              ▲                                   │
│                              │ CONFLICTS                         │
│                              ▼                                   │
│  #136 Student Merge ───► PR #124 ────────────► convex/students  │
│  #114 (dup) ───────────► PR #123 (superseded)                   │
│                                                                  │
│  #141 Moderator ───────► PR #142 ────────────► components/      │
│  #111 (dup) ───────────► PR #121 (superseded)                   │
│                                                                  │
│  #116 Remove Guardian ─► PR #126 ────────────► lib/types.ts     │
│  #148 Migration ───────► PR #118, #149 ──────► convex/          │
│                                                                  │
│  #110 Teacher Account ─► PR #120 ────────────► convex/classes   │
│  #113 Frontend UI ─────► PR #123 ────────────► components/      │
│                                                                  │
│  #145 QA Signoff ──────► PR #147 ────────────► (review only)    │
│  #107 Documentation ───► (no PR yet)                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

MERGE ORDER:
═══════════
  ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐
  │#96│ → │103│ → │128│ → │124│ → │119│ → ...
  └───┘   └───┘   └───┘   └───┘   └───┘
    │       │       │       │       │
    ▼       ▼       ▼       ▼       ▼
  Lazy   TypeScript Thailand Student Guardian
  Load     Fix      Data    Merge   Schema
```

---

## ✅ SIGN-OFF

- [ ] All duplicate issues closed
- [ ] Superseded PRs closed
- [ ] Merge conflicts resolved
- [ ] Priority PRs merged
- [ ] Final issue count verified (11 unique)
- [ ] Repository clean and organized

**Signed off by:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***

---

_Generated by GitHub Copilot - December 6, 2025_
