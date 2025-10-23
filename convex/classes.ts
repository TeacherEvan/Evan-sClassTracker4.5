import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query } from "./_generated/server";
import { checkRateLimit, validateLength } from "./rateLimit";

/**
 * Authorization Helper: Verifies user has permission to access/modify a class
 * - Admins: Can access all schools
 * - Moderators: Can only access classes from their assigned school
 * - Teachers: Can only access their own classes (optional check)
 * 
 * @throws Error if unauthorized
 */
async function verifyClassAccess(
  ctx: MutationCtx,
  userId: Id<"users">,
  classData: Doc<"classes">,
  options: { requireModeratorOrAdmin?: boolean; allowTeacherOwner?: boolean } = {}
): Promise<void> {
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check role requirements if specified
  if (options.requireModeratorOrAdmin && !["admin", "moderator"].includes(user.role)) {
    throw new Error("Unauthorized: Only admins and moderators can perform this action");
  }

  // Admin has access to everything
  if (user.role === "admin") {
    return;
  }

  // Moderator can only access their assigned school
  if (user.role === "moderator") {
    if (!user.schoolId || user.schoolId !== classData.schoolId) {
      throw new Error("Unauthorized: Moderators can only manage classes from their assigned school");
    }
    return;
  }

  // Teacher can only access their own classes (if allowed)
  if (user.role === "teacher" && options.allowTeacherOwner) {
    if (classData.teacherId !== userId) {
      throw new Error("Unauthorized: You can only manage your own classes");
    }
    return;
  }

  // If we get here and teacher isn't allowed, throw error
  if (user.role === "teacher" && !options.allowTeacherOwner) {
    throw new Error("Unauthorized: This action is not available to teachers");
  }
}// Query to list classes
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
    // Also collect additional student IDs
    const additionalStudentIds = new Set<Id<"students">>();
    for (const cls of classes) {
      if (cls.additionalStudentIds) {
        for (const id of cls.additionalStudentIds) {
          additionalStudentIds.add(id);
        }
      }
    }
    const allStudentIds = [...new Set([...studentIds, ...additionalStudentIds])];

    const locationIds = [...new Set(classes.map(c => c.locationId).filter(Boolean))];

    const students = await Promise.all(allStudentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

    // Create lookup maps
    const studentMap = new Map(
      students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
    );
    const locationMap = new Map(
      locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
    );

    // Return enriched data with additional students
    return classes.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || null,
      additionalStudents: c.additionalStudentIds?.map(id => studentMap.get(id) || null).filter(Boolean) || [],
      location: c.locationId ? locationMap.get(c.locationId) || null : null,
    }));
  },
});

