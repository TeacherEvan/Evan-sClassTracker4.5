# Authentication Flow Diagram

## BEFORE (Broken)

```
Frontend (class-booking.tsx)
    ↓
    deleteClass({ classId })  ← Missing userId!
    ↓
Backend (convex/classes.ts)
    ↓
    ctx.auth.getUserIdentity()  ← Returns null (no Convex auth)
    ↓
    ❌ Error: "Not authenticated"
```

## AFTER (Fixed)

```
Frontend (class-booking.tsx)
    User logged in → userId stored in component props
    ↓
    deleteClass({ classId, userId })  ← Passes userId
    ↓
Backend (convex/classes.ts)
    ↓
    ctx.db.get(args.userId)  ← Fetch user from database
    ↓
    Check user.role === "admin" or "moderator"
    ↓
    ✅ Authorized → Proceed with deletion
```

## Authentication Architecture

```
┌─────────────────────────────────────────────────────┐
│  Browser (Frontend)                                 │
│                                                     │
│  1. User enters username/password                  │
│  2. Calls api.users.login(username, password)      │
│  3. Backend verifies password hash                 │
│  4. Returns user object (without password)         │
│  5. Stores user in localStorage                    │
│     localStorage.setItem("currentUser", JSON.stringify(user))
│                                                     │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  Subsequent Requests                                │
│                                                     │
│  Component gets user from localStorage              │
│  Passes user._id to mutations requiring auth        │
│  Backend verifies user exists and has correct role  │
│                                                     │
└─────────────────────────────────────────────────────┘

## Key Insight

This app does NOT use Convex's built-in authentication system.
Instead, it uses:
- Custom username/password stored in database
- Manual session management via localStorage
- Explicit userId parameters for authorization
```

## Comparison: Convex Auth vs Custom Auth

### Convex Built-in Auth (NOT USED)
```typescript
// Backend
const identity = await ctx.auth.getUserIdentity();
// Returns OAuth identity from providers like Google, GitHub

// Frontend
import { useConvexAuth } from "convex/react";
const { isAuthenticated, isLoading } = useConvexAuth();
```

### Custom Auth (ACTUALLY USED)
```typescript
// Backend
const user = await ctx.db.get(args.userId);
if (!user || !["admin", "moderator"].includes(user.role)) {
  throw new Error("Unauthorized");
}

// Frontend
const user = JSON.parse(localStorage.getItem("currentUser"));
await someAction({ userId: user._id, ... });
```

## Related Code References

- **Login system**: `convex/users.ts` - `login` mutation (line 126)
- **User storage**: `app/page.tsx` - localStorage management (line 76-92)
- **Auth pattern example**: `convex/classes.ts` - `book` mutation (line 169-288)
- **Component props**: `components/class-booking.tsx` - receives `userId` (line 19)
