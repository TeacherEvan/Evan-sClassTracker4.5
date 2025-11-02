# Documentation Index - Evan's Class Tracker 4.5

**Version:** 4.5.17 | **Last Updated:** November 2, 2025

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[.github/copilot-docs/01-quick-start.md](../.github/copilot-docs/01-quick-start.md)** - 7 critical rules + dev setup
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System overview & data flows
3. **[FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md)** - What the app does

---

## 📚 Primary Documentation (Active Reference)

### For AI Agents & Developers

📁 **[.github/copilot-docs/](../.github/copilot-docs/)** - Comprehensive AI agent documentation (15 files)

- `01-quick-start.md` - Essential rules & setup
- `02-architecture.md` - Provider hierarchy & auth
- `03-patterns.md` - 25 non-negotiable patterns
- `04-integration.md` - Component communication
- `05-security.md` - Known limitations & warnings
- `06-development.md` - Local dev workflow
- `07-testing.md` - E2E testing with Playwright
- `08-pitfalls.md` - What NOT to do
- `09-procedures.md` - Post-implementation steps
- `10-files.md` - Key files reference
- `11-disaster-recovery.md` - Emergency protocols
- `12-logging-monitoring.md` - Logs & debugging
- `13-stack-alternatives.md` - Migration paths
- `14-how-to-guides.md` - Operational procedures
- `15-refactoring-guide.md` - Code splitting strategies

### Core Technical Docs

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 3-tier architecture, real-time flows, indexes
- **[SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)** - High-level system description
- **[FEATURES_DOCUMENTATION.md](./FEATURES_DOCUMENTATION.md)** - User-facing features
- **[SECURITY_REVIEWS.md](./SECURITY_REVIEWS.md)** - Security audits & compliance

### Setup & Configuration

- **[ENVIRONMENT_SETUP_GUIDE.md](./ENVIRONMENT_SETUP_GUIDE.md)** - Local environment setup
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[CI_CD_SETUP_GUIDE.md](./CI_CD_SETUP_GUIDE.md)** - GitHub Actions configuration
- **[BACKUP_SYSTEM_GUIDE.md](./BACKUP_SYSTEM_GUIDE.md)** - MongoDB backup automation
- **[MONGODB_PASSWORD_RESET_GUIDE.md](./MONGODB_PASSWORD_RESET_GUIDE.md)** - Database recovery

### Testing & Quality

- **[E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md)** - Playwright E2E tests (comprehensive)
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Manual testing workflows
- **[BCRYPT_TESTING_GUIDE.md](./BCRYPT_TESTING_GUIDE.md)** - Password migration testing
- **[TROUBLESHOOTING_CI_CD.md](./TROUBLESHOOTING_CI_CD.md)** - CI/CD debugging

### UI/UX Development

- **[UI_COMPONENTS_GUIDE.md](./UI_COMPONENTS_GUIDE.md)** - Reusable components
- **[UI_DESIGN_GUIDE.md](./UI_DESIGN_GUIDE.md)** - Design patterns & Tailwind
- **[MOBILE_UI_GUIDE.md](./MOBILE_UI_GUIDE.md)** - Mobile responsiveness

### Feature-Specific Docs

- **[AUDIT_LOGGING_IMPLEMENTATION.md](./AUDIT_LOGGING_IMPLEMENTATION.md)** - Audit trail system
- **[CONTACT_ADMIN_FEATURE.md](./CONTACT_ADMIN_FEATURE.md)** - Error reporting to admin
- **[GOLD_TABLET_NOTIFICATION_WINDOW.md](./GOLD_TABLET_NOTIFICATION_WINDOW.md)** - Notification system
- **[HELP_WINDOW_FEATURE.md](./HELP_WINDOW_FEATURE.md)** - In-app help system

### Quick References

- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Developer quick ref (toast, rate limiting, etc.)
- **[BACKUP_QUICK_REFERENCE.md](../BACKUP_QUICK_REFERENCE.md)** - Backup commands cheat sheet
- **[.github/WORKFLOWS_QUICKREF.md](../.github/WORKFLOWS_QUICKREF.md)** - GitHub Actions quick ref

