# Evan's Class Tracker 4.5 - AI Coding Instructions

## Project Overview
Bilingual (English/Thai) notification system for teachers and schools, built with Next.js 15, React 19, and Convex real-time backend. This is a full-stack TypeScript application using App Router and React Server Components.

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
- **API**: Export `query` and `mutation` functions from `convex/notifications.ts`
- **Client usage**: 
  ```tsx
  import { useQuery, useMutation } from "convex/react";
  import { api } from "@/convex/_generated/api";
  
  const notifications = useQuery(api.notifications.list, { userId });
  const createNotification = useMutation(api.notifications.create);
  ```
- **Generated code**: Never edit files in `convex/_generated/` - they auto-regenerate on schema changes

### Database Indexing Strategy
The `notifications` table uses three indexes for performance:
- `by_user`: For user-specific queries (`userId`)
- `by_created_at`: For chronological sorting (default desc order)
- `by_read`: For filtering unread notifications

When adding queries, use `.withIndex()` to leverage these indexes.

## Development Workflow

### Local Development
```powershell
npm install          # Install dependencies
npx convex dev       # Start Convex backend (required first)
npm run dev          # Start Next.js with Turbopack
```

### Environment Setup
- Convex setup creates `.env.local` with `NEXT_PUBLIC_CONVEX_URL`
- Never commit `.env.local` (already in `.gitignore`)
- For production: Run `npx convex deploy` to get production URL

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
1. If it needs data: Update `convex/schema.ts` and add query/mutation to `convex/notifications.ts`
2. If it has UI: Create component in `components/` with `"use client"`
3. Add bilingual strings using `t()` helper throughout
4. Test in both English and Thai language modes

### Adding Database Fields
1. Update schema in `convex/schema.ts`
2. Add fields to mutations in `convex/notifications.ts`
3. Update TypeScript types (auto-generated in `convex/_generated/`)
4. For bilingual fields: Add both `field` and `fieldTh` versions

### Debugging Convex Issues
- Check Convex dashboard: Database tables, function logs, errors
- Verify `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
- Ensure `npx convex dev` is running during development
- Check browser console for real-time connection issues

## Deployment

**Production Stack**: Vercel (frontend) + Convex (backend)

1. Deploy Convex: `npx convex deploy` (get production URL)
2. Set Vercel env var: `NEXT_PUBLIC_CONVEX_URL=<production-url>`
3. Deploy to Vercel (auto-deploys on push to main)

See `DEPLOYMENT.md` for detailed steps.

## Project-Specific Rules

- **Never remove bilingual support**: Every feature must work in both languages
- **Always use Convex for data**: No REST APIs, no direct database access
- **Client components only**: This app uses client-side rendering for interactivity
- **Turbopack is required**: Don't remove `--turbopack` from scripts (builds fail without it)
- **Respect the provider hierarchy**: ConvexClientProvider must wrap LanguageProvider
