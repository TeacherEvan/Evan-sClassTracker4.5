import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { checkRateLimit, validateLength } from "./rateLimit";

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
        // ✅ SECURITY: Verify user has permission for bulk operations
        const creator = await ctx.db.get(args.createdBy);
        if (!creator) {
            throw new Error("Creator user not found");
        }

        // ✅ SECURITY: Only admins and moderators can bulk create students
        if (creator.role !== "admin" && creator.role !== "moderator") {
            throw new Error("Unauthorized: Only admins and moderators can bulk create students");
        }

        // ✅ SECURITY: Validate batch size to prevent DoS
        if (args.students.length > 100) {
            throw new Error("Maximum 100 students per bulk operation");
        }

        // ✅ SECURITY: Rate limiting
        await checkRateLimit(ctx, {
            key: `bulk-create-students-${args.createdBy}`,
            limit: 5,
            windowMs: 60000, // 5 bulk operations per minute
        });

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
        userId: v.id("users"), // Required: User performing the deletion
        reason: v.string(), // Required: Reason for bulk deletion
        force: v.optional(v.boolean()), // Admin God mode: bypass class checks
        // Optional: Client-side performance tracking
        userAgent: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        timezone: v.optional(v.string()),
        locale: v.optional(v.string()),
        sessionId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Extract and ignore metadata fields (used for audit logging in future)
        const {
            userAgent: _userAgent,
            screenResolution: _screenResolution,
            timezone: _timezone,
            locale: _locale,
            sessionId: _sessionId,
            ...operationArgs
        } = args;

        // Suppress unused variable warnings - these are extracted for future audit logging
        void _userAgent;
        void _screenResolution;
        void _timezone;
        void _locale;
        void _sessionId;

        // ✅ SECURITY: Verify user exists and has appropriate privileges
        const user = await ctx.db.get(operationArgs.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // ✅ SECURITY: Role-based authorization
        // - Admins: Can delete any students (with force option)
        // - Moderators/Teachers: Can delete students from their school only
        // - Guardians: Cannot bulk delete
        if (user.role === "guardian") {
            throw new Error("Unauthorized: Guardians cannot bulk delete students");
        }

        if (user.role !== "admin" && user.role !== "moderator" && user.role !== "teacher") {
            throw new Error("Unauthorized: Insufficient permissions for bulk deletion");
        }

        // ✅ SECURITY: Only admins can use force mode
        if (operationArgs.force && user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can force delete students with classes");
        }

        // ✅ SECURITY: Validate batch size to prevent DoS
        if (operationArgs.studentIds.length > 100) {
            throw new Error("Maximum 100 students per bulk deletion");
        }

        // ✅ SECURITY: Validate reason (minimum 3 characters)
        validateLength(operationArgs.reason, "Deletion reason", 500, 3);

        // ✅ SECURITY: Rate limiting
        await checkRateLimit(ctx, {
            key: `bulk-delete-students-${operationArgs.userId}`,
            limit: 5, // Reduced from 10 to 5
            windowMs: 60000, // 5 operations per minute
        });

        const results = [];
        const errors = [];

        for (let i = 0; i < operationArgs.studentIds.length; i++) {
            const studentId = operationArgs.studentIds[i];
            try {
                // Check if student exists
                const student = await ctx.db.get(studentId);
                if (!student) {
                    errors.push({
                        index: i,
                        studentId,
                        studentName: "Unknown",
                        error: "Student not found",
                    });
                    continue;
                }

                // ✅ SECURITY: School-based access control for non-admins
                if (user.role !== "admin") {
                    if (student.schoolId !== user.schoolId) {
                        errors.push({
                            index: i,
                            studentId,
                            studentName: `${student.firstName} ${student.lastName}`,
                            error: "Cannot delete students from other schools",
                        });
                        continue;
                    }
                }

                // Check if student has associated classes (unless force=true for admin God mode)
                if (!operationArgs.force) {
                    const classes = await ctx.db
                        .query("classes")
                        .withIndex("by_student", (q) => q.eq("studentId", studentId))
                        .collect();

                    const classCount = classes.length;

                    if (classCount > 0) {
                        // Count active/pending classes
                        const activeClasses = classes.filter(
                            (c) => c.status === "pending" || c.status === "acknowledged" || c.status === "approved"
                        );

                        errors.push({
                            index: i,
                            studentId,
                            studentName: `${student.firstName} ${student.lastName}`,
                            error: `Has ${classCount} class${classCount > 1 ? 'es' : ''} (${activeClasses.length} active). Please cancel classes first or use force option (admin only).`,
                            classCount,
                            activeClassCount: activeClasses.length,
                        });
                        continue;
                    }
                }

                // Safe to delete
                await ctx.db.delete(studentId);
                results.push({
                    index: i,
                    studentId,
                    studentName: `${student.firstName} ${student.lastName}`,
                    success: true
                });
            } catch (error) {
                errors.push({
                    index: i,
                    studentId,
                    studentName: "Unknown",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return {
            total: operationArgs.studentIds.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors,
            message: `Deleted ${results.length} of ${operationArgs.studentIds.length} students. ${errors.length} failed.`,
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
