# Performance Audit & Optimization Report

**Date:** October 19, 2025  
**Project:** Evan's Class Tracker 4.5  
**Focus:** Bottlenecks, Redundancies, and Incomplete Features

---

## 🔴 CRITICAL BOTTLENECKS

### 1. N+1 Query Problem in `convex/messages.ts`

**Location:** `getConversations` query (lines 150-200)

**Problem:**

```typescript
for (const message of allMessages) {
  const partnerId = message.senderId === args.userId ? message.recipientId : message.senderId;
  if (!partnerId) continue;
  const partner = await ctx.db.get(partnerId); // ⚠️ DB call inside loop!
}
```

**Impact:** For 100 messages, this makes 100+ separate database queries. With 1000 messages, that's 1000+ queries.

**Solution:**

```typescript
// 1. Collect all unique partner IDs first
const partnerIds = new Set<string>();
for (const message of allMessages) {
  const partnerId = message.senderId === args.userId ? message.recipientId : message.senderId;
  if (partnerId) partnerIds.add(partnerId.toString());
}

// 2. Batch fetch all partners in one query
const partners = await Promise.all(
  Array.from(partnerIds).map(id => ctx.db.get(id as Id<"users">))
);

// 3. Create lookup map
const partnerMap = new Map(
  partners.filter(p => p).map(p => [p!._id.toString(), p!])
);

// 4. Use map for lookups (no more DB calls in loop)
for (const message of allMessages) {
  const partnerId = message.senderId === args.userId ? message.recipientId : message.senderId;
  const partner = partnerMap.get(partnerId.toString());
  // ...
}
```

**Priority:** HIGH - Affects all messaging functionality  
**Estimated Impact:** 10-100x performance improvement for active users

---

### 2. Inefficient Pagination Implementation

**Location:** `convex/pagination.ts` (all paginated queries)

**Problem:**

```typescript
// Loading ALL records, then slicing - defeats the purpose!
const allStudents = await ctx.db.query("students").collect();
const students = [...allStudents].sort((a, b) => b.createdAt - a.createdAt);
const page = students.slice(cursor, cursor + pageSize);
```

**Impact:** With 10,000 students, every pagination request loads all 10,000 records into memory.

**Solution:**
Convex doesn't support offset-based pagination efficiently. Use cursor-based pagination with indexes:

```typescript
export const listPaginated = query({
  args: {
    schoolId: v.optional(v.id("schools")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("students");
    
    if (args.schoolId) {
      query = query.withIndex("by_school", q => q.eq("schoolId", args.schoolId));
    } else {
      query = query.withIndex("by_created_at");
    }
    
    // Use Convex's built-in pagination
    return await query
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

**Priority:** HIGH - Pagination is currently worse than no pagination  
**Estimated Impact:** 100x improvement for large datasets

---

### 3. Component-Level N+1 Queries

**Location:** Multiple components

**Problem in `components/class-booking.tsx`:**

```tsx
// Inside ClassItem component (rendered for EACH class in list)
const student = useQuery(api.students.getById, { id: classItem.studentId });
const location = useQuery(api.locations.getById, { id: classItem.locationId });
```

**Impact:** Rendering 50 classes = 100 additional queries (50 students + 50 locations)

**Solution:**

1. **Backend:** Create compound query to return classes with joined data

```typescript
export const listWithDetails = query({
  args: { teacherId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const classes = await ctx.db.query("classes")
      .withIndex("by_teacher", q => q.eq("teacherId", args.teacherId))
      .collect();
    
    // Batch fetch all related entities
    const studentIds = classes.map(c => c.studentId);
    const locationIds = classes.map(c => c.locationId).filter(Boolean);
    
    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));
    
    // Create lookup maps
    const studentMap = new Map(students.map(s => [s!._id, s]));
    const locationMap = new Map(locations.map(l => l && [l._id, l]));
    
    // Return enriched data
    return classes.map(c => ({
      ...c,
      student: studentMap.get(c.studentId),
      location: c.locationId ? locationMap.get(c.locationId) : null,
    }));
  },
});
```

2. **Frontend:** Use single query instead of nested queries per item

**Priority:** MEDIUM - Noticeable lag with 20+ classes  
**Estimated Impact:** 10-20x improvement for list views

---

### 4. Redundant Full-Table Scans

**Location:** Multiple components

**Problems:**

```tsx
// weekly-calendar.tsx - loads ALL entities for entire system
const schools = useQuery(api.schools.list, {});      // All schools
const users = useQuery(api.users.list, {});          // All users
const students = useQuery(api.students.list, {});    // All students
const locations = useQuery(api.locations.list, {}); // All locations

