/**
 * Class Review and Reporting Management
 * 
 * Allows moderators to:
 * - Flag classes for review (with bilingual notes)
 * - Include/exclude classes from reports
 * - View flagged classes for their school
 * 
 * Security:
 * - Moderators can ONLY manage classes in their assigned school
 * - All mutations verify moderator's schoolId matches class's schoolId
 * - Audit logging for all flag/unflag/toggle actions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit, validateLength } from "./rateLimit";

/**
 * Flag a class for review
 * Only moderators for that school or admins can perform this action
 */
export const flagForReview = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"), // Moderator or admin flagging the class
    reviewNotes: v.optional(v.string()), // Review notes in English
    reviewNotesTh: v.optional(v.string()), // Review notes in Thai
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user flagging the class
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can flag classes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can flag classes for review");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-flag-${args.userId}`,
      limit: 50,
      windowMs: 60000, // 50 flags per minute
    });

    // Verify class exists
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY flag classes in their assigned school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (classItem.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Moderators can only flag classes in their assigned school");
      }
    }

    // ✅ SECURITY: Input validation for review notes
    if (args.reviewNotes) {
      validateLength(args.reviewNotes, "Review notes (English)", 1000, 0);
    }
    if (args.reviewNotesTh) {
      validateLength(args.reviewNotesTh, "Review notes (Thai)", 1000, 0);
    }

    // Update class with flag
    await ctx.db.patch(args.classId, {
      flaggedForReview: true,
      reviewNotes: args.reviewNotes,
      reviewNotesTh: args.reviewNotesTh,
      flaggedBy: args.userId,
      flaggedAt: Date.now(),
    });

    // Get student and teacher for audit log
    const student = await ctx.db.get(classItem.studentId);
    const teacher = await ctx.db.get(classItem.teacherId);

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.UPDATE_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} → ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "flag_for_review",
        classId: args.classId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
        hasReviewNotes: !!(args.reviewNotes || args.reviewNotesTh),
      },
      schoolId: classItem.schoolId,
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
 * Unflag a class (remove review flag)
 * Only moderators for that school or admins can perform this action
 */
export const unflagClass = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"), // Moderator or admin unflagging the class
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user unflagging the class
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can unflag classes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can unflag classes");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-unflag-${args.userId}`,
      limit: 50,
      windowMs: 60000, // 50 unflags per minute
    });

    // Verify class exists
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY unflag classes in their assigned school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (classItem.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Moderators can only unflag classes in their assigned school");
      }
    }

    // Update class - remove flag
    await ctx.db.patch(args.classId, {
      flaggedForReview: false,
      reviewNotes: undefined,
      reviewNotesTh: undefined,
      flaggedBy: undefined,
      flaggedAt: undefined,
    });

    // Get student and teacher for audit log
    const student = await ctx.db.get(classItem.studentId);
    const teacher = await ctx.db.get(classItem.teacherId);

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.UPDATE_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} → ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "unflag_class",
        classId: args.classId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
      },
      schoolId: classItem.schoolId,
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
 * Toggle class inclusion in reports
 * Only moderators for that school or admins can perform this action
 */
export const toggleIncludeInReports = mutation({
  args: {
    classId: v.id("classes"),
    includeInReports: v.boolean(),
    userId: v.id("users"), // Moderator or admin toggling the setting
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the user toggling the setting
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can toggle report inclusion
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can toggle class report inclusion");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-toggle-reports-${args.userId}`,
      limit: 100,
      windowMs: 60000, // 100 toggles per minute (bulk operations)
    });

    // Verify class exists
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY toggle classes in their assigned school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (classItem.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Moderators can only toggle report inclusion for classes in their assigned school");
      }
    }

    // Update class
    await ctx.db.patch(args.classId, {
      includeInReports: args.includeInReports,
    });

    // Get student and teacher for audit log
    const student = await ctx.db.get(classItem.studentId);
    const teacher = await ctx.db.get(classItem.teacherId);

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.UPDATE_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} → ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "toggle_report_inclusion",
        classId: args.classId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
        includeInReports: args.includeInReports,
      },
      schoolId: classItem.schoolId,
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
 * Get all flagged classes for a school
 * Moderators can only see flagged classes for their school
 * Admins can see flagged classes for any school
 */
export const getFlaggedClasses = query({
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

    // ✅ SECURITY: Only moderators and admins can view flagged classes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can view flagged classes");
    }

    // ✅ SECURITY: Moderators can ONLY view flagged classes for their own school
    if (user.role === "moderator") {
      if (!user.schoolId) {
        throw new Error("Moderator must be assigned to a school");
      }
      if (user.schoolId !== args.schoolId) {
        throw new Error("Unauthorized: Moderators can only view flagged classes for their assigned school");
      }
    }

    // Get flagged classes for this school
    const flaggedClasses = await ctx.db
      .query("classes")
      .withIndex("by_school_and_flagged", (q) =>
        q.eq("schoolId", args.schoolId).eq("flaggedForReview", true)
      )
      .collect();

    // Fetch related data for each class
    const classesWithDetails = await Promise.all(
      flaggedClasses.map(async (cls) => {
        const student = await ctx.db.get(cls.studentId);
        const teacher = await ctx.db.get(cls.teacherId);
        const location = cls.locationId ? await ctx.db.get(cls.locationId) : null;
        const flaggedByUser = cls.flaggedBy ? await ctx.db.get(cls.flaggedBy) : null;

        return {
          classId: cls._id,
          scheduledDate: cls.scheduledDate,
          duration: cls.duration || 60,
          status: cls.status,
          // Student info
          studentId: cls.studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          studentGrade: student?.grade || "",
          studentClass: student?.class || "",
          // Teacher info
          teacherId: cls.teacherId,
          teacherName: teacher?.username || "Unknown",
          // Location info (bilingual)
          locationName: location?.name || cls.pendingLocationName || "",
          locationNameTh: location?.nameTh || cls.pendingLocationNameTh || "",
          // Review info (bilingual)
          reviewNotes: cls.reviewNotes || "",
          reviewNotesTh: cls.reviewNotesTh || "",
          flaggedBy: flaggedByUser?.username || "Unknown",
          flaggedAt: cls.flaggedAt || 0,
          // Report inclusion
          includeInReports: cls.includeInReports ?? true,
        };
      })
    );

    // Sort by flagged date (most recent first)
    classesWithDetails.sort((a, b) => b.flaggedAt - a.flaggedAt);

    return classesWithDetails;
  },
});
