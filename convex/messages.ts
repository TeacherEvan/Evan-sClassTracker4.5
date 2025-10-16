import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list messages for a user (both direct and group messages)
export const list = query({
  args: {
    userId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Get direct messages where user is sender or recipient
    const directMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("isGroupMessage"), false),
          q.or(
            q.eq(q.field("senderId"), args.userId),
            q.eq(q.field("recipientId"), args.userId)
          )
        )
      )
      .order("desc")
      .collect();

    // Get group messages for user's school
    const groupMessages = args.schoolId
      ? await ctx.db
          .query("messages")
          .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
          .filter((q) => q.eq(q.field("isGroupMessage"), true))
          .order("desc")
          .collect()
      : [];

    // Combine and sort by creation time
    const allMessages = [...directMessages, ...groupMessages].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    // Populate sender information
    const messagesWithSenders = await Promise.all(
      allMessages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        const recipient = message.recipientId
          ? await ctx.db.get(message.recipientId)
          : null;

        return {
          ...message,
          senderUsername: sender?.username || "Unknown",
          recipientUsername: recipient?.username || null,
        };
      })
    );

    return messagesWithSenders;
  },
});

// Query to get conversation between two users
export const getConversation = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("isGroupMessage"), false),
          q.or(
            q.and(
              q.eq(q.field("senderId"), args.userId1),
              q.eq(q.field("recipientId"), args.userId2)
            ),
            q.and(
              q.eq(q.field("senderId"), args.userId2),
              q.eq(q.field("recipientId"), args.userId1)
            )
          )
        )
      )
      .order("desc")
      .collect();

    // Populate sender information
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          senderUsername: sender?.username || "Unknown",
        };
      })
    );

    return messagesWithSenders.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Query to get group messages for a school
export const getGroupMessages = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("isGroupMessage"), true))
      .order("desc")
      .collect();

    // Populate sender information
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          senderUsername: sender?.username || "Unknown",
        };
      })
    );

    return messagesWithSenders.sort((a, b) => a.createdAt - b.createdAt);
  },
});

// Query to get unread message count
export const unreadCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("recipientId"), args.userId),
          q.eq(q.field("read"), false)
        )
      )
      .collect();

    return unreadMessages.length;
  },
});

// Mutation to send a direct message
export const sendDirectMessage = mutation({
  args: {
    senderId: v.id("users"),
    recipientId: v.id("users"),
    content: v.string(),
    contentTh: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim() || !args.contentTh.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      recipientId: args.recipientId,
      content: args.content,
      contentTh: args.contentTh,
      isGroupMessage: false,
      read: false,
      acknowledged: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Mutation to send a group message
export const sendGroupMessage = mutation({
  args: {
    senderId: v.id("users"),
    schoolId: v.id("schools"),
    content: v.string(),
    contentTh: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.content.trim() || !args.contentTh.trim()) {
      throw new Error("Message content cannot be empty");
    }

    const messageId = await ctx.db.insert("messages", {
      senderId: args.senderId,
      schoolId: args.schoolId,
      content: args.content,
      contentTh: args.contentTh,
      isGroupMessage: true,
      read: false,
      acknowledged: false,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

// Mutation to mark message as read
export const markAsRead = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      read: true,
    });
  },
});

// Mutation to acknowledge a message
export const acknowledge = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      acknowledged: true,
    });
  },
});

// Mutation to delete a message
export const remove = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});

// Query to get available users for messaging (exclude current user)
export const getAvailableUsers = query({
  args: {
    currentUserId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Get all users from the same school or all users if admin
    const allUsers = args.schoolId
      ? await ctx.db
          .query("users")
          .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
          .collect()
      : await ctx.db.query("users").collect();

    // Filter out current user and return without password hash
    return allUsers
      .filter((user) => user._id !== args.currentUserId)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ passwordHash: _passwordHash, ...user }) => user);
  },
});