// Then filters in memory
const filteredStudents = students?.filter(s => s.schoolId === selectedSchool);
```

**Impact:**

- 1000 users loaded when only need 10 teachers from one school
- 5000 students loaded when only need 100 from current school
- Wastes bandwidth and memory

**Solution:**

```tsx
// Only query what you need with proper filtering
const schools = useQuery(api.schools.list, {});
const teachers = useQuery(api.users.list, { 
  role: "teacher",
  schoolId: currentUser.schoolId  // Filter server-side
});
const students = useQuery(api.students.list, { 
  schoolId: selectedSchool  // Only students from selected school
});
```

**Priority:** HIGH - Affects every page load  
**Estimated Impact:** 5-50x improvement depending on data size

---

## 🟡 REDUNDANCIES

### 1. Duplicate Queries Across Components

**Problem:** Same queries repeated in multiple components:

- `api.users.list` called in 8 different components
- `api.schools.list` called in 10+ components
- Each call re-fetches from database (Convex does cache, but still overhead)

**Solution:**
Create a shared data provider at app level:

```tsx
// lib/data-context.tsx
export function DataProvider({ children }) {
  const schools = useQuery(api.schools.list);
  const users = useQuery(api.users.list);
  
  return (
    <DataContext.Provider value={{ schools, users }}>
      {children}
    </DataContext.Provider>
  );
}

// In components
const { schools, users } = useDataContext(); // No additional query
```

**Priority:** MEDIUM  
**Estimated Impact:** Reduce query load by 50-70%

---

### 2. Backup Files in Production

**Files:**

- `components/messaging-hub.tsx.backup`

**Action:** Delete backup files or move to separate directory

---

### 3. Overfetching with Unused Data

**Problem:** Queries return full objects when only need specific fields

**Example:**

```typescript
// Returns entire user object with password hash, etc.
const users = await ctx.db.query("users").collect();
// Only need username and role for display
```

**Solution:**

```typescript
const users = await ctx.db.query("users").collect();
return users.map(u => ({
  _id: u._id,
  username: u.username,
  role: u.role,
  // Exclude passwordHash and other sensitive/unused fields
}));
```

**Priority:** LOW - Security/bandwidth optimization  
**Estimated Impact:** 10-30% bandwidth reduction

---

## ⚠️ INCOMPLETE/MISSING IMPLEMENTATIONS

### 1. YouTube Downloader - No Backend Integration

**Status:** UI component exists, but no backend functionality

**Missing:**

- `convex/youtubeDownloads.ts` - Backend API file
- Schema table for download history
- Actual download logic

**Current State:** The component shows error messages because there's no backend to call

**To Complete:**

1. Create schema entry:

```typescript
youtubeDownloads: defineTable({
  userId: v.id("users"),
  videoId: v.string(),
  title: v.string(),
  url: v.string(),
  quality: v.string(),
  type: v.union(v.literal("video"), v.literal("audio")),
  status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  createdAt: v.number(),
}).index("by_user", ["userId"])
```

2. Create backend file with mutations for:
   - Validating YouTube URL
   - Extracting video metadata
   - Queueing download (requires external service)
   - Tracking download history

**Note:** Actual video downloading requires:

- External API service (yt-dlp can't run in Convex edge functions)
- Storage solution (S3, Cloudflare R2, etc.)
- Or client-side solution using youtube-dl-exec package

**Priority:** HIGH (documented as feature but non-functional)

---

### 2. Pagination Not Actually Used

**Status:** `convex/pagination.ts` exists but components don't use it

**Issue:** All components still use non-paginated queries:

```tsx
// Current: Load everything
const students = useQuery(api.students.list, {});

