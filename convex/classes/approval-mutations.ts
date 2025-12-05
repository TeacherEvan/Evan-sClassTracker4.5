import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { logAudit } from "../auditHelpers";
import { checkRateLimit } from "../rateLimit";
import { verifyClassAccess } from "./helpers";

// Mutation to approve a class (moderator/admin only)
export const approve = mutation({
  args: {
    id: v.id("classes"),
    userId: v.id("users"), // Moderator/Admin ID
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Verify moderator/admin permissions
    await verifyClassAccess(ctx, args.id, args.userId);

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only moderators and admins can approve
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can approve classes");
    }

    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Update class status
    await ctx.db.patch(args.id, {
      status: "approved",
      approvedAt: Date.now(),
      approvedBy: args.userId,
      approvalSource: user.role,
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "approve_class",
      actionTh: "อนุมัติชั้นเรียน",
      details: `Approved class on ${new Date(cls.scheduledDate || 0).toLocaleDateString()}`,
      detailsTh: `อนุมัติชั้นเรียนวันที่ ${new Date(cls.scheduledDate || 0).toLocaleDateString("th-TH")}`,
      relatedClassId: args.id,
      createdAt: Date.now(),
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
    // ✅ SECURITY: Verify moderator/admin permissions
    await verifyClassAccess(ctx, args.id, args.userId);

    // Get user
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only moderators and admins can reject
    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can reject classes");
    }

    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Update class status
    await ctx.db.patch(args.id, {
      status: "rejected",
      rejectedAt: Date.now(),
      rejectedBy: args.userId,
      rejectionReason: args.reason,
      rejectionReasonTh: args.reasonTh,
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "reject_class",
      actionTh: "ปฏิเสธชั้นเรียน",
      details: `Rejected class on ${new Date(cls.scheduledDate || 0).toLocaleDateString()}: ${args.reason}`,
      detailsTh: `ปฏิเสธชั้นเรียนวันที่ ${new Date(cls.scheduledDate || 0).toLocaleDateString("th-TH")}: ${args.reasonTh || args.reason}`,
      relatedClassId: args.id,
      createdAt: Date.now(),
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
