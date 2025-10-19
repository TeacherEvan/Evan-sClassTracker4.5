import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { Id } from "./_generated/dataModel";

// ✅ PERFORMANCE FIX: Use Convex native pagination instead of loading all records
// This provides efficient database-level pagination with cursor support

// Paginated query for students
export const listPaginated = query({
    args: {
        schoolId: v.optional(v.id("schools")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (args.schoolId) {
            return await ctx.db
                .query("students")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        // For all students, use created_at index for consistent ordering
        return await ctx.db
            .query("students")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Paginated query for classes
export const listClassesPaginated = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        status: v.optional(
            v.union(
                v.literal("pending"),
                v.literal("acknowledged"),
                v.literal("approved"),
                v.literal("rejected")
            )
        ),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (args.teacherId) {
            return await ctx.db
                .query("classes")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        if (args.schoolId) {
            return await ctx.db
                .query("classes")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        if (args.status) {
            return await ctx.db
                .query("classes")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        return await ctx.db
            .query("classes")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Paginated query for notifications
export const listNotificationsPaginated = query({
    args: {
        userId: v.optional(v.union(v.string(), v.id("users"))),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (args.userId) {
            return await ctx.db
                .query("notifications")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        return await ctx.db
            .query("notifications")
            .withIndex("by_created_at")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

// Paginated query for messages
// Note: This is more complex due to combining direct and group messages
// For now, keeping the combined approach but with optimized batching
export const listMessagesPaginated = query({
    args: {
        userId: v.id("users"),
        schoolId: v.optional(v.id("schools")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        // Note: Convex pagination doesn't work well with filter() + or()
        // This is a limitation for complex message queries
        // TODO: Consider splitting into separate queries for direct vs group messages
        
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
            .take(100); // Limit to reasonable number

        // Get group messages for user's school
        const groupMessages = args.schoolId
            ? await ctx.db
                .query("messages")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
                .filter((q) => q.eq(q.field("isGroupMessage"), true))
                .order("desc")
                .take(100) // Limit to reasonable number
            : [];

        // Combine and sort by creation time
        const allMessages = [...directMessages, ...groupMessages]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, args.paginationOpts.numItems);

        // ✅ PERFORMANCE FIX: Batch fetch sender/recipient info
        const senderIds = new Set(allMessages.map(m => m.senderId.toString()));
        const recipientIds = new Set(
            allMessages
                .map(m => m.recipientId?.toString())
                .filter((id): id is string => id !== undefined)
        );
        
        const allUserIds = [...senderIds, ...recipientIds];
        const userPromises = allUserIds.map(async (id) => {
            const user = await ctx.db.get(id as Id<"users">);
            // Type guard to ensure we only return users
            if (user && "_id" in user && "username" in user) {
                return user as { _id: Id<"users">; username: string };
            }
            return null;
        });
        const users = (await Promise.all(userPromises)).filter(
            (u): u is NonNullable<typeof u> => u !== null
        );
        
        const userMap = new Map(
            users.map(u => [u._id.toString(), u])
        );

        // Populate sender information using map lookup (no N+1)
        const messagesWithSenders = allMessages.map(message => {
            const sender = userMap.get(message.senderId.toString());
            const recipient = message.recipientId 
                ? userMap.get(message.recipientId.toString())
                : null;

            return {
                ...message,
                senderUsername: sender?.username || "Unknown",
                recipientUsername: recipient?.username || null,
            };
        });

        return {
            page: messagesWithSenders,
            isDone: messagesWithSenders.length < args.paginationOpts.numItems,
            continueCursor: messagesWithSenders.length > 0 
                ? messagesWithSenders[messagesWithSenders.length - 1].createdAt.toString()
                : null,
        };
    },
});

// Paginated query for teacher logs
export const listTeacherLogsPaginated = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        if (args.teacherId) {
            return await ctx.db
                .query("teacherLogs")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        if (args.schoolId) {
            return await ctx.db
                .query("teacherLogs")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .paginate(args.paginationOpts);
        }
        
        return await ctx.db
            .query("teacherLogs")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});
