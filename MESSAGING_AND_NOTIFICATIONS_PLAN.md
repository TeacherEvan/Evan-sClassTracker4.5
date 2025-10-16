# Messaging & Push Notifications Implementation Plan

## Executive Summary

This document outlines the implementation plan for comprehensive messaging features and mobile push notifications with automatic device detection.

---

## Phase 1: Device Detection & Database Storage

### 1.1 Schema Updates

**File: `convex/schema.ts`**

Add `deviceType` and `pushSubscription` fields to users table:

```typescript
users: defineTable({
  // ... existing fields
  deviceType: v.optional(v.union(
    v.literal("mobile"),
    v.literal("tablet"),
    v.literal("desktop")
  )),
  lastDeviceUpdate: v.optional(v.number()),
  pushSubscription: v.optional(v.string()), // JSON stringified PushSubscription
})
```

**Why:**

- Track device type for notification strategy
- Store push subscription for Web Push API
- `lastDeviceUpdate` helps track stale device info

### 1.2 Backend Mutations

**File: `convex/users.ts`**

Add new mutations:

- `updateDeviceType` - Auto-called on login/device change
- `updatePushSubscription` - Store push notification subscription
- `getPushSubscription` - Retrieve for sending notifications

**Best Practice:** Use Convex's optimistic updates for immediate UI feedback

### 1.3 Frontend Integration

**File: `lib/device-context.tsx`**

Re-enable database sync:

- Detect device on mount and window resize
- Auto-update database when device changes
- Request push notification permission for mobile users

---

## Phase 2: Push Notifications Infrastructure

### 2.1 Service Worker Setup

**File: `public/sw.js`** (CREATE NEW)

Implement service worker with:

- Push notification event handler
- Notification click handler
- Background sync for offline messages
- Cache management

**Web Push Best Practices:**

- Use VAPID keys for authentication
- Handle notification permissions gracefully
- Provide fallback for unsupported browsers

### 2.2 Push Notification Manager

**File: `lib/push-notifications.ts`** (CREATE NEW)

Functions:

- `requestPermission()` - Request user permission
- `subscribeToPush()` - Subscribe to push notifications
- `sendPushNotification()` - Backend utility
- `unsubscribeFromPush()` - Cleanup

**Security:** Use environment variables for VAPID keys

### 2.3 Notification Triggers

**Files: `convex/classes.ts`, `convex/messages.ts`**

Trigger push notifications on:

- New class booking (to moderator)
- Class status change (to teacher)
- New direct message (to recipient)
- New group message (to all school members on mobile)

**Mobile-Only Rule:** Check `deviceType === "mobile"` before sending push

---

## Phase 3: Enhanced Messaging UI

### 3.1 Messaging Hub Redesign

**File: `components/messaging-hub.tsx`**

New Tab Structure:

1. **Available Users Tab**
   - School selector dropdown
   - User list filtered by school
   - Unread message badges
   - Click to open 1-on-1 conversation

2. **Groups Tab**
   - List of user's schools (multi-school support)
   - School-wide broadcast messaging
   - Group message history

3. **Moderators Tab**
   - Quick access to all moderators
   - Filterable by school
   - Online/offline status (future enhancement)

4. **Admin/Evan Tab**
   - Direct line to admin
   - Priority messaging indicator
   - See existing `admin-contact-button.tsx`

5. **Messages Tab**
   - Unified inbox (direct + group)
   - Sort by unread/recent
   - Search functionality

### 3.2 Private Conversation Spaces

**Database:** Already supported via `by_conversation` index

UI Pattern:

- Each user pair has dedicated conversation view
- Messages sorted chronologically
- Real-time updates via Convex subscriptions
- Typing indicators (future enhancement)

### 3.3 Acknowledgement System

**File: `convex/messages.ts`**

New mutation: `sendAcknowledgementMessage`

Trigger on:

- First message between two users
- Auto-generated system message
- Content: "Messages will be cleared from the server automatically every 2 weeks"
- Bilingual support required