// Mutation to book a class with conflict detection
export const bookWithConflictCheck = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    studentId: v.id("students"),
    locationId: v.optional(v.id("locations")),
    pendingLocationName: v.optional(v.string()),
    pendingLocationNameTh: v.optional(v.string()),
    guardianTitle: v.optional(v.string()),
    scheduledDate: v.number(),
    bookedByUserId: v.id("users"),
    // Optional fields
    duration: v.optional(v.number()),
    subject: v.optional(v.string()),
    subjectTh: v.optional(v.string()),
    lessonTopic: v.optional(v.string()),
    lessonTopicTh: v.optional(v.string()),
    materials: v.optional(v.string()),
    materialsTh: v.optional(v.string()),
    preparationNotes: v.optional(v.string()),
    preparationNotesTh: v.optional(v.string()),
    classType: v.optional(v.union(
      v.literal("regular"),
      v.literal("makeup"),
      v.literal("trial"),
      v.literal("assessment")
    )),
    // Conflict handling
    forceCreate: v.optional(v.boolean()), // If true, create despite conflicts
  },
  handler: async (ctx, args) => {
    // Check for time conflicts first
    const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes
    const startRange = args.scheduledDate - TIME_TOLERANCE;
    const endRange = args.scheduledDate + TIME_TOLERANCE;

    const potentialConflicts = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.teacherId)
          .gte("scheduledDate", startRange)
          .lte("scheduledDate", endRange)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("schoolId"), args.schoolId),
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "acknowledged")
          )
        )
      )
      .collect();

    // Filter by location if provided
    const conflicts = potentialConflicts.filter((cls) => {
      if (args.locationId && cls.locationId !== args.locationId) {
        return false;
      }
      return true;
    });

    // If conflicts found and not forced, return conflict data
    if (conflicts.length > 0 && !args.forceCreate) {
      // Fetch student and location data for conflicts
      const studentIds = [...new Set(conflicts.map(c => c.studentId))];
      const locationIds = [...new Set(conflicts.map(c => c.locationId).filter(Boolean))];

      const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
      const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

      const studentMap = new Map(
        students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
      );
      const locationMap = new Map(
        locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
      );

      // Return conflict information
      return {
        success: false,
        hasConflicts: true,
        conflicts: conflicts.map(c => ({
          classId: c._id,
          studentId: c.studentId,
          studentName: studentMap.get(c.studentId) ?
            `${studentMap.get(c.studentId)!.firstName} ${studentMap.get(c.studentId)!.lastName}` :
            "Unknown",
          locationId: c.locationId,
          locationName: c.locationId && locationMap.get(c.locationId) ?
            locationMap.get(c.locationId)!.name :
            "Unknown",
          scheduledDate: c.scheduledDate,
          status: c.status,
          additionalStudentIds: c.additionalStudentIds || [],
        })),
      };
    }

    // No conflicts or force create - proceed with booking using existing logic
    // (Copy from original book mutation)
    await checkRateLimit(ctx, {
      key: `book-class:${args.bookedByUserId}`,
      limit: 30,
      windowMs: 60000,
    });

    // Validation (copied from original)
    if (args.pendingLocationName) {
      validateLength(args.pendingLocationName, "Location name", 200, 1);
    }
    if (args.pendingLocationNameTh) {
      validateLength(args.pendingLocationNameTh, "Thai location name", 200, 0);
    }
    if (args.guardianTitle) {
      validateLength(args.guardianTitle, "Guardian title", 100, 1);
    }
    if (args.subject) {
      validateLength(args.subject, "Subject", 100, 1);
    }
    if (args.subjectTh) {
      validateLength(args.subjectTh, "Thai subject", 100, 0);
    }
    if (args.lessonTopic) {
      validateLength(args.lessonTopic, "Lesson topic", 200, 1);
    }
    if (args.lessonTopicTh) {
      validateLength(args.lessonTopicTh, "Thai lesson topic", 200, 0);
    }
    if (args.materials) {
      validateLength(args.materials, "Materials", 500, 1);
    }
    if (args.materialsTh) {
      validateLength(args.materialsTh, "Thai materials", 500, 0);
    }
    if (args.preparationNotes) {
      validateLength(args.preparationNotes, "Preparation notes", 1000, 1);
    }
    if (args.preparationNotesTh) {
      validateLength(args.preparationNotesTh, "Thai preparation notes", 1000, 0);
    }
    if (args.duration && (args.duration < 1 || args.duration > 480)) {
      throw new Error("Duration must be between 1 and 480 minutes");
    }
    // Allow scheduling classes in the past - useful for makeup classes or retroactive entries
    if (!args.locationId && !args.pendingLocationName && !args.pendingLocationNameTh) {
      throw new Error("Must provide either a location or at least one pending location name");
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
      if (location.type === "guardian") {
        isGuardianLinked = true;
        if (!args.guardianTitle?.trim()) {
          throw new Error("Guardian title is required for guardian-linked classes");
        }
      }
    }

    // Get the user who is booking
    const bookingUser = await ctx.db.get(args.bookedByUserId);
    if (!bookingUser) {
      throw new Error("User not found");
    }

    // Determine status
    // Moderators and admins creating new classes don't need acknowledgement
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
      ...(args.duration && { duration: args.duration }),
      ...(args.subject && { subject: args.subject }),
      ...(args.subjectTh && { subjectTh: args.subjectTh }),
      ...(args.lessonTopic && { lessonTopic: args.lessonTopic }),
      ...(args.lessonTopicTh && { lessonTopicTh: args.lessonTopicTh }),
      ...(args.materials && { materials: args.materials }),
      ...(args.materialsTh && { materialsTh: args.materialsTh }),
      ...(args.preparationNotes && { preparationNotes: args.preparationNotes }),
      ...(args.preparationNotesTh && { preparationNotesTh: args.preparationNotesTh }),
      ...(args.classType && { classType: args.classType }),
    });

    // Notifications and logging (same as original)
    const school = await ctx.db.get(args.schoolId);
    const location = args.locationId ? await ctx.db.get(args.locationId) : null;
    const locationText = location?.name || args.pendingLocationName || "Unknown location";
    const locationTextTh = location?.nameTh || args.pendingLocationNameTh || "ไม่ทราบสถานที่";

    if (!isGuardianLinked && !isModerator && school && school.moderatorId) {
      const teacher = await ctx.db.get(args.teacherId);
      // Notification for teacher request - requires acknowledgement
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

    return {
      success: true,
      hasConflicts: false,
      classId,
    };
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
    // Optional fields
    duration: v.optional(v.number()),
    subject: v.optional(v.string()),
    subjectTh: v.optional(v.string()),
    lessonTopic: v.optional(v.string()),
    lessonTopicTh: v.optional(v.string()),
    materials: v.optional(v.string()),
    materialsTh: v.optional(v.string()),
    preparationNotes: v.optional(v.string()),
    preparationNotesTh: v.optional(v.string()),
    classType: v.optional(v.union(
      v.literal("regular"),
      v.literal("makeup"),
      v.literal("trial"),
      v.literal("assessment")
    )),
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Rate limiting - max 30 class bookings per minute per user
    await checkRateLimit(ctx, {
      key: `book-class:${args.bookedByUserId}`,
      limit: 30,
      windowMs: 60000, // 1 minute
    });

    // ✅ SECURITY: Validate pending location names if provided
    if (args.pendingLocationName) {
      validateLength(args.pendingLocationName, "Location name", 200, 1);
    }
    if (args.pendingLocationNameTh) {
      validateLength(args.pendingLocationNameTh, "Thai location name", 200, 0);
    }
    if (args.guardianTitle) {
      validateLength(args.guardianTitle, "Guardian title", 100, 1);
    }

    // ✅ SECURITY: Validate optional fields if provided
    if (args.subject) {
      validateLength(args.subject, "Subject", 100, 1);
    }
    if (args.subjectTh) {
      validateLength(args.subjectTh, "Thai subject", 100, 0);
    }
    if (args.lessonTopic) {
      validateLength(args.lessonTopic, "Lesson topic", 200, 1);
    }
    if (args.lessonTopicTh) {
      validateLength(args.lessonTopicTh, "Thai lesson topic", 200, 0);
    }
    if (args.materials) {
      validateLength(args.materials, "Materials", 500, 1);
    }
    if (args.materialsTh) {
      validateLength(args.materialsTh, "Thai materials", 500, 0);
    }
    if (args.preparationNotes) {
      validateLength(args.preparationNotes, "Preparation notes", 1000, 1);
    }
    if (args.preparationNotesTh) {
      validateLength(args.preparationNotesTh, "Thai preparation notes", 1000, 0);
    }
    if (args.duration && (args.duration < 1 || args.duration > 480)) {
      throw new Error("Duration must be between 1 and 480 minutes");
    }

    // Allow scheduling classes in the past - useful for makeup classes or retroactive entries
    // The same acknowledgement workflow applies regardless of past or future dates

    // Validate location - either locationId or at least one pending location name must be provided
    if (!args.locationId && !args.pendingLocationName && !args.pendingLocationNameTh) {
      throw new Error("Must provide either a location or at least one pending location name");
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
    // Moderators and admins can directly book (approved status) - NO ACKNOWLEDGEMENT NEEDED FOR NEW CLASSES
    // Teachers create requests (pending status) - REQUIRES ACKNOWLEDGEMENT
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
      // Include optional fields if provided
      ...(args.duration && { duration: args.duration }),
      ...(args.subject && { subject: args.subject }),
      ...(args.subjectTh && { subjectTh: args.subjectTh }),
      ...(args.lessonTopic && { lessonTopic: args.lessonTopic }),
      ...(args.lessonTopicTh && { lessonTopicTh: args.lessonTopicTh }),
      ...(args.materials && { materials: args.materials }),
      ...(args.materialsTh && { materialsTh: args.materialsTh }),
      ...(args.preparationNotes && { preparationNotes: args.preparationNotes }),
      ...(args.preparationNotesTh && { preparationNotesTh: args.preparationNotesTh }),
      ...(args.classType && { classType: args.classType }),
    });

    // Get the school to find the moderator
    const school = await ctx.db.get(args.schoolId);

    // Get location info for notifications (if provided)
    const location = args.locationId ? await ctx.db.get(args.locationId) : null;
    const locationText = location?.name || args.pendingLocationName || "Unknown location";
    const locationTextTh = location?.nameTh || args.pendingLocationNameTh || "ไม่ทราบสถานที่";

    // Only send notification if it's a teacher request (pending status)
    // Skip notification for:
    // 1. Guardian-linked classes (auto-approved)
    // 2. Moderator/admin created classes (they don't need to acknowledge their own new classes)
    // Note: Moderators DO need acknowledgement when EDITING existing classes (handled in editClass mutation)
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

