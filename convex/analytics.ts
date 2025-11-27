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
 *
 * ✅ OPTIMIZATIONS (Nov 2025):
 * - Teacher queries use composite index (by_teacher_and_status) for status filtering
 * - Moderator queries use composite index (by_school_and_date) for date range
 * - Admin queries use scheduled_date index instead of full table scan
 * - Batch fetching for post-class notes with role-aware strategies
 * - Set-based lookups for O(1) attendance checking
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

        // ✅ OPTIMIZED: Query classes based on role with best available index
        let classes: Doc<"classes">[];
        if (user.role === "teacher") {
            // Teachers see only their classes - use composite index for status
            classes = await ctx.db
                .query("classes")
                .withIndex("by_teacher_and_status", q =>
                    q.eq("teacherId", args.userId).eq("status", "approved")
                )
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate)
                    )
                )
                .collect();
        } else if (user.role === "moderator" && user.schoolId) {
            // Moderators see their school's classes - use composite school+date index
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school_and_date", q =>
                    q.eq("schoolId", user.schoolId!).gte("scheduledDate", startDate)
                )
                .filter(q =>
                    q.and(
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "admin") {
            // Admins see all classes - use scheduled_date index for range query
            classes = await ctx.db
                .query("classes")
                .withIndex("by_scheduled_date", q => q.gte("scheduledDate", startDate))
                .filter(q =>
                    q.and(
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

        // ✅ OPTIMIZED: Batch fetch post-class notes instead of N+1 queries
        // Classes with post-class notes are considered attended
        // Collect all class IDs first, then batch fetch notes
        const classIds = classes.map(c => c._id);

        // For teachers: fetch only their notes (indexed query)
        // For moderators/admins: we need to check notes for these specific classes
        let postClassNotes;
        if (user.role === "teacher") {
            // Teacher's notes - use indexed query
            postClassNotes = await ctx.db
                .query("postClassNotes")
                .withIndex("by_teacher", q => q.eq("teacherId", args.userId))
                .collect();
        } else {
            // For moderator/admin: fetch notes for all fetched classes
            // Use batch fetch pattern with Promise.all but more efficiently
            const notePromises = classIds.map(classId =>
                ctx.db
                    .query("postClassNotes")
                    .withIndex("by_class", q => q.eq("classId", classId))
                    .first()
            );
            const noteResults = await Promise.all(notePromises);
            postClassNotes = noteResults.filter((n): n is NonNullable<typeof n> => n !== null);
        }

        // Create Set for O(1) lookup
        const classIdsWithNotes = new Set(postClassNotes.map(n => n.classId));
        const classesWithNotes = classes.filter(c => classIdsWithNotes.has(c._id));

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

        // ✅ OPTIMIZED: Query classes based on role with best available index
        let classes: Doc<"classes">[];
        if (user.role === "teacher") {
            // Use composite index for teacher + status
            classes = await ctx.db
                .query("classes")
                .withIndex("by_teacher_and_status", q =>
                    q.eq("teacherId", args.userId).eq("status", "approved")
                )
                .filter(q =>
                    q.and(
                        q.gte(q.field("scheduledDate"), startDate),
                        q.lte(q.field("scheduledDate"), endDate)
                    )
                )
                .collect();
        } else if (user.role === "moderator" && user.schoolId) {
            // Use composite school+date index
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school_and_date", q =>
                    q.eq("schoolId", user.schoolId!).gte("scheduledDate", startDate)
                )
                .filter(q =>
                    q.and(
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else if (user.role === "admin") {
            // Use scheduled_date index for range query
            classes = await ctx.db
                .query("classes")
                .withIndex("by_scheduled_date", q => q.gte("scheduledDate", startDate))
                .filter(q =>
                    q.and(
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

        // ✅ OPTIMIZED: Batch fetch post-class notes with role-aware queries
        // For teachers, use indexed query for better performance
        const classIds = classes.map(c => c._id);
        let allPostClassNotes: Array<{ classId: Id<"classes"> } | null>;

        if (user.role === "teacher") {
            // Use teacher index for better performance
            const teacherNotes = await ctx.db
                .query("postClassNotes")
                .withIndex("by_teacher", q => q.eq("teacherId", args.userId))
                .collect();
            // Map to match expected format (include only notes for current class set)
            const teacherNotesMap = new Map(teacherNotes.map(n => [n.classId, n]));
            allPostClassNotes = classIds.map(id => teacherNotesMap.get(id) || null);
        } else {
            // For moderator/admin: batch fetch per class
            allPostClassNotes = await Promise.all(
                classIds.map(classId =>
                    ctx.db
                        .query("postClassNotes")
                        .withIndex("by_class", q => q.eq("classId", classId))
                        .first()
                )
            );
        }
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

/**
 * Get Teacher Comparison Analytics (Moderator-Only)
 * Returns comparative performance data for all teachers in a school
 * 
 * ✅ NEW (Nov 2025): Enables moderators to compare teacher effectiveness
 */
export const getTeacherComparison = query({
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

        // Only moderators and admins can access teacher comparison
        if (user.role !== "moderator" && user.role !== "admin") {
            return null; // Teachers don't have access to this view
        }

        // Date range defaults to last 30 days if not specified
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const startDate = args.startDate || thirtyDaysAgo;
        const endDate = args.endDate || now;

        // Get school ID for moderator filtering
        const schoolId = user.role === "moderator" ? user.schoolId : null;

        // Fetch classes for the school (or all for admin)
        let classes: Doc<"classes">[];
        if (user.role === "moderator" && schoolId) {
            classes = await ctx.db
                .query("classes")
                .withIndex("by_school_and_date", q =>
                    q.eq("schoolId", schoolId).gte("scheduledDate", startDate)
                )
                .filter(q =>
                    q.and(
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        } else {
            // Admin sees all
            classes = await ctx.db
                .query("classes")
                .withIndex("by_scheduled_date", q => q.gte("scheduledDate", startDate))
                .filter(q =>
                    q.and(
                        q.lte(q.field("scheduledDate"), endDate),
                        q.eq(q.field("status"), "approved")
                    )
                )
                .collect();
        }

        // Group classes by teacher
        const teacherDataMap = new Map<Id<"users">, {
            teacherId: Id<"users">;
            totalClasses: number;
            attendedClasses: number;
            totalDuration: number;
            uniqueStudents: Set<Id<"students">>;
        }>();

        // ✅ OPTIMIZED: Batch fetch post-class notes for attendance tracking
        const classIds = classes.map(c => c._id);
        const notePromises = classIds.map(classId =>
            ctx.db
                .query("postClassNotes")
                .withIndex("by_class", q => q.eq("classId", classId))
                .first()
        );
        const allNotes = await Promise.all(notePromises);
        const notesMap = new Map(
            allNotes
                .map((note, index) => note ? [classIds[index], note] : null)
                .filter(Boolean) as Array<[Id<"classes">, Doc<"postClassNotes">]>
        );

        // Aggregate by teacher
        for (const classItem of classes) {
            const existing = teacherDataMap.get(classItem.teacherId) || {
                teacherId: classItem.teacherId,
                totalClasses: 0,
                attendedClasses: 0,
                totalDuration: 0,
                uniqueStudents: new Set<Id<"students">>(),
            };

            existing.totalClasses += 1;
            existing.uniqueStudents.add(classItem.studentId);

            // Count as attended if has post-class notes
            if (notesMap.has(classItem._id)) {
                existing.attendedClasses += 1;
                existing.totalDuration += (classItem.duration || 60);
            }

            teacherDataMap.set(classItem.teacherId, existing);
        }

        // Fetch teacher details
        const teacherIds = Array.from(teacherDataMap.keys());
        const teachers = await Promise.all(teacherIds.map(id => ctx.db.get(id)));

        // Build comparison array
        const comparison = teachers
            .map((teacher, index) => {
                if (!teacher) return null;

                const data = teacherDataMap.get(teacherIds[index])!;
                const attendanceRate = data.totalClasses > 0
                    ? Math.round((data.attendedClasses / data.totalClasses) * 100)
                    : 0;
                const avgClassCount = data.attendedClasses > 0
                    ? Math.round((data.totalDuration / 60 / data.attendedClasses) * 10) / 10
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
                    teacherId: teacher._id,
                    teacherName: teacher.username,
                    totalClasses: data.totalClasses,
                    attendedClasses: data.attendedClasses,
                    attendanceRate,
                    avgClassCount,
                    uniqueStudentCount: data.uniqueStudents.size,
                    rating,
                };
            })
            .filter(Boolean) as Array<{
                teacherId: Id<"users">;
                teacherName: string;
                totalClasses: number;
                attendedClasses: number;
                attendanceRate: number;
                avgClassCount: number;
                uniqueStudentCount: number;
                rating: "excellent" | "good" | "needs_improvement";
            }>;

        // Sort by total classes descending (most active teachers first)
        comparison.sort((a, b) => b.totalClasses - a.totalClasses);

        return comparison;
    },
});
