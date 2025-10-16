# Evan's Class Tracker 4.5 - AI Coding Instructions

## Project Overview
Bilingual (English/Thai) class tracking system with user authentication, class booking, student management, and real-time notifications for teachers and schools. Built with Next.js 15, React 19, and Convex real-time backend. This is a full-stack TypeScript application using App Router and client-side rendering.

## Architecture & Key Patterns

### Three-Layer Provider Architecture
The app uses a nested provider pattern in `app/layout.tsx`:
```tsx
<ConvexClientProvider>
  <LanguageProvider>{children}</LanguageProvider>
</ConvexClientProvider>
```
- **ConvexClientProvider** (`lib/convex-provider.tsx`): Wraps the app to enable real-time data sync
- **LanguageProvider** (`lib/language-context.tsx`): Manages bilingual state with `t()` helper function
- All client components must use `"use client"` directive when accessing these contexts

### Bilingual Content Pattern
ALL user-facing content requires both English and Thai versions:
- Database schema (`convex/schema.ts`): Fields are paired (e.g., `title` + `titleTh`, `message` + `messageTh`)
- Translation helper: Use `t("English text", "ข้อความไทย")` from `useLanguage()` hook
- Forms: Always include parallel input fields for both languages (see `components/notification-form.tsx`)
- Never add single-language content or UI text without both translations

### Convex Backend Integration
- **Location**: All backend code lives in `convex/` directory
- **Schema**: Defined in `convex/schema.ts` with validation using `v.*` validators
- **API Files**: 
  - `convex/users.ts` - Authentication & user management
  - `convex/schools.ts` - School CRUD operations
  - `convex/classes.ts` - Class booking workflow
  - `convex/students.ts` - Student management with unique ID generation
  - `convex/notifications.ts` - Real-time notifications
  - `convex/messages.ts` - Direct and group messaging system
  - `convex/init.ts` - Database initialization helper
- **Client usage**: 
  ```tsx
  import { useQuery, useMutation } from "convex/react";
  import { api } from "@/convex/_generated/api";
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const login = useMutation(api.users.login);
  const classes = useQuery(api.classes.list);
  ```
- **Generated code**: Never edit files in `convex/_generated/` - they auto-regenerate on schema changes

### Database Schema & Indexing Strategy
The system uses 6 interconnected tables:

1. **users** - User authentication & role-based access
   - Indexes: `by_username`, `by_school`, `by_role`
   - Roles: `admin`, `moderator`, `teacher`
   - Password security: Base64 encoded (upgradeable to bcrypt)

2. **schools** - School management
   - Index: `by_created_at`
   - Links to users (moderators) and classes

3. **classes** - Class booking workflow
   - Indexes: `by_teacher`, `by_school`, `by_status`, `by_created_at`
   - Status flow: `pending` → `acknowledged` → `approved`/`rejected`
   - Automatically triggers notifications

4. **students** - Student records
   - Indexes: `by_school`, `by_class`, `by_unique_id`
   - Unique ID format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`

5. **notifications** - Real-time alerts
   - Indexes: `by_user`, `by_created_at`, `by_read`
   - Auto-generated for class workflow events

6. **messages** - Direct and group messaging
   - Indexes: `by_sender`, `by_recipient`, `by_school`, `by_created_at`, `by_conversation`
   - Supports both 1-on-1 and school-wide group messages
   - Bilingual content with acknowledgment tracking

When adding queries, use `.withIndex()` to leverage these indexes.

## Development Workflow

### Local Development
```powershell
npm install          # Install dependencies
npx convex dev       # Start Convex backend (required first)
npm run dev          # Start Next.js with Turbopack
```

**Note**: These commands are for **local development only**. In production, Convex runs as a cloud service and Vercel handles the Next.js build automatically.

### Environment Setup
- Convex setup creates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Never commit `.env.local` (already in `.gitignore`)
- For production: Your Convex deployment is already running at the production URL
- Vercel reads environment variables from its dashboard settings

### Build Commands
- Dev: `npm run dev` (uses Turbopack via `--turbopack` flag)
- Build: `npm run build` (also uses Turbopack)
- Lint: `npm run lint` (uses ESLint 9 with flat config)

## Component Patterns

### Client Component Requirements
Components using hooks MUST have `"use client"`:
- Any component using `useLanguage()`, `useQuery()`, `useMutation()`
- All components in `components/` directory
- Event handlers (onClick, onChange, etc.)

### Authentication Flow
The app uses session-based authentication with `sessionStorage`:
```tsx
// Check current user
const currentUser = useQuery(api.users.getCurrentUser);

// Login pattern
const login = useMutation(api.users.login);
await login({ username, password });

