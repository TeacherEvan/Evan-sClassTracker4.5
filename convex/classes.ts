import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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

// Query to list classes with joined student and location data
// Eliminates N+1 query problem in components
export const listWithDetails = query({
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
    // First, get all classes based on filter
    let classes;

    if (args.teacherId) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .collect();
    } else if (args.schoolId) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      classes = await ctx.db
        .query("classes")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      classes = await ctx.db
        .query("classes")
        .order("desc")
        .collect();
    }

    // Batch fetch all related entities
    const studentIds = [...new Set(classes.map(c => c.studentId))];
    const locationIds = [...new Set(classes.map(c => c.locationId).filter(Boolean))];

    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

    // Create lookup maps
    const studentMap = new Map(
      students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
    );
    const locationMap = new Map(
      locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
    );

    // Return enriched data
    return classes.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || null,
      location: c.locationId ? locationMap.get(c.locationId) || null : null,
    }));
  },
});

// Mutation to book a class
export const book = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    studentId: v.id("students"),
    locationId: v.optional(v.id("locations")),
    pendingLocationName: v.optional(v.string()),
    pendingLocationNameTh: v.optional(v.string()),
    guardianTitle: v.optional(v.string()), // Guardian title for guardian-linked classes
    scheduledDate: v.number(),
    bookedByUserId: v.id("users"), // ID of the user creating the booking
  },
  handler: async (ctx, args) => {
    // Validate scheduled date
    if (args.scheduledDate < Date.now()) {
      throw new Error("Cannot schedule a class in the past");
    }

    // Validate location - either locationId or pending location names must be provided
    if (!args.locationId && (!args.pendingLocationName || !args.pendingLocationNameTh)) {
      throw new Error("Must provide either a location or pending location names");
    }

    // Verify student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Check if this is a guardian-linked class
    let isGuardianLinked = false;
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location) {
        throw new Error("Location not found");
      }
      if (!location.isActive) {
        throw new Error("Selected location is not available");
      }
      // Check if location type is "guardian"
      if (location.type === "guardian") {
        isGuardianLinked = true;
        // Guardian-linked classes require a guardian title
        if (!args.guardianTitle?.trim()) {
          throw new Error("Guardian title is required for guardian-linked classes");
        }
      }
    }

    // Get the user who is booking to check their role
    const bookingUser = await ctx.db.get(args.bookedByUserId);
    if (!bookingUser) {
      throw new Error("User not found");
    }

    // Determine status based on who is booking and whether it's guardian-linked
    // Guardian-linked classes are auto-approved (no moderator workflow)
    // Moderators and admins can directly book (approved status)
    // Teachers create requests (pending status)
    const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
    const status = isGuardianLinked || isModerator ? "approved" : "pending";

    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      studentId: args.studentId,
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      guardianTitle: args.guardianTitle,
      isGuardianLinked,
      status,
      scheduledDate: args.scheduledDate,
      createdAt: Date.now(),
    });

    // Get the school to find the moderator
    const school = await ctx.db.get(args.schoolId);

    // Get location info for notifications (if provided)
    const location = args.locationId ? await ctx.db.get(args.locationId) : null;
    const locationText = location?.name || args.pendingLocationName || "Unknown location";
    const locationTextTh = location?.nameTh || args.pendingLocationNameTh || "ไม่ทราบสถานที่";

    // Only send notification if it's a teacher request (pending status)
    // Skip notification for guardian-linked classes (auto-approved)
    if (!isGuardianLinked && !isModerator && school && school.moderatorId) {
      // Get teacher information
      const teacher = await ctx.db.get(args.teacherId);

      // Create notification for moderator
      await ctx.db.insert("notifications", {
        title: `New Class Request`,
        titleTh: `คำขอชั้นเรียนใหม่`,
        message: `Teacher ${teacher?.username || "Unknown"} has requested a class for ${student.firstName} ${student.lastName} at ${locationText}. Please review and acknowledge.`,
        messageTh: `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} กรุณาตรวจสอบและรับทราบ`,
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
      details: `${isModerator ? "Booked" : "Requested"} class for ${student.firstName} ${student.lastName} at ${locationText} on ${new Date(args.scheduledDate).toLocaleDateString()}`,
      detailsTh: `${isModerator ? "จอง" : "ขอ"}ชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} วันที่ ${new Date(args.scheduledDate).toLocaleDateString("th-TH")}`,
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
    const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;

    await ctx.db.patch(args.classId, {
      status: "acknowledged",
    });

    // Notify the teacher
    const teacher = await ctx.db.get(classData.teacherId);

    if (teacher && student) {
      const locationText = location?.name || classData.pendingLocationName || "Unknown location";
      const locationTextTh = location?.nameTh || classData.pendingLocationNameTh || "ไม่ทราบสถานที่";

      await ctx.db.insert("notifications", {
        title: `Class Acknowledged`,
        titleTh: `รับทราบชั้นเรียน`,
        message: `Your class request for ${student.firstName} ${student.lastName} at ${locationText} has been acknowledged by the moderator.`,
        messageTh: `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ได้รับการรับทราบจากผู้ดูแล`,
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
    const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;

    await ctx.db.patch(args.classId, {
      status: "approved",
    });

    // Notify the teacher
    if (student) {
      const locationText = location?.name || classData.pendingLocationName || "Unknown location";
      const locationTextTh = location?.nameTh || classData.pendingLocationNameTh || "ไม่ทราบสถานที่";

      await ctx.db.insert("notifications", {
        title: `Class Approved`,
        titleTh: `อนุมัติชั้นเรียน`,
        message: `Your class request for ${student.firstName} ${student.lastName} at ${locationText} has been approved!`,
        messageTh: `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ได้รับการอนุมัติแล้ว!`,
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
    const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;

    await ctx.db.patch(args.classId, {
      status: "rejected",
    });

    // Notify the teacher
    if (student) {
      const locationText = location?.name || classData.pendingLocationName || "Unknown location";
      const locationTextTh = location?.nameTh || classData.pendingLocationNameTh || "ไม่ทราบสถานที่";

      await ctx.db.insert("notifications", {
        title: `Class Rejected`,
        titleTh: `ปฏิเสธชั้นเรียน`,
        message: args.reason || `Your class request for ${student.firstName} ${student.lastName} at ${locationText} has been rejected.`,
        messageTh: args.reasonTh || `คำขอชั้นเรียนของคุณสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} ถูกปฏิเสธ`,
        type: "error",
        userId: classData.teacherId,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Admin/Moderator: Update a class
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"), // User performing the update
    scheduledDate: v.optional(v.number()),
    studentId: v.optional(v.id("students")),
    locationId: v.optional(v.id("locations")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    // Get user and verify admin/moderator role
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can edit classes");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Build update object
    const updates: Partial<{
      scheduledDate: number;
      studentId: Id<"students">;
      locationId: Id<"locations">;
      status: "pending" | "acknowledged" | "approved" | "rejected";
    }> = {} as Record<string, unknown>;
    if (args.scheduledDate) updates.scheduledDate = args.scheduledDate;
    if (args.studentId) updates.studentId = args.studentId;
    if (args.locationId) updates.locationId = args.locationId;
    if (args.status) updates.status = args.status;

    // Update class
    await ctx.db.patch(args.classId, updates);

    // Get student info for notification
    const student = await ctx.db.get(args.studentId || classData.studentId);

    // Create notification to teacher
    if (student) {
      await ctx.db.insert("notifications", {
        userId: classData.teacherId,
        title: "Class Updated",
        titleTh: "มีการอัปเดตคลาส",
        message: `Your class with ${student.firstName} ${student.lastName} has been updated by ${user.username}`,
        messageTh: `คลาสของคุณกับ ${student.firstName} ${student.lastName} ถูกอัปเดตโดย ${user.username}`,
        type: "info",
        read: false,
        createdAt: Date.now(),
      });
    }

    return args.classId;
  },
});

// Admin/Moderator: Delete a class
export const deleteClass = mutation({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"), // User performing the deletion
  },
  handler: async (ctx, args) => {
    // Get user and verify admin/moderator role
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    if (!["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can delete classes");
    }

    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get student info for notification
    const student = await ctx.db.get(classData.studentId);

    // Create notification before deleting
    if (student) {
      await ctx.db.insert("notifications", {
        userId: classData.teacherId,
        title: "Class Deleted",
        titleTh: "ลบคลาสแล้ว",
        message: `Your class with ${student.firstName} ${student.lastName} has been deleted by ${user.username}`,
        messageTh: `คลาสของคุณกับ ${student.firstName} ${student.lastName} ถูกลบโดย ${user.username}`,
        type: "warning",
        read: false,
        createdAt: Date.now(),
      });
    }

    // Delete class
    await ctx.db.delete(args.classId);

    return { success: true };
  },
});
