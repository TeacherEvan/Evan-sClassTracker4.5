import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list teacher logs
export const list = query({
  args: {
    teacherId: v.optional(v.id("users")),
    schoolId: v.optional(v.id("schools")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    if (args.teacherId && args.startDate && args.endDate) {
      // Query by teacher and date range
      const logs = await ctx.db
        .query("teacherLogs")
        .withIndex("by_teacher_and_date", (q) =>
          q
            .eq("teacherId", args.teacherId!)
            .gte("createdAt", args.startDate!)
            .lte("createdAt", args.endDate!),
        )
        .order("desc")
        .take(limit);
      return logs;
    }

    if (args.schoolId && args.startDate && args.endDate) {
      // Query by school and date range
      const logs = await ctx.db
        .query("teacherLogs")
        .withIndex("by_school_and_date", (q) =>
          q
            .eq("schoolId", args.schoolId!)
            .gte("createdAt", args.startDate!)
            .lte("createdAt", args.endDate!),
        )
        .order("desc")
        .take(limit);
      return logs;
    }

    if (args.teacherId) {
      return await ctx.db
        .query("teacherLogs")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .take(limit);
    }

    if (args.schoolId) {
      return await ctx.db
        .query("teacherLogs")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db.query("teacherLogs").order("desc").take(limit);
  },
});

// Query to get teacher activity summary
export const getTeacherSummary = query({
  args: {
    teacherId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
    const end = args.endDate || Date.now();

    const logs = await ctx.db
      .query("teacherLogs")
      .withIndex("by_teacher_and_date", (q) =>
        q
          .eq("teacherId", args.teacherId)
          .gte("createdAt", start)
          .lte("createdAt", end),
      )
      .collect();

    // Count actions by type
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      recentLogs: logs.slice(0, 10),
    };
  },
});

// Query to get school-wide teacher activity summary
export const getSchoolSummary = query({
  args: {
    schoolId: v.id("schools"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const start = args.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days
    const end = args.endDate || Date.now();

    const logs = await ctx.db
      .query("teacherLogs")
      .withIndex("by_school_and_date", (q) =>
        q
          .eq("schoolId", args.schoolId)
          .gte("createdAt", start)
          .lte("createdAt", end),
      )
      .collect();

    // Group by teacher
    const teacherActivity: Record<string, number> = {};
    logs.forEach((log) => {
      const teacherIdStr = log.teacherId;
      teacherActivity[teacherIdStr] = (teacherActivity[teacherIdStr] || 0) + 1;
    });

    // Count actions by type
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      teacherActivity,
      actionCounts,
      recentLogs: logs.slice(0, 20),
    };
  },
});

// Mutation to create a teacher log entry
export const create = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    action: v.string(),
    actionTh: v.string(),
    details: v.string(),
    detailsTh: v.string(),
    relatedClassId: v.optional(v.id("classes")),
    relatedStudentId: v.optional(v.id("students")),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("teacherLogs", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      action: args.action,
      actionTh: args.actionTh,
      details: args.details,
      detailsTh: args.detailsTh,
      relatedClassId: args.relatedClassId,
      relatedStudentId: args.relatedStudentId,
      acknowledged: false, // Default to not acknowledged
      createdAt: Date.now(),
    });

    return logId;
  },
});

// Mutation to acknowledge a teacher log (Admin/Moderator only)
export const acknowledgeLog = mutation({
  args: {
    userId: v.id("users"), // ID of the admin/moderator acknowledging the log
    logId: v.id("teacherLogs"),
  },
  handler: async (ctx, args) => {
    // Get current user
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is admin or moderator
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Only admins and moderators can acknowledge logs");
    }

    // Get the log
    const log = await ctx.db.get(args.logId);
    if (!log) {
      throw new Error("Log not found");
    }

    // Update the log
    await ctx.db.patch(args.logId, {
      acknowledged: true,
      acknowledgedBy: user._id,
      acknowledgedAt: Date.now(),
    });

    // Get teacher info for notification
    const teacher = await ctx.db.get(log.teacherId);

    // Notify the teacher
    if (teacher) {
      await ctx.db.insert("notifications", {
        title: "Class Log Acknowledged",
        titleTh: "ยืนยันบันทึกคลาสแล้ว",
        message: `Your class log has been acknowledged by ${user.username}.`,
        messageTh: `บันทึกคลาสของคุณได้รับการยืนยันโดย ${user.username} แล้ว`,
        type: "success",
        userId: teacher._id,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Query to list pending logs (unacknowledged) for admins/moderators
export const listPendingLogs = query({
  args: {
    userId: v.id("users"), // ID of the admin/moderator requesting the list
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Get current user
    const user = await ctx.db.get(args.userId);

    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return [];
    }

    let logs = await ctx.db
      .query("teacherLogs")
      .withIndex("by_acknowledged", (q) => q.eq("acknowledged", false))
      .order("desc")
      .collect();

    // Filter by school if moderator and schoolId provided
    if (args.schoolId) {
      logs = logs.filter((log) => log.schoolId === args.schoolId);
    } else if (user.role === "moderator" && user.schoolId) {
      logs = logs.filter((log) => log.schoolId === user.schoolId);
    }

    return logs;
  },
});
