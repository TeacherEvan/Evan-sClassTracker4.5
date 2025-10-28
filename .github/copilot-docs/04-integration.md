# Integration Points & Architecture

[← Back to Index](../copilot-instructions.md)

---

This comprehensive guide covers how major system components interact, data flows, and architectural decisions.

## System Architecture Overview

**3-Tier Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  Next.js 15 (App Router) + React 19 + Tailwind v4              │
│  - Client Components ("use client")                             │
│  - Real-time UI Updates (Convex subscriptions)                  │
│  - Bilingual Support (EN/TH)                                    │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                         │
│  Convex Backend (Serverless Functions)                          │
│  - Queries (Read operations with real-time subscriptions)       │
│  - Mutations (Write operations with validation)                 │
│  - Authorization (Role-based access control)                    │
│  - Rate Limiting (Anti-abuse protection)                        │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  Convex Database (NoSQL with indexes)                           │
│  - Real-time subscriptions                                      │
│  - Automatic denormalization                                    │
│  - Index-based queries                                          │
│  - File storage (_storage)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Data Flow Patterns

### 1. Class Booking Workflow (End-to-End)

Complete workflow from teacher booking to moderator approval with real-time updates.

**Flow Diagram**:

```
Teacher Books → Convex DB → Moderator Notified → Approval/Rejection → Teacher Notified
```

**5 Steps**:

1. Teacher calls `api.classes.book` mutation (rate limited 30/min)
2. Auto-notification created for moderator (unless guardian-linked)
3. Real-time UI updates (WebSocket subscriptions)
4. Moderator approves/rejects (authorization checked)
5. Teacher receives notification

See full workflow in `convex/classes.ts`.

### 2. Student Management Workflow

Student creation with dual ID generation (School vs Guardian) and duplicate prevention.

**ID Generation Routing**:

- School student: `SCHOOLHASH-NAMEHASH-TIMESTAMP-RANDOM`
- Guardian student: `AREA-NAMEHASH-BIRTHDATE-RANDOM`

---

## Messaging System ↔ Notifications

**Dual Communication Channels**:

**Notifications** (System-Generated):

- Auto-created by mutations
- One-way communication
- Real-time unread badges
- Examples: Class booking status, admin announcements

**Messages** (User-Initiated):

- Manual creation by users
- File attachments supported
- Read receipts via `acknowledgedBy`
- Direct (1-to-1) and group (school-wide)

**Integration**: Class booking mutation auto-creates notification for moderator.

---

## School → Moderator → Teacher Relationship

**Hierarchical Access Model**:

1. **ADMIN** (God Mode)
   - Access: ALL schools, ALL users, ALL data
   - Role: Singleton, creates all users manually

2. **MODERATOR** (School-Scoped)
   - Access: ONE school only (via schoolId)
   - Capabilities: Approve/reject classes, manage students, send group messages

3. **TEACHER** (Multi-School)
   - Access: Can book at ANY school
   - Capabilities: Book classes, create students, view own classes

4. **GUARDIAN** (Private Tutoring)
   - Access: Own students only
   - Auto-approved bookings (no moderator)

**Authorization Pattern**: See `convex/classes.ts` `verifyClassAccess()` function.

**Key Design Decisions**:

- Moderators are school-scoped (prevents cross-school data leaks)
- Teachers are global (supports substitute teaching)
- Admin is singleton (private repo, controlled environment)

---

## File Upload & Storage Integration

**Convex Storage Pattern** (4 steps):

1. Generate upload URL (`api.messages.generateUploadUrl`)
2. Upload file to S3 (direct from frontend)
3. Store metadata in database (storageId, name, type, size)
4. Retrieve download URL when needed (expires after 1 hour)

**Storage Limits**:

- Free tier: 1GB storage, 5GB bandwidth/month
- Practical file size: <100MB per file

**Pattern Locations**: `convex/messages.ts`, `components/messaging-hub.tsx`

---

## Component Communication Patterns

**Real-time Event Propagation**:

```
Mutation → Convex Backend → Database Update → WebSocket Push → Component Re-renders
```

**Provider-Based Data Sharing**:

```
ErrorBoundary → ConvexClientProvider → DeviceProvider → DataProvider → LanguageProvider
```

**DataProvider Pattern**: Shared cache for schools/users data prevents duplicate queries.

---

## Cross-Cutting Concerns

### Bilingual Support

- **Schema**: Dual fields (title/titleTh)
- **Backend**: Validation (both or one)
- **Frontend**: `useLanguage()` hook + `BilingualInput` component

### Error Handling

```
Component Error → ErrorBoundary → Toast + Error Report → Admin Dashboard
```

### Session Management

```
Login → localStorage + expiresAt → 24-hour auto-expiration → loadUserSession() → Valid/Expired
```

### Rate Limiting

```
checkRateLimit() → Generate key → Check window → Allow/Deny request
```

---

## Audit Logging Integration

**Auto-logging for critical actions**:

- User management (create, delete, update)
- Bulk operations
- Administrative changes
- Security-sensitive actions

**Helper**: `logAudit()` from `convex/auditHelpers.ts`

**Admin UI**: `components/audit-logs.tsx` with filters, statistics, CSV export

---

## Next Steps

- **Learn patterns** → [Non-Negotiable Patterns](./03-patterns.md)
- **Review security** → [Security Considerations](./05-security.md)
- **Development workflow** → [Development Workflow](./06-development.md)

---

[← Back to Index](../copilot-instructions.md)
