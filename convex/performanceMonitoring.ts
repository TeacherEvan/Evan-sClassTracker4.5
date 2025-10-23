/**
 * Performance Monitoring & Investigation Tools
 * 
 * Enhanced queries for admin/moderator investigation with detailed tracking
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get detailed audit logs with performance metrics for investigation
 * Admin/Moderator only
 */
export const getDetailedAuditLogs = query({
    args: {
        userId: v.id("users"), // Admin/Moderator requesting the logs
        filters: v.optional(v.object({
            targetUserId: v.optional(v.id("users")), // Filter by specific user
            action: v.optional(v.string()), // Filter by action type
            targetType: v.optional(v.string()), // Filter by target type
            schoolId: v.optional(v.id("schools")), // Filter by school
            startDate: v.optional(v.number()), // Filter by date range
            endDate: v.optional(v.number()),
            deviceType: v.optional(v.string()), // Filter by device type
            ipAddress: v.optional(v.string()), // Filter by IP
            sessionId: v.optional(v.string()), // Filter by session
        })),
        limit: v.optional(v.number()), // Pagination limit
    },
    handler: async (ctx, args) => {
        // Verify admin or moderator role
        const user = await ctx.db.get(args.userId);
        if (!user || (user.role !== "admin" && user.role !== "moderator")) {
            throw new Error("Unauthorized: Only admins and moderators can access detailed audit logs");
        }

        const limit = args.limit || 100;
        let logs;

        // Use the most specific index available based on filters
        if (args.filters?.targetUserId) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_user", (q) => q.eq("userId", args.filters!.targetUserId!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.action) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_action", (q) => q.eq("action", args.filters!.action!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.targetType) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_target_type", (q) => q.eq("targetType", args.filters!.targetType!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.schoolId) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_school", (q) => q.eq("schoolId", args.filters!.schoolId!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.deviceType) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_device_type", (q) => q.eq("deviceType", args.filters!.deviceType!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.ipAddress) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_ip_address", (q) => q.eq("ipAddress", args.filters!.ipAddress!))
                .order("desc")
                .take(limit);
        } else if (args.filters?.sessionId) {
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_session", (q) => q.eq("sessionId", args.filters!.sessionId!))
                .order("desc")
                .take(limit);
        } else {
            // Default to timestamp ordering
            logs = await ctx.db
                .query("auditLogs")
                .withIndex("by_timestamp")
                .order("desc")
                .take(limit);
        }

        // Apply additional filters (post-query) for date ranges
        if (args.filters?.startDate || args.filters?.endDate) {
            logs = logs.filter((log) => {
                if (args.filters!.startDate && log.timestamp < args.filters!.startDate) return false;
                if (args.filters!.endDate && log.timestamp > args.filters!.endDate) return false;
                return true;
            });
        }

        // Moderators can only see logs from their school
        if (user.role === "moderator" && user.schoolId) {
            logs = logs.filter((log) => log.schoolId === user.schoolId);
        }

        return logs;
    },
});

/**
 * Get performance statistics for investigation
 * Admin only
 */
