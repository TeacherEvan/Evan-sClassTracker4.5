/**
 * Teacher-School Connection Management
 * 
 * Allows moderators to connect/disconnect teachers to their assigned school.
 * Moderators can ONLY manage connections for their own school.
 * Admins can manage connections for any school.
 * 
 * Security:
 * - Moderators are strictly school-scoped (can only connect teachers to their school)
 * - All mutations verify moderator's schoolId matches target schoolId
 * - Audit logging for all connection/disconnection actions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit } from "./rateLimit";

/**
 * Connect a teacher to a school
 * Only moderators for that school or admins can perform this action
 */
export const connect = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    userId: v.id("users"), // Moderator or admin making the connection
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user making the connection
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can connect teachers
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can connect teachers to schools");
    }

    // ✅ SECURITY: Moderators can ONLY connect teachers to their own school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only connect teachers to their assigned school");
      }
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `teacher-school-connect-${args.userId}`,
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

    // Check if connection already exists (active or inactive)
    const existingConnection = await ctx.db
      .query("teacherSchools")
      .withIndex("by_teacher_and_school", (q) =>
        q.eq("teacherId", args.teacherId).eq("schoolId", args.schoolId)
      )
      .first();

    if (existingConnection) {
      if (existingConnection.isActive) {
        throw new Error("Teacher is already connected to this school");
      } else {
        // Reactivate inactive connection
        await ctx.db.patch(existingConnection._id, {
          isActive: true,
          connectedBy: args.userId,
          connectedAt: Date.now(),
          disconnectedBy: undefined,
          disconnectedAt: undefined,
        });

        // ✅ SECURITY: Audit logging
        await logAudit(ctx, {
          userId: args.userId,
          action: AuditActions.UPDATE_TEACHER,
          targetType: AuditTargetTypes.TEACHER_SCHOOLS,
          targetId: existingConnection._id,
          targetName: `${teacher.username} → ${school.name}`,
          details: {
            action: "reconnect",
            teacherId: args.teacherId,
            teacherUsername: teacher.username,
            schoolId: args.schoolId,
            schoolName: school.name,
          },
          userAgent: args.userAgent,
          screenResolution: args.screenResolution,
          timezone: args.timezone,
          locale: args.locale,
          sessionId: args.sessionId,
        });

        return { success: true, connectionId: existingConnection._id, action: "reconnected" };
      }
    }

    // Create new connection
    const connectionId = await ctx.db.insert("teacherSchools", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      connectedBy: args.userId,
      connectedAt: Date.now(),
      isActive: true,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.CREATE_TEACHER,
      targetType: AuditTargetTypes.TEACHER_SCHOOLS,
      targetId: connectionId,
      targetName: `${teacher.username} → ${school.name}`,
      details: {
        action: "connect",
        teacherId: args.teacherId,
        teacherUsername: teacher.username,
        schoolId: args.schoolId,
        schoolName: school.name,
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    return { success: true, connectionId, action: "connected" };
  },
});

/**
 * Disconnect a teacher from a school
 * Only moderators for that school or admins can perform this action
 */
export const disconnect = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    userId: v.id("users"), // Moderator or admin making the disconnection
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user making the disconnection
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can disconnect teachers
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can disconnect teachers from schools");
    }

    // ✅ SECURITY: Moderators can ONLY disconnect teachers from their own school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only disconnect teachers from their assigned school");
      }
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `teacher-school-disconnect-${args.userId}`,
      limit: 20,
      windowMs: 60000, // 20 disconnections per minute
    });

    // Verify teacher exists
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Verify school exists
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // Find active connection
    const connection = await ctx.db
      .query("teacherSchools")
      .withIndex("by_teacher_and_school", (q) =>
        q.eq("teacherId", args.teacherId).eq("schoolId", args.schoolId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!connection) {
      throw new Error("No active connection found between this teacher and school");
    }

    // Soft delete (deactivate) the connection
    await ctx.db.patch(connection._id, {
      isActive: false,
      disconnectedBy: args.userId,
      disconnectedAt: Date.now(),
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.DELETE_TEACHER,
      targetType: AuditTargetTypes.TEACHER_SCHOOLS,
      targetId: connection._id,
      targetName: `${teacher.username} ↛ ${school.name}`,
      details: {
        action: "disconnect",
        teacherId: args.teacherId,
        teacherUsername: teacher.username,
        schoolId: args.schoolId,
        schoolName: school.name,
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
 * Get all teachers connected to a school
 * Moderators can only see teachers for their school
 * Admins can see teachers for any school
 */
export const getTeachersForSchool = query({
  args: {
    schoolId: v.id("schools"),
    userId: v.id("users"), // Moderator or admin requesting the data
  },
  handler: async (ctx, args) => {
    // Get the user requesting the data
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can view teacher connections
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can view teacher connections");
    }

    // ✅ SECURITY: Moderators can ONLY view teachers for their own school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only view teachers for their assigned school");
      }
    }

    // Get active connections for this school
    const connections = await ctx.db
      .query("teacherSchools")
      .withIndex("by_school_and_active", (q) =>
        q.eq("schoolId", args.schoolId).eq("isActive", true)
      )
      .collect();

    // Fetch teacher details for each connection
    const teachersWithDetails = await Promise.all(
      connections.map(async (conn) => {
        const teacher = await ctx.db.get(conn.teacherId);
        return {
          connectionId: conn._id,
          teacherId: conn.teacherId,
          username: teacher?.username || "Unknown",
          connectedAt: conn.connectedAt,
          connectedBy: conn.connectedBy,
        };
      })
    );

    return teachersWithDetails;
  },
});

/**
 * Get all schools a teacher is connected to
 * Teachers can see their own connections
 * Moderators can see connections for teachers in their school
 * Admins can see all connections
 */
export const getSchoolsForTeacher = query({
  args: {
    teacherId: v.id("users"),
    userId: v.id("users"), // User requesting the data
  },
  handler: async (ctx, args) => {
    // Get the user requesting the data
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Verify authorization
    if (user.role === "teacher" && user._id !== args.teacherId) {
      throw new Error("Unauthorized: Teachers can only view their own connections");
    }

    if (user.role === "moderator") {
      // Moderator can only see connections for teachers in their school
      // First check if this teacher is connected to moderator's school
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      const teacherInSchool = await ctx.db
        .query("teacherSchools")
        .withIndex("by_teacher_and_school", (q) =>
          q.eq("teacherId", args.teacherId).eq("schoolId", user.schoolId!)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();

      if (!teacherInSchool) {
        throw new Error("Unauthorized: This teacher is not connected to your school");
      }
    }

    // Get active connections for this teacher
    const connections = await ctx.db
      .query("teacherSchools")
      .withIndex("by_teacher_and_active", (q) =>
        q.eq("teacherId", args.teacherId).eq("isActive", true)
      )
      .collect();

    // For moderators, filter to only show their school
    const filteredConnections = user.role === "moderator" && user.schoolId
      ? connections.filter(conn => conn.schoolId === user.schoolId)
      : connections;

    // Fetch school details for each connection
    const schoolsWithDetails = await Promise.all(
      filteredConnections.map(async (conn) => {
        const school = await ctx.db.get(conn.schoolId);
        return {
          connectionId: conn._id,
          schoolId: conn.schoolId,
          schoolName: school?.name || "Unknown",
          schoolNameTh: school?.nameTh || "ไม่ทราบ",
          connectedAt: conn.connectedAt,
          connectedBy: conn.connectedBy,
        };
      })
    );

    return schoolsWithDetails;
  },
});
