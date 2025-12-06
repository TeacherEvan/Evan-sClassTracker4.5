/**
 * Class Review & Flagging Module
 * 
 * Purpose: Allow moderators to flag classes for review and control report inclusion
 * 
 * Role-Based Access:
 * - Moderators: Can ONLY flag/review classes in THEIR assigned school
 * - Admins: Can flag/review classes in ANY school (God mode)
 * - Teachers: Read-only access to see flags on their own classes
 * 
 * Security:
 * - STRICTLY enforce school scoping for moderators
 * - Audit log all flagging actions
 * - Bilingual support for review notes
 * 
 * Features:
 * - Flag classes for review (⭐)
 * - Include/exclude classes from reports (☑️)
 * - Add bilingual review notes
 * - Query flagged classes (school-scoped)
 * 
 * ✅ PATTERN: School-Scoped Moderator Operations (Nov 2025)
 * ✅ PATTERN: Bilingual Data Entry (English required, Thai optional)
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit, validateLength } from "./rateLimit";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";

/**
 * Query to get all flagged classes for a school
 * Moderators can ONLY see flagged classes in THEIR school
 */
export const getFlaggedClasses = query({
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

    // Fetch all flagged classes for this school using composite index
    const flaggedClasses = await ctx.db
      .query("classes")
      .withIndex("by_school_and_flagged", (q) => 
        q.eq("schoolId", args.schoolId).eq("flaggedForReview", true)
      )
      .collect();

    // Fetch related data (teacher, student) for each class
    const classesWithDetails = await Promise.all(
      flaggedClasses.map(async (classItem) => {
        const teacher = await ctx.db.get(classItem.teacherId);
        const student = await ctx.db.get(classItem.studentId);
        const flaggedBy = classItem.flaggedBy ? await ctx.db.get(classItem.flaggedBy) : null;

        return {
          ...classItem,
          teacherUsername: teacher?.username || "Unknown",
          studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
          studentNickname: student?.nickname || "",
          flaggedByUsername: flaggedBy?.username || "Unknown",
        };
      })
    );

    return classesWithDetails;
  },
});

/**
 * Mutation to flag a class for review
 * Moderators can ONLY flag classes in THEIR school
 */
