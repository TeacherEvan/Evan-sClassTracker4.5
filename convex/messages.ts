import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Query to get messages for a conversation
export const list = query({
    args: {
        conversationId: v.id("conversations"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 50;

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .take(limit);

        // Return in chronological order (oldest first)
        return messages.reverse();
    },
});

// Query to get unread message count for a user across all conversations
export const getUnreadCount = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Get all conversations the user is part of
        const allConversations = await ctx.db.query("conversations").collect();
        const userConversations = allConversations.filter((conv) =>
            conv.participants.includes(args.userId)
        );

        let totalUnread = 0;

        // For each conversation, count unread messages
        for (const conversation of userConversations) {
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
                .collect();

            const unreadMessages = messages.filter(
                (msg) => msg.senderId !== args.userId && !msg.readBy.includes(args.userId)
            );

            totalUnread += unreadMessages.length;
        }

        return totalUnread;
    },
});

// Query to get unread count for a specific conversation
export const getConversationUnreadCount = query({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        const unreadMessages = messages.filter(
            (msg) => msg.senderId !== args.userId && !msg.readBy.includes(args.userId)
        );

        return unreadMessages.length;
    },
});

// Mutation to send a message
export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.content.trim()) {
            throw new Error("Message content cannot be empty");
        }

        // Verify conversation exists
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        // Verify sender is a participant
        if (!conversation.participants.includes(args.senderId)) {
            throw new Error("User is not a participant in this conversation");
        }

        // Create the message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content.trim(),
            readBy: [args.senderId], // Sender has "read" their own message
            createdAt: Date.now(),
        });

        // Update conversation's lastMessageAt
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });

        return messageId;
    },
});

// Mutation to mark a message as read
export const markAsRead = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        // Don't add if already read
        if (message.readBy.includes(args.userId)) {
            return;
        }

        const updatedReadBy = [...message.readBy, args.userId];

        await ctx.db.patch(args.messageId, {
            readBy: updatedReadBy,
        });
    },
});

// Mutation to mark all messages in a conversation as read
export const markConversationAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        // Find messages not yet read by this user
        const unreadMessages = messages.filter(
            (msg) => msg.senderId !== args.userId && !msg.readBy.includes(args.userId)
        );

        // Mark each as read
        await Promise.all(
            unreadMessages.map((msg) =>
                ctx.db.patch(msg._id, {
                    readBy: [...msg.readBy, args.userId],
                })
            )
        );
    },
});

// Mutation to delete a message
export const remove = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        // Only the sender can delete their message
        if (message.senderId !== args.userId) {
            throw new Error("You can only delete your own messages");
        }

        await ctx.db.delete(args.messageId);
    },
});

// Mutation to edit a message
export const edit = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
        newContent: v.string(),
    },
    handler: async (ctx, args) => {
        if (!args.newContent.trim()) {
            throw new Error("Message content cannot be empty");
        }

        const message = await ctx.db.get(args.messageId);

        if (!message) {
            throw new Error("Message not found");
        }

        // Only the sender can edit their message
        if (message.senderId !== args.userId) {
            throw new Error("You can only edit your own messages");
        }

        await ctx.db.patch(args.messageId, {
            content: args.newContent.trim(),
        });
    },
});

// Internal mutation to clean up old messages (called by cron job)
// Deletes messages older than 2 weeks
export const cleanupOldMessages = internalMutation({
    handler: async (ctx) => {
        const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);

        const oldMessages = await ctx.db
            .query("messages")
            .withIndex("by_created_at")
            .filter((q) => q.lt(q.field("createdAt"), twoWeeksAgo))
            .collect();

        let deletedCount = 0;

        for (const message of oldMessages) {
            // Don't delete system/acknowledgment messages
            if (message.messageType === "acknowledgment" || message.messageType === "system") {
                continue;
            }

            await ctx.db.delete(message._id);
            deletedCount++;
        }

        console.log(`[Cleanup] Deleted ${deletedCount} messages older than 2 weeks`);

        return {
            deleted: deletedCount,
            scanned: oldMessages.length,
            timestamp: Date.now()
        };
    },
});
