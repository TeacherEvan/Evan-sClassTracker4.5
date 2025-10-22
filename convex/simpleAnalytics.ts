import { v } from "convex/values";
import { query } from "./_generated/server";

// Simple query to count classes for a school
export const getSchoolClassCount = query({
    args: {
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        return {
            total: classes.length,
            approved: classes.filter((c) => c.status === "approved").length,
            pending: classes.filter((c) => c.status === "pending").length,
            rejected: classes.filter((c) => c.status === "rejected").length,
            acknowledged: classes.filter((c) => c.status === "acknowledged").length,
        };
    },
});

// Get teacher performance metrics for a school
export const getTeacherPerformance = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
        const end = args.endDate || Date.now();

        // Get classes in date range for the school
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q
                    .eq("schoolId", args.schoolId)
                    .gte("scheduledDate", start)
                    .lte("scheduledDate", end)
            )
            .collect();

        // Group by teacher
        const teacherStats: Record<
            string,
            {
                total: number;
                approved: number;
                pending: number;
                rejected: number;
                acknowledged: number;
            }
        > = {};

        for (const cls of classes) {
            const teacherId = cls.teacherId;
            if (!teacherStats[teacherId]) {
                teacherStats[teacherId] = {
                    total: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    acknowledged: 0,
                };
            }

            teacherStats[teacherId].total++;
            if (cls.status === "approved") teacherStats[teacherId].approved++;
            if (cls.status === "pending") teacherStats[teacherId].pending++;
            if (cls.status === "rejected") teacherStats[teacherId].rejected++;
            if (cls.status === "acknowledged") teacherStats[teacherId].acknowledged++;
        }

        // Build response with teacher details
        const performance = await Promise.all(
            Object.keys(teacherStats).map(async (teacherId) => {
                const stats = teacherStats[teacherId];
                const teacher = await ctx.db
                    .query("users")
                    .withIndex("by_username")
                    .filter((q) => q.eq(q.field("_id"), teacherId))
                    .first();

                const processedClasses = stats.approved + stats.rejected;
                const approvalRate = processedClasses > 0 ? (stats.approved / processedClasses) * 100 : 0;

                return {
                    teacherId,
                    teacherUsername: teacher?.username || "Unknown",
                    ...stats,
                    approvalRate: Math.round(approvalRate * 100) / 100,
                };
            })
        );

        return performance.sort((a, b) => b.total - a.total);
    },
});

// Get class trends over time for a school
export const getClassTrends = query({
    args: {
        schoolId: v.id("schools"),
        days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const days = args.days || 30;
        const now = Date.now();
        const startDate = now - days * 24 * 60 * 60 * 1000;

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", startDate).lte("scheduledDate", now)
            )
            .collect();

        // Group by day
        const dailyStats: Record<string, { total: number; approved: number; rejected: number }> = {};

        for (const cls of classes) {
            const date = new Date(cls.scheduledDate).toISOString().split("T")[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { total: 0, approved: 0, rejected: 0 };
            }

            dailyStats[date].total++;
            if (cls.status === "approved") dailyStats[date].approved++;
            if (cls.status === "rejected") dailyStats[date].rejected++;
        }

        return Object.entries(dailyStats)
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));
    },
});

// Get student attendance statistics for a school
export const getStudentStats = query({
    args: {
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const students = await ctx.db
            .query("students")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        // Count classes per student
        const studentClassCounts: Record<string, number> = {};
        for (const cls of classes) {
            const studentId = cls.studentId;
            studentClassCounts[studentId] = (studentClassCounts[studentId] || 0) + 1;
        }

        const totalStudents = students.length;
        const studentsWithClasses = Object.keys(studentClassCounts).length;
        const averageClassesPerStudent =
            studentsWithClasses > 0
                ? Object.values(studentClassCounts).reduce((sum, count) => sum + count, 0) /
                studentsWithClasses
                : 0;

        return {
            totalStudents,
            studentsWithClasses,
            studentsWithoutClasses: totalStudents - studentsWithClasses,
            averageClassesPerStudent: Math.round(averageClassesPerStudent * 100) / 100,
        };
    },
});