### Business Analysis

- **[COST_ANALYSIS_CONVEX_VS_VERCEL.md](./COST_ANALYSIS_CONVEX_VS_VERCEL.md)** - Hosting cost comparison

---

## 📦 Historical Documentation (Archives)

### Implementation Summaries (Completed Features)

📁 **[archive/implementations/](./archive/implementations/)** - 26 completed feature implementations

- Bcrypt migration (Nov 1, 2025)
- Wizard-based onboarding (Nov 1, 2025)
- Analytics dashboard (Nov 1, 2025)
- Provider system (Oct 30, 2025)
- Guardian booking (Oct 28, 2025)
- Recurring bookings (Oct 27, 2025)
- Error reporting (Oct 27, 2025)
- ...and 19 more

See `archive/implementations/README.md` for complete index.

### Deep Archive (Historical Planning & Audits)

📁 **[Deep/](./Deep/)** - Long-term storage

- Implementation plans (not yet built)
- Research findings
- Audit reports (>30 days old)
- Documentation consolidation reports

See `Deep/README.md` for complete index.

### Legacy Archive

📁 **[archive/](./archive/)** - Older documentation from Oct 2025

- Cleanup summaries
- Deployment fixes
- Codebase reviews
- Security implementations

See `archive/README.md` for complete index.

---

## 📊 Documentation Stats

- **Total Active Docs:** 28 files (docs/ folder)
- **AI Agent Docs:** 15 files (.github/copilot-docs/)
- **Implementation Archives:** 26 files (archive/implementations/)
- **Deep Archive:** 8 files (Deep/)
- **Legacy Archive:** 30+ files (archive/)

---

## 🔍 Finding What You Need

### "How do I...?"

- **Deploy to production?** → `.github/copilot-docs/14-how-to-guides.md` (Section: Deploy)
- **Write E2E tests?** → `E2E_TESTING_GUIDE.md` or `.github/copilot-docs/07-testing.md`
- **Debug production issues?** → `.github/copilot-docs/12-logging-monitoring.md`
- **Backup/restore data?** → `BACKUP_SYSTEM_GUIDE.md` or `14-how-to-guides.md` (Section: Backup)
- **Understand the architecture?** → `ARCHITECTURE.md` or `.github/copilot-docs/02-architecture.md`

### "What is...?"

- **A specific pattern?** → `.github/copilot-docs/03-patterns.md`
- **The provider hierarchy?** → `.github/copilot-docs/02-architecture.md`
- **Security status?** → `SECURITY_REVIEWS.md` or `.github/copilot-docs/05-security.md`

### "When was X implemented?"

- **Check:** `archive/implementations/` folder
- **Search:** `IMPLEMENTATION_SUMMARY_{FEATURE}_{DATE}.md`
- **Also see:** `CHANGELOG.md` in project root

---

## 📝 Documentation Standards

### File Naming Conventions

- **Guides:** `{TOPIC}_GUIDE.md` (e.g., `TESTING_GUIDE.md`)
- **Implementation Summaries:** `IMPLEMENTATION_SUMMARY_{FEATURE}_{DATE}.md`
- **Plans:** `IMPLEMENTATION_PLAN_{FEATURE}_{DATE}.md`
- **Quick Refs:** `{TOPIC}_QUICK_REFERENCE.md` or `QUICK_REFERENCE.md`

### When to Archive

- ✅ **Move to archive/implementations/:** Completed feature summaries (>7 days old)
- ✅ **Move to Deep/:** Plans not yet built, audits >30 days, research findings
- ✅ **Keep in docs/:** Active guides, architecture, system overview, security

### Updating This Index

- Update this file when adding/removing major documentation
- Update version number and last updated date
- Keep stats accurate (run: `Get-ChildItem docs/*.md | Measure-Object`)

---

**Maintained by:** AI Agents + Human Developer  
**Next Review:** December 2, 2025
