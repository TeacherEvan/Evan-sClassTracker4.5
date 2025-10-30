import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Audit Logging System
 * 
 * Tracks all administrative actions for compliance and accountability.
 * Logs include: user management, deletions, bulk operations, configuration changes.
 */

// ============================================================================
// MUTATION: Log an action
// ============================================================================

export const logAction = mutation({
    args: {
        userId: v.id("users"),
        action: v.string(), // e.g., "delete_class", "update_user", "bulk_delete"
        targetType: v.string(), // e.g., "classes", "users", "schools"
        targetId: v.optional(v.string()),
        targetName: v.optional(v.string()),
        details: v.optional(v.string()), // JSON string with additional info
        reason: v.optional(v.string()),
        affectedCount: v.optional(v.number()),
        schoolId: v.optional(v.id("schools")),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Get user info for caching
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Create audit log entry
        await ctx.db.insert("auditLogs", {
            userId: args.userId,
            username: user.username,
            userRole: user.role,
            action: args.action,
            targetType: args.targetType,
            targetId: args.targetId,
            targetName: args.targetName,
            details: args.details,
            reason: args.reason,
            affectedCount: args.affectedCount,
            schoolId: args.schoolId,
            timestamp: Date.now(),
            ipAddress: args.ipAddress,
            userAgent: args.userAgent,
        });
    },
});

// ============================================================================
// QUERY: Get all audit logs (admin only, with filters)
// ============================================================================

export const list = query({
    args: {
        userId: v.id("users"), // Admin user requesting logs
        filters: v.optional(v.object({
            action: v.optional(v.string()),
            targetType: v.optional(v.string()),
            performedBy: v.optional(v.id("users")),
            schoolId: v.optional(v.id("schools")),
            startDate: v.optional(v.number()),
            endDate: v.optional(v.number()),
        })),
        limit: v.optional(v.number()), // Default 100
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.userId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required to view audit logs");
        }

        // Apply filters with proper index usage
        let logs;
        if (args.filters?.performedBy) {
            logs = await ctx.db.query("auditLogs")
                .withIndex("by_user", q => q.eq("userId", args.filters!.performedBy!))
                .order("desc")
                .take(args.limit || 100);
        } else if (args.filters?.action) {
            logs = await ctx.db.query("auditLogs")
                .withIndex("by_action", q => q.eq("action", args.filters!.action!))
                .order("desc")
                .take(args.limit || 100);
        } else if (args.filters?.targetType) {
            logs = await ctx.db.query("auditLogs")
                .withIndex("by_target_type", q => q.eq("targetType", args.filters!.targetType!))
                .order("desc")
                .take(args.limit || 100);
        } else if (args.filters?.schoolId) {
            logs = await ctx.db.query("auditLogs")
                .withIndex("by_school", q => q.eq("schoolId", args.filters!.schoolId!))
                .order("desc")
                .take(args.limit || 100);
        } else {
            // Default: sort by timestamp descending
            logs = await ctx.db.query("auditLogs")
                .withIndex("by_timestamp")
                .order("desc")
                .take(args.limit || 100);
        }

        // Apply additional filters in memory (for complex queries)
        if (args.filters?.startDate) {
            logs = logs.filter(log => log.timestamp >= args.filters!.startDate!);
        }
        if (args.filters?.endDate) {
            logs = logs.filter(log => log.timestamp <= args.filters!.endDate!);
        }

        return logs;
    },
});

// ============================================================================
// QUERY: Get audit logs for specific target
// ============================================================================

export const getForTarget = query({
    args: {
        userId: v.id("users"), // Admin user requesting logs
        targetType: v.string(),
        targetId: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.userId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required to view audit logs");
        }

        // Get all logs for this target
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_target_type", q => q.eq("targetType", args.targetType))
            .filter(q => q.eq(q.field("targetId"), args.targetId))
            .order("desc")
            .collect();

        return logs;
    },
});

// ============================================================================
// QUERY: Get audit log statistics
// ============================================================================

export const getStatistics = query({
    args: {
        userId: v.id("users"), // Admin user requesting stats
        days: v.optional(v.number()), // Last N days (default 30)
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.userId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required to view statistics");
        }

        const days = args.days || 30;
        const startDate = Date.now() - (days * 24 * 60 * 60 * 1000);

        // Get logs from last N days
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_timestamp")
            .filter(q => q.gte(q.field("timestamp"), startDate))
            .collect();

        // Calculate statistics
        const actionCounts: Record<string, number> = {};
        const userCounts: Record<string, number> = {};
        const targetTypeCounts: Record<string, number> = {};
        let totalAffected = 0;

        for (const log of logs) {
            // Count by action type
            actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;

            // Count by user
            userCounts[log.username] = (userCounts[log.username] || 0) + 1;

            // Count by target type
            targetTypeCounts[log.targetType] = (targetTypeCounts[log.targetType] || 0) + 1;

            // Sum affected items
            if (log.affectedCount) {
                totalAffected += log.affectedCount;
            }
        }

        return {
            period: days,
            totalActions: logs.length,
            totalAffected,
            actionBreakdown: actionCounts,
            userBreakdown: userCounts,
            targetTypeBreakdown: targetTypeCounts,
            mostActiveUser: Object.entries(userCounts).sort((a, b) => b[1] - a[1])[0],
            mostCommonAction: Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0],
        };
    },
});

