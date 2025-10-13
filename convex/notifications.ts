import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all notifications
export const list = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notifications = args.userId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .order("desc")
          .collect()
      : await ctx.db
          .query("notifications")
          .withIndex("by_created_at")
          .order("desc")
          .collect();

    return notifications;
  },
});

// Query to get unread notifications count
export const unreadCount = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notifications = args.userId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("read"), false))
          .collect()
      : await ctx.db
          .query("notifications")
          .withIndex("by_read", (q) => q.eq("read", false))
          .collect();

    return notifications.length;
  },
});

// Mutation to create a new notification
export const create = mutation({
  args: {
    title: v.string(),
    titleTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notificationId = await ctx.db.insert("notifications", {
      title: args.title,
      titleTh: args.titleTh,
      message: args.message,
      messageTh: args.messageTh,
      type: args.type,
      userId: args.userId,
      read: false,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

// Mutation to mark a notification as read
export const markAsRead = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

// Mutation to mark all notifications as read
export const markAllAsRead = mutation({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const notifications = args.userId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .filter((q) => q.eq(q.field("read"), false))
          .collect()
      : await ctx.db
          .query("notifications")
          .withIndex("by_read", (q) => q.eq("read", false))
          .collect();

    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, { read: true })
      )
    );
  },
});

// Mutation to delete a notification
export const remove = mutation({
  args: {
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
