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

// Query to get classes by date range (for calendar view)
// Optimized to use compound indexes for better performance
export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    schoolId: v.optional(v.id("schools")),
    teacherId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Use compound indexes for efficient range queries
    if (args.schoolId) {
      const classes = await ctx.db
        .query("classes")
        .withIndex("by_school_and_date", (q) =>
          q.eq("schoolId", args.schoolId!)
            .gte("scheduledDate", args.startDate)
            .lte("scheduledDate", args.endDate)
        )
        .collect();
      return classes;
    }

    if (args.teacherId) {
      const classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher_and_date", (q) =>
          q.eq("teacherId", args.teacherId!)
            .gte("scheduledDate", args.startDate)
            .lte("scheduledDate", args.endDate)
        )
        .collect();
      return classes;
    }

    // For all classes, use the scheduled_date index
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_scheduled_date", (q) =>
        q.gte("scheduledDate", args.startDate)
          .lte("scheduledDate", args.endDate)
      )
      .collect();
    return classes;
  },
});

// Mutation to book a new class
export const book = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    name: v.string(),
    location: v.string(),
    scheduledDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.name.trim()) {
      throw new Error("Name is required");
    }
    if (!args.location.trim()) {
      throw new Error("Location is required");
    }
    if (args.scheduledDate < Date.now()) {
      throw new Error("Cannot schedule a class in the past");
    }

    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      name: args.name,
      location: args.location,
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
        title: `New Class Booking: ${args.name}`,
        titleTh: `การจองชั้นเรียนใหม่: ${args.name}`,
        message: `Teacher ${teacher?.username || "Unknown"} has booked a class at your school. Please review and acknowledge.`,
        messageTh: `ครู ${teacher?.username || "ไม่ทราบ"} ได้จองชั้นเรียนที่โรงเรียนของคุณ กรุณาตรวจสอบและรับทราบ`,
        type: "warning",
        userId: school.moderatorId,
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
        title: `Class Acknowledged: ${classData.name}`,
        titleTh: `รับทราบชั้นเรียน: ${classData.name}`,
        message: `Your class booking has been acknowledged by the moderator.`,
        messageTh: `การจองชั้นเรียนของคุณได้รับการรับทราบจากผู้ดูแล`,
        type: "success",
        userId: classData.teacherId,
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
      title: `Class Approved: ${classData.name}`,
      titleTh: `อนุมัติชั้นเรียน: ${classData.name}`,
      message: `Your class booking has been approved!`,
      messageTh: `การจองชั้นเรียนของคุณได้รับการอนุมัติแล้ว!`,
      type: "success",
      userId: classData.teacherId,
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
      title: `Class Rejected: ${classData.name}`,
      titleTh: `ปฏิเสธชั้นเรียน: ${classData.name}`,
      message: args.reason || `Your class booking has been rejected.`,
      messageTh: args.reasonTh || `การจองชั้นเรียนของคุณถูกปฏิเสธ`,
      type: "error",
      userId: classData.teacherId,
      read: false,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
