import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get active notification windows for a user
export const getActiveForUser = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get all active notification windows
    const windows = await ctx.db
      .query("notificationWindows")
      .withIndex("by_active_and_priority", (q) => q.eq("isActive", true))
      .order("desc")
      .collect();

    // Filter by role and find first unviewed window
    for (const window of windows) {
      // Check if window targets this user's role
      if (window.targetRole && window.targetRole !== "all" && window.targetRole !== user.role) {
        continue;
      }

      // Check if user has already viewed this window
      const hasViewed = await ctx.db
        .query("notificationWindowViews")
        .withIndex("by_user_and_window", (q) =>
          q.eq("userId", args.userId).eq("windowId", window._id)
        )
        .first();

      if (!hasViewed) {
        return window;
      }
    }

    return null;
  },
});

// Mutation to mark notification window as viewed
export const markAsViewed = mutation({
  args: {
    userId: v.id("users"),
    windowId: v.id("notificationWindows"),
  },
  handler: async (ctx, args) => {
    // Check if already viewed
    const existing = await ctx.db
      .query("notificationWindowViews")
      .withIndex("by_user_and_window", (q) =>
        q.eq("userId", args.userId).eq("windowId", args.windowId)
      )
      .first();

    if (existing) {
      return existing;
    }

    // Create view record
    return await ctx.db.insert("notificationWindowViews", {
      userId: args.userId,
      windowId: args.windowId,
      viewedAt: Date.now(),
    });
  },
});

// Query to list all notification windows (admin only)
export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can list notification windows");
    }

    const windows = await ctx.db
      .query("notificationWindows")
      .withIndex("by_created_at")
      .order("desc")
      .collect();

    // Get view counts for each window
    const windowsWithCounts = await Promise.all(
      windows.map(async (window) => {
        const viewCount = (await ctx.db
          .query("notificationWindowViews")
          .withIndex("by_window", (q) => q.eq("windowId", window._id))
          .collect()).length;

        return {
          ...window,
          viewCount,
        };
      })
    );

    return windowsWithCounts;
  },
});

// Mutation to create a notification window (admin only)
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    titleTh: v.string(),
    greeting: v.string(),
    greetingTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    showUpdateSummary: v.boolean(),
    targetRole: v.optional(v.union(
      v.literal("all"),
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin")
    )),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create notification windows");
    }

    // Validate input
    if (!args.title.trim() && !args.titleTh.trim()) {
      throw new Error("Title is required in at least one language");
    }
    if (!args.message.trim() && !args.messageTh.trim()) {
      throw new Error("Message is required in at least one language");
    }

    const windowId = await ctx.db.insert("notificationWindows", {
      title: args.title,
      titleTh: args.titleTh,
      greeting: args.greeting,
      greetingTh: args.greetingTh,
      message: args.message,
      messageTh: args.messageTh,
      showUpdateSummary: args.showUpdateSummary,
      targetRole: args.targetRole || "all",
      isActive: true,
      priority: args.priority,
      createdBy: args.userId,
      createdAt: Date.now(),
    });

    return windowId;
  },
});

// Mutation to update a notification window (admin only)
export const update = mutation({
  args: {
    userId: v.id("users"),
    windowId: v.id("notificationWindows"),
    title: v.string(),
    titleTh: v.string(),
    greeting: v.string(),
    greetingTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    showUpdateSummary: v.boolean(),
    targetRole: v.optional(v.union(
      v.literal("all"),
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin")
    )),
    priority: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update notification windows");
    }

    await ctx.db.patch(args.windowId, {
      title: args.title,
      titleTh: args.titleTh,
      greeting: args.greeting,
      greetingTh: args.greetingTh,
      message: args.message,
      messageTh: args.messageTh,
      showUpdateSummary: args.showUpdateSummary,
      targetRole: args.targetRole || "all",
      priority: args.priority,
      isActive: args.isActive,
    });

    return { success: true };
  },
});

// Mutation to toggle notification window active status (admin only)
export const toggleActive = mutation({
  args: {
    userId: v.id("users"),
    windowId: v.id("notificationWindows"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can toggle notification window status");
    }

    const window = await ctx.db.get(args.windowId);
    if (!window) {
      throw new Error("Notification window not found");
    }

    await ctx.db.patch(args.windowId, { isActive: !window.isActive });
    return { success: true };
  },
});

// Mutation to delete a notification window (admin only)
export const remove = mutation({
  args: {
    userId: v.id("users"),
    windowId: v.id("notificationWindows"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete notification windows");
    }

    // Delete all view records first
    const views = await ctx.db
      .query("notificationWindowViews")
      .withIndex("by_window", (q) => q.eq("windowId", args.windowId))
      .collect();

    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    // Delete the window
    await ctx.db.delete(args.windowId);
    return { success: true };
  },
});
