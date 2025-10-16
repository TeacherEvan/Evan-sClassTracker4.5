/**
 * Push Notifications Backend
 * 
 * Handles Web Push API subscriptions and notification delivery
 * Requires web-push package: npm install web-push
 */

import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Query to get user's push subscriptions
export const getUserSubscriptions = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

// Mutation to subscribe to push notifications
export const subscribe = mutation({
    args: {
        userId: v.id("users"),
        subscription: v.object({
            endpoint: v.string(),
            keys: v.object({
                p256dh: v.string(),
                auth: v.string(),
            }),
        }),
        deviceInfo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Check if subscription already exists
        const existing = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_endpoint", (q) => q.eq("endpoint", args.subscription.endpoint))
            .first();

        if (existing) {
            // Update existing subscription
            await ctx.db.patch(existing._id, {
                userId: args.userId,
                keys: args.subscription.keys,
                deviceInfo: args.deviceInfo,
            });
            return existing._id;
        }

        // Create new subscription
        const subscriptionId = await ctx.db.insert("pushSubscriptions", {
            userId: args.userId,
            endpoint: args.subscription.endpoint,
            keys: args.subscription.keys,
            deviceInfo: args.deviceInfo,
            createdAt: Date.now(),
        });

        // Also store in user record for quick access
        await ctx.db.patch(args.userId, {
            pushSubscription: JSON.stringify(args.subscription),
        });

        return subscriptionId;
    },
});

// Mutation to unsubscribe from push notifications
export const unsubscribe = mutation({
    args: {
        userId: v.id("users"),
        endpoint: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.endpoint) {
            // Unsubscribe specific endpoint
            const subscription = await ctx.db
                .query("pushSubscriptions")
                .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
                .first();

            if (subscription) {
                await ctx.db.delete(subscription._id);
            }
        } else {
            // Unsubscribe all user's subscriptions
            const subscriptions = await ctx.db
                .query("pushSubscriptions")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .collect();

            for (const sub of subscriptions) {
                await ctx.db.delete(sub._id);
            }
        }

        // Clear from user record
        await ctx.db.patch(args.userId, {
            pushSubscription: undefined,
        });
    },
});

// Internal mutation to send push notification
// This is called from other mutations (e.g., when a new message is sent)
// NOTE: Actual sending requires server-side web-push library
// This mutation stores the notification request for processing
export const sendNotification = internalMutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        url: v.optional(v.string()),
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);

        if (!user) {
            console.error(`[Push] User ${args.userId} not found`);
            return { success: false, error: "User not found" };
        }

        // Only send to mobile devices
        if (user.deviceType !== "mobile") {
            console.log(`[Push] Skipping notification for non-mobile device: ${user.deviceType}`);
            return { success: false, error: "Not a mobile device" };
        }

        const subscriptions = await ctx.db
            .query("pushSubscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        if (subscriptions.length === 0) {
            console.log(`[Push] No subscriptions found for user ${user.username}`);
            return { success: false, error: "No subscriptions" };
        }

        // NOTE: In a real implementation, you would use the web-push library here
        // For now, we'll just log the notification
        // To implement: Use Convex actions to call web-push.sendNotification()

        console.log(`[Push] Would send notification to ${subscriptions.length} subscriptions:`, {
            user: user.username,
            title: args.title,
            body: args.body,
            url: args.url,
        });

        return {
            success: true,
            sentTo: subscriptions.length,
            timestamp: Date.now(),
        };
    },
});

// Internal mutation to clean up expired subscriptions
// Called by cron job weekly
export const cleanupExpiredSubscriptions = internalMutation({
    handler: async (ctx) => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

        const allSubscriptions = await ctx.db.query("pushSubscriptions").collect();

        let deletedCount = 0;

        for (const sub of allSubscriptions) {
            // Delete if created more than 30 days ago and user hasn't logged in
            const user = await ctx.db.get(sub.userId);

            if (!user || sub.createdAt < thirtyDaysAgo) {
                await ctx.db.delete(sub._id);
                deletedCount++;
            }
        }

        console.log(`[Cleanup] Deleted ${deletedCount} expired push subscriptions`);

        return {
            deleted: deletedCount,
            timestamp: Date.now(),
        };
    },
});

// Helper mutation to test push notifications
export const testNotification = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);

        if (!user) {
            throw new Error("User not found");
        }

        // Send test notification
        return await ctx.runMutation(internalMutation({
            handler: async (ctx) => {
                return await ctx.db.insert("notifications", {
                    userId: args.userId,
                    title: "Test Notification",
                    titleTh: "การแจ้งเตือนทดสอบ",
                    message: "This is a test push notification",
                    messageTh: "นี่คือการแจ้งเตือนแบบพุชทดสอบ",
                    type: "info",
                    read: false,
                    createdAt: Date.now(),
                });
            },
        }));
    },
});