Implementation:

```typescript
// Check if this is first interaction
const existingMessages = await ctx.db.query("messages")
  .withIndex("by_conversation", (q) => 
    q.eq("senderId", userId1).eq("recipientId", userId2)
  )
  .collect();

if (existingMessages.length === 0) {
  // Send acknowledgement message
  await ctx.db.insert("messages", {
    senderId: "system",
    recipientId: userId,
    content: "Messages will be cleared from the server automatically every 2 weeks",
    contentTh: "ข้อความจะถูกลบออกจากเซิร์ฟเวอร์โดยอัตโนมัติทุก 2 สัปดาห์",
    isGroupMessage: false,
    read: false,
    acknowledged: true,
    createdAt: Date.now(),
  });
}
```

---

## Phase 4: Auto-Deletion System

### 4.1 Convex Cron Job

**File: `convex/crons.ts`** (CREATE NEW)

Schedule daily cleanup:

```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "delete-old-messages",
  { hourUTC: 2, minuteUTC: 0 }, // 2 AM UTC
  internal.messages.deleteOldMessages
);

export default crons;
```

### 4.2 Deletion Logic

**File: `convex/messages.ts`**

Add internal mutation:

```typescript
export const deleteOldMessages = internalMutation({
  handler: async (ctx) => {
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    
    const oldMessages = await ctx.db
      .query("messages")
      .withIndex("by_created_at", (q) => 
        q.lt("createdAt", twoWeeksAgo)
      )
      .collect();

    // Delete in batches to avoid timeout
    for (const message of oldMessages) {
      await ctx.db.delete(message._id);
    }

    return { deleted: oldMessages.length };
  },
});
```

**Best Practice:**

- Use `internalMutation` to prevent external calls
- Log deletion count for monitoring
- Consider soft delete with `deletedAt` field for auditing

---

## Phase 5: Desktop Notification Toast

### 5.1 Component Enhancement

**File: `components/desktop-notification-toast.tsx`**

Current state: Already exists
Enhancements needed:

- Only show on desktop (`deviceType === "desktop"`)
- Position: Fixed bottom-right corner
- Auto-dismiss after 5 seconds
- Click to navigate to message
- Stack multiple notifications

### 5.2 Notification Manager

**File: `lib/notification-manager.ts`** (CREATE NEW)

Centralized notification handling:

- Detect device type
- Route to push (mobile) or toast (desktop)
- Queue management
- Duplicate suppression

---

## Phase 6: Backend API Endpoints

### 6.1 New Queries

**File: `convex/messages.ts`**

Add:

- `getAvailableUsers` - Users in selected school (already exists?)
- `getModeratorsBySchool` - Filter moderators
- `getConversationPreview` - Last message per conversation
- `searchMessages` - Full-text search (future)

### 6.2 New Mutations

**File: `convex/messages.ts`**

Add:

- `markConversationAsRead` - Mark all messages in thread
- `deleteConversation` - User-initiated cleanup
- `reportMessage` - Moderation feature (future)

---

## Security & Privacy Considerations

### Data Retention

- ✅ 2-week auto-deletion complies with minimal retention
- ✅ Users informed via acknowledgement message
- ⚠️ Consider GDPR "right to be forgotten" - add manual delete

### Push Notification Security

- ✅ VAPID keys prevent spoofing
- ✅ User must grant permission
- ✅ Subscription stored securely in database
- ⚠️ Never send sensitive data in push payload (only alert)

### Message Privacy

- ✅ Direct messages only visible to sender/recipient
- ✅ Group messages scoped to school
- ⚠️ Add encryption for sensitive conversations (future)

---

## Testing Plan

### Device Detection

- [ ] Test on actual mobile device
- [ ] Test on tablet (iPad)
- [ ] Test on desktop
- [ ] Test resize behavior
- [ ] Test device switching (laptop → phone)

### Push Notifications

