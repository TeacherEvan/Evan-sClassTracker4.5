# Quick Fix for TypeScript Errors

## Problem

You're seeing TypeScript errors like:

- `Property 'messages' does not exist on type...`
- `Property 'conversations' does not exist on type...`

## Root Cause

The new backend files (`convex/conversations.ts` and `convex/messages.ts`) were created, but Convex hasn't regenerated the API types yet.

## Solution (30 seconds)

### Step 1: Start Convex Dev Server

```powershell
npx convex dev
```

Wait for the message:

```
✔ Convex functions ready!
```

This will automatically regenerate the types in `convex/_generated/`.

### Step 2: Restart TypeScript Server in VSCode

1. Press `Ctrl+Shift+P`
2. Type "TypeScript: Restart TS Server"
3. Press Enter

### Step 3: Verify

All red squiggly lines should disappear!

## Why This Happens

Convex uses code generation to create TypeScript types from your backend files. When you add new files like `conversations.ts` and `messages.ts`, the types won't exist until Convex processes them.

## Alternative: Ignore for Now

These are **type-checking errors only**. The code will work fine once you start the dev server. You can safely ignore them until you're ready to test.

---

**Next Step After Fix**: See `QUICK_START.md` for testing the new messaging system!
