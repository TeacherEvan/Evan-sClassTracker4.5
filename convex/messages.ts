import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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

// Query to get all conversations (inbox view) with unread counts
export const getConversations = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all direct messages where user is sender or recipient
    const allMessages = await ctx.db
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
      .collect();

    // ✅ PERFORMANCE FIX: Batch fetch all unique partner IDs first
    const partnerIds = new Set<string>();
    for (const message of allMessages) {
      const partnerId = message.senderId === args.userId
        ? message.recipientId
        : message.senderId;
      if (partnerId) {
        partnerIds.add(partnerId.toString());
      }
    }

    // Batch fetch all partners in parallel (instead of in loop)
    const partnerPromises = Array.from(partnerIds).map(async (id) => {
      const partner = await ctx.db.get(id as Id<"users">);
      // Type guard to ensure we only return users
      if (partner && "_id" in partner && "username" in partner) {
        return partner as { _id: Id<"users">; username: string };
      }
      return null;
    });
    const partners = (await Promise.all(partnerPromises)).filter(
      (p): p is NonNullable<typeof p> => p !== null
    );

    // Create lookup map for O(1) access
    const partnerMap = new Map(
      partners.map(p => [p._id.toString(), p])
    );

    // Group messages by conversation partner
    const conversationMap = new Map<string, {
      partnerId: string;
      partnerUsername: string;
      lastMessage: string;
      lastMessageTh: string;
      lastMessageTime: number;
      unreadCount: number;
      messages: typeof allMessages;
    }>();

    for (const message of allMessages) {
      const partnerId = message.senderId === args.userId
        ? message.recipientId
        : message.senderId;

      if (!partnerId) continue;

      const partnerIdString = partnerId.toString();

      if (!conversationMap.has(partnerIdString)) {
        // Use pre-fetched partner from map (no DB call!)
        const partner = partnerMap.get(partnerIdString);
        conversationMap.set(partnerIdString, {
          partnerId: partnerIdString,
          partnerUsername: partner?.username || "Unknown",
          lastMessage: message.content,
          lastMessageTh: message.contentTh,
          lastMessageTime: message.createdAt,
          unreadCount: 0,
          messages: [],
        });
      }

      const conversation = conversationMap.get(partnerIdString)!;
      conversation.messages.push(message);

      // Update last message if this is newer
      if (message.createdAt > conversation.lastMessageTime) {
        conversation.lastMessage = message.content;
        conversation.lastMessageTh = message.contentTh;
        conversation.lastMessageTime = message.createdAt;
      }

      // Count unread messages (messages sent TO this user that are unread)
      if (message.recipientId === args.userId && !message.read) {
        conversation.unreadCount++;
      }
    }

    // Convert to array and sort: unread first (oldest unread first), then read (newest first)
    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      // If one has unread and other doesn't, unread comes first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

      // If both have unread or both have no unread, sort by oldest unread message time
      if (a.unreadCount > 0 && b.unreadCount > 0) {
        // Find oldest unread message in each conversation
        const aOldestUnread = a.messages
          .filter(m => m.recipientId === args.userId && !m.read)
          .sort((x, y) => x.createdAt - y.createdAt)[0];
        const bOldestUnread = b.messages
          .filter(m => m.recipientId === args.userId && !m.read)
          .sort((x, y) => x.createdAt - y.createdAt)[0];

        if (aOldestUnread && bOldestUnread) {
          return aOldestUnread.createdAt - bOldestUnread.createdAt;
        }
      }

      // For conversations with no unread, sort by newest last message
      return b.lastMessageTime - a.lastMessageTime;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return conversations.map(({ messages, ...conv }) => conv);
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
    if (!args.content.trim() && !args.contentTh.trim()) {
      throw new Error("Message content cannot be empty in both languages");
    }

    // Get sender information for notification
    const sender = await ctx.db.get(args.senderId);
    if (!sender) {
      throw new Error("Sender not found");
    }

    // Check if this is the first message between these users
    const existingMessages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.and(
          q.eq(q.field("isGroupMessage"), false),
          q.or(
            q.and(
              q.eq(q.field("senderId"), args.senderId),
              q.eq(q.field("recipientId"), args.recipientId)
            ),
            q.and(
              q.eq(q.field("senderId"), args.recipientId),
              q.eq(q.field("recipientId"), args.senderId)
            )
          )
        )
      )
      .collect();

    const isFirstMessage = existingMessages.length === 0;

    // If first message, send acknowledgement
    if (isFirstMessage) {
      await ctx.db.insert("messages", {
        senderId: args.senderId,
        recipientId: args.recipientId,
        content: "⚠️ Messages will be cleared from the server automatically every 2 weeks.",
        contentTh: "⚠️ ข้อความจะถูกลบออกจากเซิร์ฟเวอร์โดยอัตโนมัติทุก 2 สัปดาห์",
        isGroupMessage: false,
        read: false,
        acknowledged: true,
        createdAt: Date.now(),
      });
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

    // Create notification for recipient
    await ctx.db.insert("notifications", {
      title: `New message from ${sender.username}`,
      titleTh: `ข้อความใหม่จาก ${sender.username}`,
      message: "You have a new message. Check your Messages tab.",
      messageTh: "คุณมีข้อความใหม่ ตรวจสอบแท็บข้อความของคุณ",
      type: "info",
      userId: args.recipientId,
      read: false,
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
    if (!args.content.trim() && !args.contentTh.trim()) {
      throw new Error("Message content cannot be empty in both languages");
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
    filterSchoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Get users based on filter - if filterSchoolId provided, filter by school, otherwise get all
    const allUsers = args.filterSchoolId
      ? await ctx.db
        .query("users")
        .withIndex("by_school", (q) => q.eq("schoolId", args.filterSchoolId))
        .collect()
      : await ctx.db.query("users").collect();

    // Filter out current user
    const filteredUsers = allUsers.filter(
      (user) => user._id !== args.currentUserId
    );

    // Fetch school information for each user
    const usersWithSchools = await Promise.all(
      filteredUsers.map(async (user) => {
        const school = user.schoolId
          ? await ctx.db.get(user.schoolId)
          : null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Internal mutation to delete old messages (called by cron job)
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
    let deletedCount = 0;
    for (const message of oldMessages) {
      await ctx.db.delete(message._id);
      deletedCount++;
    }

    console.log(`Auto-deleted ${deletedCount} messages older than 14 days`);

    return {
      deleted: deletedCount,
      timestamp: Date.now(),
    };
  },
});
