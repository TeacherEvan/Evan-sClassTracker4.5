# Evan's Class Tracker 4.5 - AI Coding Instructions

## Project Overview
Bilingual (English/Thai) class tracking system with user authentication, class booking, student management, real-time messaging, and notifications for teachers and schools. Built with Next.js 15, React 19, and Convex real-time backend. This is a full-stack TypeScript application using App Router and client-side rendering.

## Architecture & Key Patterns

### Three-Layer Provider Architecture
The app uses a nested provider pattern in `app/layout.tsx`:
```tsx
<ErrorBoundary>
  <ConvexClientProvider>
    <DeviceProvider userId={currentUser?._id}>
      <LanguageProvider>{children}</LanguageProvider>
    </DeviceProvider>
  </ConvexClientProvider>
</ErrorBoundary>
```
- **ErrorBoundary** (`components/error-boundary.tsx`): Catches and displays client-side exceptions gracefully
- **ConvexClientProvider** (`lib/convex-provider.tsx`): Wraps the app to enable real-time data sync
- **DeviceProvider** (`lib/device-context.tsx`): Detects device type (mobile/tablet/desktop) and syncs to database
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
  - `convex/conversations.ts` - Messaging conversation management
  - `convex/messages.ts` - Chat message handling
  - `convex/pushNotifications.ts` - Push notification subscription management
  - `convex/crons.ts` - Scheduled background jobs (message cleanup, subscription cleanup)
  - `convex/init.ts` - Database initialization helper
- **Client usage**: 
  ```tsx
  import { useQuery, useMutation } from "convex/react";
  import { api } from "@/convex/_generated/api";
  
  const currentUser = useQuery(api.users.getCurrentUser);
  const login = useMutation(api.users.login);
  const conversations = useQuery(api.conversations.list, { userId });
  ```
- **Generated code**: Never edit files in `convex/_generated/` - they auto-regenerate on schema changes
- **Query vs Mutation**: Use `query` for read-only operations, `mutation` for writes. Mismatching types causes runtime errors (see `convex/init.ts` for example)

### Database Schema & Indexing Strategy
The system uses 8 interconnected tables:

1. **users** - User authentication & role-based access
   - Indexes: `by_username`, `by_school`, `by_role`
   - Roles: `admin`, `moderator`, `teacher`
   - Password security: Base64 encoded (upgradeable to bcrypt)
   - Device tracking: `deviceType`, `lastDeviceUpdate`
   - Push notifications: Optional `pushSubscription` field

2. **schools** - School management
   - Indexes: `by_moderator`, `by_created_at`
   - Links to users (moderators) and classes
   - Contains `locations` array for class location management

3. **classes** - Class booking workflow
   - Indexes: `by_teacher`, `by_school`, `by_status`, `by_scheduled_date`, `by_school_and_date`, `by_teacher_and_date`
   - Status flow: `pending` → `acknowledged` → `approved`/`rejected`
   - Schema uses `name` and `location` (not `title`/`description` - this was refactored)
   - Automatically triggers notifications

4. **students** - Student records
   - Indexes: `by_student_id`, `by_school`, `by_guardian`
   - Unique ID format: `{SchoolHash}-{NameHash}-{Timestamp}-{Random}`
   - Supports both school-linked and guardian-linked students

5. **notifications** - Real-time alerts
   - Indexes: `by_user`, `by_created_at`, `by_read`
   - Auto-generated for class workflow events
   - Type union: `"info" | "success" | "warning" | "error"`

6. **conversations** - Messaging conversations
   - Indexes: `by_last_message`, `by_school`, `by_created_at`
   - Type: `"direct"` (2 participants) or `"group"` (2+ participants)
   - Participants array stores user IDs
   - Auto-inserts acknowledgment message on creation

7. **messages** - Chat messages
   - Indexes: `by_conversation`, `by_sender`, `by_created_at`
   - Read tracking via `readBy` array of user IDs
   - Linked to conversation via `conversationId`
   - Supports `senderId: "system"` for system messages
   - Message types: `"normal" | "acknowledgment"` (acknowledgments preserved during cleanup)

8. **pushSubscriptions** - Web Push notification subscriptions
   - Indexes: `by_user`, `by_endpoint`, `by_created_at`
   - Stores Web Push API subscription data
   - Includes device information for targeted notifications
   - Auto-cleanup of expired subscriptions via cron job

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

