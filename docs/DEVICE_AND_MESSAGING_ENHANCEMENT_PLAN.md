# Device Detection & Messaging Enhancement Plan

**Project:** Evan's Class Tracker 4.5  
**Date:** October 16, 2025  
**Status:** 📋 Planning Phase

---

## 🎯 Overview

This document outlines the implementation plan for adding:

1. **Device Detection** - Automatic mobile/desktop detection
2. **Push Notifications** - Mobile push notifications for classes and messages
3. **Enhanced Messaging UI** - Categorized user access (Available Users, Groups, Moderators, Admin)
4. **Message Retention** - Auto-deletion of messages after 2 weeks
5. **Desktop Notifications** - Corner notification window for desktop users

---

## 🔍 Research & Best Practices

### Device Detection

**Best Practice: Multi-Factor Detection**

```typescript
// Recommended approach: Combine multiple signals
const detectDevice = () => {
  // 1. User Agent detection
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // 2. Touch capability
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 3. Screen size (breakpoint-based)
  const isSmallScreen = window.innerWidth < 768; // md breakpoint
  
  // 4. Device orientation API
  const hasOrientation = 'orientation' in window;
  
  // Combined logic: all factors must agree
  return {
    isMobile: isMobileUA && hasTouch && (isSmallScreen || hasOrientation),
    isTablet: hasTouch && !isSmallScreen && hasOrientation,
    isDesktop: !isMobileUA || (!hasTouch && !isSmallScreen)
  };
};
```

**Storage Strategy:**

- Store device type in `localStorage` for session persistence
- Update database user record with `lastDeviceType` for analytics
- Re-detect on window resize (debounced)

**Reference:** [MDN - Browser Detection](https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent)

---

### Push Notifications (Mobile)

**Technology: Web Push API + Service Workers**

#### Architecture

```
┌─────────────────┐
│   Browser       │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ 1. Request permission
         ▼
┌─────────────────┐
│ Service Worker  │
│   (sw.js)       │
└────────┬────────┘
         │
         │ 2. Subscribe to push
         ▼
┌─────────────────┐
│  Push Service   │
│  (Browser API)  │
└────────┬────────┘
         │
         │ 3. Store subscription
         ▼
┌─────────────────┐
│ Convex Backend  │
│ (Subscriptions) │
└────────┬────────┘
         │
         │ 4. Send notifications
         └──────────────────────┐
                                ▼
                    ┌────────────────────┐
                    │   User's Device    │
                    │ (Push Notification)│
                    └────────────────────┘
```

#### Implementation Steps

1. **Generate VAPID Keys** (for Web Push)

   ```bash
   npx web-push generate-vapid-keys
   ```

   Store in environment variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY` (server-only)

2. **Service Worker** (`public/sw.js`)

   ```javascript
   self.addEventListener('push', (event) => {
     const data = event.data.json();
     event.waitUntil(
       self.registration.showNotification(data.title, {
         body: data.body,
         icon: '/icon-192.png',
         badge: '/badge-72.png',
         data: { url: data.url }
       })
     );
   });
   
   self.addEventListener('notificationclick', (event) => {
     event.notification.close();
     event.waitUntil(clients.openWindow(event.notification.data.url));
   });
   ```

3. **Client-side Registration**

   ```typescript
   const subscribeToPush = async () => {
     const registration = await navigator.serviceWorker.register('/sw.js');
     const subscription = await registration.pushManager.subscribe({
       userVisibleOnly: true,
       applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
     });
     
     // Store in Convex
     await savePushSubscription({ subscription: JSON.stringify(subscription) });
   };
   ```

4. **Backend Sending** (Convex + web-push library)

   ```typescript
   // convex/notifications.ts
   import webpush from 'web-push';
   
   export const sendPushNotification = internalMutation({
     handler: async (ctx, { userId, title, body, url }) => {
       const user = await ctx.db.get(userId);
       if (user?.pushSubscription) {
         await webpush.sendNotification(
           JSON.parse(user.pushSubscription),
           JSON.stringify({ title, body, url })
         );
       }
     }
   });
   ```

**Limitations:**

- Requires HTTPS (or localhost for dev)
- iOS Safari: Limited support (use App Clips or PWA)
- User must grant permission

**Reference:** [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)

---

### Message Retention & Auto-Deletion

**Best Practice: Convex Scheduled Functions (Cron Jobs)**

#### Approach 1: Scheduled Function (Recommended)

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run daily at 2 AM UTC
crons.daily(
  "clean-old-messages",
  { hourUTC: 2, minuteUTC: 0 },
  internal.messages.cleanupOldMessages
);

export default crons;
```