// Get location utilization for a school
export const getLocationUtilization = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000;
        const end = args.endDate || Date.now();

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", start).lte("scheduledDate", end)
            )
            .collect();

        // Group by location
        const locationStats: Record<string, { total: number; name: string; nameTh: string }> = {};

        for (const cls of classes) {
            const locationId = cls.locationId;
            if (locationId) {
                if (!locationStats[locationId]) {
                    const location = await ctx.db.get(locationId);
                    locationStats[locationId] = {
                        total: 0,
                        name: location?.name || cls.pendingLocationName || "Unknown",
                        nameTh: location?.nameTh || cls.pendingLocationNameTh || "Unknown",
                    };
                }

                locationStats[locationId].total++;
            }
        }

        return Object.entries(locationStats)
            .map(([locationId, stats]) => ({ locationId, ...stats }))
            .sort((a, b) => b.total - a.total);
    },
});

// Get engagement metrics - response times and approval rates
export const getEngagementMetrics = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000;
        const end = args.endDate || Date.now();

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", start).lte("scheduledDate", end)
            )
            .collect();

        // Calculate metrics
        let editedClassesCount = 0;

        const statusCounts = {
            pending: 0,
            acknowledged: 0,
            approved: 0,
            rejected: 0,
        };

        for (const cls of classes) {
            statusCounts[cls.status]++;

            // Track edited classes
            if (cls.isEdited) {
                editedClassesCount++;
            }
        }

        const totalClasses = classes.length;
        const processedClasses = statusCounts.approved + statusCounts.rejected;
        const approvalRate = processedClasses > 0 ? (statusCounts.approved / processedClasses) * 100 : 0;
        const editRate = totalClasses > 0 ? (editedClassesCount / totalClasses) * 100 : 0;

        return {
            totalClasses,
            statusCounts,
            approvalRate: Math.round(approvalRate * 100) / 100,
            editRate: Math.round(editRate * 100) / 100,
            editedClassesCount,
            pendingResponseRate: totalClasses > 0 ? Math.round((statusCounts.pending / totalClasses) * 100 * 100) / 100 : 0,
        };
    },
});

// Get weekly trend comparison
export const getWeeklyComparison = query({
    args: {
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        // Current week
        const currentWeekStart = now - oneWeek;
        const currentWeekClasses = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", currentWeekStart).lte("scheduledDate", now)
            )
            .collect();

        // Previous week
        const previousWeekStart = currentWeekStart - oneWeek;
        const previousWeekClasses = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", previousWeekStart).lte("scheduledDate", currentWeekStart)
            )
            .collect();

        const currentWeekStats = {
            total: currentWeekClasses.length,
            approved: currentWeekClasses.filter(c => c.status === "approved").length,
            pending: currentWeekClasses.filter(c => c.status === "pending").length,
            rejected: currentWeekClasses.filter(c => c.status === "rejected").length,
        };

        const previousWeekStats = {
            total: previousWeekClasses.length,
            approved: previousWeekClasses.filter(c => c.status === "approved").length,
            pending: previousWeekClasses.filter(c => c.status === "pending").length,
            rejected: previousWeekClasses.filter(c => c.status === "rejected").length,
        };

        // Calculate percentage changes
        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            currentWeek: currentWeekStats,
            previousWeek: previousWeekStats,
            changes: {
                total: calculateChange(currentWeekStats.total, previousWeekStats.total),
                approved: calculateChange(currentWeekStats.approved, previousWeekStats.approved),
                pending: calculateChange(currentWeekStats.pending, previousWeekStats.pending),
                rejected: calculateChange(currentWeekStats.rejected, previousWeekStats.rejected),
            },
        };
    },
});

// Get most active teachers
export const getMostActiveTeachers = query({
    args: {
        schoolId: v.id("schools"),
        limit: v.optional(v.number()),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 5;
        const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000;
        const end = args.endDate || Date.now();

        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q.eq("schoolId", args.schoolId).gte("scheduledDate", start).lte("scheduledDate", end)
            )
            .collect();

        // Group by teacher
        const teacherStats: Record<string, { count: number; username: string }> = {};

        for (const cls of classes) {
            const teacherId = cls.teacherId;
            if (!teacherStats[teacherId]) {
                const teacher = await ctx.db.get(teacherId);
                teacherStats[teacherId] = {
                    count: 0,
                    username: teacher?.username || "Unknown",
                };
            }
            teacherStats[teacherId].count++;
        }

        return Object.entries(teacherStats)
            .map(([teacherId, stats]) => ({ teacherId, ...stats }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },
});
