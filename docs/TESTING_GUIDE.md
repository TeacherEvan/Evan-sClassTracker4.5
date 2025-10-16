# Testing Guide for Client-Side Exception Fix

## Issue Fixed
The application was showing "Application error: a client-side exception has occurred" when users tried to use the app after database initialization.

## Root Causes Addressed

1. **Missing Loading State**: The app didn't handle the case when Convex queries were loading (returning `undefined`)
2. **Type Error in Convex**: `isInitialized` was incorrectly defined as a mutation instead of a query
3. **No Error Boundary**: Client-side exceptions weren't caught and displayed gracefully
4. **No Session Persistence**: User login state was lost on page reload
5. **Weak Environment Validation**: Missing Convex URL wasn't properly handled

## Changes Made

### Files Modified
- `app/page.tsx` - Added loading state and localStorage session persistence
- `convex/init.ts` - Fixed `isInitialized` from mutation to query
- `lib/convex-provider.tsx` - Improved error handling with runtime validation
- `components/error-boundary.tsx` - NEW: Error boundary component
- `app/layout.tsx` - Added error boundary wrapper

## Testing Instructions

### 1. Local Development Testing

#### Prerequisites
```bash
# Install dependencies
npm install

# Start Convex backend (required)
npx convex dev

# In another terminal, start Next.js
npm run dev
```

#### Test Scenario 1: Fresh Database Initialization
1. Clear your browser's localStorage and cookies
2. Navigate to http://localhost:3000
3. **Expected**: You should see "Initialize Database" screen with a loading spinner briefly first
4. Click "Initialize Database" button
5. **Expected**: Success screen with default credentials displayed
6. Click "Go to Login" button
7. **Expected**: Login screen appears (not an error)
8. Login with admin credentials (admin / TeacherAdmin)
9. **Expected**: Main dashboard appears, you should be prompted to change password

#### Test Scenario 2: Session Persistence
1. After logging in successfully (from Scenario 1)
2. Refresh the page (F5 or Ctrl+R)
3. **Expected**: You should remain logged in, see a brief loading spinner, then dashboard appears
4. Close the browser tab and reopen http://localhost:3000
5. **Expected**: You should still be logged in

#### Test Scenario 3: Logout and Re-login
1. Click the "Logout" button
2. **Expected**: Redirected to login screen
3. Refresh the page
4. **Expected**: Still on login screen (session cleared)
5. Login again
6. **Expected**: Dashboard appears

#### Test Scenario 4: Error Boundary (Simulated Error)
This tests that errors are caught gracefully:
1. Open browser DevTools Console
2. Trigger an error by opening the Console and typing:
   ```javascript
   throw new Error("Test error");
   ```
3. **Expected**: Error boundary screen appears with error message and "Reload Page" / "Try Again" buttons

### 2. Production Testing (Vercel)

#### Prerequisites
- Ensure `NEXT_PUBLIC_CONVEX_URL` is set in Vercel environment variables
- Value should be: `https://resolute-basilisk-801.convex.cloud`

#### Deployment
```bash
# Deploy to Vercel
vercel

# Or push to main branch for automatic deployment
git push origin main
```

#### Test Scenario 1: First Time Setup
1. Navigate to your Vercel deployment URL
2. **Expected**: "Initialize Database" screen appears after brief loading
3. Complete database initialization
4. **Expected**: Login screen appears (not error screen)
5. Login and verify dashboard works

#### Test Scenario 2: Production Session Persistence
1. After logging in, refresh the page
2. **Expected**: Still logged in
3. Open deployment URL in new browser tab
4. **Expected**: Still logged in (localStorage persists)

### 3. Build Verification

```bash
# Test production build locally
NEXT_PUBLIC_CONVEX_URL="https://resolute-basilisk-801.convex.cloud" npm run build

# Expected: Build succeeds with no errors

# Start production server
npm run start
```

## Known Behaviors

### Loading States
- Brief loading spinner appears when:
  - Initial page load while Convex connects
  - After database initialization when checking for users
  - After page refresh while restoring session

### Session Management
- Login sessions persist in browser localStorage
- Sessions survive page refreshes and new tabs
- Logout clears the session
- Changing password updates the stored session

### Error Handling
- Missing Convex URL shows configuration error (production only, not build time)
- Client-side exceptions are caught by error boundary
- Database connection errors are handled gracefully

## Troubleshooting

### Issue: Error Boundary Appears with "Missing NEXT_PUBLIC_CONVEX_URL"
**Solution**: Set the environment variable in `.env.local` (local) or Vercel settings (production):
```
NEXT_PUBLIC_CONVEX_URL=https://resolute-basilisk-801.convex.cloud
```

### Issue: Blank screen after login
**Solution**: 
1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()` in console
3. Refresh the page

### Issue: Build fails with environment variable error
**Solution**: This should no longer happen - the Convex provider now uses a dummy URL at build time

### Issue: Session lost after refresh
**Solution**: 
1. Check that localStorage is enabled in your browser
2. Check browser console for errors related to JSON parsing
3. Clear localStorage and login again

## Verification Checklist

- [ ] Build completes successfully
- [ ] No linting errors
- [ ] Loading spinner appears on initial load
- [ ] Database initialization works without errors
- [ ] Login redirects to dashboard (not error screen)
- [ ] Page refresh maintains login session
- [ ] Logout clears session properly
- [ ] Error boundary catches and displays errors
- [ ] Works in both English and Thai languages

## Additional Notes

### Security Considerations
- Passwords are base64 encoded (not production-ready, should use bcrypt)
- Sessions stored in localStorage (consider using httpOnly cookies for production)
- No token expiration implemented (should add timeout for production)

### Future Improvements
1. Implement proper token-based authentication with expiration
2. Add session refresh mechanism
3. Use httpOnly cookies instead of localStorage
4. Add bcrypt password hashing
5. Implement rate limiting on login attempts
