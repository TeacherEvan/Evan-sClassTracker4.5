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
    studentId: v.id("students"),
    locationId: v.id("locations"),
    scheduledDate: v.number(),
    bookedByUserId: v.id("users"), // ID of the user creating the booking
  },
  handler: async (ctx, args) => {
    // Validate scheduled date
    if (args.scheduledDate < Date.now()) {
      throw new Error("Cannot schedule a class in the past");
    }

    // Verify student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Verify location exists and is active
    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }
    if (!location.isActive) {
      throw new Error("Selected location is not available");
    }

    // Get the user who is booking to check their role
    const bookingUser = await ctx.db.get(args.bookedByUserId);
    if (!bookingUser) {
      throw new Error("User not found");
    }

    // Determine status based on who is booking
    // Moderators and admins can directly book (approved status)
    // Teachers create requests (pending status)
    const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
    const status = isModerator ? "approved" : "pending";

    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      studentId: args.studentId,
      locationId: args.locationId,
      status,
      scheduledDate: args.scheduledDate,
      createdAt: Date.now(),
    });

    // Get the school to find the moderator
    const school = await ctx.db.get(args.schoolId);

    // Only send notification if it's a teacher request (pending status)
    if (!isModerator && school && school.moderatorId) {
      // Get teacher information
      const teacher = await ctx.db.get(args.teacherId);

      // Create notification for moderator
      await ctx.db.insert("notifications", {
        title: `New Class Request`,
        titleTh: `คำขอชั้นเรียนใหม่`,
        message: `Teacher ${teacher?.username || "Unknown"} has requested a class for ${student.firstName} ${student.lastName} at ${location.name}. Please review and acknowledge.`,
        messageTh: `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${location.nameTh} กรุณาตรวจสอบและรับทราบ`,
        type: "warning",
        userId: school.moderatorId,
        read: false,
        createdAt: Date.now(),
      });
    }

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      action: isModerator ? "class_booked" : "class_requested",
      actionTh: isModerator ? "จองชั้นเรียน" : "ขอชั้นเรียน",
      details: `${isModerator ? "Booked" : "Requested"} class for ${student.firstName} ${student.lastName} at ${location.name} on ${new Date(args.scheduledDate).toLocaleDateString()}`,
      detailsTh: `${isModerator ? "จอง" : "ขอ"}ชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${location.nameTh} วันที่ ${new Date(args.scheduledDate).toLocaleDateString("th-TH")}`,
      relatedClassId: classId,
      relatedStudentId: args.studentId,
      createdAt: Date.now(),
    });

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

    // Get student and location info for notification
    const student = await ctx.db.get(classData.studentId);
    const location = await ctx.db.get(classData.locationId);

    await ctx.db.patch(args.classId, {
      status: "acknowledged",
    });

    // Notify the teacher
    const teacher = await ctx.db.get(classData.teacherId);

    if (teacher && student && location) {
      await ctx.db.insert("notifications", {
        title: `Class Acknowledged`,
        titleTh: `รับทราบชั้นเรียน`,
        message: `Your class request for ${student.firstName} ${student.lastName} at ${location.name} has been acknowledged by the moderator.`,
        messageTh: `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${location.nameTh} ได้รับการรับทราบจากผู้ดูแล`,
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

    // Get student and location info for notification
    const student = await ctx.db.get(classData.studentId);
    const location = await ctx.db.get(classData.locationId);

    await ctx.db.patch(args.classId, {
      status: "approved",
    });

    // Notify the teacher
    if (student && location) {
      await ctx.db.insert("notifications", {
        title: `Class Approved`,
        titleTh: `อนุมัติชั้นเรียน`,
        message: `Your class request for ${student.firstName} ${student.lastName} at ${location.name} has been approved!`,
        messageTh: `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${location.nameTh} ได้รับการอนุมัติแล้ว!`,
        type: "success",
        userId: classData.teacherId,
        read: false,
        createdAt: Date.now(),
      });
    }

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

    // Get student and location info for notification
    const student = await ctx.db.get(classData.studentId);
    const location = await ctx.db.get(classData.locationId);

    await ctx.db.patch(args.classId, {
      status: "rejected",
    });

    // Notify the teacher
    if (student && location) {
      await ctx.db.insert("notifications", {
        title: `Class Rejected`,
        titleTh: `ปฏิเสธชั้นเรียน`,
        message: args.reason || `Your class request for ${student.firstName} ${student.lastName} at ${location.name} has been rejected.`,
        messageTh: args.reasonTh || `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${location.nameTh} ถูกปฏิเสธ`,
        type: "error",
        userId: classData.teacherId,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});
