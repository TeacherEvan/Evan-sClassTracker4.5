import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimit";

/**
 * Error Reporting System
 * 
 * Allows users to report errors they encounter to admins for investigation.
 * Captures detailed context including stack traces, user actions, and environment info.
 */

/**
 * Submit an error report from the frontend
 * 
 * Can be called by any user (or anonymous users for login errors)
 * Automatically captures browser/device information
 */
export const submitErrorReport = mutation({
    args: {
        userId: v.optional(v.id("users")),
        errorType: v.string(),
        errorMessage: v.string(),
        errorCode: v.optional(v.string()),
        errorOrigin: v.string(), // Component or file name
        errorFunction: v.optional(v.string()), // Function or mutation name
        stackTrace: v.optional(v.string()),
        userAction: v.optional(v.string()), // What the user was trying to do
        componentState: v.optional(v.string()), // JSON string of relevant state
        deviceType: v.optional(v.string()),
        browser: v.optional(v.string()),
        browserVersion: v.optional(v.string()),
        os: v.optional(v.string()),
        screenResolution: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // ✅ RATE LIMIT: Prevent error report spam (5 per minute - very soft limit)
        // Use userId if provided, otherwise use a global key for anonymous reports
        const rateLimitKey = args.userId
            ? `submit-error:${args.userId}`
            : `submit-error:anonymous`;

        await checkRateLimit(ctx, {
            key: rateLimitKey,
            limit: 5,
            windowMs: 60000,
        });

        // Get user details if userId provided
        let username: string | undefined;
        let userRole: string | undefined;
        let schoolId: Id<"schools"> | undefined;

        if (args.userId) {
            const user = await ctx.db.get(args.userId);
            if (user) {
                username = user.username;
                userRole = user.role;
                schoolId = user.schoolId;
            }
        }

        // Auto-classify severity based on error type
        let severity: "low" | "medium" | "high" | "critical" = "medium";
        if (args.errorType.includes("critical") || args.errorType.includes("crash")) {
            severity = "critical";
        } else if (args.errorType.includes("network") || args.errorType.includes("timeout")) {
            severity = "high";
        } else if (args.errorType.includes("validation") || args.errorType.includes("ui")) {
            severity = "low";
        }

        // Truncate stack trace if too long (max 5000 chars)
        const stackTrace = args.stackTrace
            ? args.stackTrace.substring(0, 5000)
            : undefined;

        // Insert error report
        const errorReportId = await ctx.db.insert("errorReports", {
            userId: args.userId,
            username,
            userRole,
            schoolId,
            errorType: args.errorType,
            errorMessage: args.errorMessage,
            errorCode: args.errorCode,
            errorOrigin: args.errorOrigin,
            errorFunction: args.errorFunction,
            stackTrace,
            userAction: args.userAction,
            componentState: args.componentState,
            timestamp: Date.now(),
            deviceType: args.deviceType,
            browser: args.browser,
            browserVersion: args.browserVersion,
            os: args.os,
            screenResolution: args.screenResolution,
            userAgent: args.userAgent,
            status: "new",
            severity,
        });

        return errorReportId;
    },
});

/**
 * Get all error reports (admin only)
 * Supports filtering and pagination
 */
export const listErrorReports = query({
    args: {
        adminId: v.id("users"),
        status: v.optional(v.union(
            v.literal("new"),
            v.literal("acknowledged"),
            v.literal("resolved"),
            v.literal("closed")
        )),
        severity: v.optional(v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
        )),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required");
        }

        // Get error reports based on filters (newest first)
        let errorReports;

        if (args.status) {
            errorReports = await ctx.db
                .query("errorReports")
                .withIndex("by_status", q => q.eq("status", args.status!))
                .order("desc")
                .take(args.limit || 100);
        } else if (args.severity) {
            errorReports = await ctx.db
                .query("errorReports")
                .withIndex("by_severity", q => q.eq("severity", args.severity!))
                .order("desc")
                .take(args.limit || 100);
        } else {
            errorReports = await ctx.db
                .query("errorReports")
                .withIndex("by_timestamp")
                .order("desc")
                .take(args.limit || 100);
        }

        return errorReports;
    },
});

/**
 * Get error report statistics (admin only)
 */
export const getErrorStats = query({
    args: {
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required");
        }

        // Get all error reports
        const allErrors = await ctx.db.query("errorReports").collect();

        // Calculate statistics
        const stats = {
            total: allErrors.length,
            new: allErrors.filter(e => e.status === "new").length,
            acknowledged: allErrors.filter(e => e.status === "acknowledged").length,
            resolved: allErrors.filter(e => e.status === "resolved").length,
            closed: allErrors.filter(e => e.status === "closed").length,
            critical: allErrors.filter(e => e.severity === "critical").length,
            high: allErrors.filter(e => e.severity === "high").length,
            medium: allErrors.filter(e => e.severity === "medium").length,
            low: allErrors.filter(e => e.severity === "low").length,
            last24Hours: allErrors.filter(e => e.timestamp > Date.now() - 86400000).length,
            topErrorTypes: Object.entries(
                allErrors.reduce((acc, e) => {
                    acc[e.errorType] = (acc[e.errorType] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => ({ type, count })),
        };

        return stats;
    },
});

/**
 * Update error report status (admin only)
 */
export const updateErrorStatus = mutation({
    args: {
        errorReportId: v.id("errorReports"),
        adminId: v.id("users"),
        status: v.union(
            v.literal("new"),
            v.literal("acknowledged"),
            v.literal("resolved"),
            v.literal("closed")
        ),
        adminNotes: v.optional(v.string()),
        severity: v.optional(v.union(
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("critical")
        )),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required");
        }

        // Get existing error report
        const errorReport = await ctx.db.get(args.errorReportId);
        if (!errorReport) {
            throw new Error("Error report not found");
        }

        // Update error report
        const updates: Partial<{
            status: "new" | "acknowledged" | "resolved" | "closed";
            adminNotes: string;
            severity: "low" | "medium" | "high" | "critical";
            resolvedBy: Id<"users">;
            resolvedAt: number;
        }> = {
            status: args.status,
        };

        if (args.adminNotes) {
            updates.adminNotes = args.adminNotes;
        }

        if (args.severity) {
            updates.severity = args.severity;
        }

        // If resolving, set resolvedBy and resolvedAt
        if (args.status === "resolved" || args.status === "closed") {
            updates.resolvedBy = args.adminId;
            updates.resolvedAt = Date.now();
        }

        await ctx.db.patch(args.errorReportId, updates);

        return { success: true };
    },
});

/**
 * Get single error report details (admin only)
 */
export const getErrorReport = query({
    args: {
        errorReportId: v.id("errorReports"),
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify admin role
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required");
        }

        const errorReport = await ctx.db.get(args.errorReportId);
        if (!errorReport) {
            throw new Error("Error report not found");
        }

        // Get resolver info if resolved
        let resolverName: string | undefined;
        if (errorReport.resolvedBy) {
            const resolver = await ctx.db.get(errorReport.resolvedBy);
            resolverName = resolver?.username;
        }

        return {
            ...errorReport,
            resolverName,
        };
    },
});