// Mutation to acknowledge a class booking (moderator/admin)
export const acknowledge = mutation({
  args: {
    userId: v.id("users"), // ID of the moderator/admin performing the action
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization (replaces 15+ lines of duplicate code)
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true
    });

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

// Mutation to approve a class (moderator/admin)
export const approve = mutation({
  args: {
    userId: v.id("users"), // ID of the moderator/admin performing the action
    classId: v.id("classes"),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization (replaces duplicate code)
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true
    });

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

// Mutation to reject a class (moderator/admin)
export const reject = mutation({
  args: {
    userId: v.id("users"), // ID of the moderator/admin performing the action
    classId: v.id("classes"),
    reason: v.optional(v.string()),
    reasonTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);

    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization (replaces duplicate code)
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true
    });

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
    userId: v.id("users"), // ID of the user performing the update
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
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization (replaces duplicate code)
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true
    });

    // Get user for notification
    const user = await ctx.db.get(args.userId);

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
    if (student && user) {
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
    userId: v.id("users"), // ID of the user performing the deletion
  },
  handler: async (ctx, args) => {
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Verify authorization (replaces duplicate code)
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true
    });

    // Check if class date has not passed yet
    const currentTime = Date.now();
    if (classData.scheduledDate < currentTime) {
      throw new Error("Cannot delete classes whose dates have already passed");
    }

    // Get user for notification message
    const user = await ctx.db.get(args.userId);

    // Get student info for notification
    const student = await ctx.db.get(classData.studentId);

    // Create notification before deleting
    if (student && user) {
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

    // Log the deletion for audit trail
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      username: user!.username,
      userRole: user!.role,
      action: "delete_class",
      targetType: "classes",
      targetId: args.classId,
      targetName: student ? `${student.firstName} ${student.lastName} - ${new Date(classData.scheduledDate).toLocaleDateString()}` : undefined,
      schoolId: classData.schoolId,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to edit a class with full audit trail
export const editClass = mutation({
  args: {
    userId: v.id("users"),
    classId: v.id("classes"),
    updates: v.object({
      studentId: v.optional(v.id("students")),
      locationId: v.optional(v.id("locations")),
      scheduledDate: v.optional(v.number()),
      duration: v.optional(v.number()),
      subject: v.optional(v.string()),
      subjectTh: v.optional(v.string()),
      lessonTopic: v.optional(v.string()),
      lessonTopicTh: v.optional(v.string()),
      materials: v.optional(v.string()),
      materialsTh: v.optional(v.string()),
      preparationNotes: v.optional(v.string()),
      preparationNotesTh: v.optional(v.string()),
      classType: v.optional(v.union(
        v.literal("regular"),
        v.literal("makeup"),
        v.literal("assessment"),
        v.literal("trial")
      )),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Fetch current class data
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // 2. Get user for audit trail
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // 3. Verify authorization using helper
    // Teachers can only edit their own classes
    // Moderators can edit classes in their assigned school
    // Admins can edit classes from any school
    const isTeacher = user.role === "teacher" && classData.teacherId === args.userId;

    if (isTeacher) {
      // Teacher editing their own class
      await verifyClassAccess(ctx, args.userId, classData, {
        allowTeacherOwner: true
      });
    } else {
      // Moderator or admin
      await verifyClassAccess(ctx, args.userId, classData, {
        requireModeratorOrAdmin: true
      });
    }

    // 4. Build change log
    const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];

    // Helper function to format values for logging
    const formatValue = (field: string, value: unknown): string => {
      if (value === undefined || value === null) return "Not set";
      if (field.includes("Date") && typeof value === "number") {
        return new Date(value).toLocaleString();
      }
      return String(value);
    };

    // Check each field for changes
    if (args.updates.studentId !== undefined && args.updates.studentId !== classData.studentId) {
      const oldStudent = await ctx.db.get(classData.studentId);
      const newStudent = await ctx.db.get(args.updates.studentId);
      changes.push({
        field: "student",
        oldValue: oldStudent ? `${oldStudent.firstName} ${oldStudent.lastName}` : "Unknown",
        newValue: newStudent ? `${newStudent.firstName} ${newStudent.lastName}` : "Unknown",
      });
    }

    if (args.updates.locationId !== undefined && args.updates.locationId !== classData.locationId) {
      const oldLocation = classData.locationId ? await ctx.db.get(classData.locationId) : null;
      const newLocation = await ctx.db.get(args.updates.locationId);
      changes.push({
        field: "location",
        oldValue: oldLocation?.name || "Not set",
        newValue: newLocation?.name || "Not set",
      });
    }

    if (args.updates.scheduledDate !== undefined && args.updates.scheduledDate !== classData.scheduledDate) {
      changes.push({
        field: "scheduledDate",
        oldValue: formatValue("scheduledDate", classData.scheduledDate),
        newValue: formatValue("scheduledDate", args.updates.scheduledDate),
      });
    }

    // Log optional field changes
    const optionalFields = [
      "duration", "subject", "subjectTh", "lessonTopic", "lessonTopicTh",
      "materials", "materialsTh", "preparationNotes", "preparationNotesTh", "classType"
    ] as const;

    for (const field of optionalFields) {
      if (args.updates[field] !== undefined && args.updates[field] !== classData[field]) {
        changes.push({
          field,
          oldValue: formatValue(field, classData[field]),
          newValue: formatValue(field, args.updates[field]),
        });
      }
    }

    // If no changes, don't update
    if (changes.length === 0) {
      return { success: true, message: "No changes detected" };
    }

    // 5. Prepare edit history entry
    const editHistoryEntry = {
      editedAt: Date.now(),
      editedBy: args.userId,
      editedByName: user.username,
      editedByRole: user.role,
      changes,
    };

    // 6. Update class with new data and edit history
    const existingHistory = classData.editHistory || [];
    await ctx.db.patch(args.classId, {
      ...args.updates,
      isEdited: true,
      lastEditedAt: Date.now(),
      lastEditedBy: args.userId,
      editHistory: [...existingHistory, editHistoryEntry],
    });

    // 7. Send notification to moderator (if teacher edited)
    if (user.role === "teacher") {
      const school = await ctx.db.get(classData.schoolId);
      if (school?.moderatorId) {
        const student = await ctx.db.get(classData.studentId);
        await ctx.db.insert("notifications", {
          userId: school.moderatorId,
          title: "Class Edited",
          titleTh: "แก้ไขคลาสแล้ว",
          message: `Teacher ${user.username} edited their class with ${student?.firstName} ${student?.lastName}. ${changes.length} change(s) made.`,
          messageTh: `ครู ${user.username} แก้ไขคลาสของพวกเขากับ ${student?.firstName} ${student?.lastName}. มีการเปลี่ยนแปลง ${changes.length} รายการ`,
          type: "info",
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    // 8. Log the edit action
    await ctx.db.insert("teacherLogs", {
      teacherId: classData.teacherId,
      schoolId: classData.schoolId,
      action: "class_edited",
      actionTh: "แก้ไขคลาส",
      details: `Class edited by ${user.username}. Changes: ${changes.map(c => c.field).join(", ")}`,
      detailsTh: `แก้ไขคลาสโดย ${user.username}. การเปลี่ยนแปลง: ${changes.map(c => c.field).join(", ")}`,
      relatedClassId: args.classId,
      createdAt: Date.now(),
    });

    return { success: true, changesCount: changes.length };
  },
});

// Mutation to add additional dates to an existing class (creates copies with new dates)
export const addDatesToClass = mutation({
  args: {
    userId: v.id("users"),
    classId: v.id("classes"),
    newDates: v.array(v.number()), // Array of timestamps for new class dates
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Rate limiting - max 20 date additions per minute per user
    await checkRateLimit(ctx, {
      key: `add-dates:${args.userId}`,
      limit: 20,
      windowMs: 60000, // 1 minute
    });

    // Validate input
    if (args.newDates.length === 0) {
      throw new Error("Please provide at least one new date");
    }
    if (args.newDates.length > 14) {
      throw new Error("Cannot add more than 14 dates at once");
    }

    // 1. Fetch current class data
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // 2. Get user for authorization
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // 3. Verify authorization
    const isTeacher = user.role === "teacher" && classData.teacherId === args.userId;

    if (isTeacher) {
      await verifyClassAccess(ctx, args.userId, classData, {
        allowTeacherOwner: true
      });
    } else {
      await verifyClassAccess(ctx, args.userId, classData, {
        requireModeratorOrAdmin: true
      });
    }

    // 4. Check school exists
    const school = await ctx.db.get(classData.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // 5. Determine if this is a moderator/admin booking
    const isModerator = user.role === "admin" || user.role === "moderator";
    const isGuardianLinked = classData.isGuardianLinked || false;

    // 6. Create new class entries for each date
    const createdClassIds: string[] = [];
    const student = await ctx.db.get(classData.studentId);

    for (const scheduledDate of args.newDates) {
      // Create new class with same details but new date
      const newClassId = await ctx.db.insert("classes", {
        schoolId: classData.schoolId,
        teacherId: classData.teacherId,
        studentId: classData.studentId,
        locationId: classData.locationId,
        scheduledDate,
        duration: classData.duration,
        status: isModerator || isGuardianLinked ? "approved" : "pending",
        isGuardianLinked,
        createdAt: Date.now(),
        // Optional fields
        ...(classData.subject && { subject: classData.subject }),
        ...(classData.subjectTh && { subjectTh: classData.subjectTh }),
        ...(classData.lessonTopic && { lessonTopic: classData.lessonTopic }),
        ...(classData.lessonTopicTh && { lessonTopicTh: classData.lessonTopicTh }),
        ...(classData.materials && { materials: classData.materials }),
        ...(classData.materialsTh && { materialsTh: classData.materialsTh }),
        ...(classData.preparationNotes && { preparationNotes: classData.preparationNotes }),
        ...(classData.preparationNotesTh && { preparationNotesTh: classData.preparationNotesTh }),
        ...(classData.classType && { classType: classData.classType }),
      });
      createdClassIds.push(newClassId);
    }

    // 7. Get location info for notifications
    const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;
    const locationText = location?.name || "Unknown location";
    const locationTextTh = location?.nameTh || "ไม่ทราบสถานที่";

    // 8. Send notification to moderator (if teacher added dates)
    if (!isGuardianLinked && !isModerator && school?.moderatorId) {
      await ctx.db.insert("notifications", {
        userId: school.moderatorId,
        title: `Additional Class Dates Requested`,
        titleTh: `ขอวันเรียนเพิ่มเติม`,
        message: `Teacher ${user.username} added ${args.newDates.length} date(s) for ${student?.firstName} ${student?.lastName} at ${locationText}. Please review.`,
        messageTh: `ครู ${user.username} เพิ่ม ${args.newDates.length} วันสำหรับ ${student?.firstName} ${student?.lastName} ที่ ${locationTextTh} กรุณาตรวจสอบ`,
        type: "warning",
        read: false,
        createdAt: Date.now(),
      });
    }

    // 9. Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: classData.teacherId,
      schoolId: classData.schoolId,
      action: "dates_added",
      actionTh: "เพิ่มวันเรียน",
      details: `Added ${args.newDates.length} date(s) for ${student?.firstName} ${student?.lastName} at ${locationText}`,
      detailsTh: `เพิ่ม ${args.newDates.length} วันสำหรับ ${student?.firstName} ${student?.lastName} ที่ ${locationTextTh}`,
      relatedClassId: args.classId,
      relatedStudentId: classData.studentId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      createdCount: createdClassIds.length,
      classIds: createdClassIds
    };
  },
});

// Query to check for time conflicts when booking a class
export const checkTimeConflicts = query({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    scheduledDate: v.number(),
    locationId: v.optional(v.id("locations")),
    excludeClassId: v.optional(v.id("classes")), // Exclude a specific class (for edits)
  },
  handler: async (ctx, args) => {
    // Time tolerance: classes within ±5 minutes are considered conflicting
    const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes in milliseconds
    const startRange = args.scheduledDate - TIME_TOLERANCE;
    const endRange = args.scheduledDate + TIME_TOLERANCE;

    // Query classes for the same teacher, school, and time range
    const potentialConflicts = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.teacherId)
          .gte("scheduledDate", startRange)
          .lte("scheduledDate", endRange)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("schoolId"), args.schoolId),
          // Only consider approved or pending classes (not rejected)
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "acknowledged")
          )
        )
      )
      .collect();

    // Filter by location if provided and exclude specific class if needed
    const conflicts = potentialConflicts.filter((cls) => {
      // Exclude the class being edited
      if (args.excludeClassId && cls._id === args.excludeClassId) {
        return false;
      }
      // If location is specified, only flag conflicts at the same location
      if (args.locationId && cls.locationId !== args.locationId) {
        return false;
      }
      return true;
    });

    // Batch fetch student and location data for conflicts
    const studentIds = [...new Set(conflicts.map(c => c.studentId))];
    const locationIds = [...new Set(conflicts.map(c => c.locationId).filter(Boolean))];

    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const locations = await Promise.all(locationIds.map(id => ctx.db.get(id!)));

    const studentMap = new Map(
      students.filter((s): s is NonNullable<typeof s> => s !== null).map(s => [s._id, s])
    );
    const locationMap = new Map(
      locations.filter((l): l is NonNullable<typeof l> => l !== null).map(l => [l._id, l])
    );

    // Return enriched conflict data
    return conflicts.map(c => ({
      ...c,
      student: studentMap.get(c.studentId) || null,
      location: c.locationId ? locationMap.get(c.locationId) || null : null,
    }));
  },
});

