# Fix Summary: Admin/Moderator Class Management Authentication

## Issue
The `updateClass` and `deleteClass` mutations were failing with "Server Error" when called by admin or moderator users.

### Error Screenshots
- Error 1: `[CONVEX M(classes:deleteClass)] [Request ID: e1209b290f0dd922] Server Error - Called by client`
- Error 2: `[CONVEX M(classes:updateClass)] [Request ID: 1fa625ad3e1acc47] Server Error - Called by client`

## Root Cause
The mutations were trying to authenticate users using Convex's built-in authentication system via `ctx.auth.getUserIdentity()`:

```typescript
const identity = await ctx.auth.getUserIdentity();
if (!identity) {
  throw new Error("Not authenticated");
}

const user = await ctx.db
  .query("users")
  .withIndex("by_username", (q) => q.eq("username", identity.subject))
  .first();
```

However, this application uses a **custom authentication system** with:
- Username/password stored in the database
- Manual login via `api.users.login` mutation  
- User data stored in browser `localStorage`
- No Convex built-in auth configured

Since `ctx.auth.getUserIdentity()` always returned `null`, the authentication check always failed.

## Solution
Changed both mutations to accept a `userId` parameter (similar to the existing `book` mutation which uses `bookedByUserId`), then verify the user's role directly from the database:

### Backend Changes (convex/classes.ts)

**Before:**
```typescript
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    // ... other args
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();
    
    if (!user || !["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized");
    }
    // ...
  }
});
```

**After:**
```typescript
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"), // User performing the update
    // ... other args
  },
  handler: async (ctx, args) => {
    // Get user and verify admin/moderator role
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can edit classes");
    }
    // ...
  }
});
```

Same pattern applied to `deleteClass` mutation.

### Frontend Changes (components/class-booking.tsx)

Updated both mutation calls to pass the `userId` prop (which the component already receives):

**handleDelete function:**
```typescript
await deleteClass({ classId, userId });
```

**handleEditClass function:**
```typescript
const updates = {
  classId: classItem._id,
  userId,
  // ... other fields
};
await updateClassMutation(updates);
```

## Files Modified
1. `convex/classes.ts` - Updated `updateClass` and `deleteClass` mutations
2. `components/class-booking.tsx` - Updated mutation calls to pass `userId`

## Testing Recommendations
1. Login as admin or moderator user
2. Navigate to class management
3. Try editing a class (update date, student, location, or status)
4. Try deleting a class
5. Verify that:
   - Actions complete successfully without errors
   - Teacher receives notification about the update/deletion
   - Changes are reflected in the database

## Pattern for Future Development
When creating new mutations that need authorization:
- **DO NOT** use `ctx.auth.getUserIdentity()` (not configured in this app)
- **DO** accept `userId` as a parameter
- **DO** fetch user from database using `ctx.db.get(userId)`
- **DO** verify role/permissions from the fetched user object

See the `book` mutation (line 169-288 in convex/classes.ts) for the established pattern.