// First-time password change required
if (currentUser?.requirePasswordChange) {
  // Show PasswordChangeDialog component
}
```

### Key Components
- **LoginForm** - Handles authentication with bilingual UI
- **PasswordChangeDialog** - Forced password change for new users
- **UserManagement** - Admin interface for creating users (password: `Teacher{username}`)
- **ClassBooking** - Class booking workflow with approval states
- **DatabaseInit** - First-time setup (creates admin account)
- **NotificationForm/List** - Real-time notification system
- **MessagingHub** - Direct and group messaging interface
- **DesktopNotificationToast** - Toast notifications for desktop
- **ModeratorListView** - Directory of school moderators
- **AdminContactButton** - Quick contact button for admin

### Notification Type System
Strict union type with four values:
```typescript
type: "info" | "success" | "warning" | "error"
```
Each maps to color-coded UI (blue/green/yellow/red). Always validate against this union.

### Form Submission Pattern
See `components/notification-form.tsx` for standard approach:
1. Use controlled inputs with individual state variables
2. Call Convex mutation in `handleSubmit`
3. Clear form fields after successful submission
4. No manual loading states needed (Convex handles optimistic updates)

## Styling Conventions

### Tailwind v4 Setup
- Uses new `@tailwindcss/postcss` package (v4)
- Dark mode: `dark:` variant automatically detects system preference
- Responsive: Use `md:` prefix for tablet/desktop layouts
- Forms: Standard pattern is `border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500`

### Color Coding for Notification Types
- Info: `bg-blue-50 border-blue-200` (light), adjust for dark mode
- Success: `bg-green-50 border-green-200`
- Warning: `bg-yellow-50 border-yellow-200`
- Error: `bg-red-50 border-red-200`

## Critical Dependencies

### Package Versions (see `package.json`)
- Next.js 15.5.4 with App Router
- React 19.1.0 (latest)
- Convex 1.27.5 (real-time backend)
- Tailwind CSS v4 (new major version)
- Lucide React for icons

### TypeScript Configuration
- Strict mode enabled
- Path alias: `@/` maps to project root
- React 19 types required (`@types/react@19`)

## Common Tasks

### Adding a New Feature
1. If it needs data: Update `convex/schema.ts` and add query/mutation to appropriate file in `convex/`
2. If it has UI: Create component in `components/` with `"use client"`
3. Add bilingual strings using `t()` helper throughout
4. Test in both English and Thai language modes
5. For workflow features: Add notification triggers (see `convex/classes.ts` for examples)

### User Authentication Pattern
Default user creation follows this pattern:
```typescript
// Admin creates user with username
username: "Evan"
password: "TeacherEvan" // Auto-generated: Teacher{username}
requirePasswordChange: true // Forced on first login
```

### Class Booking Workflow
Standard approval flow:
1. Teacher books class → Status: `pending`, Notification sent to moderator
2. Moderator acknowledges → Status: `acknowledged`
3. Moderator approves/rejects → Status: `approved`/`rejected`, Notification sent to teacher

### Student Unique ID Generation
Format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`
- See `convex/students.ts` for implementation
- System retries on collision (max 10 attempts)

### Adding Database Fields
1. Update schema in `convex/schema.ts`
2. Add fields to mutations in `convex/notifications.ts` or relevant file
3. Update TypeScript types (auto-generated in `convex/_generated/`)
4. For bilingual fields: Add both `field` and `fieldTh` versions

### Debugging Convex Issues
- Check Convex dashboard: Database tables, function logs, errors
- Verify `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Ensure `npx convex dev` is running during development
- Check browser console for real-time connection issues

## Deployment

**Production Stack**: Vercel (frontend) + Convex (backend - already deployed)

**Convex Backend**: Already running at `https://resolute-basilisk-801.convex.cloud`
- No manual deployment needed - it's a persistent cloud service
- Manages real-time database, queries, and mutations
- Automatically handles scaling and uptime

**Vercel Frontend Deployment**:
1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel` (follow prompts to link GitHub repo)
3. Set environment variable in Vercel dashboard:
   - `NEXT_PUBLIC_CONVEX_URL=https://resolute-basilisk-801.convex.cloud`
4. Future deploys: Auto-deploy on push to main branch

**Environment Variables**:
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL (required in Vercel settings)
- `CONVEX_DEPLOY_KEY` - For CI/CD automation (keep secret, optional)

**First-Time Setup After Deployment**:
1. Navigate to deployed app URL
2. Click "Initialize Database" button
3. Default admin account created (save credentials shown)
4. Login and change password immediately

See `DEPLOYMENT.md` for detailed steps.

## Project-Specific Rules

- **Never remove bilingual support**: Every feature must work in both languages
- **Always use Convex for data**: No REST APIs, no direct database access
- **Client components only**: This app uses client-side rendering for interactivity
- **Turbopack is required**: Don't remove `--turbopack` from scripts (builds fail without it)
- **Respect the provider hierarchy**: ConvexClientProvider must wrap LanguageProvider
