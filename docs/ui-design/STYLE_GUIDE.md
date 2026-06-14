# Code Style Guide

**Version**: 1.0  
**Last Updated**: November 2, 2025  
**Applies To**: All source code, documentation, and configuration files

---

## 📋 Table of Contents

1. [Markdown Formatting Standards](#markdown-formatting-standards)
2. [TypeScript/JavaScript Standards](#typescriptjavascript-standards)
3. [File Naming Conventions](#file-naming-conventions)
4. [Git Commit Messages](#git-commit-messages)
5. [Documentation Standards](#documentation-standards)
6. [Enforcement Tools](#enforcement-tools)

---

## Markdown Formatting Standards

### Horizontal Rules (Separators)

**REQUIRED**: Use exactly **3 dashes** (`---`) for horizontal rules.

```markdown
## ✅ CORRECT

## ❌ WRONG

---

---

---
```

**Rationale**:

- **CommonMark Specification**: The 3-dash separator is the [official CommonMark standard](https://spec.commonmark.org/0.30/#thematic-breaks)
- **YAML Front Matter Compatibility**: 4+ dashes can conflict with YAML front matter delimiters in static site generators
- **Consistency**: All 270+ existing markdown files use `---` (verified Nov 2, 2025)
- **Tooling Support**: Markdown linters (markdownlint) enforce 3-dash as best practice

**Enforcement**: Automated via markdownlint rule `MD035: { style: "---" }`

### Heading Styles

**REQUIRED**: Use ATX-style headings (with `#`), not Setext-style (underlines).

```markdown
✅ CORRECT

# Heading 1

## Heading 2

### Heading 3

❌ WRONG
Heading 1
=========

## Heading 2
```

**Rationale**: ATX-style is more explicit, easier to parse, and supports all 6 heading levels.

**Enforcement**: Automated via markdownlint rule `MD003`

### List Formatting

**REQUIRED**: Use consistent list markers within same list.

```markdown
✅ CORRECT

- Item 1
- Item 2
- Item 3

✅ CORRECT

1. First
2. Second
3. Third

❌ WRONG (mixed markers)

- Item 1

* Item 2

- Item 3
```

**Enforcement**: Automated via markdownlint rule `MD004`

### Code Blocks

**REQUIRED**: Use fenced code blocks with language identifiers.

````markdown
✅ CORRECT

```typescript
const example = "code";
```

```bash
npm install
```

❌ WRONG (indented code block)
const example = "code";

❌ WRONG (no language)

```
const example = "code";
```
````

**Rationale**: Enables syntax highlighting, better for accessibility, explicit language declaration.

**Enforcement**: Automated via markdownlint rule `MD046: { style: "fenced" }`

### Line Length

**RECOMMENDED**: No strict line length limit for markdown.

**Rationale**:

- Markdown is documentation (not code)
- Tables and URLs often exceed typical limits
- Modern editors handle wrapping

**Enforcement**: Disabled via markdownlint rule `MD013: false`

### Inline HTML

**ALLOWED**: Limited HTML elements for enhanced formatting.

**Permitted Elements**:

- `<br>` - Line breaks
- `<details>` / `<summary>` - Collapsible sections
- `<sup>` / `<sub>` - Superscript/subscript
- `<kbd>` - Keyboard input

```markdown
✅ CORRECT
Press <kbd>Ctrl</kbd>+<kbd>C</kbd> to copy

<details>
<summary>Click to expand</summary>
Hidden content here
</details>

❌ WRONG (arbitrary HTML)

<div class="custom">...</div>
<script>alert('no');</script>
```

**Enforcement**: Automated via markdownlint rule `MD033: { allowed_elements: [...] }`

---

## TypeScript/JavaScript Standards

### Indentation

**REQUIRED**: 2 spaces (not tabs).

```typescript
✅ CORRECT
function example() {
  if (condition) {
    return true;
  }
}

❌ WRONG (4 spaces)
function example() {
    if (condition) {
        return true;
    }
}

❌ WRONG (tabs)
function example() {
 if (condition) {
  return true;
 }
}
```

**Enforcement**: Automated via EditorConfig + ESLint

### Line Endings

**REQUIRED**: Unix-style (`LF`), not Windows-style (`CRLF`).

**Rationale**:

- Consistent across platforms
- Git default
- Deployment targets (Vercel, Netlify) expect LF

**Enforcement**: Automated via EditorConfig: `end_of_line = lf`

### Final Newline

**REQUIRED**: All files must end with a newline.

**Rationale**: [POSIX standard](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap03.html#tag_03_206) defines text files as ending with newline.

**Enforcement**: Automated via EditorConfig: `insert_final_newline = true`

### Trailing Whitespace

**REQUIRED**: Remove trailing whitespace from all lines (except markdown code blocks).

**Enforcement**: Automated via EditorConfig: `trim_trailing_whitespace = true`

---

## File Naming Conventions

### Component Files

**Pattern**: `kebab-case.tsx`

```
✅ CORRECT
class-booking.tsx
student-management.tsx
desktop-notification-toast.tsx

❌ WRONG
ClassBooking.tsx
student_management.tsx
DesktopNotificationToast.tsx
```

### Backend Files (Convex)

**Pattern**: `camelCase.ts`

```
✅ CORRECT
users.ts
classes.ts
teacherClassCount.ts

❌ WRONG
Users.ts
teacher-class-count.ts
TeacherClassCount.ts
```

### Documentation Files

**Pattern**: `SCREAMING_SNAKE_CASE.md` or `Title_Case.md`

```
✅ CORRECT
README.md
CHANGELOG.md
IMPLEMENTATION_SUMMARY_v4.5.17.md
UI_DESIGN_GUIDE.md

❌ WRONG
readme.md
change-log.md
implementation-summary.md
```

---

## Git Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting, linting (no code change)
- `refactor:` - Code restructuring (no feature change)
- `perf:` - Performance improvement
- `test:` - Add/update tests
- `chore:` - Build, dependencies, tooling

### Examples

```
✅ CORRECT
feat(class-booking): add recurring weekly booking wizard
fix(auth): prevent account lockout on password reset
docs(style-guide): add markdown formatting standards
style(markdown): standardize separators to 3-dash format

❌ WRONG
updated stuff
Fixed bug
WIP
asdf
```

---

## Documentation Standards

### Implementation Summaries

**Required Sections**:

1. Objective
2. Files Modified
3. Implementation Details
4. Testing
5. Verification Checklist

**Naming**: `IMPLEMENTATION_SUMMARY_[FEATURE]_[DATE].md`

**Location**: `docs/archive/implementations/`

### README Files

**Required Sections**:

1. Project overview
2. Quick start
3. Development setup
4. Deployment
5. Contributing

**Location**: Project root + each major directory

---

## Enforcement Tools

### Automated Linting

**Markdown**: markdownlint-cli2

```bash
npm run lint:md        # Check all markdown files
npm run lint:md:fix    # Auto-fix violations
```

**TypeScript/JavaScript**: ESLint

```bash
npm run lint           # Check all code files
```

### Editor Configuration

**EditorConfig**: `.editorconfig` enforces:

- Indentation (2 spaces)
- Line endings (LF)
- Trailing whitespace removal
- Final newline insertion
- File encoding (UTF-8)

**IDE Support**: VS Code, WebStorm, Sublime Text, Vim, Emacs (all auto-detect `.editorconfig`)

### Pre-Commit Hooks

**Husky + lint-staged**: Automatically runs linters on staged files before commit.

```bash
git add file.md
git commit -m "docs: update guide"
# → Automatically runs markdownlint on file.md
# → Blocks commit if violations found
# → Auto-fixes if possible
```

**Setup**: Runs automatically after `npm install` (via `prepare` script)

### CI/CD Integration

**GitHub Actions**: (Future enhancement)

- Run `npm run lint:md` on all PRs
- Block merge if violations found
- Post lint results as PR comments

---

## Migration Guide

### For Existing Files

All existing markdown files are already compliant (verified Nov 2, 2025). No migration needed.

### For New Files

1. **Install dependencies**: `npm install` (includes markdownlint, husky, lint-staged)
2. **Setup git hooks**: `npm run prepare` (configures husky)
3. **Enable EditorConfig**: Install EditorConfig plugin in your IDE
4. **Write code**: Linters enforce standards automatically

### For Contributors

1. **Read this guide**: Understand formatting standards
2. **Install dependencies**: `npm install`
3. **Test locally**: `npm run lint:md` before committing
4. **Commit**: Pre-commit hooks enforce standards automatically
5. **Fix violations**: `npm run lint:md:fix` auto-fixes most issues

---

## FAQ

**Q: Why 3 dashes instead of 4?**  
A: CommonMark specification defines 3+ characters as horizontal rule. 3 is the minimum and avoids YAML front matter conflicts.

**Q: Can I disable linting for specific lines?**  
A: Yes, for markdown: `<!-- markdownlint-disable-next-line MD035 -->`

**Q: What if pre-commit hook blocks my urgent fix?**  
A: Emergency bypass: `git commit --no-verify` (use sparingly!)

**Q: Do I need to fix all old files?**  
A: No! All existing files are already compliant. Only new/modified files need checking.

---

## Resources

- **CommonMark Spec**: <https://spec.commonmark.org/>
- **Markdownlint Rules**: <https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md>
- **EditorConfig**: <https://editorconfig.org/>
- **ESLint**: <https://eslint.org/docs/latest/>
- **Husky**: <https://typicode.github.io/husky/>

---

**Version History**:

- v1.0 (Nov 2, 2025): Initial version with markdown standards
- Future: TypeScript, React, Convex-specific standards

---

[← Back to Documentation Index](./README.md)
