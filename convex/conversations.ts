import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get all conversations for a user
export const list = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allConversations = await ctx.db.query("conversations").collect();

        // Filter conversations where user is a participant
        const userConversations = allConversations.filter((conv) =>
            conv.participants.includes(args.userId)
        );

        // Sort by last message timestamp
        return userConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
});

// Query to get a specific conversation
export const getById = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.conversationId);
    },
});

// Query to find a direct conversation between two users
export const findDirect = query({
    args: {
        userId1: v.id("users"),
        userId2: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allConversations = await ctx.db.query("conversations").collect();

        // Find direct conversation with exactly these two participants
        return allConversations.find(
            (conv) =>
                conv.type === "direct" &&
                conv.participants.length === 2 &&
                conv.participants.includes(args.userId1) &&
                conv.participants.includes(args.userId2)
        );
    },
});

// Mutation to create a new conversation
export const create = mutation({
    args: {
        participants: v.array(v.id("users")),
        type: v.union(v.literal("direct"), v.literal("group")),
        name: v.optional(v.string()),
        nameTh: v.optional(v.string()),
        schoolId: v.optional(v.id("schools")),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Validate participants
        if (args.participants.length < 2) {
            throw new Error("A conversation must have at least 2 participants");
        }

        // For direct conversations, ensure exactly 2 participants
        if (args.type === "direct" && args.participants.length !== 2) {
            throw new Error("Direct conversations must have exactly 2 participants");
        }

        // For group conversations, require a name
        if (args.type === "group" && (!args.name || !args.nameTh)) {
            throw new Error("Group conversations require a name in both languages");
        }

        // Check if direct conversation already exists
        if (args.type === "direct") {
            const allConversations = await ctx.db.query("conversations").collect();
            const existing = allConversations.find(
                (conv) =>
                    conv.type === "direct" &&
                    conv.participants.length === 2 &&
                    conv.participants.includes(args.participants[0]) &&
                    conv.participants.includes(args.participants[1])
            );

            if (existing) {
                return existing._id;
            }
        }

        const conversationId = await ctx.db.insert("conversations", {
            participants: args.participants,
            type: args.type,
            name: args.name,
            nameTh: args.nameTh,
            schoolId: args.schoolId,
            createdBy: args.createdBy,
            lastMessageAt: Date.now(),
            createdAt: Date.now(),
        });

        // Insert acknowledgment message for new conversations
        await ctx.db.insert("messages", {
            conversationId,
            senderId: "system",
            content: "Messages will be cleared from the server automatically every 2 weeks.",
            readBy: [],
            messageType: "acknowledgment",
            createdAt: Date.now(),
        });

        return conversationId;
    },
});

// Mutation to add a participant to a conversation
export const addParticipant = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (conversation.type === "direct") {
            throw new Error("Cannot add participants to direct conversations");
        }

        if (conversation.participants.includes(args.userId)) {
            throw new Error("User is already a participant");
        }

        const updatedParticipants = [...conversation.participants, args.userId];

        await ctx.db.patch(args.conversationId, {
            participants: updatedParticipants,
        });
    },
});

// Mutation to remove a participant from a conversation
export const removeParticipant = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            throw new Error("Conversation not found");
        }

        if (conversation.type === "direct") {
            throw new Error("Cannot remove participants from direct conversations");
        }

        const updatedParticipants = conversation.participants.filter(
            (id) => id !== args.userId
        );

        if (updatedParticipants.length < 2) {
            throw new Error("A conversation must have at least 2 participants");
        }

        await ctx.db.patch(args.conversationId, {
            participants: updatedParticipants,
        });
    },
});

// Mutation to update last message timestamp
export const updateLastMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.conversationId, {
            lastMessageAt: Date.now(),
        });
    },
});

// Mutation to delete a conversation (admin only)
export const remove = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        // Delete all messages in the conversation first
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        await Promise.all(messages.map((msg) => ctx.db.delete(msg._id)));

        // Delete the conversation
        await ctx.db.delete(args.conversationId);
    },
});

// Query to get users by school (for "Available Users" flow)
export const getUsersBySchool = query({
    args: {
        schoolId: v.id("schools"),
        currentUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        // Filter out current user and return without password hash
        return allUsers
            .filter((user) => user._id !== args.currentUserId)
            .map((user) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
    },
});

// Query to get all moderators (for "Moderators" button)
export const getModerators = query({
    args: {
        currentUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "moderator"))
            .collect();

        // Filter out current user if they're a moderator
        return allUsers
            .filter((user) => user._id !== args.currentUserId)
            .map((user) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
    },
});

// Query to get admin user (for "Evan/Admin" button)
export const getAdmin = query({
    handler: async (ctx) => {
        const admin = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", "admin"))
            .first();

        if (!admin) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _passwordHash, ...userWithoutPassword } = admin;
        return userWithoutPassword;
    },
});

// Query to get group conversations
export const getGroupConversations = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allConversations = await ctx.db.query("conversations").collect();

        // Filter for group conversations where user is a participant
        const groupConversations = allConversations.filter(
            (conv) => conv.type === "group" && conv.participants.includes(args.userId)
        );

        // Sort by last message timestamp
        return groupConversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
});