// Query to get edit analytics for mods/admins
export const getEditAnalytics = query({
  args: {
    userId: v.id("users"),
    schoolId: v.id("schools"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify user is mod/admin
    const user = await ctx.db.get(args.userId);
    if (!user || !["admin", "moderator"].includes(user.role)) {
      throw new Error("Unauthorized: Only admins and moderators can view edit analytics");
    }

    // If moderator, verify they manage this school
    if (user.role === "moderator") {
      const school = await ctx.db.get(args.schoolId);
      if (school?.moderatorId !== args.userId) {
        throw new Error("Unauthorized: You can only view analytics for your school");
      }
    }

    // Query edited classes
    const query = ctx.db
      .query("classes")
      .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
      .filter((q) => q.eq(q.field("isEdited"), true));

    const editedClasses = await query.collect();

    // Filter by date range if provided
    let filteredClasses = editedClasses;
    if (args.startDate && args.endDate) {
      filteredClasses = editedClasses.filter(
        (cls) =>
          cls.lastEditedAt &&
          cls.lastEditedAt >= args.startDate! &&
          cls.lastEditedAt <= args.endDate!
      );
    }

    // Batch fetch related entities
    const studentIds = [...new Set(filteredClasses.map((c) => c.studentId))];
    const teacherIds = [...new Set(filteredClasses.map((c) => c.teacherId))];

    const students = await Promise.all(studentIds.map((id) => ctx.db.get(id)));
    const teachers = await Promise.all(teacherIds.map((id) => ctx.db.get(id)));

    const studentMap = new Map(students.map((s) => [s?._id, s]));
    const teacherMap = new Map(teachers.map((t) => [t?._id, t]));

    // Build analytics data
    const analytics = filteredClasses.map((cls) => ({
      classId: cls._id,
      student: studentMap.get(cls.studentId),
      teacher: teacherMap.get(cls.teacherId),
      scheduledDate: cls.scheduledDate,
      lastEditedAt: cls.lastEditedAt,
      lastEditedBy: cls.lastEditedBy,
      editCount: cls.editHistory?.length || 0,
      editHistory: cls.editHistory || [],
    }));

    return analytics;
  },
});

// Mutation to add a student to an existing class
export const addStudentToClass = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    classId: v.id("classes"),
    studentId: v.id("students"), // Student to add
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, {
      key: `addStudent_${args.userId}`,
      limit: 100,
      windowMs: 60000, // 100 per minute
    });

    // Get the class
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get the user performing the action
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Authorization check using helper
    // Teachers can add to their own classes, moderators to their school, admins to any
    if (user.role === "teacher") {
      await verifyClassAccess(ctx, args.userId, classData, {
        allowTeacherOwner: true
      });
    } else {
      await verifyClassAccess(ctx, args.userId, classData, {
        requireModeratorOrAdmin: true
      });
    }

    // Verify the student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Check if student is already in the class
    if (classData.studentId === args.studentId) {
      throw new Error("This student is already the primary student in this class");
    }

    const existingAdditionalStudents = classData.additionalStudentIds || [];
    if (existingAdditionalStudents.includes(args.studentId)) {
      throw new Error("This student is already added to this class");
    }

    // Add the student to the class
    const updatedAdditionalStudents = [...existingAdditionalStudents, args.studentId];

    await ctx.db.patch(args.classId, {
      additionalStudentIds: updatedAdditionalStudents,
    });

    // Get primary student for logging
    const primaryStudent = await ctx.db.get(classData.studentId);

    // Create notification for the teacher (if not the one who added)
    if (classData.teacherId !== args.userId) {
      await ctx.db.insert("notifications", {
        title: "Student Added to Your Class",
        titleTh: "เพิ่มนักเรียนในคลาสของคุณ",
        message: `${user.username} added ${student.firstName} ${student.lastName} to your class with ${primaryStudent?.firstName} ${primaryStudent?.lastName}`,
        messageTh: `${user.username} ได้เพิ่ม ${student.firstName} ${student.lastName} ในคลาสของคุณกับ ${primaryStudent?.firstName} ${primaryStudent?.lastName}`,
        type: "info",
        userId: classData.teacherId,
        read: false,
        createdAt: Date.now(),
      });
    }

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: classData.teacherId,
      schoolId: classData.schoolId,
      action: "student_added_to_class",
      actionTh: "เพิ่มนักเรียนในคลาส",
      details: `${user.username} added ${student.firstName} ${student.lastName} to class (now ${updatedAdditionalStudents.length + 1} students)`,
      detailsTh: `${user.username} เพิ่ม ${student.firstName} ${student.lastName} ในคลาส (ตอนนี้มี ${updatedAdditionalStudents.length + 1} คน)`,
      relatedClassId: args.classId,
      relatedStudentId: args.studentId,
      createdAt: Date.now(),
    });

    return { success: true, totalStudents: updatedAdditionalStudents.length + 1 };
  },
});

