import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit, validateLength } from "./rateLimit";

// Query to list all schools
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});

// Query to get school by ID
export const getById = query({
  args: {
    id: v.id("schools"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new school
export const create = mutation({
  args: {
    name: v.string(),
    nameTh: v.string(),
    moderatorId: v.optional(v.id("users")),
    adminId: v.id("users"), // Required: admin creating the school
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Verify admin role
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can create schools");
    }

    // ✅ SECURITY: Rate limiting to prevent abuse
    await checkRateLimit(ctx, {
      key: `school-create-${args.adminId}`,
      limit: 10,
      windowMs: 60000, // 10 schools per minute
    });

    // ✅ SECURITY: Input validation
    validateLength(args.name, "School name (English)", 200, 1);
    validateLength(args.nameTh, "School name (Thai)", 200, 1);

    // Validate inputs
    if (!args.name.trim() && !args.nameTh.trim()) {
      throw new Error("School name is required in at least one language");
    }

    // If moderator is specified, verify they exist and have moderator role
    if (args.moderatorId) {
      const moderator = await ctx.db.get(args.moderatorId);
      if (!moderator) {
        throw new Error("Moderator not found");
      }
      if (moderator.role !== "moderator" && moderator.role !== "admin") {
        throw new Error("Specified user is not a moderator or admin");
      }
    }

    const schoolId = await ctx.db.insert("schools", {
      name: args.name,
      nameTh: args.nameTh,
      moderatorId: args.moderatorId,
      createdAt: Date.now(),
    });

    // ✅ SECURITY: Audit logging with performance metadata
    await logAudit(ctx, {
      userId: args.adminId,
      action: AuditActions.CREATE_SCHOOL,
      targetType: AuditTargetTypes.SCHOOLS,
      targetId: schoolId,
      targetName: args.name,
      details: {
        englishName: args.name,
        thaiName: args.nameTh,
        moderatorId: args.moderatorId
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    return schoolId;
  },
});

// Mutation to update school moderator
export const updateModerator = mutation({
  args: {
    schoolId: v.id("schools"),
    moderatorId: v.id("users"),
    adminId: v.id("users"), // Required: admin making the change
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Verify admin role
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update school moderators");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `school-update-${args.adminId}`,
      limit: 20,
      windowMs: 60000, // 20 updates per minute
    });

    // Verify the school exists
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // Verify the moderator exists and has appropriate role
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator) {
      throw new Error("Moderator not found");
    }
    if (moderator.role !== "moderator" && moderator.role !== "admin") {
      throw new Error("Specified user is not a moderator or admin");
    }

    await ctx.db.patch(args.schoolId, {
      moderatorId: args.moderatorId,
    });

    // ✅ SECURITY: Audit logging with performance metadata
    await logAudit(ctx, {
      userId: args.adminId,
      action: AuditActions.UPDATE_SCHOOL,
      targetType: AuditTargetTypes.SCHOOLS,
      targetId: args.schoolId,
      targetName: school.name,
      details: {
        newModeratorId: moderator._id,
        newModeratorUsername: moderator.username
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

// Mutation to delete a school
export const remove = mutation({
  args: {
    id: v.id("schools"),
    adminId: v.id("users"), // Required: admin deleting the school
    reason: v.string(), // Required: reason for deletion (audit trail)
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Verify admin role
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete schools");
    }

    // ✅ SECURITY: Rate limiting
    await checkRateLimit(ctx, {
      key: `school-delete-${args.adminId}`,
      limit: 5,
      windowMs: 60000, // 5 deletions per minute max
    });

    // ✅ SECURITY: Input validation for reason
    validateLength(args.reason, "Deletion reason", 500, 10);

    // Get school details before deletion for audit log
    const school = await ctx.db.get(args.id);
    if (!school) {
      throw new Error("School not found");
    }

    // Check if school has active classes - prevent accidental data loss
    const activeClasses = await ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.id))
      .collect();

    if (activeClasses.length > 0) {
      throw new Error(
        `Cannot delete school with ${activeClasses.length} active classes. Please delete or reassign classes first.`
      );
    }

    // Check if school has students
    const students = await ctx.db
      .query("students")
      .withIndex("by_school", (q) => q.eq("schoolId", args.id))
      .collect();

    if (students.length > 0) {
      throw new Error(
        `Cannot delete school with ${students.length} students. Please reassign students first.`
      );
    }

    // Proceed with deletion
    await ctx.db.delete(args.id);

    // ✅ SECURITY: Audit logging with performance metadata
    await logAudit(ctx, {
      userId: args.adminId,
      action: AuditActions.DELETE_SCHOOL,
      targetType: AuditTargetTypes.SCHOOLS,
      targetId: args.id,
      targetName: school.name,
      reason: args.reason,
      details: {
        englishName: school.name,
        thaiName: school.nameTh,
        moderatorId: school.moderatorId
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
