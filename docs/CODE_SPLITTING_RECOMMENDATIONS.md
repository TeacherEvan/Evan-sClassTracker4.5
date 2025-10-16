# Code Splitting Recommendations

This file documents potential lazy loading opportunities for bundle optimization. These are NOT implemented yet but are recommended for future optimization if bundle size becomes a concern.

## Component Sizes

Based on lines of code analysis:

- **WeeklyCalendar**: 454 lines (CANDIDATE for lazy loading)
- **ClassBooking**: 352 lines (CANDIDATE for lazy loading)  
- **SchoolManagement**: 298 lines (CANDIDATE for lazy loading)
- **UserManagement**: 227 lines (CANDIDATE for lazy loading)
- **NotificationList**: 143 lines (loaded immediately)
- **NotificationForm**: 124 lines (admin only, could lazy load)

## Recommended Implementation

```typescript
import { lazy, Suspense } from "react";

// Lazy load heavy components that aren't needed on initial render
const WeeklyCalendar = lazy(() => import("@/components/weekly-calendar"));
const ClassBooking = lazy(() => import("@/components/class-booking"));
const SchoolManagement = lazy(() => import("@/components/school-management"));
const UserManagement = lazy(() => import("@/components/user-management"));

// Usage with Suspense boundary
<Suspense fallback={<LoadingSpinner />}>
  <WeeklyCalendar currentUser={user} />
</Suspense>
```

## Bundle Impact Analysis

### Current Approach
- All components loaded on initial page load
- Estimated initial bundle size: ~350KB (uncompressed)

### With Lazy Loading
- Initial bundle: ~150KB (login, layout, core)
- Calendar tab: +80KB
- Classes tab: +70KB
- Admin tabs: +100KB

**Expected Time to Interactive improvement**: ~40-50% for initial load

## Implementation Priority

### HIGH Priority
- **SchoolManagement** - Admin only, not needed for most users
- **UserManagement** - Admin only, not needed for most users

### MEDIUM Priority
- **WeeklyCalendar** - Largest component, but frequently used
- **ClassBooking** - Frequently used, but could benefit teachers

### LOW Priority
- **NotificationForm** - Admin only, small size
- **NotificationList** - Frequently accessed, should load immediately

## Why Not Implemented Yet?

1. **Current bundle size is acceptable** (~350KB is within normal range)
2. **Minimal change philosophy** - Only implement if needed
3. **Trade-off analysis**: Lazy loading adds complexity vs marginal benefit at current scale
4. **User experience**: All components load fast enough with current architecture

## When to Implement

Consider implementing lazy loading when:
- Bundle size exceeds 500KB
- Initial load time exceeds 3 seconds on 3G
- Component count grows beyond 20
- Performance metrics show degradation

## Additional Optimizations to Consider

1. **Route-based code splitting** (Next.js does this automatically)
2. **Dynamic imports for heavy libraries** (if any are added)
3. **Tree shaking** verification (ensure unused code is eliminated)
4. **Image optimization** (use Next.js Image component)
