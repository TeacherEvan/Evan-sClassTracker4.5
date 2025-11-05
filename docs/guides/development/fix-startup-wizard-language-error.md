# Fix: Language Change Error in Startup Wizard

## Issue Description

When users changed the language in the moderator welcome wizard, an "Application Error" dialog appeared with the message:

```text
Failed to execute 'removeChild' on 'Node': 
The node to be removed is not a child of this node.
```

## Root Cause Analysis

### The Problem

This is a classic React DOM reconciliation error that occurs when:

1. A component tree is re-rendered due to state changes (in this case, language change)
2. React's reconciliation algorithm tries to match old virtual DOM nodes with new ones
3. Without unique `key` props, React may incorrectly identify which nodes to update vs. remove
4. This causes React to attempt to remove a DOM node that's already been removed or moved

### Why It Happened

In `components/startup-window.tsx`, when the language toggle button was clicked:

1. The `language` state changed via `setLanguage()`
2. This triggered a re-render of the entire `StartupWindow` component
3. The conditionally rendered wizard modals (BookingWizard, ClassCountReportWizard, etc.) were re-rendered
4. **These wizards had NO `key` props**, so React used the component's position in the tree as the key
5. During the re-render, React's reconciliation algorithm got confused about which DOM nodes belonged to which components
6. This led to attempting to remove DOM nodes that were not actual children of their supposed parent

### Code Before Fix

```tsx
{showBookingWizard && (
    <BookingWizard
        userId={user._id}
        userRole={user.role as "teacher" | "moderator"}
        // ... other props
    />
)}
```

## The Solution

### Implementation

Added unique `key` props to each wizard modal that include the current language:

```tsx
{showBookingWizard && (
    <BookingWizard
        key={`booking-wizard-${language}`}
        userId={user._id}
        userRole={user.role as "teacher" | "moderator"}
        // ... other props
    />
)}
```

### Why This Works

1. **Unique Keys**: Each wizard now has a unique key that changes when language changes
   - `booking-wizard-en` → `booking-wizard-th`
   - `class-count-wizard-en` → `class-count-wizard-th`
   - `message-wizard-en` → `message-wizard-th`
   - `analytics-en` → `analytics-th`

2. **Forced Remounting**: When the key changes, React treats it as a completely different component
   - Old wizard is unmounted cleanly
   - New wizard is mounted fresh
   - No DOM reconciliation confusion

3. **Side Benefit**: Wizard state is reset on language change
   - This is actually desirable UX - prevents partial form state in wrong language
   - Users get a fresh start when switching languages

## Technical Background

### React Key Prop Behavior

From React documentation:

> Keys tell React which array element each component corresponds to, so it can match them up later. This becomes important if your array elements can move, get inserted, or get deleted.

In our case, the wizard components don't move in an array, but they DO get re-created when language changes. The key helps React understand:

- "This is a new wizard in Thai, unmount the old English one"
- vs. "This is the same wizard, just update its content"

### Why Language in the Key?

We specifically include the language variable because:

1. It's the trigger for the re-render that was causing issues
2. It ensures complete component remount on language change
3. It's semantically correct - different language = different component instance
4. It avoids any lingering state from the previous language

### Alternative Solutions Considered

1. **useEffect to reset state**: Could reset wizard state on language change
   - ❌ More complex, doesn't solve DOM reconciliation
   - ❌ Still risk of transient errors during re-render

2. **Refs and manual DOM manipulation**: Force re-render via refs
   - ❌ Anti-pattern in React
   - ❌ Much more complex, error-prone

3. **React.memo or useMemo**: Prevent unnecessary re-renders
   - ❌ Doesn't solve the root issue
   - ❌ Wizards SHOULD re-render on language change

4. **Portal for wizards**: Render wizards outside main tree
   - ❌ Overly complex for this issue
   - ✅ Might be worth considering for other reasons (z-index, positioning)

## Files Changed

1. **components/startup-window.tsx**
   - Added `key` prop to BookingWizard
   - Added `key` prop to ClassCountReportWizard  
   - Added `key` prop to MessageWizard
   - Added `key` prop to ClassAnalytics

2. **tests/e2e/startup-wizard.spec.ts** (NEW)
   - Test: Language switch without wizard open
   - Test: Language switch with booking wizard open
   - Test: Language switch with message wizard open

## Verification

### Build Status

- ✅ Next.js build: Compiled successfully
- ✅ TypeScript: No type errors
- ✅ ESLint: No new warnings

### Expected Behavior After Fix

1. User opens startup wizard
2. User opens any sub-wizard (booking, message, etc.)
3. User clicks language toggle button
4. **NO ERROR APPEARS**
5. Wizard content updates to new language
6. Wizard state is reset (fresh start)

### Testing Notes

E2E tests have been created but require Convex backend to run. These tests will run automatically in CI/CD pipeline when PR is merged.

For manual testing:

1. Login as moderator
2. Open startup wizard (dismiss localStorage flag if needed)
3. Click through to open a sub-wizard
4. Click language toggle button multiple times
5. Verify no error dialog appears
6. Verify wizard updates language correctly

## Impact Assessment

### User Impact

- ✅ **Positive**: No more crashes when switching language
- ✅ **Positive**: Cleaner UX with reset wizard state on language change
- ⚠️ **Neutral**: Wizard form data is lost when switching language
  - This is acceptable because mixed-language form data would be confusing anyway

### Performance Impact

- ✅ **Minimal**: Key prop adds negligible overhead
- ✅ **Potential improvement**: Component remounting might be slightly faster than deep reconciliation

### Code Maintainability

- ✅ **Improved**: Explicit keys make React behavior predictable
- ✅ **Best practice**: Following React documentation recommendations

## Related Patterns

This fix follows the **"Wizard-Based Onboarding Pattern"** documented in `.github/copilot-instructions.md`:

> Wizards should handle language changes gracefully and reset state appropriately

## References

- React Documentation: [Lists and Keys](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- React Documentation: [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state)
- GitHub Issue: [Error happening when user changed language on moderator welcome wizard](issue link)

## Author

- Implementation: GitHub Copilot
- Review: Pending
- Date: November 2, 2025