// ============================================================================
// QUERY: Export audit logs (for compliance reports)
// ============================================================================

export const exportLogs = query({
    args: {
        userId: v.id("users"),
        startDate: v.number(),
        endDate: v.number(),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.userId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required to export audit logs");
        }

        // Get all logs in date range
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_timestamp")
            .filter(q =>
                q.and(
                    q.gte(q.field("timestamp"), args.startDate),
                    q.lte(q.field("timestamp"), args.endDate)
                )
            )
            .order("desc")
            .collect();

        return logs;
    },
});

// ============================================================================
// MUTATION: Clean old audit logs (data retention)
// ============================================================================

export const cleanOldLogs = mutation({
    args: {
        userId: v.id("users"),
        daysToKeep: v.number(), // Delete logs older than N days
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.userId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required to clean audit logs");
        }

        const cutoffDate = Date.now() - (args.daysToKeep * 24 * 60 * 60 * 1000);

        // Find old logs
        const oldLogs = await ctx.db
            .query("auditLogs")
            .withIndex("by_timestamp")
            .filter(q => q.lt(q.field("timestamp"), cutoffDate))
            .collect();

        // Delete old logs
        for (const log of oldLogs) {
            await ctx.db.delete(log._id);
        }

        // Log this cleanup action
        await ctx.db.insert("auditLogs", {
            userId: args.userId,
            username: admin.username,
            userRole: admin.role,
            action: "clean_audit_logs",
            targetType: "auditLogs",
            details: JSON.stringify({
                cutoffDate: new Date(cutoffDate).toISOString(),
                daysKept: args.daysToKeep,
            }),
            affectedCount: oldLogs.length,
            timestamp: Date.now(),
        });

        return {
            deletedCount: oldLogs.length,
            cutoffDate,
        };
    },
});

// ============================================================================
// QUERY: Get all deleted students (CRITICAL for investigation)
// ============================================================================

export const getDeletedStudents = query({
    args: {
        userId: v.id("users"), // Admin or moderator requesting investigation data
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify admin or moderator role
        const user = await ctx.db.get(args.userId);
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            throw new Error("Admin or moderator access required to view deleted students");
        }

        // Get all student deletion audit logs
        let deletionLogs = await ctx.db
            .query("auditLogs")
            .withIndex("by_action", q => q.eq("action", "delete_student"))
            .order("desc")
            .take(args.limit || 100);

        // For moderators, filter to their school only
        if (user.role === "moderator" && user.schoolId) {
            deletionLogs = deletionLogs.filter(log => log.schoolId === user.schoolId);
        }

        // Parse details for each log
        const enrichedLogs = deletionLogs.map(log => {
            const details = log.details ? JSON.parse(log.details) : {};
            return {
                ...log,
                parsedDetails: details,
                studentName: log.targetName,
                studentId: details.studentId,
                deletedBy: log.username,
                deletedAt: log.timestamp,
                reason: log.reason,
                affectedClasses: details.affectedClasses || 0,
                affectedClassIds: details.affectedClassIds || [],
            };
        });

        return enrichedLogs;
    },
});

// ============================================================================
// QUERY: Get orphaned classes (classes referencing deleted students)
// ============================================================================

export const getOrphanedClasses = query({
    args: {
        userId: v.id("users"), // Admin or moderator requesting investigation data
    },
    handler: async (ctx, args) => {
        // Verify admin or moderator role
        const user = await ctx.db.get(args.userId);
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            throw new Error("Admin or moderator access required to view orphaned classes");
        }

        // Get all classes
        let classes = await ctx.db.query("classes").collect();

        // For moderators, filter to their school only
        if (user.role === "moderator" && user.schoolId) {
            classes = classes.filter(c => c.schoolId === user.schoolId);
        }

        // Check which classes have deleted students
        const orphanedClasses = [];
        for (const classItem of classes) {
            const student = await ctx.db.get(classItem.studentId);
            if (!student) {
                // Student has been deleted - this is an orphaned class

                // Try to find deletion audit log for this student
                const deletionLog = await ctx.db
                    .query("auditLogs")
                    .withIndex("by_action", q => q.eq("action", "delete_student"))
                    .filter(q => q.eq(q.field("targetId"), classItem.studentId))
                    .first();

                orphanedClasses.push({
                    classId: classItem._id,
                    scheduledDate: classItem.scheduledDate,
                    status: classItem.status,
                    teacherId: classItem.teacherId,
                    schoolId: classItem.schoolId,
                    duration: classItem.duration,
                    studentCount: classItem.additionalStudentIds ? classItem.additionalStudentIds.length + 1 : 1,
                    deletedStudentId: classItem.studentId,
                    deletionInfo: deletionLog ? {
                        deletedBy: deletionLog.username,
                        deletedAt: deletionLog.timestamp,
                        reason: deletionLog.reason,
                        studentName: deletionLog.targetName,
                    } : null,
                });
            }
        }

        return orphanedClasses;
    },
});