export const flagForReview = mutation({
  args: {
    classId: v.id("classes"),
    requestingUserId: v.id("users"),
    reviewNotes: v.optional(v.string()), // English review notes (optional)
    reviewNotesTh: v.optional(v.string()), // Thai review notes (optional)
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

    // ✅ SECURITY: Only moderators and admins can flag classes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can flag classes for review");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-flag-${args.requestingUserId}`,
      limit: 50,
      windowMs: 60000, // 50 flags per minute
    });

    // ✅ SECURITY: Input validation
    if (args.reviewNotes) {
      validateLength(args.reviewNotes, "Review notes (English)", 2000, 0);
    }
    if (args.reviewNotesTh) {
      validateLength(args.reviewNotesTh, "Review notes (Thai)", 2000, 0);
    }

    // Get class to verify school
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY flag classes in THEIR assigned school
    if (user.role === "moderator") {
      if (!classItem.schoolId || user.schoolId !== classItem.schoolId) {
        throw new Error("Unauthorized: Moderators can only flag classes in their assigned school");
      }
    }

    // Get teacher and student details for audit log
    const teacher = await ctx.db.get(classItem.teacherId);
    const student = await ctx.db.get(classItem.studentId);

    // Flag the class
    await ctx.db.patch(args.classId, {
      flaggedForReview: true,
      reviewNotes: args.reviewNotes,
      reviewNotesTh: args.reviewNotesTh,
      flaggedBy: args.requestingUserId,
      flaggedAt: Date.now(),
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.EDIT_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} - ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "flag_class_for_review",
        schoolId: classItem.schoolId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
        reviewNotes: args.reviewNotes,
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
 * Mutation to unflag a class (remove from review)
 * Moderators can ONLY unflag classes in THEIR school
 */
export const unflagForReview = mutation({
  args: {
    classId: v.id("classes"),
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

    // ✅ SECURITY: Only moderators and admins can unflag classes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can unflag classes");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-unflag-${args.requestingUserId}`,
      limit: 50,
      windowMs: 60000, // 50 unflags per minute
    });

    // Get class to verify school
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY unflag classes in THEIR assigned school
    if (user.role === "moderator") {
      if (!classItem.schoolId || user.schoolId !== classItem.schoolId) {
        throw new Error("Unauthorized: Moderators can only unflag classes in their assigned school");
      }
    }

    // Get teacher and student details for audit log
    const teacher = await ctx.db.get(classItem.teacherId);
    const student = await ctx.db.get(classItem.studentId);

    // Unflag the class (clear review data)
    await ctx.db.patch(args.classId, {
      flaggedForReview: false,
      reviewNotes: undefined,
      reviewNotesTh: undefined,
      flaggedBy: undefined,
      flaggedAt: undefined,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.EDIT_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} - ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "unflag_class_for_review",
        schoolId: classItem.schoolId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
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
 * Mutation to toggle report inclusion for a class
 * Moderators can ONLY modify classes in THEIR school
 */
export const toggleReportInclusion = mutation({
  args: {
    classId: v.id("classes"),
    includeInReports: v.boolean(),
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

    // ✅ SECURITY: Only moderators and admins can toggle report inclusion
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can toggle report inclusion");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-toggle-report-${args.requestingUserId}`,
      limit: 100,
      windowMs: 60000, // 100 toggles per minute
    });

    // Get class to verify school
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY modify classes in THEIR assigned school
    if (user.role === "moderator") {
      if (!classItem.schoolId || user.schoolId !== classItem.schoolId) {
        throw new Error("Unauthorized: Moderators can only modify classes in their assigned school");
      }
    }

    // Get teacher and student details for audit log
    const teacher = await ctx.db.get(classItem.teacherId);
    const student = await ctx.db.get(classItem.studentId);

    // Toggle report inclusion
    await ctx.db.patch(args.classId, {
      includeInReports: args.includeInReports,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.EDIT_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} - ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "toggle_report_inclusion",
        schoolId: classItem.schoolId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
        includeInReports: args.includeInReports,
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
 * Mutation to update review notes for a flagged class
 * Moderators can ONLY update notes for classes in THEIR school
 */
export const updateReviewNotes = mutation({
  args: {
    classId: v.id("classes"),
    requestingUserId: v.id("users"),
    reviewNotes: v.optional(v.string()), // English review notes
    reviewNotesTh: v.optional(v.string()), // Thai review notes
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

    // ✅ SECURITY: Only moderators and admins can update review notes
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can update review notes");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `class-update-notes-${args.requestingUserId}`,
      limit: 50,
      windowMs: 60000, // 50 updates per minute
    });

    // ✅ SECURITY: Input validation
    if (args.reviewNotes) {
      validateLength(args.reviewNotes, "Review notes (English)", 2000, 0);
    }
    if (args.reviewNotesTh) {
      validateLength(args.reviewNotesTh, "Review notes (Thai)", 2000, 0);
    }

    // Get class to verify school
    const classItem = await ctx.db.get(args.classId);
    if (!classItem) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can ONLY update notes for classes in THEIR assigned school
    if (user.role === "moderator") {
      if (!classItem.schoolId || user.schoolId !== classItem.schoolId) {
        throw new Error("Unauthorized: Moderators can only update notes for classes in their assigned school");
      }
    }

    // Get teacher and student details for audit log
    const teacher = await ctx.db.get(classItem.teacherId);
    const student = await ctx.db.get(classItem.studentId);

    // Update review notes
    await ctx.db.patch(args.classId, {
      reviewNotes: args.reviewNotes,
      reviewNotesTh: args.reviewNotesTh,
    });

    // ✅ SECURITY: Audit logging
    await logAudit(ctx, {
      userId: args.requestingUserId,
      action: AuditActions.EDIT_CLASS,
      targetType: AuditTargetTypes.CLASSES,
      targetId: args.classId,
      targetName: `${teacher?.username} - ${student?.firstName} ${student?.lastName}`,
      details: {
        action: "update_review_notes",
        schoolId: classItem.schoolId,
        teacherId: classItem.teacherId,
        studentId: classItem.studentId,
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
