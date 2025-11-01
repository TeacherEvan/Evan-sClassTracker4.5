import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, MutationCtx, query } from "./_generated/server";
import { logAudit } from "./auditHelpers";
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

  // Check role requirements if specified (after checking teacher owner exception)
  if (options.requireModeratorOrAdmin && !["admin", "moderator"].includes(user.role)) {
    throw new Error("Unauthorized: Only admins and moderators can perform this action");
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
    schoolId: v.optional(v.id("schools")), // Optional for provider classes
    providerId: v.optional(v.id("providers")), // Optional for provider classes
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
    // XOR validation - must have EITHER schoolId OR providerId (not both, not neither)
    const hasSchool = args.schoolId !== undefined;
    const hasProvider = args.providerId !== undefined;
    if (hasSchool && hasProvider) {
      throw new Error("Class cannot be linked to both school and provider - choose one");
    }
    if (!hasSchool && !hasProvider) {
      throw new Error("Class must be linked to either a school or a provider");
    }

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
      .filter((q) => {
        // Match by school or provider
        const entityMatch = args.schoolId
          ? q.eq(q.field("schoolId"), args.schoolId)
          : q.eq(q.field("providerId"), args.providerId);

        return q.and(
          entityMatch,
          q.or(
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "acknowledged")
          )
        );
      })
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
    // Provider classes and guardian-linked classes are auto-approved
    // Moderators and admins creating new classes don't need acknowledgement
    const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
    const isProviderLinked = args.providerId !== undefined;
    const status = isProviderLinked || isGuardianLinked || isModerator ? "approved" : "pending";
    const now = Date.now();

    let approvalMetadata: Record<string, unknown> = {};
    if (status === "approved") {
      if (isModerator) {
        approvalMetadata = {
          approvedByUserId: bookingUser._id,
          approvedByUsername: bookingUser.username,
          approvedAt: now,
          approvalSource: bookingUser.role === "admin" ? "admin" : "moderator",
        };
      } else if (isProviderLinked) {
        approvalMetadata = {
          approvedByUsername: "System (Provider Auto)",
          approvedAt: now,
          approvalSource: "auto_provider",
        };
      } else if (isGuardianLinked) {
        approvalMetadata = {
          approvedByUsername: "System (Guardian Auto)",
          approvedAt: now,
          approvalSource: "auto_guardian",
        };
      } else {
        approvalMetadata = {
          approvedByUsername: "System Auto-Approve",
          approvedAt: now,
          approvalSource: "system",
        };
      }
    }

    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      ...(args.schoolId && { schoolId: args.schoolId }),
      ...(args.providerId && { providerId: args.providerId }),
      studentId: args.studentId,
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      guardianTitle: args.guardianTitle,
      isGuardianLinked,
      status,
      scheduledDate: args.scheduledDate,
      createdAt: now,
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
      bookedByUserId: bookingUser._id,
      bookedByUsername: bookingUser.username,
      ...approvalMetadata,
    });

    // Notifications and logging (only for school classes)
    if (args.schoolId) {
      const school = await ctx.db.get(args.schoolId);
      const location = args.locationId ? await ctx.db.get(args.locationId) : null;
      const locationText = location?.name || args.pendingLocationName || "Unknown location";
      const locationTextTh = location?.nameTh || args.pendingLocationNameTh || "ไม่ทราบสถานที่";

      if (!isGuardianLinked && !isProviderLinked && !isModerator && school && school.moderatorId) {
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
    }

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
    schoolId: v.optional(v.id("schools")), // NOW OPTIONAL - alternative to providerId
    providerId: v.optional(v.id("providers")), // NEW - alternative to schoolId
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
    // ✅ NEW: XOR VALIDATION - Class must have EITHER schoolId OR providerId (not both, not neither)
    const hasSchool = !!args.schoolId;
    const hasProvider = !!args.providerId;

    if (hasSchool && hasProvider) {
      throw new Error("Class cannot be linked to both a school and a provider. Please choose one.");
    }

    if (!hasSchool && !hasProvider) {
      throw new Error("Class must be linked to either a school or a provider");
    }

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

    // NEW FEATURE (Oct 30, 2025): Check if past date is within teacher's active cycle
    const isPastDate = args.scheduledDate < Date.now();
    let isWithinCycle = false;

    if (isPastDate) {
      // Check teacher's active cycle
      const activeCycle = await ctx.db
        .query("teacherClassCountCycles")
        .withIndex("by_teacher_and_active", (q) =>
          q.eq("teacherId", args.teacherId).eq("isActive", true)
        )
        .first();

      if (activeCycle) {
        isWithinCycle = args.scheduledDate >= activeCycle.cycleStartDate &&
          args.scheduledDate <= activeCycle.cycleEndDate;
      }
    }

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

    // Determine status based on who is booking and whether it's guardian-linked or provider-linked
    // Guardian-linked classes are auto-approved (no moderator workflow)
    // Provider-linked classes are auto-approved (no moderator workflow) - NEW
    // Moderators and admins can directly book (approved status) - NO ACKNOWLEDGEMENT NEEDED FOR NEW CLASSES
    // Teachers create requests (pending status) - REQUIRES ACKNOWLEDGEMENT (school classes only)
    const isModerator = bookingUser.role === "moderator" || bookingUser.role === "admin";
    const isProviderLinked = args.providerId !== undefined;
    const status = isGuardianLinked || isProviderLinked || isModerator ? "approved" : "pending";
    const now = Date.now();

    let approvalMetadata: Record<string, unknown> = {};
    if (status === "approved") {
      if (isModerator) {
        approvalMetadata = {
          approvedByUserId: bookingUser._id,
          approvedByUsername: bookingUser.username,
          approvedAt: now,
          approvalSource: bookingUser.role === "admin" ? "admin" : "moderator",
        };
      } else if (isProviderLinked) {
        approvalMetadata = {
          approvedByUsername: "System (Provider Auto)",
          approvedAt: now,
          approvalSource: "auto_provider",
        };
      } else if (isGuardianLinked) {
        approvalMetadata = {
          approvedByUsername: "System (Guardian Auto)",
          approvedAt: now,
          approvalSource: "auto_guardian",
        };
      } else {
        approvalMetadata = {
          approvedByUsername: "System Auto-Approve",
          approvedAt: now,
          approvalSource: "system",
        };
      }
    }

    // Create the class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      providerId: args.providerId, // NEW: Provider support
      studentId: args.studentId,
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      guardianTitle: args.guardianTitle,
      isGuardianLinked,
      status,
      scheduledDate: args.scheduledDate,
      createdAt: now,
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
      bookedByUserId: bookingUser._id,
      bookedByUsername: bookingUser.username,
      ...approvalMetadata,
    });

    // Get the school to find the moderator (only for school-linked classes)
    const school = args.schoolId ? await ctx.db.get(args.schoolId) : null;

    // Get location info for notifications (if provided)
    const location = args.locationId ? await ctx.db.get(args.locationId) : null;
    const locationText = location?.name || args.pendingLocationName || "Unknown location";
    const locationTextTh = location?.nameTh || args.pendingLocationNameTh || "ไม่ทราบสถานที่";

    // Only send notification if it's a teacher request (pending status) FOR SCHOOL CLASSES
    // Skip notification for:
    // 1. Guardian-linked classes (auto-approved)
    // 2. Provider-linked classes (auto-approved) - NEW
    // 3. Moderator/admin created classes (they don't need to acknowledge their own new classes)
    // Note: Moderators DO need acknowledgement when EDITING existing classes (handled in editClass mutation)
    if (!isGuardianLinked && !isProviderLinked && !isModerator && school && school.moderatorId) {
      // Get teacher information
      const teacher = await ctx.db.get(args.teacherId);

      // Prepare notification message with past date warning if applicable
      let notificationMessage = `Teacher ${teacher?.username || "Unknown"} has requested a class for ${student.firstName} ${student.lastName} at ${locationText}.`;
      let notificationMessageTh = `ครู ${teacher?.username || "ไม่ทราบ"} ได้ขอชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh}`;

      if (isPastDate) {
        notificationMessage += ` ⚠️ This is a PAST DATE booking (${new Date(args.scheduledDate).toLocaleDateString()})`;
        notificationMessageTh += ` ⚠️ การจองนี้เป็นวันที่ย้อนหลัง (${new Date(args.scheduledDate).toLocaleDateString("th-TH")})`;

        if (isWithinCycle) {
          notificationMessage += " within the teacher's active cycle. Approval will count toward ClassCount.";
          notificationMessageTh += " ภายในรอบที่ใช้งานของครู การอนุมัติจะนับรวมใน ClassCount";
        } else {
          notificationMessage += " OUTSIDE the teacher's active cycle. Approval will NOT count toward ClassCount.";
          notificationMessageTh += " นอกรอบที่ใช้งานของครู การอนุมัติจะไม่นับรวมใน ClassCount";
        }
      }

      notificationMessage += " Please review and acknowledge.";
      notificationMessageTh += " กรุณาตรวจสอบและรับทราบ";

      // Create notification for moderator
      await ctx.db.insert("notifications", {
        title: isPastDate ? "⚠️ Past Date Class Request" : "New Class Request",
        titleTh: isPastDate ? "⚠️ คำขอชั้นเรียนย้อนหลัง" : "คำขอชั้นเรียนใหม่",
        message: notificationMessage,
        messageTh: notificationMessageTh,
        type: isPastDate ? "warning" : "info",
        userId: school.moderatorId,
        read: false,
        createdAt: Date.now(),
      });
    }

    // Log the action (only for school classes - provider classes don't create logs)
    if (args.schoolId) {
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
    }

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

    const approver = await ctx.db.get(args.userId);
    if (!approver) {
      throw new Error("User not found");
    }

    // Get student and location info for notification
    const student = await ctx.db.get(classData.studentId);
    const location = classData.locationId ? await ctx.db.get(classData.locationId) : null;

    await ctx.db.patch(args.classId, {
      status: "approved",
      approvedByUserId: approver._id,
      approvedByUsername: approver.username,
      approvedAt: Date.now(),
      approvalSource: approver.role === "admin" ? "admin" : "moderator",
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
      approvedByUserId: undefined,
      approvedByUsername: undefined,
      approvedAt: undefined,
      approvalSource: undefined,
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
    const updates: Record<string, unknown> = {};
    if (args.scheduledDate) updates.scheduledDate = args.scheduledDate;
    if (args.studentId) updates.studentId = args.studentId;
    if (args.locationId) updates.locationId = args.locationId;
    if (args.status) updates.status = args.status;

    if (args.status) {
      if (args.status === "approved" && user) {
        updates.approvedByUserId = user._id;
        updates.approvedByUsername = user.username;
        updates.approvedAt = Date.now();
        updates.approvalSource = user.role === "admin" ? "admin" : "moderator";
      } else {
        updates.approvedByUserId = undefined;
        updates.approvedByUsername = undefined;
        updates.approvedAt = undefined;
        updates.approvalSource = undefined;
      }
    }

    // Update class
    await ctx.db.patch(args.classId, updates);

    // Get student info for notification
    const student = await ctx.db.get(args.studentId || classData.studentId);

    // Get location info
    const locationId = args.locationId || classData.locationId;
    const location = locationId ? await ctx.db.get(locationId) : null;

    // Create detailed notification to teacher based on status change
    if (student && user) {
      // Status-specific notifications with full class details
      if (args.status === "approved") {
        // Class approved by moderator - send detailed notification
        const dateStr = new Date(args.scheduledDate || classData.scheduledDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const timeStr = new Date(args.scheduledDate || classData.scheduledDate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });

        // Get updated class data for additional details
        const updatedClass = await ctx.db.get(args.classId);

        let detailsMessage = `✅ Class Approved!\n\n`;
        detailsMessage += `📅 Date & Time: ${dateStr} at ${timeStr}\n`;
        detailsMessage += `👤 Student: ${student.firstName} ${student.lastName}`;
        if (student.grade) detailsMessage += ` (Grade ${student.grade})`;
        detailsMessage += `\n`;

        if (location) {
          detailsMessage += `📍 Location: ${location.name}\n`;
        } else if (classData.pendingLocationName) {
          detailsMessage += `📍 Location: ${classData.pendingLocationName} (Pending approval)\n`;
        }

        if (updatedClass?.subject) {
          detailsMessage += `📚 Subject: ${updatedClass.subject}\n`;
        }
        if (updatedClass?.lessonTopic) {
          detailsMessage += `📖 Topic: ${updatedClass.lessonTopic}\n`;
        }
        if (updatedClass?.duration) {
          detailsMessage += `⏱️ Duration: ${updatedClass.duration} minutes\n`;
        }
        if (updatedClass?.materials) {
          detailsMessage += `📦 Materials: ${updatedClass.materials}\n`;
        }

        detailsMessage += `\nApproved by: ${user.username}`;

        // Thai version
        const dateStrTh = new Date(args.scheduledDate || classData.scheduledDate).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        let detailsMessageTh = `✅ คลาสได้รับการอนุมัติแล้ว!\n\n`;
        detailsMessageTh += `📅 วันที่และเวลา: ${dateStrTh} เวลา ${timeStr}\n`;
        detailsMessageTh += `👤 นักเรียน: ${student.firstName} ${student.lastName}`;
        if (student.grade) detailsMessageTh += ` (ชั้น ${student.grade})`;
        detailsMessageTh += `\n`;

        if (location) {
          detailsMessageTh += `📍 สถานที่: ${location.nameTh || location.name}\n`;
        } else if (classData.pendingLocationNameTh) {
          detailsMessageTh += `📍 สถานที่: ${classData.pendingLocationNameTh} (รอการอนุมัติ)\n`;
        }

        if (updatedClass?.subjectTh) {
          detailsMessageTh += `📚 วิชา: ${updatedClass.subjectTh}\n`;
        }
        if (updatedClass?.lessonTopicTh) {
          detailsMessageTh += `📖 หัวข้อ: ${updatedClass.lessonTopicTh}\n`;
        }
        if (updatedClass?.duration) {
          detailsMessageTh += `⏱️ ระยะเวลา: ${updatedClass.duration} นาที\n`;
        }
        if (updatedClass?.materialsTh) {
          detailsMessageTh += `📦 อุปกรณ์: ${updatedClass.materialsTh}\n`;
        }

        detailsMessageTh += `\nอนุมัติโดย: ${user.username}`;

        await ctx.db.insert("notifications", {
          userId: classData.teacherId,
          title: "Class Approved - Ready to Teach",
          titleTh: "คลาสได้รับการอนุมัติ - พร้อมสอน",
          message: detailsMessage,
          messageTh: detailsMessageTh,
          type: "success",
          read: false,
          createdAt: Date.now(),
        });
      } else if (args.status === "acknowledged") {
        // Class acknowledged by moderator
        await ctx.db.insert("notifications", {
          userId: classData.teacherId,
          title: "Class Acknowledged",
          titleTh: "คลาสรับทราบแล้ว",
          message: `Your class request with ${student.firstName} ${student.lastName} has been acknowledged by ${user.username}. Awaiting final approval.`,
          messageTh: `คำขอคลาสของคุณกับ ${student.firstName} ${student.lastName} ได้รับการรับทราบโดย ${user.username} กำลังรอการอนุมัติขั้นสุดท้าย`,
          type: "info",
          read: false,
          createdAt: Date.now(),
        });
      } else if (args.status === "rejected") {
        // Class rejected by moderator
        await ctx.db.insert("notifications", {
          userId: classData.teacherId,
          title: "Class Request Rejected",
          titleTh: "คำขอคลาสถูกปฏิเสธ",
          message: `Your class request with ${student.firstName} ${student.lastName} has been rejected by ${user.username}. Please contact the moderator for details.`,
          messageTh: `คำขอคลาสของคุณกับ ${student.firstName} ${student.lastName} ถูกปฏิเสธโดย ${user.username} กรุณาติดต่อผู้ดูแลเพื่อสอบถามรายละเอียด`,
          type: "error",
          read: false,
          createdAt: Date.now(),
        });
      } else {
        // General update notification
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

    // Verify authorization - allow moderators, admins, and teachers deleting their own classes
    await verifyClassAccess(ctx, args.userId, classData, {
      requireModeratorOrAdmin: true,
      allowTeacherOwner: true
    });

    // Get user once for all checks (admins have God mode)
    const user = await ctx.db.get(args.userId);

    // Check if class date has not passed yet (EXCEPT for admins - they have God mode)
    if (user?.role !== "admin") {
      const currentTime = Date.now();
      if (classData.scheduledDate < currentTime) {
        throw new Error("Cannot delete classes whose dates have already passed");
      }
    }

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

    // 7. Send notification to moderator (if teacher edited AND school-linked)
    if (user.role === "teacher" && classData.schoolId) {
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

    // 8. Log the edit action (only for school classes)
    if (classData.schoolId) {
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
    }

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

    // 4. Check school exists (only for school-linked classes)
    const school = classData.schoolId ? await ctx.db.get(classData.schoolId) : null;
    if (classData.schoolId && !school) {
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
        providerId: classData.providerId, // NEW: Include provider if present
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

    // 8. Send notification to moderator (if teacher added dates AND school-linked)
    if (!isGuardianLinked && !isModerator && classData.schoolId && school?.moderatorId) {
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

    // 9. Log the action (only for school classes)
    if (classData.schoolId) {
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
    }

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

    // Log the action (only for school classes)
    if (classData.schoolId) {
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
    }
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

    // Log the action (only for school classes)
    if (classData.schoolId) {
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
    }

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

    console.log("mergeClasses called with:", {
      userId: args.userId,
      targetClassId: args.targetClassId,
      sourceClassIds: args.sourceClassIds,
    });

    // Get the target class
    const targetClass = await ctx.db.get(args.targetClassId);
    if (!targetClass) {
      console.error("Target class not found:", args.targetClassId);
      throw new Error("Target class not found");
    }

    console.log("Target class:", {
      id: targetClass._id,
      scheduledDate: new Date(targetClass.scheduledDate).toISOString(),
      locationId: targetClass.locationId,
      teacherId: targetClass.teacherId,
      schoolId: targetClass.schoolId,
    });

    // Get the user performing the action
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("User not found:", args.userId);
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

    console.log("Source classes:", sourceClasses.map(c => c ? {
      id: c._id,
      scheduledDate: new Date(c.scheduledDate).toISOString(),
      locationId: c.locationId,
      teacherId: c.teacherId,
      schoolId: c.schoolId,
    } : null));

    // CRITICAL FIX: Use 5-minute time tolerance to match frontend grouping logic
    // Frontend groups classes within 5-minute window (merge-classes-modal.tsx line 47)
    // This allows classes at 3:00:00 PM and 3:00:30 PM to be merged together
    const TIME_TOLERANCE = 5 * 60 * 1000; // 5 minutes in milliseconds

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

      // Check if scheduled for the same date/time (with 5-minute tolerance)
      const timeDiff = Math.abs(sourceClass.scheduledDate - targetClass.scheduledDate);
      if (timeDiff > TIME_TOLERANCE) {
        const sourceDate = new Date(sourceClass.scheduledDate).toLocaleString();
        const targetDate = new Date(targetClass.scheduledDate).toLocaleString();
        const minutesDiff = Math.round(timeDiff / 60000);
        throw new Error(
          `Can only merge classes scheduled within 5 minutes of each other. ` +
          `Source class: ${sourceDate}, Target class: ${targetDate}, ` +
          `Time difference: ${minutesDiff} minutes`
        );
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

    // Log the action (only for school classes)
    if (targetClass.schoolId) {
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
    }

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

/**
 * Bulk delete classes (admin God mode - no restrictions)
 */
export const bulkDeleteClasses = mutation({
  args: {
    classIds: v.array(v.id("classes")),
    userId: v.id("users"), // Admin performing the deletion
    reason: v.optional(v.string()), // Optional reason for audit trail
  },
  handler: async (ctx, args) => {
    // Rate limiting
    await checkRateLimit(ctx, {
      key: `bulkDeleteClasses-${args.userId}`,
      limit: 5,
      windowMs: 60000, // 5 deletions per minute
    });

    // Verify user is admin
    const admin = await ctx.db.get(args.userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required for bulk class deletion");
    }

    // Validate batch size
    if (args.classIds.length > 100) {
      throw new Error("Maximum 100 classes can be deleted at once");
    }

    const results = {
      successful: [] as string[],
      failed: [] as { classId: string; error: string }[],
    };

    // Delete each class
    for (const classId of args.classIds) {
      try {
        const classData = await ctx.db.get(classId);
        if (!classData) {
          results.failed.push({
            classId: classId.toString(),
            error: "Class not found",
          });
          continue;
        }

        // Admin has God mode - no date restrictions, no approval checks
        // Just delete it
        await ctx.db.delete(classId);
        results.successful.push(classId.toString());

        // Log the deletion
        await logAudit(ctx, {
          userId: args.userId,
          action: "DELETE_CLASS" as const,
          targetType: "CLASSES" as const,
          targetId: classId,
          targetName: `Class on ${new Date(classData.scheduledDate).toLocaleDateString()}`,
          reason: args.reason || "Bulk deletion by admin",
          schoolId: admin.schoolId,
        });
      } catch (error) {
        results.failed.push({
          classId: classId.toString(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

/**
 * Find Recurring Series Query
 * Auto-detects if a class is part of a weekly recurring pattern
 */
export const findRecurringSeries = query({
  args: {
    classId: v.id("classes"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get seed class
    const seedClass = await ctx.db.get(args.classId);
    if (!seedClass) {
      throw new Error("Class not found");
    }

    // Verify authorization
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isTeacherOwner = seedClass.teacherId === args.userId;
    const isModeratorOrAdmin = user.role === "moderator" || user.role === "admin";

    if (!isTeacherOwner && !isModeratorOrAdmin) {
      throw new Error("Unauthorized: You can only view recurring series for your own classes");
    }

    // Find all classes matching pattern
    const seedDayOfWeek = new Date(seedClass.scheduledDate).getDay();
    const allClasses = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q.eq("teacherId", seedClass.teacherId)
      )
      .filter((q) => q.eq(q.field("studentId"), seedClass.studentId))
      .collect();

    // Filter to weekly pattern (same location, day of week, ~7 days apart)
    const series = allClasses.filter((cls) => {
      const locationMatch = cls.locationId === seedClass.locationId;
      const dayMatch = new Date(cls.scheduledDate).getDay() === seedDayOfWeek;
      const daysDiff = Math.abs(
        (cls.scheduledDate - seedClass.scheduledDate) / 86400000
      );
      const weeklyPattern = daysDiff % 7 <= 1;
      return locationMatch && dayMatch && weeklyPattern;
    });

    return series.sort((a, b) => a.scheduledDate - b.scheduledDate);
  },
});

/**
 * Bulk Approve Classes Mutation
 * Allows moderators/admins to approve multiple classes at once (e.g., recurring bookings)
 * SECURITY: Requires moderator or admin role, school-scoped for moderators
 */
export const bulkApprove = mutation({
  args: {
    userId: v.id("users"),
    classIds: v.array(v.id("classes")),
    teacherId: v.optional(v.id("users")), // For filtering classes by teacher
    dateRange: v.optional(v.object({
      startDate: v.number(),
      endDate: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // 1. Verify user and role
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error("Unauthorized: Only moderators and admins can bulk approve classes");
    }

    // 2. Validate batch size
    if (args.classIds.length > 100) {
      throw new Error("Maximum 100 classes can be approved at once");
    }

    const results = {
      approved: 0,
      skipped: 0,
      failed: [] as Array<{ classId: string; error: string; studentName?: string }>,
    };

    // 3. Batch fetch all classes to approve
    const classes = await Promise.all(
      args.classIds.map(id => ctx.db.get(id))
    );

    // 4. Process each class
    for (let i = 0; i < classes.length; i++) {
      const classData = classes[i];
      const classId = args.classIds[i];

      if (!classData) {
        results.failed.push({
          classId: classId.toString(),
          error: "Class not found",
        });
        continue;
      }

      try {
        // Authorization check: moderators can only approve their school
        if (user.role === "moderator") {
          if (!user.schoolId || classData.schoolId !== user.schoolId) {
            results.failed.push({
              classId: classId.toString(),
              error: "Unauthorized: Can only approve classes from your assigned school",
            });
            continue;
          }
        }

        // Skip if already approved
        if (classData.status === "approved") {
          results.skipped++;
          continue;
        }

        // Skip if rejected (require manual review)
        if (classData.status === "rejected") {
          results.failed.push({
            classId: classId.toString(),
            error: "Cannot bulk approve rejected classes",
          });
          continue;
        }

        // Approve the class
        await ctx.db.patch(classId, {
          status: "approved",
          approvedByUserId: user._id,
          approvedByUsername: user.username,
          approvedAt: Date.now(),
          approvalSource: user.role === "admin" ? "admin" : "moderator",
        });

        results.approved++;

      } catch (error) {
        results.failed.push({
          classId: classId.toString(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // 5. Create single bulk notification to teacher
    if (results.approved > 0 && args.teacherId) {
      const teacher = await ctx.db.get(args.teacherId);
      if (teacher) {
        await ctx.db.insert("notifications", {
          title: "Classes Bulk Approved",
          titleTh: "อนุมัติชั้นเรียนจำนวนมาก",
          message: `${results.approved} of your class requests have been approved by ${user.username}.`,
          messageTh: `${results.approved} คำขอชั้นเรียนของคุณได้รับการอนุมัติโดย ${user.username}`,
          type: "success",
          userId: args.teacherId,
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    // 6. Log audit trail
    await logAudit(ctx, {
      userId: args.userId,
      action: "BULK_APPROVE_CLASSES" as const,
      targetType: "CLASSES" as const,
      targetId: args.classIds[0], // Reference first class ID
      targetName: `Bulk approved ${results.approved} classes`,
      reason: `Bulk approval: ${results.approved} approved, ${results.skipped} skipped, ${results.failed.length} failed`,
      schoolId: user.schoolId,
    });

    return results;
  },
});

/**
 * Delete Recurring Series Mutation
 * Bulk deletes classes in a recurring series with authorization and audit logging
 */
export const deleteRecurringSeries = mutation({
  args: {
    classIds: v.array(v.id("classes")),
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate batch size
    if (args.classIds.length > 50) {
      throw new Error("Maximum 50 classes can be deleted in a recurring series at once");
    }

    // Validate reason
    validateLength(args.reason, "Reason", 500, 5);

    const results = {
      successful: [] as string[],
      failed: [] as Array<{ classId: string; error: string }>,
    };

    // Process each class deletion
    for (const classId of args.classIds) {
      try {
        const classData = await ctx.db.get(classId);
        if (!classData) {
          results.failed.push({
            classId: classId.toString(),
            error: "Class not found",
          });
          continue;
        }

        // Verify authorization for this specific class
        try {
          await verifyClassAccess(ctx, args.userId, classData, {
            requireModeratorOrAdmin: false,
            allowTeacherOwner: true,
          });
        } catch (error) {
          results.failed.push({
            classId: classId.toString(),
            error: error instanceof Error ? error.message : "Unauthorized",
          });
          continue;
        }

        // Delete the class
        await ctx.db.delete(classId);
        results.successful.push(classId.toString());

        // Log the deletion
        await logAudit(ctx, {
          userId: args.userId,
          action: "DELETE_CLASS" as const,
          targetType: "CLASSES" as const,
          targetId: classId,
          targetName: `Recurring class on ${new Date(classData.scheduledDate).toLocaleDateString()}`,
          reason: args.reason,
          schoolId: classData.schoolId,
        });
      } catch (error) {
        results.failed.push({
          classId: classId.toString(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});
