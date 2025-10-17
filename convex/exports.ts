import { v } from "convex/values";
import { query } from "./_generated/server";

// Export classes data as CSV-ready format
export const exportClasses = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let classes = await ctx.db.query("classes").order("desc").collect();

        // Apply filters
        if (args.teacherId) {
            classes = classes.filter((c) => c.teacherId === args.teacherId);
        }
        if (args.schoolId) {
            classes = classes.filter((c) => c.schoolId === args.schoolId);
        }
        if (args.startDate) {
            classes = classes.filter((c) => c.scheduledDate >= args.startDate!);
        }
        if (args.endDate) {
            classes = classes.filter((c) => c.scheduledDate <= args.endDate!);
        }

        // Populate related data
        const exportData = await Promise.all(
            classes.map(async (cls) => {
                const teacher = await ctx.db.get(cls.teacherId);
                const school = await ctx.db.get(cls.schoolId);
                const student = await ctx.db.get(cls.studentId);
                const location = await ctx.db.get(cls.locationId);

                return {
                    classId: cls._id,
                    teacherUsername: teacher?.username || "Unknown",
                    schoolName: school?.name || "Unknown",
                    schoolNameTh: school?.nameTh || "Unknown",
                    studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
                    studentId: student?.studentId || "Unknown",
                    locationName: location?.name || "Unknown",
                    locationNameTh: location?.nameTh || "Unknown",
                    status: cls.status,
                    scheduledDate: new Date(cls.scheduledDate).toISOString(),
                    createdAt: new Date(cls.createdAt).toISOString(),
                };
            })
        );

        return exportData;
    },
});

// Export students data as CSV-ready format
export const exportStudents = query({
    args: {
        schoolId: v.optional(v.id("schools")),
    },
    handler: async (ctx, args) => {
        const students = args.schoolId
            ? await ctx.db
                .query("students")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .collect()
            : await ctx.db.query("students").collect();

        // Populate school data
        const exportData = await Promise.all(
            students.map(async (student) => {
                const school = student.schoolId ? await ctx.db.get(student.schoolId) : null;

                return {
                    studentId: student.studentId,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    grade: student.grade,
                    schoolName: school?.name || "N/A",
                    schoolNameTh: school?.nameTh || "N/A",
                    guardianName: student.guardianName || "N/A",
                    guardianPhone: student.guardianPhone || "N/A",
                    guardianEmail: student.guardianEmail || "N/A",
                    createdAt: new Date(student.createdAt).toISOString(),
                };
            })
        );

        return exportData;
    },
});

// Export analytics data as CSV-ready format
export const exportAnalytics = query({
    args: {
        schoolId: v.id("schools"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        // Get all classes for the school in the date range
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_school_and_date", (q) =>
                q
                    .eq("schoolId", args.schoolId)
                    .gte("scheduledDate", args.startDate)
                    .lte("scheduledDate", args.endDate)
            )
            .collect();

        // Group by teacher
        const teacherStats: Record<
            string,
            {
                teacherId: string;
                teacherUsername: string;
                totalClasses: number;
                approved: number;
                pending: number;
                rejected: number;
                acknowledged: number;
                approvalRate: number;
            }
        > = {};

        for (const cls of classes) {
            const teacherId = cls.teacherId;
            if (!teacherStats[teacherId]) {
                const teacher = await ctx.db.get(teacherId);
                teacherStats[teacherId] = {
                    teacherId,
                    teacherUsername: teacher?.username || "Unknown",
                    totalClasses: 0,
                    approved: 0,
                    pending: 0,
                    rejected: 0,
                    acknowledged: 0,
                    approvalRate: 0,
                };
            }

            teacherStats[teacherId].totalClasses++;
            if (cls.status === "approved") teacherStats[teacherId].approved++;
            if (cls.status === "pending") teacherStats[teacherId].pending++;
            if (cls.status === "rejected") teacherStats[teacherId].rejected++;
            if (cls.status === "acknowledged") teacherStats[teacherId].acknowledged++;
        }

        // Calculate approval rates
        const exportData = Object.values(teacherStats).map((stat) => {
            const processedClasses = stat.approved + stat.rejected;
            const approvalRate =
                processedClasses > 0 ? (stat.approved / processedClasses) * 100 : 0;

            return {
                ...stat,
                approvalRate: approvalRate.toFixed(2),
            };
        });

        return exportData;
    },
});

// Export teacher logs as CSV-ready format
export const exportTeacherLogs = query({
    args: {
        teacherId: v.optional(v.id("users")),
        schoolId: v.optional(v.id("schools")),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let logs = await ctx.db.query("teacherLogs").order("desc").collect();

        // Apply filters
        if (args.teacherId) {
            logs = logs.filter((log) => log.teacherId === args.teacherId);
        }
        if (args.schoolId) {
            logs = logs.filter((log) => log.schoolId === args.schoolId);
        }
        if (args.startDate) {
            logs = logs.filter((log) => log.createdAt >= args.startDate!);
        }
        if (args.endDate) {
            logs = logs.filter((log) => log.createdAt <= args.endDate!);
        }

        // Populate related data
        const exportData = await Promise.all(
            logs.map(async (log) => {
                const teacher = await ctx.db.get(log.teacherId);
                const school = await ctx.db.get(log.schoolId);

                return {
                    logId: log._id,
                    teacherUsername: teacher?.username || "Unknown",
                    schoolName: school?.name || "Unknown",
                    schoolNameTh: school?.nameTh || "Unknown",
                    action: log.action,
                    actionTh: log.actionTh,
                    details: log.details,
                    detailsTh: log.detailsTh,
                    createdAt: new Date(log.createdAt).toISOString(),
                };
            })
        );

        return exportData;
    },
});
