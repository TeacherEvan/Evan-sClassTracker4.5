# AI Agent Instructions - Index

**Evan's Class Tracker 4.5** - Bilingual (English/Thai) class tracking system  
**Version:** 4.5.7 (Oct 28, 2025)

---

## 📋 Agent-Friendly Navigation

This documentation is split into focused sections for efficient knowledge discovery. Start with the Quick Start, then dive into specific areas as needed.

### 🚀 Essential Reading (Start Here)

**[Quick Start Guide](./copilot-docs/01-quick-start.md)** ⭐ **READ FIRST**
- 6 critical rules that prevent runtime failures
- Tech stack overview
- Critical files reference
- How to start development servers

**[Architecture Essentials](./copilot-docs/02-architecture.md)**
- Provider hierarchy (load-bearing order)
- Convex backend patterns
- Authentication & session management
- Database schema structure

### 📚 Core Documentation

**[Non-Negotiable Patterns](./copilot-docs/03-patterns.md)** (20 patterns)
- Bilingual-first development
- Index-first queries (performance critical)
- N+1 query prevention
- Toast notifications
- Rate limiting
- Unique student IDs
- Class booking state machine
- Soft deletes
- File upload patterns
- Login security (account lockout)
- Bulk deletion (security-critical)
- Audit logging
- Teacher cycle editor
- Guardian student booking (auto-approve)
- Recurring weekly bookings
- Error reporting
- Hierarchical student selector
- Modal accordion pattern (NEW Oct 2025)
- Modal flex layout pattern (NEW Oct 2025)
- Pagination pattern (NEW Oct 2025)
- Collapsible section pattern (NEW Oct 2025)

**[Integration Points & Architecture](./copilot-docs/04-integration.md)**
- System architecture overview (3-tier)
- Core data flow patterns
- Class booking workflow (end-to-end)
- Student management workflow
- Messaging ↔ Notifications integration
- School → Moderator → Teacher relationship
- File upload & storage integration
- Component communication patterns
- Cross-cutting concerns
- Audit logging integration

**[Security Considerations](./copilot-docs/05-security.md)** ⚠️
- Security context & environment (private repo)
- Known limitations (NOT production-ready)
- Password hashing issues
- Rate limiting gaps
- localStorage risks

### 🛠️ Development & Testing

**[Development Workflow](./copilot-docs/06-development.md)**
- Local development setup (PowerShell)
- Convex schema changes & migrations
- Debugging real-time updates
- Debugging toast notifications
- Build & deploy
- CI/CD pipeline
- Environment setup
- Testing new features

**[E2E Testing Guide](./copilot-docs/07-testing.md)**
- Playwright setup & commands
- Test structure overview
- 7 Best practices for writing tests
- 4 Performance optimization patterns
- Real test examples from codebase
- Bilingual testing strategies
- Test users & credentials

### 📖 Reference Materials

**[Common Pitfalls](./copilot-docs/08-pitfalls.md)**
- What NOT to do (8 critical warnings)
- Safe changes you can make
- When to ask before proceeding

**[Post-Implementation Procedures](./copilot-docs/09-procedures.md)**
- Update notification workflow (automated)
- Implementation summary conventions
- School-specific vs broadcast notifications
- Version tracking & changelog

**[Key Files Reference](./copilot-docs/10-files.md)**
- Architecture & schema files
- Core patterns & helpers
- Backend logic files
- UI components
- Feature documentation

---

## 🎯 Quick Decision Tree

**I need to...**

- **Get started immediately** → [Quick Start Guide](./copilot-docs/01-quick-start.md)
- **Understand the architecture** → [Architecture Essentials](./copilot-docs/02-architecture.md)
- **Implement a new feature** → [Non-Negotiable Patterns](./copilot-docs/03-patterns.md)
- **Debug real-time issues** → [Development Workflow](./copilot-docs/06-development.md) → Debugging sections
- **Write E2E tests** → [E2E Testing Guide](./copilot-docs/07-testing.md)
- **Deploy to production** → [Security Considerations](./copilot-docs/05-security.md) ⚠️ **READ FIRST**
- **Find a specific file** → [Key Files Reference](./copilot-docs/10-files.md)
- **Avoid breaking changes** → [Common Pitfalls](./copilot-docs/08-pitfalls.md)

---

## 📊 Documentation Stats

- **Total Documentation**: ~2000 lines split into 10 focused files
- **Code Patterns**: 20 non-negotiable patterns documented
- **Architecture Diagrams**: 11 ASCII diagrams across integration docs
- **Test Best Practices**: 7 E2E testing patterns + 4 performance optimizations
- **Security Warnings**: 4 known limitations clearly marked

---

## 🔄 Last Updated

**October 29, 2025** - Version 4.5.8
- Added Pagination Pattern (#19) and Collapsible Section Pattern (#20)
- 85-96% DOM reduction, 64% memory reduction, 33% faster mobile loads
- Comprehensive code review completed (see CODE_REVIEW_OCT_29_2025.md)
- All patterns documented with examples and performance metrics

---

**Note for AI Agents**: Each section file is self-contained with cross-references. Follow the links to deep-dive into specific topics. Start with Quick Start for immediate productivity.

---

## 🚀 Quick Start for AI Agents (Preview)

**If you only read 5 things, read these:**

1. **NEVER reorder providers** in `app/layout.tsx` - the hierarchy is load-bearing (ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider). Reordering causes runtime failures.

2. **Everything is bilingual (English/Thai)** - Schema has `title` AND `titleTh`. Forms need parallel inputs. Use `BilingualInput` component. Validation: `&&` (AND) not `||` (OR) for optional fields.

3. **Always use `.withIndex()`** for Convex queries - check `convex/schema.ts` for indexes. NEVER query inside loops - use batch fetch + Map pattern. This is critical for performance.

4. **Custom auth, not Convex built-in** - Uses localStorage sessions (24hr expiry), `btoa()` password hashing (⚠️ NOT production-secure), and explicit userId passing. See `lib/session-utils.ts`.

5. **All components need `"use client"`** - Next.js App Router requires this directive for client-side hooks (`useQuery`, `useMutation`, `useState`).

6. **Guardian students auto-approve** - Classes with `isGuardianLinked: true` bypass moderator approval workflow (NEW Oct 2025).

**Start Convex FIRST**: `npx convex dev` (must be running before `npm run dev`)

---

**For complete documentation on each topic, see the linked files in the sections above.**

