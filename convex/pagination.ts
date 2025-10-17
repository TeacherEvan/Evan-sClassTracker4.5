import { v } from "convex/values";
import { query } from "./_generated/server";

// Paginated query for students
export const listPaginated = query({
    args: {
        schoolId: v.optional(v.id("schools")),
        cursor: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pageSize = args.pageSize || 20;
        const cursor = args.cursor || 0;

        const allStudents = args.schoolId
            ? await ctx.db
                .query("students")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .collect()
            : await ctx.db.query("students").collect();

        // Sort by creation date descending
        const students = [...allStudents].sort((a, b) => b.createdAt - a.createdAt);

        const total = students.length;
        const page = students.slice(cursor, cursor + pageSize);
        const hasMore = cursor + pageSize < total;
        const nextCursor = hasMore ? cursor + pageSize : null;

        return {
            page,
            nextCursor,
            hasMore,
            total,
        };
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
        cursor: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pageSize = args.pageSize || 20;
        const cursor = args.cursor || 0;

        let classes;
        if (args.teacherId) {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .collect();
        } else if (args.schoolId) {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .collect();
        } else if (args.status) {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .collect();
        } else {
            classes = await ctx.db.query("classes").order("desc").collect();
        }

        const total = classes.length;
        const page = classes.slice(cursor, cursor + pageSize);
        const hasMore = cursor + pageSize < total;
        const nextCursor = hasMore ? cursor + pageSize : null;

        return {
            page,
            nextCursor,
            hasMore,
            total,
        };
    },
});

// Paginated query for notifications
export const listNotificationsPaginated = query({
    args: {
        userId: v.optional(v.union(v.string(), v.id("users"))),
        cursor: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pageSize = args.pageSize || 20;
        const cursor = args.cursor || 0;

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

        const total = notifications.length;
        const page = notifications.slice(cursor, cursor + pageSize);
        const hasMore = cursor + pageSize < total;
        const nextCursor = hasMore ? cursor + pageSize : null;

        return {
            page,
            nextCursor,
            hasMore,
            total,
        };
    },
});

// Paginated query for messages
export const listMessagesPaginated = query({
    args: {
        userId: v.id("users"),
        schoolId: v.optional(v.id("schools")),
        cursor: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pageSize = args.pageSize || 50;
        const cursor = args.cursor || 0;

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

        const total = allMessages.length;
        const page = allMessages.slice(cursor, cursor + pageSize);
        const hasMore = cursor + pageSize < total;
        const nextCursor = hasMore ? cursor + pageSize : null;

        // Populate sender information
        const messagesWithSenders = await Promise.all(
            page.map(async (message) => {
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

        return {
            page: messagesWithSenders,
            nextCursor,
            hasMore,
            total,
        };
    },
});

// Paginated query for teacher logs
export const listTeacherLogsPaginated = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        cursor: v.optional(v.number()),
        pageSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const pageSize = args.pageSize || 20;
        const cursor = args.cursor || 0;

        let logs;
        if (args.teacherId) {
            logs = await ctx.db
                .query("teacherLogs")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .collect();
        } else if (args.schoolId) {
            logs = await ctx.db
                .query("teacherLogs")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .collect();
        } else {
            logs = await ctx.db.query("teacherLogs").order("desc").collect();
        }

        const total = logs.length;
        const page = logs.slice(cursor, cursor + pageSize);
        const hasMore = cursor + pageSize < total;
        const nextCursor = hasMore ? cursor + pageSize : null;

        return {
            page,
            nextCursor,
            hasMore,
            total,
        };
    },
});