```typescript
// convex/messages.ts
export const cleanupOldMessages = internalMutation({
  handler: async (ctx) => {
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const oldMessages = await ctx.db
      .query("messages")
      .withIndex("by_created_at")
      .filter((q) => q.lt(q.field("createdAt"), twoWeeksAgo))
      .collect();
    
    for (const message of oldMessages) {
      await ctx.db.delete(message._id);
    }
    
    return { deleted: oldMessages.length };
  }
});
```

**Configuration:**

- Add `convex/crons.ts` to project
- Daily cleanup at 2 AM UTC (low-traffic time)
- Logs deletion count for monitoring

**Reference:** [Convex Scheduled Functions](https://docs.convex.dev/scheduling/cron-jobs)

---

### Desktop Notification Window

**Pattern: Corner Toast/Notification Panel**

#### Design Considerations

1. **Position:** Fixed bottom-right corner (or top-right for some UIs)
2. **Behavior:**
   - Auto-show on new message
   - Auto-hide after 5 seconds (user can pin)
   - Click to navigate to conversation
   - Queue multiple notifications (stack)
3. **Accessibility:** ARIA live region for screen readers
4. **Responsive:** Hide on mobile (use push notifications instead)

#### Implementation Pattern

```typescript
// components/desktop-notification-toast.tsx
"use client";

export function DesktopNotificationToast({ message, onClose, onClick }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 
                 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 
                 p-4 cursor-pointer hover:shadow-2xl transition-all
                 animate-slide-in-right"
      onClick={onClick}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">{message.sender}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {message.content}
          </p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

**Reference:** [Tailwind UI Notifications](https://tailwindui.com/components/application-ui/overlays/notifications)

---

## 📋 Implementation Plan

### Phase 1: Core Infrastructure (Days 1-2)

#### 1.1 Device Detection System

**Files to Create:**

- `lib/device-detection.ts` - Detection utility
- `lib/device-context.tsx` - React context provider

**Schema Changes:**

```typescript
// convex/schema.ts
users: defineTable({
  // ... existing fields
  deviceType: v.optional(v.union(
    v.literal("mobile"),
    v.literal("tablet"),
    v.literal("desktop")
  )),
  lastDeviceUpdate: v.optional(v.number()),
})
```

**Backend API:**

```typescript
// convex/users.ts
export const updateDeviceType = mutation({
  args: {
    userId: v.id("users"),
    deviceType: v.union(v.literal("mobile"), v.literal("tablet"), v.literal("desktop"))
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      deviceType: args.deviceType,
      lastDeviceUpdate: Date.now()
    });
  }
});
```

---

#### 1.2 Push Notification Infrastructure

**Dependencies to Install:**

```bash
npm install web-push
npm install --save-dev @types/web-push
```

**Schema Changes:**

```typescript
// convex/schema.ts
users: defineTable({
  // ... existing fields
  pushSubscription: v.optional(v.string()), // JSON stringified subscription
})

pushSubscriptions: defineTable({
  userId: v.id("users"),
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string()
  }),
  deviceInfo: v.optional(v.string()),
  createdAt: v.number()
}).index("by_user", ["userId"])
```

**Files to Create:**

- `public/sw.js` - Service worker
- `lib/push-notifications.ts` - Client utilities
- `convex/pushNotifications.ts` - Backend API

---

#### 1.3 Message Cleanup System

**Files to Create:**

- `convex/crons.ts` - Scheduled functions

**Schema Changes:**

```typescript
// Add system message type
messages: defineTable({
  // ... existing fields
  messageType: v.optional(v.union(
    v.literal("user"),
    v.literal("system"),
    v.literal("acknowledgment")
  ))
})
```

**Backend Updates:**

- Add `cleanupOldMessages` internal mutation
- Add `createSystemMessage` for acknowledgments

---

### Phase 2: Messaging UI Enhancements (Days 3-4)

#### 2.1 Messaging Tab Restructure

**New Component Structure:**

```
components/
├── messaging/
│   ├── messaging-hub.tsx          # Main container with category buttons
│   ├── available-users-flow.tsx   # School selection → user list
│   ├── groups-list.tsx            # Group conversations
│   ├── moderators-list.tsx        # All moderators
│   ├── admin-conversation.tsx     # Direct to Evan/Admin
│   └── conversation-selector.tsx  # Reusable conversation item
```

**UI Flow:**

```
[Messaging Tab]
├── [Available Users] → [Select School] → [User List] → [Conversation]
├── [Groups] → [Group List] → [Group Conversation]
├── [Moderators] → [Moderator List] → [Conversation]
├── [Evan/Admin] → [Direct Conversation]
└── [Messages] → [All Conversations (existing)]
```

---

#### 2.2 Acknowledgment System

**Implementation:**

```typescript
// convex/conversations.ts
export const createWithAcknowledgment = mutation({
  handler: async (ctx, args) => {
    // Create conversation
    const conversationId = await ctx.db.insert("conversations", { ...args });
    
    // Check if this is a new interaction
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .collect();
    
    if (existingMessages.length === 0) {
      // Insert acknowledgment message
      await ctx.db.insert("messages", {
        conversationId,
        senderId: "system", // Special system user
        content: "Messages will be cleared from the server automatically every 2 weeks.",
        messageType: "acknowledgment",
        readBy: [],
        createdAt: Date.now()
      });
    }
    
    return conversationId;
  }
});
```

---

### Phase 3: Desktop Notifications (Day 5)

#### 3.1 Toast Notification Component

**Files to Create:**

- `components/desktop-notification-toast.tsx`
- `lib/notification-manager.ts` - Queue management

**Integration:**

```typescript
// app/layout.tsx
<NotificationToastProvider>
  <ErrorBoundary>
    <ConvexClientProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </ConvexClientProvider>
  </ErrorBoundary>
