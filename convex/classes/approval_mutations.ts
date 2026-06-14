import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { logAudit } from "../auditHelpers";

// Mutation to approve a class (moderator/admin only)
export const approve = mutation({
  args: {
    id: v.id("classes"),
    userId: v.id("users"), // Moderator/Admin ID
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can approve
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error(
        "Unauthorized: Only moderators and admins can approve classes",
      );
    }

    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can only approve classes from their school
    if (user.role === "moderator" && user.schoolId !== cls.schoolId) {
      throw new Error(
        "Unauthorized: Moderators can only approve classes from their assigned school",
      );
    }

    // Update class status - use schema-compliant fields
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: Date.now(),
      approvedByUserId: args.userId,
      approvedByUsername: user.username,
      approvalSource: user.role as "moderator" | "admin",
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "approve_class",
      targetType: "classes",
      targetId: args.id.toString(),
      details: {
        scheduledDate: cls.scheduledDate,
        studentId: cls.studentId?.toString(),
      },
    });

    // Send notification to teacher
    await ctx.db.insert("notifications", {
      userId: cls.teacherId,
      title: "Class Approved",
      titleTh: "อนุมัติชั้นเรียนแล้ว",
      message: `Your class on ${new Date(cls.scheduledDate || 0).toLocaleString()} has been approved`,
      messageTh: `ชั้นเรียนของคุณวันที่ ${new Date(cls.scheduledDate || 0).toLocaleString("th-TH")} ได้รับการอนุมัติแล้ว`,
      type: "success",
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to reject a class (moderator/admin only)
export const reject = mutation({
  args: {
    id: v.id("classes"),
    userId: v.id("users"), // Moderator/Admin ID
    reason: v.string(),
    reasonTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Only moderators and admins can reject
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error(
        "Unauthorized: Only moderators and admins can reject classes",
      );
    }

    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Moderators can only reject classes from their school
    if (user.role === "moderator" && user.schoolId !== cls.schoolId) {
      throw new Error(
        "Unauthorized: Moderators can only reject classes from their assigned school",
      );
    }

    // Update class status - rejected classes go back to pending or get marked
    // Note: Schema doesn't have rejectedAt/rejectedBy, so we just change status
    await ctx.db.patch(args.id, {
      status: "rejected",
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "reject_class",
      targetType: "classes",
      targetId: args.id.toString(),
      reason: args.reason,
      details: {
        scheduledDate: cls.scheduledDate,
        studentId: cls.studentId?.toString(),
        reasonTh: args.reasonTh,
      },
    });

    // Send notification to teacher
    await ctx.db.insert("notifications", {
      userId: cls.teacherId,
      title: "Class Rejected",
      titleTh: "ปฏิเสธชั้นเรียน",
      message: `Your class on ${new Date(cls.scheduledDate || 0).toLocaleString()} was rejected: ${args.reason}`,
      messageTh: `ชั้นเรียนของคุณวันที่ ${new Date(cls.scheduledDate || 0).toLocaleString("th-TH")} ถูกปฏิเสธ: ${args.reasonTh || args.reason}`,
      type: "error",
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