export const getPerformanceStatistics = query({
    args: {
        adminId: v.id("users"),
        timeRange: v.optional(v.union(
            v.literal("hour"),
            v.literal("day"),
            v.literal("week"),
            v.literal("month")
        )),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Unauthorized: Only admins can access performance statistics");
        }

        // Calculate time range
        const now = Date.now();
        const ranges = {
            hour: 3600000,
            day: 86400000,
            week: 604800000,
            month: 2592000000,
        };
        const startTime = now - (ranges[args.timeRange || "day"]);

        // Get all logs in time range
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_timestamp", q => q.gte("timestamp", startTime))
            .collect();

        // Calculate statistics
        const stats = {
            totalActions: logs.length,
            averageExecutionTime: logs
                .filter(l => l.executionTime)
                .reduce((sum, l) => sum + (l.executionTime || 0), 0) /
                (logs.filter(l => l.executionTime).length || 1),

            slowestActions: logs
                .filter(l => l.executionTime)
                .sort((a, b) => (b.executionTime || 0) - (a.executionTime || 0))
                .slice(0, 10)
                .map(l => ({
                    action: l.action,
                    executionTime: l.executionTime,
                    timestamp: l.timestamp,
                    username: l.username,
                })),

            actionsByType: logs.reduce((acc, log) => {
                acc[log.action] = (acc[log.action] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),

            actionsByUser: logs.reduce((acc, log) => {
                acc[log.username] = (acc[log.username] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),

            actionsByDevice: logs.reduce((acc, log) => {
                const device = log.deviceType || "unknown";
                acc[device] = (acc[device] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),

            actionsByBrowser: logs.reduce((acc, log) => {
                const browser = log.browser || "unknown";
                acc[browser] = (acc[browser] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),

            actionsByOS: logs.reduce((acc, log) => {
                const os = log.os || "unknown";
                acc[os] = (acc[os] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),

            uniqueUsers: new Set(logs.map(l => l.userId)).size,
            uniqueIPs: new Set(logs.map(l => l.ipAddress).filter(Boolean)).size,
            uniqueSessions: new Set(logs.map(l => l.sessionId).filter(Boolean)).size,

            totalDataProcessed: logs.reduce((sum, l) => sum + (l.dataSize || 0), 0),
            totalQueries: logs.reduce((sum, l) => sum + (l.queryCount || 0), 0),
        };

        return stats;
    },
});

/**
 * Get session timeline for user investigation
 * Shows all actions in a session for debugging user behavior
 */
export const getSessionTimeline = query({
    args: {
        adminId: v.id("users"),
        sessionId: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify admin or moderator role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
            throw new Error("Unauthorized: Only admins and moderators can access session timelines");
        }

        // Get all logs for this session
        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_session", q => q.eq("sessionId", args.sessionId))
            .order("asc") // Chronological order
            .collect();

        // Build timeline with breadcrumbs
        const timeline = logs.map((log, index) => ({
            ...log,
            sequenceNumber: index + 1,
            timeFromPrevious: index > 0 ? log.timestamp - logs[index - 1].timestamp : 0,
        }));

        return {
            sessionId: args.sessionId,
            totalActions: logs.length,
            startTime: logs[0]?.timestamp,
            endTime: logs[logs.length - 1]?.timestamp,
            duration: logs.length > 1 ? logs[logs.length - 1].timestamp - logs[0].timestamp : 0,
            user: logs[0] ? { id: logs[0].userId, username: logs[0].username, role: logs[0].userRole } : null,
            device: logs[0] ? {
                type: logs[0].deviceType,
                browser: logs[0].browser,
                browserVersion: logs[0].browserVersion,
                os: logs[0].os,
                osVersion: logs[0].osVersion,
            } : null,
            timeline,
        };
    },
});

/**
 * Get suspicious activity alerts
 * Detects potential security issues or anomalies
 */
export const getSuspiciousActivity = query({
    args: {
        adminId: v.id("users"),
        timeRange: v.optional(v.union(
            v.literal("hour"),
            v.literal("day"),
            v.literal("week")
        )),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Unauthorized: Only admins can access suspicious activity alerts");
        }

        const now = Date.now();
        const ranges = {
            hour: 3600000,
            day: 86400000,
            week: 604800000,
        };
        const startTime = now - (ranges[args.timeRange || "day"]);

        const logs = await ctx.db
            .query("auditLogs")
            .withIndex("by_timestamp", q => q.gte("timestamp", startTime))
            .collect();

        const alerts = [];

        // Detect rapid-fire actions (potential automation/bot)
        const actionsByUser = logs.reduce((acc, log) => {
            if (!acc[log.userId]) acc[log.userId] = [];
            acc[log.userId].push(log);
            return acc;
        }, {} as Record<string, typeof logs>);

        for (const [userId, userLogs] of Object.entries(actionsByUser)) {
            // Check for >50 actions in 1 minute
            const sortedLogs = userLogs.sort((a, b) => a.timestamp - b.timestamp);
            for (let i = 0; i < sortedLogs.length - 50; i++) {
                if (sortedLogs[i + 50].timestamp - sortedLogs[i].timestamp < 60000) {
                    alerts.push({
                        type: "rapid_fire_actions",
                        severity: "high",
                        userId,
                        username: sortedLogs[i].username,
                        message: `${sortedLogs[i].username} performed 50+ actions in under 1 minute`,
                        timestamp: sortedLogs[i].timestamp,
                        details: { actionCount: 50, timeWindow: "60s" },
                    });
                    break;
                }
            }
        }

        // Detect multiple IPs for same user (account sharing or compromise)
        for (const [userId, userLogs] of Object.entries(actionsByUser)) {
            const ips = new Set(userLogs.map(l => l.ipAddress).filter(Boolean));
            if (ips.size > 3) {
                alerts.push({
                    type: "multiple_ips",
                    severity: "medium",
                    userId,
                    username: userLogs[0].username,
                    message: `${userLogs[0].username} accessed from ${ips.size} different IPs`,
                    timestamp: now,
                    details: { ipCount: ips.size, ips: Array.from(ips) },
                });
            }
        }

        // Detect bulk deletions without reason
        const bulkDeletions = logs.filter(l =>
            (l.action.includes("bulk_delete") || l.action.includes("delete")) &&
            !l.reason
        );
        if (bulkDeletions.length > 0) {
            alerts.push({
                type: "bulk_deletion_no_reason",
                severity: "medium",
                userId: bulkDeletions[0].userId,
                username: bulkDeletions[0].username,
                message: `${bulkDeletions.length} deletions performed without reasons`,
                timestamp: now,
                details: { count: bulkDeletions.length },
            });
        }

        // Detect slow queries (performance issue)
        const slowQueries = logs.filter(l => (l.executionTime || 0) > 5000); // >5s
        if (slowQueries.length > 5) {
            alerts.push({
                type: "performance_degradation",
                severity: "low",
                userId: "system",
                username: "System",
                message: `${slowQueries.length} slow queries detected (>5s execution time)`,
                timestamp: now,
                details: {
                    count: slowQueries.length,
                    actions: slowQueries.map(q => ({ action: q.action, time: q.executionTime })),
                },
            });
        }

        return alerts.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            return severityOrder[b.severity as keyof typeof severityOrder] -
                severityOrder[a.severity as keyof typeof severityOrder];
        });
    },
});