</NotificationToastProvider>
```

**Trigger Logic:**

```typescript
// Listen for new messages
const messages = useQuery(api.messages.list, { conversationId });

useEffect(() => {
  if (messages && previousMessages) {
    const newMessages = messages.filter(
      m => !previousMessages.find(pm => pm._id === m._id)
    );
    
    newMessages.forEach(msg => {
      if (deviceType === "desktop" && msg.senderId !== currentUser._id) {
        showDesktopToast({
          sender: getUserName(msg.senderId),
          content: msg.content,
          onClick: () => navigateTo(conversationId)
        });
      }
    });
  }
}, [messages]);
```

---

### Phase 4: Testing & Documentation (Day 6)

#### 4.1 Testing Checklist

**Device Detection:**

- [ ] Correctly detects mobile (iPhone, Android)
- [ ] Correctly detects tablet (iPad, Android tablet)
- [ ] Correctly detects desktop (laptop, desktop)
- [ ] Persists across page refreshes
- [ ] Updates on window resize

**Push Notifications:**

- [ ] Permission request shows correctly
- [ ] Subscription stored in database
- [ ] Notifications received on mobile
- [ ] Click opens correct conversation
- [ ] Works in both languages

**Message Cleanup:**

- [ ] Scheduled function runs daily
- [ ] Deletes messages older than 2 weeks
- [ ] Preserves recent messages
- [ ] Logs deletion count

**Messaging UI:**

- [ ] All category buttons functional
- [ ] School selection flow works
- [ ] User list displays correctly
- [ ] Acknowledgment shows on first message
- [ ] Groups, moderators, admin buttons work

**Desktop Notifications:**

- [ ] Toast appears on new message
- [ ] Auto-hides after 5 seconds
- [ ] Click navigates to conversation
- [ ] Only shows on desktop
- [ ] Supports both languages

---

## 🔧 Technical Specifications

### Database Schema Updates

```typescript
// Complete schema changes
export default defineSchema({
  users: defineTable({
    // ... existing fields
    deviceType: v.optional(v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop")
    )),
    lastDeviceUpdate: v.optional(v.number()),
    pushSubscription: v.optional(v.string()),
  }),
  
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string()
    }),
    deviceInfo: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_user", ["userId"]),
  
  messages: defineTable({
    // ... existing fields
    messageType: v.optional(v.union(
      v.literal("user"),
      v.literal("system"),
      v.literal("acknowledgment")
    ))
  })
  // ... other tables
});
```

---

### Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_CONVEX_URL=https://resolute-basilisk-801.convex.cloud
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY

# .env (server-only)
VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY
VAPID_SUBJECT=mailto:evan@example.com
```

---

### API Endpoints Summary

**New Convex Functions:**

```typescript
// Device Detection
users.updateDeviceType(userId, deviceType)

// Push Notifications
pushNotifications.subscribe(subscription, deviceInfo)
pushNotifications.unsubscribe(userId)
pushNotifications.send(userId, title, body, url)

// Message Cleanup
messages.cleanupOldMessages() // internal, scheduled

// Enhanced Conversations
conversations.createWithAcknowledgment(participants, type, ...)
conversations.listBySchool(schoolId)
conversations.listModerators()
conversations.getAdminConversation(userId)
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Generate VAPID keys
- [ ] Add environment variables to Vercel
- [ ] Test service worker registration
- [ ] Configure Convex cron jobs
- [ ] Update copilot instructions

### Post-Deployment

- [ ] Verify push notifications work
- [ ] Check scheduled function runs
- [ ] Monitor message cleanup logs
- [ ] Test on multiple devices
- [ ] Update documentation

---

## 📚 References

1. [MDN Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
2. [Convex Scheduled Functions](https://docs.convex.dev/scheduling/cron-jobs)
3. [Service Worker Cookbook](https://serviceworke.rs/)
4. [Web.dev Push Notifications](https://web.dev/push-notifications-overview/)
5. [Tailwind UI Components](https://tailwindui.com/)

---

**Next Steps:** Begin Phase 1 implementation after review and approval.
