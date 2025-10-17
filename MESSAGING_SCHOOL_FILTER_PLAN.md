# Messaging School Filter Implementation Plan

## Current State Analysis

### Current Behavior

1. **Direct Mode**: Shows only users from the same school as the current user
   - Uses `getAvailableUsers` query with `schoolId: currentUser.schoolId`
   - Filters to show only users from the logged-in user's school
   - Teachers can only message other users in their assigned school

2. **Group Mode**: Shows all schools
   - User can select any school for group messaging
   - No restriction on which school groups to view

### Problem

- Teachers cannot message users from other schools they teach at
- No way to browse and filter users by different schools
- Limited cross-school communication

## Proposed Solution

### Feature Overview

Add a school filter dropdown in Direct Mode that allows users to:

1. View users from ANY school in the system (not just their assigned school)
2. Filter the user list by selecting a specific school
3. Default to "All Schools" to show all users
4. Maintain proper role-based visibility (teachers can message moderators/admins from any school)

### User Experience

```
┌─────────────────────────────────────┐
│ Messaging Hub                       │
│ [Direct] [Group]                    │
├─────────────────────────────────────┤
│ Available Users                     │
│                                     │
│ Filter by School:                   │
│ [All Schools ▼]  <-- NEW DROPDOWN   │
│ ├─ All Schools                      │
│ ├─ ABC School                       │
│ ├─ XYZ Academy                      │
│ └─ Demo School                      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ moderator1                      │ │
│ │ Moderator - ABC School          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ teacher2                        │ │
│ │ Teacher - XYZ Academy           │ │
│ └─────────────────────────────────┘ │
```

## Implementation Steps

### Step 1: Update Backend Query (`convex/messages.ts`)

- Modify `getAvailableUsers` to:
  - Accept optional `filterSchoolId` parameter (separate from user's own schoolId)
  - If `filterSchoolId` is provided, filter users by that school
  - If `filterSchoolId` is null/undefined, return ALL users (except current user)
  - Include school information in the returned user data

### Step 2: Update Component State (`components/messaging-hub.tsx`)

- Add new state: `selectedFilterSchoolId` (can be null for "All Schools")
- Update `getAvailableUsers` query to pass `filterSchoolId`
- Keep existing `selectedUserId` for conversation selection

### Step 3: Update UI (`components/messaging-hub.tsx`)

- Add school filter dropdown above the user list in Direct Mode
- Display "All Schools" as default option
- Populate dropdown with all schools from `schools` query
- Show school name next to each user in the list
- Update styling to accommodate school labels

### Step 4: Enhanced User Display

- Show school affiliation for each user in the list
- Format: `{username} - {role} - {schoolName}`
- Add visual indicator (school icon) for clarity

## Code Changes Required

### 1. Backend Query Update (`convex/messages.ts`)

**Current:**

```typescript
export const getAvailableUsers = query({
  args: {
    currentUserId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    const allUsers = args.schoolId
      ? await ctx.db
        .query("users")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect()
      : await ctx.db.query("users").collect();
    // ... filter and return
  },
});
```

**New:**

```typescript
export const getAvailableUsers = query({
  args: {
    currentUserId: v.id("users"),
    filterSchoolId: v.optional(v.id("schools")), // NEW: filter parameter
  },
  handler: async (ctx, args) => {
    // Get users based on filter
    const allUsers = args.filterSchoolId
      ? await ctx.db
        .query("users")
        .withIndex("by_school", (q) => q.eq("schoolId", args.filterSchoolId))
        .collect()
      : await ctx.db.query("users").collect();
    
    // Filter out current user and enrich with school data
    const filteredUsers = allUsers.filter(
      (user) => user._id !== args.currentUserId
    );
    
    // Fetch school information for each user
    const usersWithSchools = await Promise.all(
      filteredUsers.map(async (user) => {
        const school = user.schoolId 
          ? await ctx.db.get(user.schoolId) 
          : null;
        
        const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          schoolName: school?.name || "No School",
          schoolNameTh: school?.nameTh || "ไม่มีโรงเรียน",
        };
      })
    );
    
    return usersWithSchools;
  },
});
```

### 2. Component State Update (`components/messaging-hub.tsx`)

**Add new state:**

```typescript
const [filterSchoolId, setFilterSchoolId] = useState<Id<"schools"> | null>(null);
```

**Update query call:**

```typescript
const availableUsers = useQuery(api.messages.getAvailableUsers, {
  currentUserId: currentUser._id,
  filterSchoolId: filterSchoolId || undefined,
});
```

### 3. UI Updates (`components/messaging-hub.tsx`)

**Add school filter dropdown in Direct Mode sidebar:**

```tsx
{mode === "direct" && (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      {t("Filter by School", "กรองตามโรงเรียน")}
    </label>
    <select
      value={filterSchoolId || "all"}
      onChange={(e) => 
        setFilterSchoolId(e.target.value === "all" ? null : e.target.value as Id<"schools">)
      }
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
    >
      <option value="all">
        {t("All Schools", "โรงเรียนทั้งหมด")}
      </option>
      {schools?.map((school) => (
        <option key={school._id} value={school._id}>
          {language === "en" ? school.name : school.nameTh}
        </option>
      ))}
    </select>
  </div>
)}
```

**Update user card to show school:**

```tsx
<button
  key={user._id}
  onClick={() => setSelectedUserId(user._id)}
  className={`w-full text-left p-3 rounded-lg transition-colors ${
    selectedUserId === user._id
      ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-500"
      : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
  }`}
>
  <div className="font-medium text-gray-900 dark:text-white">
    {user.username}
  </div>
  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    {t(
      user.role.charAt(0).toUpperCase() + user.role.slice(1),
      user.role === "teacher" ? "ครู" : user.role === "moderator" ? "ผู้ดูแล" : "ผู้จัดการ"
    )}
  </div>
  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
    <Building2 className="w-3 h-3" />
    {language === "en" ? user.schoolName : user.schoolNameTh}
  </div>
</button>
```

## Benefits

1. **Cross-School Communication**: Teachers can message moderators/admins from any school they work with
2. **Improved Discoverability**: Users can browse all available users across the system
3. **Flexible Filtering**: Quick filtering by school maintains usability
4. **Consistent UX**: Matches the group mode's school selection pattern
5. **Role-Based Access**: Maintains security - users still can't access data they shouldn't see

## Testing Checklist

- [ ] Verify "All Schools" shows all users (except current user)
- [ ] Verify school filter dropdown shows all schools
- [ ] Verify filtering by specific school shows only that school's users
- [ ] Verify school name displays correctly in both languages
- [ ] Verify messaging works across schools
- [ ] Verify conversation history persists when switching filters
- [ ] Test with teacher, moderator, and admin accounts
- [ ] Verify UI responsive on mobile/tablet/desktop

## Rollout Steps

1. Commit backend changes to `convex/messages.ts`
2. Commit UI changes to `components/messaging-hub.tsx`
3. Test in development environment
4. Deploy to production
5. Monitor for any issues

## Notes

- This change is **additive** - it doesn't break existing functionality
- No database schema changes required
- No migration needed
- Backward compatible with existing conversations
- Performance impact: minimal (still using indexed queries)