// Mutation to remove a student from a class
export const removeStudentFromClass = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    classId: v.id("classes"),
    studentId: v.id("students"), // Student to remove
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, {
      key: `removeStudent_${args.userId}`,
      limit: 100,
      windowMs: 60000, // 100 per minute
    });

    // Get the class
    const classData = await ctx.db.get(args.classId);
    if (!classData) {
      throw new Error("Class not found");
    }

    // Get the user performing the action
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Authorization check using helper
    if (user.role === "teacher") {
      await verifyClassAccess(ctx, args.userId, classData, {
        allowTeacherOwner: true
      });
    } else {
      await verifyClassAccess(ctx, args.userId, classData, {
        requireModeratorOrAdmin: true
      });
    }

    // Cannot remove the primary student
    if (classData.studentId === args.studentId) {
      throw new Error("Cannot remove the primary student. Consider merging or deleting the class instead.");
    }

    const existingAdditionalStudents = classData.additionalStudentIds || [];
    if (!existingAdditionalStudents.includes(args.studentId)) {
      throw new Error("This student is not in the additional students list");
    }

    // Remove the student
    const updatedAdditionalStudents = existingAdditionalStudents.filter(
      (id) => id !== args.studentId
    );

    await ctx.db.patch(args.classId, {
      additionalStudentIds: updatedAdditionalStudents,
    });

    const student = await ctx.db.get(args.studentId);

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: classData.teacherId,
      schoolId: classData.schoolId,
      action: "student_removed_from_class",
      actionTh: "ลบนักเรียนออกจากคลาส",
      details: `${user.username} removed ${student?.firstName} ${student?.lastName} from class (now ${updatedAdditionalStudents.length + 1} students)`,
      detailsTh: `${user.username} ลบ ${student?.firstName} ${student?.lastName} ออกจากคลาส (ตอนนี้มี ${updatedAdditionalStudents.length + 1} คน)`,
      relatedClassId: args.classId,
      relatedStudentId: args.studentId,
      createdAt: Date.now(),
    });

    return { success: true, totalStudents: updatedAdditionalStudents.length + 1 };
  },
});

