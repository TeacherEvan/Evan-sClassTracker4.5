/**
 * Audit Logging Helper Utilities
 * 
 * Simplifies adding audit logs throughout the application.
 * Import and use these helpers in mutations that need audit trails.
 */

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Quick audit log helper - logs an action with minimal required fields
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
    }
) {
    // Get user info
    const user = await ctx.db.get(params.userId);
    if (!user) {
        console.warn("Audit log: User not found", params.userId);
        return;
    }

    // Insert audit log
    await ctx.db.insert("auditLogs", {
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
