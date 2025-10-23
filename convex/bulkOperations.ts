import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper function to generate unique student ID
function generateStudentId(firstName: string, lastName: string, schoolId: string): string {
    const timestamp = Date.now().toString(36);
    const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
    const schoolHash = schoolId.substring(0, 4).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}

// Bulk create students from array
export const bulkCreateStudents = mutation({
    args: {
        students: v.array(
            v.object({
                firstName: v.string(),
                lastName: v.string(),
                schoolId: v.optional(v.id("schools")),
                guardianId: v.optional(v.id("users")),
                guardianTitle: v.optional(v.string()),
                grade: v.string(),
                guardianName: v.optional(v.string()),
                guardianPhone: v.optional(v.string()),
                guardianEmail: v.optional(v.string()),
            })
        ),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        const results = [];
        const errors = [];

        for (let i = 0; i < args.students.length; i++) {
            const student = args.students[i];
            try {
                // Validate required fields
                if (!student.firstName.trim() || !student.lastName.trim()) {
                    throw new Error("First name and last name are required");
                }

                // Generate unique student ID
                const schoolIdForHash = student.schoolId || "GUARDIAN";
                let studentId = generateStudentId(student.firstName, student.lastName, schoolIdForHash);

                // Check for duplicates and regenerate if necessary
                let attempts = 0;
                const maxAttempts = 10;

                while (attempts < maxAttempts) {
                    const existing = await ctx.db
                        .query("students")
                        .withIndex("by_student_id", (q) => q.eq("studentId", studentId))
                        .first();

                    if (!existing) {
                        break;
                    }

                    studentId = generateStudentId(student.firstName, student.lastName, schoolIdForHash);
                    attempts++;
                }

                if (attempts === maxAttempts) {
                    throw new Error("Failed to generate unique student ID");
                }

                const id = await ctx.db.insert("students", {
                    firstName: student.firstName,
                    lastName: student.lastName,
                    studentId,
                    schoolId: student.schoolId,
                    guardianId: student.guardianId,
                    guardianTitle: student.guardianTitle,
                    grade: student.grade,
                    guardianName: student.guardianName,
                    guardianPhone: student.guardianPhone,
                    guardianEmail: student.guardianEmail,
                    acknowledged: student.guardianId ? false : true,
                    createdBy: args.createdBy,
                    createdAt: Date.now(),
                });

                results.push({ index: i, id, studentId, success: true });
            } catch (error) {
                errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : "Unknown error",
                    student: student,
                });
            }
        }

        return {
            total: args.students.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
        };
    },
});

// Bulk create users
export const bulkCreateUsers = mutation({
    args: {
        users: v.array(
            v.object({
                username: v.string(),
                role: v.union(
                    v.literal("teacher"),
                    v.literal("moderator"),
                    v.literal("admin")
                ),
                schoolId: v.optional(v.id("schools")),
            })
        ),
    },
    handler: async (ctx, args) => {
        const results = [];
        const errors = [];

        for (let i = 0; i < args.users.length; i++) {
            const user = args.users[i];
            try {
                // Validate username
                if (!user.username.trim()) {
                    throw new Error("Username is required");
                }

                // Check if user already exists
                const existing = await ctx.db
                    .query("users")
                    .withIndex("by_username", (q) => q.eq("username", user.username))
                    .first();

                if (existing) {
                    throw new Error(`User ${user.username} already exists`);
                }

                // Generate default password
                const defaultPassword = `Teacher${user.username}`;
                const passwordHash = btoa(defaultPassword);

                const id = await ctx.db.insert("users", {
                    username: user.username,
                    passwordHash,
                    role: user.role,
                    schoolId: user.schoolId,
                    requirePasswordChange: true,
                    createdAt: Date.now(),
                });

                results.push({
                    index: i,
                    id,
                    username: user.username,
                    defaultPassword,
                    success: true,
                });
            } catch (error) {
                errors.push({
                    index: i,
                    error: error instanceof Error ? error.message : "Unknown error",
                    user: user,
                });
            }
        }

        return {
            total: args.users.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
        };
    },
});

// Bulk delete students
export const bulkDeleteStudents = mutation({
    args: {
        studentIds: v.array(v.id("students")),
        userId: v.optional(v.id("users")), // User performing the deletion (for rate limiting)
    },
    handler: async (ctx, args) => {
        // Rate limiting if userId provided
        if (args.userId) {
            const { checkRateLimit } = await import("./rateLimit");
            await checkRateLimit(ctx, {
                key: `bulk-delete-students-${args.userId}`,
                limit: 10,
                windowMs: 60000, // 10 operations per minute
            });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < args.studentIds.length; i++) {
            const studentId = args.studentIds[i];
            try {
                // Check if student exists
                const student = await ctx.db.get(studentId);
                if (!student) {
                    throw new Error("Student not found");
                }

                // Check if student has associated classes
                const classes = await ctx.db
                    .query("classes")
                    .withIndex("by_student", (q) => q.eq("studentId", studentId))
                    .first();

                if (classes) {
                    throw new Error("Cannot delete student with associated classes");
                }

                await ctx.db.delete(studentId);
                results.push({ index: i, studentId, success: true });
            } catch (error) {
                errors.push({
                    index: i,
                    studentId,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return {
            total: args.studentIds.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
        };
    },
});

// Bulk update class status
export const bulkUpdateClassStatus = mutation({
    args: {
        classIds: v.array(v.id("classes")),
        status: v.union(
            v.literal("pending"),
            v.literal("acknowledged"),
            v.literal("approved"),
            v.literal("rejected")
        ),
    },
    handler: async (ctx, args) => {
        const results = [];
        const errors = [];

        for (let i = 0; i < args.classIds.length; i++) {
            const classId = args.classIds[i];
            try {
                const cls = await ctx.db.get(classId);
                if (!cls) {
                    throw new Error("Class not found");
                }

                await ctx.db.patch(classId, { status: args.status });
                results.push({ index: i, classId, success: true });
            } catch (error) {
                errors.push({
                    index: i,
                    classId,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return {
            total: args.classIds.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
        };
    },
});
