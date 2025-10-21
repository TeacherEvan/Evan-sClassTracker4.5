import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all notifications
export const list = query({
  args: {
    userId: v.optional(v.union(v.string(), v.id("users"))),
  },
  handler: async (ctx, args) => {
    // IMPORTANT: Always require userId to prevent leaking all notifications
    if (!args.userId) {
      return [];
    }
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return notifications;
  },
});

// Query to get unread notifications count
export const unreadCount = query({
  args: {
    userId: v.optional(v.union(v.string(), v.id("users"))),
  },
  handler: async (ctx, args) => {
    // IMPORTANT: Always require userId to prevent leaking notification counts
    if (!args.userId) {
      return 0;
    }
    
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
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
    userId: v.optional(v.union(v.string(), v.id("users"))),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.title.trim() && !args.titleTh.trim()) {
      throw new Error("Title is required in at least one language");
    }
    if (!args.message.trim() && !args.messageTh.trim()) {
      throw new Error("Message is required in at least one language");
    }

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
    userId: v.optional(v.union(v.string(), v.id("users"))),
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

// Mutation to delete a notification (admin only)
export const deleteNotification = mutation({
  args: {
    userId: v.id("users"), // ID of the admin performing the deletion
    id: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    // Get user and verify admin role
    const user = await ctx.db.get(args.userId);

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete notifications");
    }

    // Delete the notification
    await ctx.db.delete(args.id);
  },
});