### Error Handling Pattern
All Convex mutations should handle errors gracefully:
```tsx
try {
  await mutation({ field: value });
  // Clear form or update UI
} catch (err) {
  setError(err instanceof Error ? err.message : "Operation failed");
}
```
- Convex mutations can throw errors (e.g., validation failures in backend)
- Use try-catch blocks when calling mutations from UI components
- Display user-friendly error messages in both languages
- ErrorBoundary catches unhandled client-side exceptions at app level

### Key Components
- **LoginForm** - Handles authentication with bilingual UI
- **PasswordChangeDialog** - Forced password change for new users
- **UserManagement** - Admin interface for creating users (password: `Teacher{username}`)
- **ClassBooking** - Class booking workflow with approval states
- **DatabaseInit** - First-time setup (creates admin account)
- **NotificationForm/List** - Real-time notification system
- **MessagingHub** - Enhanced messaging interface with 5 category buttons (Available Users, Groups, Moderators, Admin, Messages)
- **ConversationList** - Shows all user conversations with unread counts
- **MessageThread** - Chat interface with real-time updates and auto-scroll
- **NewConversationDialog** - Modal for starting new direct/group conversations
- **DesktopNotificationToast** - Desktop-only corner notifications with auto-dismiss
- **WeeklyCalendar** - Calendar view using `name` and `location` fields (not title/description)
- **StudentManagement** - CRUD operations for students with guardian support
- **SchoolManagement** - School management with location arrays
- **ErrorBoundary** - Client-side exception handler with recovery options

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

### Real-Time Data Pattern
Convex automatically subscribes to queries and updates components:
```tsx
// Component automatically re-renders when data changes
const messages = useQuery(api.messages.list, { conversationId });
const unreadCount = useQuery(api.messages.getUnreadCount, { userId });

// Mutations trigger automatic re-queries
const sendMessage = useMutation(api.messages.send);
await sendMessage({ conversationId, content }); // UI updates automatically
```
- No manual polling or WebSocket setup needed
- Use `useQuery` for read operations (auto-subscribes to changes)
- Use `useMutation` for write operations (auto-triggers re-queries)
- Loading states: Check if query result is `undefined` (means loading)

### Messaging System Architecture
Four-component pattern for chat features:
1. **Hub** (`messaging-hub.tsx`): Enhanced messaging interface with category buttons (Available Users, Groups, Moderators, Admin, Messages)
2. **List** (`conversation-list.tsx`): Display conversations with unread counts
3. **Thread** (`message-thread.tsx`): Display and send messages with auto-scroll
4. **Dialog** (`new-conversation-dialog.tsx`): Create new conversations

Key patterns:
- Auto-scroll to bottom on new messages using `scrollIntoView()`
- Mark messages as read when conversation is viewed
- Prevent duplicate direct conversations with `findDirect` query
- Update `lastMessageAt` timestamp on conversation when new message sent

#### Messaging Hub Category Views
The messaging hub provides 5 category buttons for different user access patterns:

1. **Available Users** - Two-step flow:
   - Step 1: Select school from list
   - Step 2: View users from selected school, click to message
   - Query: `api.conversations.getUsersBySchool(schoolId, currentUserId)`

2. **Groups** - Group conversations:
   - Shows all group conversations user is part of
   - Displays member count and last message date
   - Query: `api.conversations.getGroupConversations(userId)`

3. **Moderators** - Contact moderators:
   - Lists all moderators in the system
   - Shows moderator name with message button
   - Query: `api.conversations.getModerators(currentUserId)`

4. **Admin** - Contact system administrator:
   - Special card design for admin contact
   - Direct line to Evan for urgent issues
   - Query: `api.conversations.getAdmin()`

5. **Messages** - All conversations (default view):
   - Shows all user's conversations (direct + group)
   - Uses existing ConversationList component

Pattern for starting conversations from categories:
```tsx
const findOrCreate = useMutation(api.conversations.findOrCreate);

const handleStartChat = async (otherUserId: Id<"users">) => {
  const conversationId = await findOrCreate({
    participants: [userId, otherUserId],
  });
  setSelectedConversationId(conversationId);
  setViewMode("all-messages");
};
```

### Device Detection Pattern
The app detects device type (mobile/tablet/desktop) using multi-signal detection:

**Detection Utility** (`lib/device-detection.ts`):
- Combines User Agent, touch capability, screen size, and orientation
- Caches result in localStorage for 24 hours
- Provides: `detectDevice()`, `isMobileDevice()`, `isDesktopDevice()`

**Device Context** (`lib/device-context.tsx`):
- Auto-detects on component mount
- Re-detects on window resize (debounced 500ms)
- Updates user.deviceType in database via `api.users.updateDeviceType`
- Provides hooks: `useDevice()`, `useDeviceType()`, `useIsMobile()`, `useIsDesktop()`

**Usage:**
```tsx
import { useIsMobile, useIsDesktop } from "@/lib/device-context";

const isMobile = useIsMobile();
const isDesktop = useIsDesktop();

// Conditional rendering
{isDesktop && <DesktopNotificationToast />}
```

### Push Notifications Setup
Web Push API integration for mobile notifications:

**Service Worker** (`public/sw.js`):
- Handles push events and displays notifications
- Click handler opens app to specific conversation
- Auto-renews expired subscriptions

**Client Utilities** (`lib/push-notifications.ts`):
- `requestNotificationPermission()` - Ask user for permission
- `subscribeToPushNotifications()` - Create subscription
- `unsubscribeFromPushNotifications()` - Remove subscription
- `saveSubscriptionToDatabase()` - Persist to Convex

**Backend API** (`convex/pushNotifications.ts`):
- `subscribe(userId, subscription, deviceInfo)` - Save subscription
- `unsubscribe(userId, endpoint)` - Remove subscription
- `sendNotification(userId, title, body, url, data)` - Send push (internal)
- `cleanupExpiredSubscriptions()` - Cron job removes expired subscriptions

**VAPID Keys Required:**
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
VAPID_SUBJECT=mailto:evan@example.com
```

Generate with: `npx web-push generate-vapid-keys`

### Message Retention Policy
Automated message cleanup system:

**Retention Rules:**
- Messages older than 14 days are auto-deleted
- System messages and acknowledgments are preserved
- Runs daily at 2AM UTC via cron job

**Acknowledgment System:**
- Auto-inserted on new conversation creation
- Message: "Messages will be cleared from the server automatically every 2 weeks"
- Type: `messageType: "acknowledgment"`, `senderId: "system"`
- Never deleted by cleanup job

**Cron Jobs** (`convex/crons.ts`):
```typescript
crons.daily("clean-old-messages", { hourUTC: 2 }, cleanupOldMessages);
crons.weekly("clean-expired-push-subscriptions", { 
  dayOfWeek: "sunday", 
  hourUTC: 3 
}, cleanupExpiredSubscriptions);
```

### Desktop Notification Toast
Desktop-only corner notifications for new messages:

**Component** (`components/desktop-notification-toast.tsx`):
- Fixed bottom-right positioning
- Auto-dismisses after 5 seconds with progress bar
- Click to navigate to conversation
- Manual dismiss button (X icon)
- Only renders on desktop devices (`useIsDesktop()` check)
- Supports multiple notifications (stacked)

**Usage:**
```tsx
const [notifications, setNotifications] = useState<NotificationData[]>([]);

<DesktopNotificationToast
  notifications={notifications}
  onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
  onNavigate={(conversationId) => {
    setSelectedConversation(conversationId);
  }}
/>
```

**Notification Data:**
```typescript
interface NotificationData {
  id: string;
  conversationId: Id<"conversations">;
  senderName: string;
  message: string;
  timestamp: number;
}
```

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
- **Type mismatches**: Common if schema changed but types not regenerated - run `npx convex dev` and save any file
- **Query vs Mutation errors**: Read-only operations must use `query`, write operations use `mutation`
- **Loading states**: Always check if `useQuery` returns `undefined` before accessing data

### Common Pitfalls
- **Schema field changes**: If you change schema fields (e.g., `title` → `name`), update ALL components using those fields. Check `lib/types.ts` for TypeScript definitions
- **Missing indexes**: Adding `.withIndex()` to queries requires corresponding index in schema
- **Session persistence**: App uses `localStorage` for sessions (not secure for production - documented for future enhancement)
- **Build-time vs runtime**: Environment variables prefixed with `NEXT_PUBLIC_` are embedded at build time

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
