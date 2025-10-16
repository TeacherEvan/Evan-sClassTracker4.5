import { v } from "convex/values";
import { query } from "./_generated/server";

// Query to get teacher performance analytics for a school
export const getTeacherAnalytics = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { schoolId, startDate, endDate } = args;

        // Get all classes for the school
        const classesQuery = ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId));

        const classes = await classesQuery.collect();

        // Filter by date range if provided
        const filteredClasses = classes.filter((cls) => {
            if (startDate && cls.scheduledDate < startDate) return false;
            if (endDate && cls.scheduledDate > endDate) return false;
            return true;
        });

        // Group classes by teacher
        const teacherStats: Record<string, {
            teacherId: string;
            teacherName: string;
            totalClasses: number;
            pending: number;
            acknowledged: number;
            approved: number;
            rejected: number;
            approvalRate: number;
        }> = {};

        for (const cls of filteredClasses) {
            const teacherId = cls.teacherId;

            if (!teacherStats[teacherId]) {
                const teacher = await ctx.db.get(teacherId);
                teacherStats[teacherId] = {
                    teacherId,
                    teacherName: teacher?.username || "Unknown",
                    totalClasses: 0,
                    pending: 0,
                    acknowledged: 0,
                    approved: 0,
                    rejected: 0,
                    approvalRate: 0,
                };
            }

            const stats = teacherStats[teacherId];
            stats.totalClasses++;

            switch (cls.status) {
                case "pending":
                    stats.pending++;
                    break;
                case "acknowledged":
                    stats.acknowledged++;
                    break;
                case "approved":
                    stats.approved++;
                    break;
                case "rejected":
                    stats.rejected++;
                    break;
            }
        }

        // Calculate approval rates
        Object.values(teacherStats).forEach((stats) => {
            const completed = stats.approved + stats.rejected;
            if (completed > 0) {
                stats.approvalRate = (stats.approved / completed) * 100;
            }
        });

        return Object.values(teacherStats);
    },
});

// Query to get overall school analytics
export const getSchoolAnalytics = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { schoolId, startDate, endDate } = args;

        // Get all classes for the school
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        // Filter by date range
        const filteredClasses = classes.filter((cls) => {
            if (startDate && cls.scheduledDate < startDate) return false;
            if (endDate && cls.scheduledDate > endDate) return false;
            return true;
        });

        const totalClasses = filteredClasses.length;
        const pending = filteredClasses.filter((c) => c.status === "pending").length;
        const acknowledged = filteredClasses.filter((c) => c.status === "acknowledged").length;
        const approved = filteredClasses.filter((c) => c.status === "approved").length;
        const rejected = filteredClasses.filter((c) => c.status === "rejected").length;

        const completed = approved + rejected;
        const approvalRate = completed > 0 ? (approved / completed) * 100 : 0;

        // Get unique teachers
        const uniqueTeachers = new Set(filteredClasses.map((c) => c.teacherId));

        return {
            totalClasses,
            pending,
            acknowledged,
            approved,
            rejected,
            approvalRate,
            uniqueTeachers: uniqueTeachers.size,
        };
    },
});

// Query to get class trends over time
export const getClassTrends = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.number(),
        endDate: v.number(),
        interval: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    },
    handler: async (ctx, args) => {
        const { schoolId, startDate, endDate, interval } = args;

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", schoolId)
                    .gte("scheduledDate", startDate)
                    .lte("scheduledDate", endDate)
            )
            .collect();

        // Group by time interval
        const trends: Record<string, {
            date: string;
            timestamp: number;
            total: number;
            approved: number;
            rejected: number;
            pending: number;
        }> = {};

        classes.forEach((cls) => {
            const date = new Date(cls.scheduledDate);
            let key: string;

            switch (interval) {
                case "daily":
                    key = date.toISOString().split("T")[0];
                    break;
                case "weekly":
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    key = weekStart.toISOString().split("T")[0];
                    break;
                case "monthly":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                default:
                    key = date.toISOString().split("T")[0];
            }

            if (!trends[key]) {
                trends[key] = {
                    date: key,
                    timestamp: new Date(key).getTime(),
                    total: 0,
                    approved: 0,
                    rejected: 0,
                    pending: 0,
                };
            }

            trends[key].total++;
            if (cls.status === "approved") trends[key].approved++;
            if (cls.status === "rejected") trends[key].rejected++;
            if (cls.status === "pending" || cls.status === "acknowledged") trends[key].pending++;
        });

        return Object.values(trends).sort((a, b) => a.timestamp - b.timestamp);
    },
});

// Query to get teacher ranking by approval rate
export const getTeacherRanking = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { schoolId, startDate, endDate } = args;

        // Get all classes for the school (inline the logic from getTeacherAnalytics)
        const classesQuery = ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId));

        const classes = await classesQuery.collect();

        // Filter by date range if provided
        const filteredClasses = classes.filter((cls) => {
            if (startDate && cls.scheduledDate < startDate) return false;
            if (endDate && cls.scheduledDate > endDate) return false;
            return true;
        });

        // Group classes by teacher
        const teacherStats: Record<string, {
            teacherId: string;
            teacherName: string;
            totalClasses: number;
            pending: number;
            acknowledged: number;
            approved: number;
            rejected: number;
            approvalRate: number;
        }> = {};

        for (const cls of filteredClasses) {
            const teacherId = cls.teacherId;

            if (!teacherStats[teacherId]) {
                const teacher = await ctx.db.get(teacherId);
                teacherStats[teacherId] = {
                    teacherId,
                    teacherName: teacher?.username || "Unknown",
                    totalClasses: 0,
                    pending: 0,
                    acknowledged: 0,
                    approved: 0,
                    rejected: 0,
                    approvalRate: 0,
                };
            }

            const stats = teacherStats[teacherId];
            stats.totalClasses++;

            switch (cls.status) {
                case "pending":
                    stats.pending++;
                    break;
                case "acknowledged":
                    stats.acknowledged++;
                    break;
                case "approved":
                    stats.approved++;
                    break;
                case "rejected":
                    stats.rejected++;
                    break;
            }
        }

        // Calculate approval rates
        Object.values(teacherStats).forEach((stats) => {
            const completed = stats.approved + stats.rejected;
            if (completed > 0) {
                stats.approvalRate = (stats.approved / completed) * 100;
            }
        });

        // Sort by approval rate (descending) and total classes (descending)
        const ranked = Object.values(teacherStats)
            .filter((t) => t.totalClasses > 0)
            .sort((a, b) => {
                if (b.approvalRate !== a.approvalRate) {
                    return b.approvalRate - a.approvalRate;
                }
                return b.totalClasses - a.totalClasses;
            });

        const limit = args.limit || ranked.length;
        return ranked.slice(0, limit);
    },
});

// Query to get response time analytics (time from pending to acknowledged/approved)
export const getResponseTimeAnalytics = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { schoolId, startDate, endDate } = args;

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", schoolId))
            .collect();

        const filteredClasses = classes.filter((cls) => {
            if (startDate && cls.scheduledDate < startDate) return false;
            if (endDate && cls.scheduledDate > endDate) return false;
            return cls.status !== "pending"; // Only completed actions
        });

        // Note: This is a simplified version. In a real system, you'd track
        // timestamp changes for each status transition
        const avgResponseTime = filteredClasses.length > 0
            ? "Data not available - implement status change tracking"
            : "No data";

        return {
            message: avgResponseTime,
            processedClasses: filteredClasses.length,
            pendingClasses: classes.filter((c) => c.status === "pending").length,
        };
    },
});
