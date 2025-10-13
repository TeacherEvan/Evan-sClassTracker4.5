import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list classes
export const list = query({
  args: {
    teacherId: v.optional(v.id("users")),
    schoolId: v.optional(v.id("schools")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    if (args.teacherId) {
      return await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .collect();
    } else if (args.schoolId) {
      return await ctx.db
        .query("classes")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      return await ctx.db
        .query("classes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("classes")
      .order("desc")
      .collect();
  },
});

// Query to get class by ID
export const getById = query({
  args: {
    id: v.id("classes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to book a new class
export const book = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    title: v.string(),
    titleTh: v.string(),
    description: v.string(),
    descriptionTh: v.string(),
    scheduledDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      title: args.title,
      titleTh: args.titleTh,
      description: args.description,
      descriptionTh: args.descriptionTh,
      status: "pending",
      scheduledDate: args.scheduledDate,
      createdAt: Date.now(),
    });

    // Get the school to find the moderator
    const school = await ctx.db.get(args.schoolId);

    if (school && school.moderatorId) {
      // Get teacher information
      const teacher = await ctx.db.get(args.teacherId);

      // Create notification for moderator
      await ctx.db.insert("notifications", {
        title: `New Class Booking: ${args.title}`,
        titleTh: `การจองชั้นเรียนใหม่: ${args.titleTh}`,
        message: `Teacher ${teacher?.username || "Unknown"} has booked a class at your school. Please review and acknowledge.`,
        messageTh: `ครู ${teacher?.username || "ไม่ทราบ"} ได้จองชั้นเรียนที่โรงเรียนของคุณ กรุณาตรวจสอบและรับทราบ`,
        type: "warning",
        userId: school.moderatorId.toString(),
        read: false,
        createdAt: Date.now(),
      });
    }

    return classId;
  },
});

// Mutation to acknowledge a class booking (moderator)
export const acknowledge = mutation({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    await ctx.db.patch(args.classId, {
      status: "acknowledged",
    });

    // Notify the teacher
    const teacher = await ctx.db.get(classData.teacherId);

    if (teacher) {
      await ctx.db.insert("notifications", {
        title: `Class Acknowledged: ${classData.title}`,
        titleTh: `รับทราบชั้นเรียน: ${classData.titleTh}`,
        message: `Your class booking has been acknowledged by the moderator.`,
        messageTh: `การจองชั้นเรียนของคุณได้รับการรับทราบจากผู้ดูแล`,
        type: "success",
        userId: classData.teacherId.toString(),
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Mutation to approve a class
export const approve = mutation({
  args: {
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    await ctx.db.patch(args.classId, {
      status: "approved",
    });

    // Notify the teacher
    await ctx.db.insert("notifications", {
      title: `Class Approved: ${classData.title}`,
      titleTh: `อนุมัติชั้นเรียน: ${classData.titleTh}`,
      message: `Your class booking has been approved!`,
      messageTh: `การจองชั้นเรียนของคุณได้รับการอนุมัติแล้ว!`,
      type: "success",
      userId: classData.teacherId.toString(),
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to reject a class
export const reject = mutation({
  args: {
    classId: v.id("classes"),
    reason: v.optional(v.string()),
    reasonTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    await ctx.db.patch(args.classId, {
      status: "rejected",
    });

    // Notify the teacher
    await ctx.db.insert("notifications", {
      title: `Class Rejected: ${classData.title}`,
      titleTh: `ปฏิเสธชั้นเรียน: ${classData.titleTh}`,
      message: args.reason || `Your class booking has been rejected.`,
      messageTh: args.reasonTh || `การจองชั้นเรียนของคุณถูกปฏิเสธ`,
      type: "error",
      userId: classData.teacherId.toString(),
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
