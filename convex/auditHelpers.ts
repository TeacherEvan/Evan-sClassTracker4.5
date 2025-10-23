/**
 * Audit Logging Helper Utilities
 * 
 * Simplifies adding audit logs throughout the application with enhanced tracking.
 * Import and use these helpers in mutations that need audit trails.
 */

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Enhanced device and browser detection from user agent
 */
function parseUserAgent(userAgent: string) {
    const ua = userAgent.toLowerCase();

    // Detect device type
    let deviceType = "desktop";
    if (ua.includes("mobile")) deviceType = "mobile";
    else if (ua.includes("tablet") || ua.includes("ipad")) deviceType = "tablet";

    // Detect OS and version
    let os = "Unknown";
    let osVersion = "";
    if (ua.includes("windows nt 10")) { os = "Windows"; osVersion = "10/11"; }
    else if (ua.includes("windows nt 6.3")) { os = "Windows"; osVersion = "8.1"; }
    else if (ua.includes("windows nt 6.2")) { os = "Windows"; osVersion = "8"; }
    else if (ua.includes("windows nt 6.1")) { os = "Windows"; osVersion = "7"; }
    else if (ua.includes("mac os x")) {
        os = "macOS";
        const match = ua.match(/mac os x (\d+[._]\d+)/);
        osVersion = match ? match[1].replace("_", ".") : "";
    } else if (ua.includes("iphone") || ua.includes("ipad")) {
        os = "iOS";
        const match = ua.match(/os (\d+[._]\d+)/);
        osVersion = match ? match[1].replace("_", ".") : "";
    } else if (ua.includes("android")) {
        os = "Android";
        const match = ua.match(/android (\d+(\.\d+)?)/);
        osVersion = match ? match[1] : "";
    } else if (ua.includes("linux")) {
        os = "Linux";
    }

    // Detect browser and version
    let browser = "Unknown";
    let browserVersion = "";
    if (ua.includes("edg/")) {
        browser = "Edge";
        const match = ua.match(/edg\/(\d+(\.\d+)?)/);
        browserVersion = match ? match[1] : "";
    } else if (ua.includes("chrome/")) {
        browser = "Chrome";
        const match = ua.match(/chrome\/(\d+(\.\d+)?)/);
        browserVersion = match ? match[1] : "";
    } else if (ua.includes("safari/") && !ua.includes("chrome")) {
        browser = "Safari";
        const match = ua.match(/version\/(\d+(\.\d+)?)/);
        browserVersion = match ? match[1] : "";
    } else if (ua.includes("firefox/")) {
        browser = "Firefox";
        const match = ua.match(/firefox\/(\d+(\.\d+)?)/);
        browserVersion = match ? match[1] : "";
    }

    return { deviceType, os, osVersion, browser, browserVersion };
}

/**
 * Enhanced audit log helper with performance and hardware tracking
 */
export async function logAudit(
    ctx: MutationCtx,
    params: {
        userId: Id<"users">;
        action: string;
        targetType: string;
        targetId?: string;
        targetName?: string;
        reason?: string;
        affectedCount?: number;
        schoolId?: Id<"schools">;
        details?: Record<string, unknown>;

        // ✨ ENHANCED: Optional tracking metadata
        userAgent?: string;
        ipAddress?: string;
        screenResolution?: string;
        timezone?: string;
        locale?: string;
        executionTime?: number;
        queryCount?: number;
        dataSize?: number;
        sessionId?: string;
        previousAction?: string;
        referrer?: string;
    }
) {
    // Get user info
    const user = await ctx.db.get(params.userId);
    if (!user) {
        console.warn("Audit log: User not found", params.userId);
        return;
    }

    // Parse user agent if provided
    const deviceInfo = params.userAgent ? parseUserAgent(params.userAgent) : {
        deviceType: undefined,
        os: undefined,
        osVersion: undefined,
        browser: undefined,
        browserVersion: undefined,
    };

    // Insert enhanced audit log
    await ctx.db.insert("auditLogs", {
        // Core audit fields
        userId: params.userId,
        username: user.username,
        userRole: user.role,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        targetName: params.targetName,
        reason: params.reason,
        affectedCount: params.affectedCount,
        schoolId: params.schoolId,
        details: params.details ? JSON.stringify(params.details) : undefined,
        timestamp: Date.now(),

        // ✨ ENHANCED: Hardware & Environment
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        browserVersion: deviceInfo.browserVersion,
        os: deviceInfo.os,
        osVersion: deviceInfo.osVersion,
        screenResolution: params.screenResolution,
        timezone: params.timezone,
        locale: params.locale,

        // ✨ ENHANCED: Performance Metrics
        executionTime: params.executionTime,
        queryCount: params.queryCount,
        dataSize: params.dataSize,

        // ✨ ENHANCED: Session Tracking
        sessionId: params.sessionId,
        previousAction: params.previousAction,
        referrer: params.referrer,
    });
}

/**
 * Audit Actions - Standard action strings for consistency
 */
export const AuditActions = {
    // User Management
    CREATE_USER: "create_user",
    UPDATE_USER: "update_user",
    DELETE_USER: "delete_user",
    RESET_PASSWORD: "reset_password",

    // Class Management
    DELETE_CLASS: "delete_class",
    BULK_DELETE_CLASSES: "bulk_delete_classes",
    EDIT_CLASS: "edit_class",
    APPROVE_CLASS: "approve_class",
    REJECT_CLASS: "reject_class",

    // School Management
    CREATE_SCHOOL: "create_school",
    UPDATE_SCHOOL: "update_school",
    DELETE_SCHOOL: "delete_school",

    // Student Management
    DELETE_STUDENT: "delete_student",
    BULK_DELETE_STUDENTS: "bulk_delete_students",

    // Location Management
    CREATE_LOCATION: "create_location",
    DELETE_LOCATION: "delete_location",
    APPROVE_LOCATION: "approve_location",
    REJECT_LOCATION: "reject_location",

    // Notification Management
    CREATE_NOTIFICATION_WINDOW: "create_notification_window",
    DELETE_NOTIFICATION_WINDOW: "delete_notification_window",

    // App Updates
    CREATE_APP_UPDATE: "create_app_update",
    DELETE_APP_UPDATE: "delete_app_update",

    // System
    CLEAN_AUDIT_LOGS: "clean_audit_logs",
    EXPORT_DATA: "export_data",
} as const;

/**
 * Target Types - Standard target type strings
 */
export const AuditTargetTypes = {
    USERS: "users",
    CLASSES: "classes",
    SCHOOLS: "schools",
    STUDENTS: "students",
    LOCATIONS: "locations",
    NOTIFICATIONS: "notifications",
    NOTIFICATION_WINDOWS: "notificationWindows",
    APP_UPDATES: "appUpdates",
    AUDIT_LOGS: "auditLogs",
    MESSAGES: "messages",
} as const;

/**
 * Example usage in a mutation:
 * 
 * import { logAudit, AuditActions, AuditTargetTypes } from "./auditHelpers";
 * 
 * export const deleteUser = mutation({
 *   handler: async (ctx, args) => {
 *     // ... perform deletion
 *     await ctx.db.delete(userId);
 *     
 *     // Log the action
 *     await logAudit(ctx, {
 *       userId: args.adminId,
 *       action: AuditActions.DELETE_USER,
 *       targetType: AuditTargetTypes.USERS,
 *       targetId: userId,
 *       targetName: user.username,
 *       reason: args.reason,
 *     });
 *   }
 * });
 */