// Should be: Use pagination
const { results, status, loadMore } = usePaginatedQuery(
  api.pagination.listPaginated,
  { schoolId },
  { initialNumItems: 20 }
);
```

**Action Required:** Update all list components to use `usePaginatedQuery`

**Affected Components:**

- `student-management.tsx`
- `class-booking.tsx` (class list)
- `notification-list.tsx`
- `teacher-activity-dashboard.tsx`
- `messaging-hub.tsx`

**Priority:** HIGH - Directly impacts performance

---

### 3. Push Notifications System Incomplete

**Status:** Schema has `pushSubscription` field, but no actual push system

**Missing:**

- Service worker file (`public/sw.js`)
- Push notification API integration
- Subscription management UI
- Notification permission handling

**Current:** `initServiceWorker()` is called but does nothing

**To Complete:**

1. Create `public/sw.js`:

```javascript
self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon.png',
  });
});
```

2. Implement subscription flow in `lib/init-sw.ts`
3. Add backend mutations for sending push notifications
4. Create permission request UI

**Priority:** MEDIUM - Listed as feature but not functional

---

### 4. Guardian Dashboard Incomplete Integration

**Status:** Backend exists, UI exists, but may not be fully connected

**To Verify:**

- Test guardian user flow end-to-end
- Check if acknowledgement system works
- Verify guardian-linked students display correctly

**Action:** Full integration testing needed

**Priority:** MEDIUM

---

### 5. Location Request Approval Flow

**Status:** Backend supports pending locations, but workflow unclear

**Missing:**

- Moderator notification when teacher requests new location
- UI indicator for pending location requests
- Approval/rejection interface in location management

**Current:** Teachers can request locations but moderators may not know

**To Complete:**

1. Add notification creation in `convex/locations.ts` when location requested
2. Add pending requests section to `location-management.tsx`
3. Display count of pending requests

**Priority:** MEDIUM

---

## 📋 RECOMMENDED OPTIMIZATIONS

### Short-Term (1-2 days)

1. **Fix N+1 in messages.ts** - Batch fetch partners (2 hours)
2. **Fix pagination implementation** - Use Convex native pagination (3 hours)
3. **Remove backup files** - Cleanup (5 minutes)
4. **Add indexes for common queries** - Schema updates (1 hour)

### Medium-Term (1 week)

1. **Create compound queries for lists** - Reduce component-level N+1 (8 hours)
2. **Implement shared data context** - Reduce duplicate queries (4 hours)
3. **Update components to use pagination** - All list views (6 hours)
4. **Complete YouTube downloader backend** - Or remove feature (8-16 hours)

### Long-Term (2+ weeks)

1. **Implement push notifications** - Full system (16 hours)
2. **Add query result caching strategy** - Client-side optimization (8 hours)
3. **Create data prefetching** - For predicted navigation (8 hours)
4. **Add monitoring/analytics** - Query performance tracking (8 hours)

---

## 🎯 PERFORMANCE IMPACT SUMMARY

| Issue | Current Impact | Fix Priority | Estimated Gain |
|-------|---------------|--------------|----------------|
| Messages N+1 | 100+ queries per page | HIGH | 10-100x |
| Pagination implementation | All records loaded | HIGH | 100x |
| Component N+1 queries | 50-100 extra queries | MEDIUM | 10-20x |
| Full table scans | Slow page loads | HIGH | 5-50x |
| Duplicate queries | Unnecessary load | MEDIUM | 50-70% reduction |
| YouTube downloader | Non-functional | HIGH | Feature completion |
| Push notifications | Non-functional | MEDIUM | Feature completion |

---

## 📝 ACTION ITEMS

### Immediate (This Week)

- [ ] Fix messages.ts N+1 query problem
- [ ] Fix pagination.ts to use Convex native pagination
- [ ] Add batch fetching for class list queries
- [ ] Remove messaging-hub.tsx.backup

### Next Sprint

- [ ] Implement shared data context provider
- [ ] Update all components to use pagination
- [ ] Create compound queries for list views
- [ ] Complete YouTube downloader or remove feature
- [ ] Add monitoring for slow queries

### Backlog

- [ ] Implement push notification system
- [ ] Add query result caching
- [ ] Create data prefetching strategy
- [ ] Add performance monitoring dashboard

---

**Report prepared by:** AI Code Auditor  
**Review status:** Awaiting team review  
**Next review:** After optimizations implemented
