import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

/**
 * Calculate teacher's total weighted class count
 * 
 * Formula: For each approved class:
 *   studentCount × (duration / 60) = class count
 * 
 * Examples:
 *   - 1 student + 60min = 1 class
 *   - 6 students + 90min = 6 × 1.5 = 9 classes
 *   - 2 students + 120min = 2 × 2 = 4 classes
 * 
 * Updates reactively when classes are approved
 */
export const getTeacherClassCount = query({
    args: {
        teacherId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Use indexed query for performance
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .filter((q) => q.eq(q.field("status"), "approved")) // Only count approved classes
            .collect();

        // Calculate weighted class count
        let totalClassCount = 0;

        for (const classItem of classes) {
            // Student count: primary student + additional students
            const studentCount = 1 + (classItem.additionalStudentIds?.length || 0);

            // Duration in minutes (default 60 if not specified)
            const durationMinutes = classItem.duration || 60;

            // Weighted calculation: students × (duration / 60)
            const classCount = studentCount * (durationMinutes / 60);

            totalClassCount += classCount;
        }

        // Round to 1 decimal place for display
        const roundedTotal = Math.round(totalClassCount * 10) / 10;

        return {
            total: roundedTotal,
            rawTotal: totalClassCount,
            approvedClassesCount: classes.length,
        };
    },
});

/**
 * Get teacher's class count with date range filter (Moderator-only)
 * Includes detailed breakdown by student
 */
export const getTeacherClassCountDetailed = query({
    args: {
        teacherId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
        moderatorId: v.id("users"), // For authorization
    },
    handler: async (ctx, args) => {
        // Verify moderator authorization
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
            throw new Error("Unauthorized: Only moderators and admins can view detailed class counts");
        }

        // Get teacher details
        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // For moderators, verify they're viewing their school's teacher
        if (moderator.role === "moderator") {
            const teacherClasses = await ctx.db
                .query("classes")
                .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
                .first();

            if (teacherClasses && teacherClasses.schoolId !== moderator.schoolId) {
                throw new Error("Unauthorized: Moderators can only view teachers from their assigned school");
            }
        }

        // Get classes in date range
        const classes = await ctx.db
            .query("classes")
            .withIndex("by_teacher_and_date", (q) =>
                q.eq("teacherId", args.teacherId)
                    .gte("scheduledDate", args.startDate)
                    .lte("scheduledDate", args.endDate)
            )
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        // Batch fetch all students to avoid N+1
        const studentIds = new Set<string>();
        classes.forEach(cls => {
            studentIds.add(cls.studentId);
            cls.additionalStudentIds?.forEach(id => studentIds.add(id));
        });

        const students = await Promise.all(
            Array.from(studentIds).map(id => ctx.db.get(id as Id<"students">))
        );
        const studentMap = new Map(
            students.filter(s => s !== null).map(s => [s!._id, s])
        );

        // Group classes by student and calculate counts
        const studentBreakdown: Record<Id<"students">, {
            studentId: Id<"students">;
            studentName: string;
            studentNameTh: string;
            classCount: number;
            numberOfClasses: number;
            classes: Array<{
                classId: Id<"classes">;
                scheduledDate: number;
                duration: number;
                studentCount: number;
                contributedCount: number;
                location?: string;
                locationTh?: string;
            }>;
        }> = {};

        for (const classItem of classes) {
            const studentCount = 1 + (classItem.additionalStudentIds?.length || 0);
            const durationMinutes = classItem.duration || 60;

            // Process primary student
            const processStudent = (studentId: Id<"students">) => {
                const student = studentMap.get(studentId);
                if (!student) return;

                if (!studentBreakdown[studentId]) {
                    studentBreakdown[studentId] = {
                        studentId,
                        studentName: `${student.firstName} ${student.lastName}`,
                        studentNameTh: `${student.firstName} ${student.lastName}`, // Schema doesn't have Thai name fields
                        classCount: 0,
                        numberOfClasses: 0,
                        classes: [],
                    };
                }

                const perStudentCount = (durationMinutes / 60);
                studentBreakdown[studentId].classCount += perStudentCount;
                studentBreakdown[studentId].numberOfClasses++;
                studentBreakdown[studentId].classes.push({
                    classId: classItem._id,
                    scheduledDate: classItem.scheduledDate,
                    duration: durationMinutes,
                    studentCount,
                    contributedCount: perStudentCount,
                    location: classItem.pendingLocationName,
                    locationTh: classItem.pendingLocationNameTh,
                });
            };

            processStudent(classItem.studentId);
            classItem.additionalStudentIds?.forEach(id => processStudent(id));
        }

        // Convert to sorted array
        const breakdown = Object.values(studentBreakdown)
            .sort((a, b) => b.classCount - a.classCount)
            .map(item => ({
                ...item,
                classCount: Math.round(item.classCount * 10) / 10,
            }));

        const totalClassCount = breakdown.reduce((sum, item) => sum + item.classCount, 0);

        return {
            teacher: {
                id: teacher._id,
                username: teacher.username,
                role: teacher.role,
            },
            dateRange: {
                start: args.startDate,
                end: args.endDate,
            },
            summary: {
                totalClassCount: Math.round(totalClassCount * 10) / 10,
                totalApprovedClasses: classes.length,
                totalStudents: breakdown.length,
            },
            studentBreakdown: breakdown,
        };
    },
});

/**
 * Log when a moderator views/exports a teacher's class count
 * Creates transparency notification for the teacher
 */
export const logClassCountView = mutation({
    args: {
        teacherId: v.id("users"),
        moderatorId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
        action: v.union(v.literal("viewed"), v.literal("exported")),
    },
    handler: async (ctx, args) => {
        // Verify moderator authorization
        const moderator = await ctx.db.get(args.moderatorId);
        if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
            throw new Error("Unauthorized: Only moderators and admins can log class count views");
        }

        const teacher = await ctx.db.get(args.teacherId);
        if (!teacher) {
            throw new Error("Teacher not found");
        }

        // Create notification for teacher (transparency)
        const startDateStr = new Date(args.startDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStr = new Date(args.endDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const startDateStrTh = new Date(args.startDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
        const endDateStrTh = new Date(args.endDate).toLocaleDateString('th-TH', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const actionText = args.action === "viewed" ? "viewed" : "exported";
        const actionTextTh = args.action === "viewed" ? "ดู" : "ส่งออก";

        await ctx.db.insert("notifications", {
            userId: args.teacherId,
            title: `Class Count ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
            titleTh: `การ${actionTextTh}จำนวนชั้นเรียน`,
            message: `${moderator.username} ${actionText} your class count for ${startDateStr} - ${endDateStr}`,
            messageTh: `${moderator.username} ${actionTextTh}จำนวนชั้นเรียนของคุณสำหรับ ${startDateStrTh} - ${endDateStrTh}`,
            type: "info",
            read: false,
            createdAt: Date.now(),
        });

        // Log the action
        await ctx.db.insert("classCountAuditLogs", {
            teacherId: args.teacherId,
            moderatorId: args.moderatorId,
            moderatorUsername: moderator.username,
            startDate: args.startDate,
            endDate: args.endDate,
            action: args.action,
            timestamp: Date.now(),
        });

        return { success: true };
    },
});
