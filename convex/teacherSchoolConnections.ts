/**
 * Teacher-School Connections Module
 * 
 * Purpose: Manage which teachers can work at which schools
 * 
 * Role-Based Access:
 * - Moderators: Can ONLY connect/disconnect teachers to THEIR assigned school
 * - Admins: Can connect/disconnect teachers to ANY school (God mode)
 * - Teachers: Read-only access to see their own connections
 * 
 * Security:
 * - STRICTLY enforce school scoping for moderators
 * - Audit log all connection/disconnection actions
 * - Validate teacher role before connecting
 * 
 * ✅ PATTERN: School-Scoped Moderator Operations (Nov 2025)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimit";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";

/**
 * Query to get all teacher connections for a school
 * Moderators can ONLY see connections for THEIR school
 */
export const getBySchool = query({
  args: {
    schoolId: v.id("schools"),
    requestingUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get requesting user to verify permissions
    const user = await ctx.db.get(args.requestingUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Moderators can ONLY access their assigned school
    if (user.role === "moderator") {
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only access their assigned school");
      }
    }

    // Fetch all active connections for this school
    const connections = await ctx.db
      .query("teacherSchoolConnections")
      .withIndex("by_school_and_active", (q) => 
        q.eq("schoolId", args.schoolId).eq("isActive", true)
      )
      .collect();

    // Fetch teacher details for each connection
    const connectionsWithTeachers = await Promise.all(
      connections.map(async (conn) => {
        const teacher = await ctx.db.get(conn.teacherId);
        const connectedBy = await ctx.db.get(conn.connectedBy);
        return {
          ...conn,
          teacherUsername: teacher?.username || "Unknown",
          connectedByUsername: connectedBy?.username || "Unknown",
        };
      })
    );

    return connectionsWithTeachers;
  },
});

/**
 * Query to get all schools a teacher is connected to
 */
export const getByTeacher = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query("teacherSchoolConnections")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Fetch school details for each connection
    const connectionsWithSchools = await Promise.all(
      connections.map(async (conn) => {
        const school = await ctx.db.get(conn.schoolId);
        return {
          ...conn,
          schoolName: school?.name || "Unknown",
          schoolNameTh: school?.nameTh || "ไม่ทราบ",
        };
      })
    );

    return connectionsWithSchools;
  },
});

/**
 * Mutation to connect a teacher to a school
 * Moderators can ONLY connect teachers to THEIR school
 */
export const connect = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    requestingUserId: v.id("users"),
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Get requesting user and verify permissions
    const user = await ctx.db.get(args.requestingUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can connect teachers
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can connect teachers to schools");
    }

    // ✅ SECURITY: Moderators can ONLY connect teachers to THEIR assigned school
    if (user.role === "moderator") {
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only connect teachers to their assigned school");
      }
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `teacher-school-connect-${args.requestingUserId}`,
      limit: 20,
      windowMs: 60000, // 20 connections per minute
    });

    // Verify teacher exists and has teacher role
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }
    if (teacher.role !== "teacher") {
      throw new Error("User is not a teacher");
    }

    // Verify school exists
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // Check if connection already exists
    const existingConnection = await ctx.db
      .query("teacherSchoolConnections")
      .withIndex("by_teacher_and_school", (q) => 
        q.eq("teacherId", args.teacherId).eq("schoolId", args.schoolId)
      )
      .first();

    if (existingConnection) {
      if (existingConnection.isActive) {
        throw new Error("Teacher is already connected to this school");
      }
      // Reactivate existing connection
      await ctx.db.patch(existingConnection._id, {
        isActive: true,
        connectedBy: args.requestingUserId,
        connectedAt: Date.now(),
      });

      // ✅ SECURITY: Audit logging
      await logAudit(ctx, {
        userId: args.requestingUserId,
        action: AuditActions.UPDATE_USER,
        targetType: AuditTargetTypes.USERS,
        targetId: args.teacherId,
        targetName: teacher.username,
        details: {
          action: "reactivate_teacher_school_connection",
          schoolId: args.schoolId,
          schoolName: school.name,
        },
        userAgent: args.userAgent,
        screenResolution: args.screenResolution,
        timezone: args.timezone,
        locale: args.locale,
        sessionId: args.sessionId,
      });

      return { success: true, connectionId: existingConnection._id, reactivated: true };
    }

    // Create new connection
    const connectionId = await ctx.db.insert("teacherSchoolConnections", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      connectedBy: args.requestingUserId,
      connectedAt: Date.now(),
      isActive: true,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.UPDATE_USER,
      targetType: AuditTargetTypes.USERS,
      targetId: args.teacherId,
      targetName: teacher.username,
      details: {
        action: "connect_teacher_to_school",
        schoolId: args.schoolId,
        schoolName: school.name,
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    return { success: true, connectionId, reactivated: false };
  },
});

/**
 * Mutation to disconnect a teacher from a school (soft delete)
 * Moderators can ONLY disconnect teachers from THEIR school
 */
export const disconnect = mutation({
  args: {
    connectionId: v.id("teacherSchoolConnections"),
    requestingUserId: v.id("users"),
    reason: v.string(), // Required for audit trail
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Get requesting user and verify permissions
    const user = await ctx.db.get(args.requestingUserId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can disconnect teachers
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can disconnect teachers from schools");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `teacher-school-disconnect-${args.requestingUserId}`,
      limit: 20,
      windowMs: 60000, // 20 disconnections per minute
    });

    // Get connection
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // ✅ SECURITY: Moderators can ONLY disconnect from THEIR assigned school
    if (user.role === "moderator") {
      if (user.schoolId !== connection.schoolId) {
        throw new Error("Unauthorized: Moderators can only disconnect teachers from their assigned school");
      }
    }

    // Get teacher and school details for audit log
    const teacher = await ctx.db.get(connection.teacherId);
    const school = await ctx.db.get(connection.schoolId);

    // Soft delete the connection
    await ctx.db.patch(args.connectionId, {
      isActive: false,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.UPDATE_USER,
      targetType: AuditTargetTypes.USERS,
      targetId: connection.teacherId,
      targetName: teacher?.username || "Unknown",
      reason: args.reason,
      details: {
        action: "disconnect_teacher_from_school",
        schoolId: connection.schoolId,
        schoolName: school?.name || "Unknown",
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    return { success: true };
  },
});

/**
 * Query to check if a teacher is connected to a school
 */
export const isConnected = query({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("teacherSchoolConnections")
      .withIndex("by_teacher_and_school", (q) => 
        q.eq("teacherId", args.teacherId).eq("schoolId", args.schoolId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return connection !== null;
  },
});