// Mutation to merge multiple classes into one
export const mergeClasses = mutation({
  args: {
    userId: v.id("users"), // User performing the action
    targetClassId: v.id("classes"), // The class to merge into (will keep this one)
    sourceClassIds: v.array(v.id("classes")), // The classes to merge from (will be deleted)
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, {
      key: `mergeClasses_${args.userId}`,
      limit: 50,
      windowMs: 60000, // 50 per minute
    });

    // Get the target class
    const targetClass = await ctx.db.get(args.targetClassId);
    if (!targetClass) {
      throw new Error("Target class not found");
    }

    // Get the user performing the action
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Authorization check using helper
    if (user.role === "teacher") {
      await verifyClassAccess(ctx, args.userId, targetClass, {
        allowTeacherOwner: true
      });
    } else {
      await verifyClassAccess(ctx, args.userId, targetClass, {
        requireModeratorOrAdmin: true
      });
    }

    // Validate source classes
    if (args.sourceClassIds.length === 0) {
      throw new Error("No source classes provided");
    }

    if (args.sourceClassIds.includes(args.targetClassId)) {
      throw new Error("Cannot merge a class into itself");
    }

    // Get all source classes
    const sourceClasses = await Promise.all(
      args.sourceClassIds.map((id) => ctx.db.get(id))
    );

    // Verify all source classes exist and belong to the same teacher and school
    for (const sourceClass of sourceClasses) {
      if (!sourceClass) {
        throw new Error("One or more source classes not found");
      }

      if (sourceClass.teacherId !== targetClass.teacherId) {
        throw new Error("Can only merge classes from the same teacher");
      }

      if (sourceClass.schoolId !== targetClass.schoolId) {
        throw new Error("Can only merge classes from the same school");
      }

      // Check if scheduled for the same date/time
      if (sourceClass.scheduledDate !== targetClass.scheduledDate) {
        throw new Error("Can only merge classes scheduled for the same date and time");
      }

      // Check if at the same location
      if (sourceClass.locationId !== targetClass.locationId) {
        throw new Error("Can only merge classes at the same location");
      }
    }

    // Collect all students from source classes
    const additionalStudents = new Set(targetClass.additionalStudentIds || []);
    const primaryStudentIds: Id<"students">[] = [targetClass.studentId];

    for (const sourceClass of sourceClasses) {
      if (sourceClass) {
        // Add primary student if not already the target's primary student
        if (sourceClass.studentId !== targetClass.studentId) {
          additionalStudents.add(sourceClass.studentId);
        }
        // Add all additional students
        if (sourceClass.additionalStudentIds) {
          for (const studentId of sourceClass.additionalStudentIds) {
            if (studentId !== targetClass.studentId) {
              additionalStudents.add(studentId);
            }
          }
        }
        primaryStudentIds.push(sourceClass.studentId);
      }
    }

    // Update the target class with merged students
    await ctx.db.patch(args.targetClassId, {
      additionalStudentIds: Array.from(additionalStudents),
    });

    // Get student names for logging
    const studentPromises = primaryStudentIds.map((id) => ctx.db.get(id));
    const students = await Promise.all(studentPromises);
    const studentNames = students
      .filter((s) => s !== null)
      .map((s) => `${s?.firstName} ${s?.lastName}`)
      .join(", ");

    // Delete source classes
    for (const classId of args.sourceClassIds) {
      await ctx.db.delete(classId);
    }

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: targetClass.teacherId,
      schoolId: targetClass.schoolId,
      action: "classes_merged",
      actionTh: "รวมคลาส",
      details: `${user.username} merged ${args.sourceClassIds.length} classes into one (Students: ${studentNames}). Total students: ${additionalStudents.size + 1}`,
      detailsTh: `${user.username} รวม ${args.sourceClassIds.length} คลาสเป็นหนึ่งเดียว (นักเรียน: ${studentNames}) รวม: ${additionalStudents.size + 1} คน`,
      relatedClassId: args.targetClassId,
      createdAt: Date.now(),
    });

    // Notify the teacher (if not the one who merged)
    if (targetClass.teacherId !== args.userId) {
      await ctx.db.insert("notifications", {
        title: "Classes Merged",
        titleTh: "รวมคลาส",
        message: `${user.username} merged ${args.sourceClassIds.length} of your classes into one class. Total students: ${additionalStudents.size + 1}`,
        messageTh: `${user.username} รวม ${args.sourceClassIds.length} คลาสของคุณเป็นหนึ่งเดียว รวมนักเรียน: ${additionalStudents.size + 1} คน`,
        type: "info",
        userId: targetClass.teacherId,
        read: false,
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      totalStudents: additionalStudents.size + 1,
      mergedClassIds: args.sourceClassIds,
    };
  },
});

// Query to get upcoming classes for notification window
export const getUpcomingForNotification = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return [];
    }

    const now = Date.now();
    const sevenDaysFromNow = now + 7 * 24 * 60 * 60 * 1000;

    // Get approved classes for this teacher in the next 7 days
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", args.userId).gte("scheduledDate", now)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "approved"),
          q.lte(q.field("scheduledDate"), sevenDaysFromNow)
        )
      )
      .order("asc")
      .take(5);

    // Enrich with student and location data
    const enrichedClasses = await Promise.all(
      classes.map(async (cls) => {
        const student = await ctx.db.get(cls.studentId);
        let locationName = "";

        if (cls.locationId) {
          const location = await ctx.db.get(cls.locationId);
          locationName = location
            ? user.role === "admin" || user.role === "moderator"
              ? `${location.name} / ${location.nameTh}`
              : location.name
            : "";
        } else if (cls.pendingLocationName) {
          locationName = cls.pendingLocationName;
        }

        return {
          _id: cls._id,
          scheduledDate: cls.scheduledDate,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : "Unknown Student",
          locationName: locationName || "No location",
        };
      })
    );

    return enrichedClasses;
  },
});
