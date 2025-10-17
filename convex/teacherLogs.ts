import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list teacher logs
export const list = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 100;

        if (args.teacherId && args.startDate && args.endDate) {
            // Query by teacher and date range
            const logs = await ctx.db
                .query("teacherLogs")
                .withIndex("by_teacher_and_date", (q) =>
                    q
                        .eq("teacherId", args.teacherId!)
                        .gte("createdAt", args.startDate!)
                        .lte("createdAt", args.endDate!)
                )
                .order("desc")
                .take(limit);
            return logs;
        }

        if (args.schoolId && args.startDate && args.endDate) {
            // Query by school and date range
            const logs = await ctx.db
                .query("teacherLogs")
                .withIndex("by_school_and_date", (q) =>
                    q
                        .eq("schoolId", args.schoolId!)
                        .gte("createdAt", args.startDate!)
                        .lte("createdAt", args.endDate!)
                )
                .order("desc")
                .take(limit);
            return logs;
        }

        if (args.teacherId) {
            return await ctx.db
                .query("teacherLogs")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
                .order("desc")
                .take(limit);
        }

        if (args.schoolId) {
            return await ctx.db
                .query("teacherLogs")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .order("desc")
                .take(limit);
        }

        return await ctx.db
            .query("teacherLogs")
            .order("desc")
            .take(limit);
    },
});

// Query to get teacher activity summary
export const getTeacherSummary = query({
    args: {
        teacherId: v.id("users"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
        const end = args.endDate || Date.now();

        const logs = await ctx.db
            .query("teacherLogs")
            .withIndex("by_teacher_and_date", (q) =>
                q
                    .eq("teacherId", args.teacherId)
                    .gte("createdAt", start)
                    .lte("createdAt", end)
            )
            .collect();

        // Count actions by type
        const actionCounts: Record<string, number> = {};
        logs.forEach((log) => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });

        return {
            totalActions: logs.length,
            actionCounts,
            recentLogs: logs.slice(0, 10),
        };
    },
});

// Query to get school-wide teacher activity summary
export const getSchoolSummary = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
        const end = args.endDate || Date.now();

        const logs = await ctx.db
            .query("teacherLogs")
            .withIndex("by_school_and_date", (q) =>
                q
                    .eq("schoolId", args.schoolId)
                    .gte("createdAt", start)
                    .lte("createdAt", end)
            )
            .collect();

        // Group by teacher
        const teacherActivity: Record<string, number> = {};
        logs.forEach((log) => {
            const teacherIdStr = log.teacherId;
            teacherActivity[teacherIdStr] = (teacherActivity[teacherIdStr] || 0) + 1;
        });

        // Count actions by type
        const actionCounts: Record<string, number> = {};
        logs.forEach((log) => {
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        });

        return {
            totalActions: logs.length,
            teacherActivity,
            actionCounts,
            recentLogs: logs.slice(0, 20),
        };
    },
});

// Mutation to create a teacher log entry
export const create = mutation({
    args: {
        teacherId: v.id("users"),
        schoolId: v.id("schools"),
        action: v.string(),
        actionTh: v.string(),
        details: v.string(),
        detailsTh: v.string(),
        relatedClassId: v.optional(v.id("classes")),
        relatedStudentId: v.optional(v.id("students")),
    },
    handler: async (ctx, args) => {
        const logId = await ctx.db.insert("teacherLogs", {
            teacherId: args.teacherId,
            schoolId: args.schoolId,
            action: args.action,
            actionTh: args.actionTh,
            details: args.details,
            detailsTh: args.detailsTh,
            relatedClassId: args.relatedClassId,
            relatedStudentId: args.relatedStudentId,
            createdAt: Date.now(),
        });

        return logId;
    },
});
