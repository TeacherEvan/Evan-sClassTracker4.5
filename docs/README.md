# Documentation Index - Evan's Class Tracker 4.5

**Version:** 4.5.31 | **Last Updated:** December 3, 2025

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[.github/copilot-docs/01-quick-start.md](../.github/copilot-docs/01-quick-start.md)** - 7 critical rules + dev setup
2. **[architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md)** - System overview & data flows
3. **[features/FEATURES_DOCUMENTATION.md](./features/FEATURES_DOCUMENTATION.md)** - What the app does

---

## 📚 Documentation Structure

### 📖 Guides (Step-by-Step Instructions)

#### 🔧 Setup & Configuration

- **[ENVIRONMENT_SETUP_GUIDE.md](guides/setup/ENVIRONMENT_SETUP_GUIDE.md)** - Development environment
- **[CI_CD_SETUP_GUIDE.md](guides/setup/CI_CD_SETUP_GUIDE.md)** - GitHub Actions pipeline
- **[MONGODB_PASSWORD_RESET_GUIDE.md](guides/setup/MONGODB_PASSWORD_RESET_GUIDE.md)** - Database credentials

#### 💻 Development

- **[fix-startup-wizard-language-error.md](guides/development/fix-startup-wizard-language-error.md)** - Common dev issues

#### 🧪 Testing

- **[TESTING_GUIDE.md](guides/testing/TESTING_GUIDE.md)** - Running and writing tests
- **[E2E_TESTING_GUIDE.md](guides/testing/E2E_TESTING_GUIDE.md)** - Playwright E2E testing
- **[BCRYPT_TESTING_GUIDE.md](guides/testing/BCRYPT_TESTING_GUIDE.md)** - Password hashing tests

#### 🚢 Deployment

