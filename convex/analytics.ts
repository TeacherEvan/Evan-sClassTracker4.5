/**
 * Analytics Module - Performance Metrics & Reporting
 * 
 * Role-Based Access:
 * - Teachers: See their own performance data only
 * - Moderators: See school-wide data for their assigned school
 * - Admins: See all data across all schools
 * 
 * Features:
 * - Summary metrics (total classes, attendance rate, active students, avg ClassCount)
 * - Student performance analysis (classes attended, attendance %, avg ClassCount)
 * - Date range filtering
 * - Bilingual support
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

/**
 * Get Summary Analytics
 * Returns high-level performance metrics based on role
 */
export const getSummaryAnalytics = query({
    args: {
        userId: v.id("users"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get user to determine role
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Date range defaults to last 30 days if not specified
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const startDate = args.startDate || thirtyDaysAgo;
        const endDate = args.endDate || now;

        // Query classes based on role
        let classes: Doc<"classes">[];
        if (user.role === "teacher") {
            // Teachers see only their classes
            classes = await ctx.db
                .query("classes")
                .withIndex("by_teacher", q => q.eq("teacherId", args.userId))
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "moderator" && user.schoolId) {
            // Moderators see their school's classes
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school", q => q.eq("schoolId", user.schoolId!))
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "admin") {
            // Admins see all classes
            classes = await ctx.db
                .query("classes")
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else {
            classes = [];
        }

        // Calculate metrics
        const totalClasses = classes.length;

        // Fetch post-class notes to determine attendance
        // Classes with post-class notes are considered attended
        const postClassNotesPromises = classes.map(c =>
            ctx.db
                .query("postClassNotes")
                .withIndex("by_class", q => q.eq("classId", c._id))
                .first()
        );
        const postClassNotesResults = await Promise.all(postClassNotesPromises);
        const classesWithNotes = classes.filter((_, index) => postClassNotesResults[index] !== null);

        const attendanceRate = totalClasses > 0
            ? Math.round((classesWithNotes.length / totalClasses) * 100)
            : 0;

        // Unique students
        const uniqueStudentIds = new Set(classes.map(c => c.studentId));
        const activeStudents = uniqueStudentIds.size;

        // Average ClassCount - calculate from duration (60min = 1 ClassCount)
        const totalDuration = classes.reduce((sum, c) => sum + (c.duration || 60), 0);
        const avgClassCount = totalClasses > 0
            ? Math.round((totalDuration / 60 / totalClasses) * 10) / 10 // Convert to ClassCount and round to 1 decimal
            : 0;

        return {
            totalClasses,
            attendanceRate,
            activeStudents,
            avgClassCount,
            dateRange: {
                start: startDate,
                end: endDate,
            },
        };
    },
});

/**
 * Get Student Performance Analytics
 * Returns detailed performance data for each student
 */
export const getStudentPerformance = query({
    args: {
        userId: v.id("users"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Get user to determine role
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Date range defaults to last 30 days if not specified
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const startDate = args.startDate || thirtyDaysAgo;
        const endDate = args.endDate || now;

        // Query classes based on role (same logic as summary)
        let classes: Doc<"classes">[];
        if (user.role === "teacher") {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_teacher", q => q.eq("teacherId", args.userId))
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "moderator" && user.schoolId) {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school", q => q.eq("schoolId", user.schoolId!))
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "admin") {
            classes = await ctx.db
                .query("classes")
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else {
            classes = [];
        }

        // Group classes by student
        const studentDataMap = new Map<Id<"students">, {
            studentId: Id<"students">;
            totalClasses: number;
            attendedClasses: number;
            totalDuration: number;
        }>();

        // Fetch all post-class notes for these classes in one batch
        const classIds = classes.map(c => c._id);
        const allPostClassNotes = await Promise.all(
            classIds.map(classId =>
                ctx.db
                    .query("postClassNotes")
                    .withIndex("by_class", q => q.eq("classId", classId))
                    .first()
            )
        );
        const postClassNotesMap = new Map(
            allPostClassNotes
                .map((note, index) => note ? [classIds[index], note] : null)
                .filter(Boolean) as Array<[Id<"classes">, Doc<"postClassNotes">]>
        );

        for (const classItem of classes) {
            const existing = studentDataMap.get(classItem.studentId) || {
                studentId: classItem.studentId,
                totalClasses: 0,
                attendedClasses: 0,
                totalDuration: 0,
            };

            existing.totalClasses += 1;

            // Count as attended if has post-class notes
            if (postClassNotesMap.has(classItem._id)) {
                existing.attendedClasses += 1;
                existing.totalDuration += (classItem.duration || 60);
            }

            studentDataMap.set(classItem.studentId, existing);
        }

        // Fetch student details (batch fetch for performance)
        const studentIds = Array.from(studentDataMap.keys());
        const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));

        // Build performance array with student details
        const performance = students
            .map((student, index) => {
                if (!student) return null;

                const data = studentDataMap.get(studentIds[index])!;
                const attendanceRate = data.totalClasses > 0
                    ? Math.round((data.attendedClasses / data.totalClasses) * 100)
                    : 0;
                const avgClassCount = data.attendedClasses > 0
                    ? Math.round((data.totalDuration / 60 / data.attendedClasses) * 10) / 10 // Convert to ClassCount
                    : 0;

                // Performance rating based on attendance rate
                let rating: "excellent" | "good" | "needs_improvement";
                if (attendanceRate >= 90) {
                    rating = "excellent";
                } else if (attendanceRate >= 70) {
                    rating = "good";
                } else {
                    rating = "needs_improvement";
                }

                return {
                    studentId: student._id,
                    studentName: `${student.firstName} ${student.lastName}`,
                    studentNickname: student.nickname || "",
                    grade: student.grade || "",
                    class: student.class || "",
                    totalClasses: data.totalClasses,
                    attendedClasses: data.attendedClasses,
                    attendanceRate,
                    avgClassCount,
                    rating,
                };
            })
            .filter(Boolean) as Array<{
                studentId: Id<"students">;
                studentName: string;
                studentNickname: string;
                grade: string;
                class: string;
                totalClasses: number;
                attendedClasses: number;
                attendanceRate: number;
                avgClassCount: number;
                rating: "excellent" | "good" | "needs_improvement";
            }>;

        // Sort by total classes descending (most active students first)
        performance.sort((a, b) => b.totalClasses - a.totalClasses);

        return performance;
    },
});