- [ ] Test permission request flow
- [ ] Test notification delivery on mobile
- [ ] Test notification click behavior
- [ ] Test when app is closed
- [ ] Test when app is in background

### Messaging Features

- [ ] Test first-time conversation (acknowledgement)
- [ ] Test message delivery (direct)
- [ ] Test group messages
- [ ] Test unread count
- [ ] Test auto-deletion (wait 14 days or mock time)

### Desktop Toasts

- [ ] Test toast appearance on desktop only
- [ ] Test auto-dismiss
- [ ] Test multiple toasts
- [ ] Test click navigation

---

## Implementation Order (Recommended)

1. ✅ **Phase 1**: Device detection (enable DB storage)
2. ✅ **Phase 3.3**: Acknowledgement message system
3. ✅ **Phase 4**: Auto-deletion cron job
4. ✅ **Phase 3.1-3.2**: Enhanced messaging UI
5. ✅ **Phase 5**: Desktop toast enhancements
6. ✅ **Phase 2**: Push notifications (requires SSL in production)

**Rationale:** Build features that work offline first, then add real-time enhancements

---

## External Resources & Best Practices

### Web Push API

- [MDN Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [web-push npm package](https://www.npmjs.com/package/web-push) - For VAPID keys
- [Push Notification Best Practices](https://web.dev/push-notifications-overview/)

### Service Workers

- [Workbox by Google](https://developers.google.com/web/tools/workbox) - Production-ready SW
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)

### Convex Patterns

- [Convex Cron Jobs](https://docs.convex.dev/scheduling/cron-jobs)
- [Convex Internal Functions](https://docs.convex.dev/functions/internal-functions)
- [Optimistic Updates](https://docs.convex.dev/client/react/optimistic-updates)

### Real-time Messaging

- [Convex Subscriptions](https://docs.convex.dev/client/react/useQuery) - Already using
- [Message Threading Patterns](https://www.stream-io.com/blog/messaging-threading-patterns/)

---

## Technical Debt & Future Enhancements

### Current Limitations

- No end-to-end encryption
- No read receipts
- No typing indicators
- No file attachments
- No message editing
- No multi-device sync for push subscriptions

### Future Roadmap

1. Message reactions (emoji)
2. Voice messages
3. Video calls (WebRTC)
4. Rich text formatting
5. Message search with Convex full-text search
6. Message export for compliance

---

## Environment Variables Required

```env
# Web Push (production only)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<generate with web-push>
VAPID_PRIVATE_KEY=<generate with web-push>
VAPID_SUBJECT=mailto:your-email@example.com

# Already exists
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

---

## Success Metrics

- ✅ Device detection accuracy: 95%+
- ✅ Push notification delivery: 90%+ (within 30 seconds)
- ✅ Message delivery latency: <500ms
- ✅ Auto-deletion runs successfully: 100% (daily cron)
- ✅ Desktop toast display rate: 100% on desktop devices

---

## Rollout Strategy

### Phase A: Internal Testing (1 week)

- Deploy to staging
- Test with admin account only
- Verify all features work

### Phase B: Soft Launch (1 week)

- Enable for moderators only
- Gather feedback
- Fix critical bugs

### Phase C: Full Launch

- Enable for all teachers
- Monitor error rates
- Provide user guide

---

## Questions for Review

1. ✅ Should we implement message encryption for compliance?
2. ✅ Do we need message retention longer than 2 weeks for admins?
3. ✅ Should group messages have size limits (max recipients)?
4. ✅ Do we need offline message queue (send when back online)?
5. ✅ Should moderators see all messages in their school for moderation?

---

## Conclusion

This plan implements:

- ✅ Automatic device detection with DB storage
- ✅ Mobile push notifications for classes & messages
- ✅ Enhanced messaging UI with 5 tabs
- ✅ Private conversation spaces
- ✅ 2-week auto-deletion with acknowledgement
- ✅ Desktop-only notification toasts

Estimated effort: **3-5 days** for full implementation with testing.

Next steps: Review this plan and approve to proceed with implementation.