- **[DEPLOYMENT_GUIDE.md](guides/deployment/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[TROUBLESHOOTING_CI_CD.md](guides/deployment/TROUBLESHOOTING_CI_CD.md)** - Pipeline debugging

#### 💾 Backup & Recovery

- **[BACKUP_SYSTEM_GUIDE.md](guides/backup-recovery/BACKUP_SYSTEM_GUIDE.md)** - Automated backups
- **[BACKUP_GUIDE.md](guides/backup-recovery/BACKUP_GUIDE.md)** - Manual backup procedures
- **[BACKUP_OPTIMIZATION_REVIEW_NOV_2_2025.md](guides/backup-recovery/BACKUP_OPTIMIZATION_REVIEW_NOV_2_2025.md)** - Performance improvements

---

### 🏗️ Architecture (System Design)

- **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** - 3-tier architecture, real-time flows, indexes
- **[SYSTEM_OVERVIEW.md](architecture/SYSTEM_OVERVIEW.md)** - High-level system description

#### 📊 Diagrams

- **[SYSTEM_ARCHITECTURE_DIAGRAM.md](architecture/diagrams/SYSTEM_ARCHITECTURE_DIAGRAM.md)** - Visual system diagrams

#### 🔬 Analysis

- **[BOTTLENECK_ANALYSIS.md](BOTTLENECK_ANALYSIS.md)** - System performance & backup bottlenecks
- **[COMPOSITIONAL_ARCHITECTURE_ANALYSIS.md](architecture/analysis/COMPOSITIONAL_ARCHITECTURE_ANALYSIS.md)** - Deep architectural analysis
- **[COST_ANALYSIS_CONVEX_VS_VERCEL.md](architecture/analysis/COST_ANALYSIS_CONVEX_VS_VERCEL.md)** - Infrastructure costs

---

### ✨ Features (User-Facing Functionality)

- **[FEATURES_DOCUMENTATION.md](features/FEATURES_DOCUMENTATION.md)** - Complete feature list
- **[GOLD_TABLET_NOTIFICATION_WINDOW.md](features/GOLD_TABLET_NOTIFICATION_WINDOW.md)** - Notification system
- **[HELP_WINDOW_FEATURE.md](features/HELP_WINDOW_FEATURE.md)** - In-app help system
- **[CONTACT_ADMIN_FEATURE.md](features/CONTACT_ADMIN_FEATURE.md)** - Admin communication

---

### 🔒 Security (Security & Compliance)

- **[SECURITY_REVIEWS.md](security/SECURITY_REVIEWS.md)** - Security audits & recommendations
- **[AUDIT_LOGGING_IMPLEMENTATION.md](security/AUDIT_LOGGING_IMPLEMENTATION.md)** - Audit trail system

---

### 🎨 UI/UX Design (Design Standards)

- **[STYLE_GUIDE.md](ui-design/STYLE_GUIDE.md)** - UI/UX design standards
- **[UI_COMPONENTS_GUIDE.md](ui-design/UI_COMPONENTS_GUIDE.md)** - Component library reference
- **[UI_DESIGN_GUIDE.md](ui-design/UI_DESIGN_GUIDE.md)** - Design principles
- **[MOBILE_UI_GUIDE.md](ui-design/MOBILE_UI_GUIDE.md)** - Mobile-specific guidelines

---

### 📊 Audits & Reviews (Quality Assurance)

- **[DOCUMENTATION_AUDIT_NOV_2_2025.md](audits-reviews/DOCUMENTATION_AUDIT_NOV_2_2025.md)** - Documentation quality
- **[LINTING_INFRASTRUCTURE_IMPLEMENTATION_NOV_2_2025.md](audits-reviews/LINTING_INFRASTRUCTURE_IMPLEMENTATION_NOV_2_2025.md)** - Code quality tools

---

### � Migrations (Database & Architecture Changes)

- **[migrations/GUARDIAN_TO_PROVIDER_MIGRATION_PLAN.md](migrations/GUARDIAN_TO_PROVIDER_MIGRATION_PLAN.md)** - Guardian to provider consolidation (archived)
- **[migrations/IMPLEMENTATION_REVIEW_NOV_6_2025.md](migrations/IMPLEMENTATION_REVIEW_NOV_6_2025.md)** - Migration review (archived)
- **[migrations/GUARDIAN_ROLE_REMOVAL_REPORT_NOV_9_2025.md](migrations/GUARDIAN_ROLE_REMOVAL_REPORT_NOV_9_2025.md)** - Final guardian removal report

**⚠️ DEPRECATION**: Guardian role is DEPRECATED (Oct 2025). See root level `GUARDIAN_PROVIDER_IMPLEMENTATION_PLAN.md` for migration details. Use `providers` table for new implementations.

---

### ⚙️ Convex Backend (Best Practices & Analysis)

- **[convex/ERROR_HANDLING_BEST_PRACTICES.md](convex/ERROR_HANDLING_BEST_PRACTICES.md)** - Error handling patterns
- **[convex/RELIABILITY_AND_MIGRATION_ANALYSIS.md](convex/RELIABILITY_AND_MIGRATION_ANALYSIS.md)** - Reliability & migration strategies

---

### �📁 Additional Resources

#### 📦 Archive

Historical documentation and implementation summaries → **[archive/](archive/)**

#### 🔍 Deep Dive

In-depth research, implementation plans → **[Deep/](Deep/)**

#### 📚 Class Registry

Student roster data → **[class-registry/](class-registry/)**

#### 🖼️ Visual Assets

Screenshots, diagrams → **[Images/](Images/)**, **[screenshots/](screenshots/)**

#### ⚠️ Important

Critical documentation → **[.github/copilot-docs/](../.github/copilot-docs/)**

---

## 🗺️ Navigation by Task

| I need to...                   | Go to...                                        |
| :----------------------------- | :---------------------------------------------- |
| Set up development environment | `guides/setup/ENVIRONMENT_SETUP_GUIDE.md`       |
| Run tests                      | `guides/testing/TESTING_GUIDE.md`               |
| Deploy to production           | `guides/deployment/DEPLOYMENT_GUIDE.md`         |
| Understand architecture        | `architecture/ARCHITECTURE.md`                  |
| Learn about features           | `features/FEATURES_DOCUMENTATION.md`            |
| Review security                | `security/SECURITY_REVIEWS.md`                  |
| Design UI components           | `ui-design/STYLE_GUIDE.md`                      |
| Configure backups              | `guides/backup-recovery/BACKUP_SYSTEM_GUIDE.md` |
| Troubleshoot CI/CD             | `guides/deployment/TROUBLESHOOTING_CI_CD.md`    |
| Find historical docs           | `archive/`                                      |

---

## 📖 For AI Agents & Advanced Reference

📁 **[.github/copilot-docs/](../.github/copilot-docs/)** - Comprehensive AI agent documentation (15 files)

- `01-quick-start.md` - Essential rules & setup
- `02-architecture.md` - Provider hierarchy & auth
- `03-patterns.md` - 30 non-negotiable patterns (includes lazy loading, modular decomposition)
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

---

## 📝 Documentation Standards

When adding new documentation:

1. **Choose the right folder:**
   - How-to guides → `guides/[category]/`
   - Architecture docs → `architecture/`
   - Feature specs → `features/`
   - Security docs → `security/`
   - UI/UX → `ui-design/`
   - Historical → `archive/implementations/`

2. **Use clear naming:**
   - Guides: `VERB_NOUN_GUIDE.md` (e.g., `DEPLOYMENT_GUIDE.md`)
   - Features: `FEATURE_NAME_FEATURE.md`
   - Dated docs: `TOPIC_MMM_DD_YYYY.md`

3. **Include sections:**
   - Purpose/Overview
   - Prerequisites (if applicable)
   - Step-by-step instructions
   - Examples
   - Troubleshooting
   - Related documentation links

4. **Bilingual support:**
   - Include EN/TH translations where user-facing
   - Use consistent terminology with codebase

---

## 🔍 Search Tips

- Use your editor's search functionality (Ctrl/Cmd + Shift + F) to search across all documentation
- Check **[QUICK_REFERENCE.md](archive/QUICK_REFERENCE.md)** for common commands
- Browse by category above for specific needs
- Check folder READMEs for category-specific navigation

---

## 🗂️ Recent Updates

**December 3, 2025** - v4.5.31 - Documentation Consolidation

- ✅ Updated all documentation to v4.5.31
- ✅ Added 5 new patterns (database seeding, wizard onboarding, lazy loading, modular component decomposition, backend module split)
- ✅ Updated architecture docs with modular structures (`components/class-booking/`, `convex/classes/`)
- ✅ Marked class-booking.tsx and classes.ts refactoring as COMPLETE
- ✅ Added guardian deprecation notices throughout documentation
- ✅ Clarified bilingual pattern (developer UI vs user content)
- ✅ Archived redundant documentation files to `docs/archive/`

**November 5, 2025** - Documentation reorganization

- ✅ Created logical folder structure (guides, architecture, features, security, ui-design, audits-reviews)
- ✅ Moved files to appropriate categories using `git mv` (preserves history)
- ✅ Updated README with clear navigation and task-based index
- ✅ Improved discoverability and maintainability

**November 2, 2025** - v4.5.18

- Updated backup guides
- Added linting infrastructure docs
- Security documentation improvements

---

**Quick Reference:** [QUICK_REFERENCE_CARD.md](QUICK_REFERENCE_CARD.md) (archived: [QUICK_REFERENCE.md](archive/QUICK_REFERENCE.md))  
**Main Documentation Hub:** [.github/copilot-docs/](../.github/copilot-docs/)
