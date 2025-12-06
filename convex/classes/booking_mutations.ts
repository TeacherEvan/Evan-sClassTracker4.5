import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { logAudit } from "../auditHelpers";
import { checkRateLimit, validateLength } from "../rateLimit";

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
    const scheduledDate = new Date(args.scheduledDate);
    const dayStart = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000; // End of day

    // Use proper index for teacher + date range query
    const existingClasses = await ctx.db
      .query("classes")
      .withIndex("by_teacher_and_date", (q) =>
        q
          .eq("teacherId", args.teacherId)
          .gte("scheduledDate", dayStart)
          .lt("scheduledDate", dayEnd)
      )
      .collect();

    const conflictingClasses = existingClasses.filter((c) => {
      if (!c.scheduledDate) return false;
      return Math.abs(c.scheduledDate - args.scheduledDate) < 1000 * 60 * 60; // Within 1 hour
    });

    // If conflicts found and not forcing, return conflicts
    if (conflictingClasses.length > 0 && !args.forceCreate) {
      return {
        success: false,
        hasConflicts: true,
        conflicts: conflictingClasses.map((c) => ({
          _id: c._id,
          scheduledDate: c.scheduledDate,
          studentId: c.studentId,
          locationId: c.locationId,
        })),
      };
    }

    // No conflicts or forcing creation - proceed with booking
    const bookedBy = await ctx.db.get(args.bookedByUserId);
    if (!bookedBy) {
      throw new Error("User not found");
    }

    const isModerator = bookedBy.role === "moderator";
    const isAdmin = bookedBy.role === "admin";
    const hasProvider = args.providerId !== undefined;

    // Auto-approve if: 
    // 1. Booked by moderator/admin
    // 2. Class has a provider (provider classes bypass moderator approval)
    const shouldAutoApprove = isModerator || isAdmin || hasProvider;
    const status = shouldAutoApprove ? "approved" : "pending";
    const approvedAt = shouldAutoApprove ? Date.now() : undefined;
    const approvedByUserId = shouldAutoApprove ? args.bookedByUserId : undefined;
    const approvalSource = isModerator ? "moderator" : isAdmin ? "admin" : hasProvider ? "auto_provider" : undefined;

    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      providerId: args.providerId,
      studentId: args.studentId,
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      scheduledDate: args.scheduledDate,
      status,
      approvedAt,
      approvedByUserId,
      approvedByUsername: approvedByUserId ? bookedBy.username : undefined,
      bookedByUserId: args.bookedByUserId,
      bookedByUsername: bookedBy.username,
      approvalSource,
      guardianTitle: args.guardianTitle,
      duration: args.duration,
      subject: args.subject,
      subjectTh: args.subjectTh,
      lessonTopic: args.lessonTopic,
      lessonTopicTh: args.lessonTopicTh,
      materials: args.materials,
      materialsTh: args.materialsTh,
      preparationNotes: args.preparationNotes,
      preparationNotesTh: args.preparationNotesTh,
      classType: args.classType || "regular",
      createdAt: Date.now(),
    });

    // Get student details for audit log
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get location for audit log
    let locationText = "Pending Location Request";
    let locationTextTh = "รอการอนุมัติสถานที่";
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (location) {
        locationText = location.name;
        locationTextTh = location.nameTh || location.name;
      }
    } else if (args.pendingLocationName) {
      locationText = `Pending: ${args.pendingLocationName}`;
      locationTextTh = `รอการอนุมัติ: ${args.pendingLocationNameTh || args.pendingLocationName}`;
    }

    // Create audit log
    await logAudit(ctx, {
      userId: args.bookedByUserId,
      action: isModerator ? "book_class" : "request_class",
      targetType: "classes",
      targetId: classId.toString(),
      details: {
        studentName: `${student.firstName} ${student.lastName}`,
        location: locationText,
        scheduledDate: args.scheduledDate,
      },
    });

    // If auto-approved, send notification to teacher
    if (status === "approved") {
      await ctx.db.insert("notifications", {
        userId: args.teacherId,
        title: "New Class Booked",
        titleTh: "จองชั้นเรียนใหม่",
        message: `A class has been booked for ${student.firstName} ${student.lastName} at ${locationText} on ${new Date(args.scheduledDate).toLocaleString()}`,
        messageTh: `มีการจองชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} วันที่ ${new Date(args.scheduledDate).toLocaleString("th-TH")}`,
        type: "info",
        read: false,
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

    // ✅ RATE LIMIT: Prevent accidental rapid booking (30 per minute - soft limit)
    await checkRateLimit(ctx, {
      key: `book-class:${args.bookedByUserId}`,
      limit: 30,
      windowMs: 60000,
    });

    // Get user details for audit log
    const bookedBy = await ctx.db.get(args.bookedByUserId);
    if (!bookedBy) {
      throw new Error("User not found");
    }

    const isModerator = bookedBy.role === "moderator";
    const isAdmin = bookedBy.role === "admin";

    // Validate: teacher exists
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    // Validate: student exists
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Validate: school/provider exists
    if (args.schoolId) {
      const school = await ctx.db.get(args.schoolId);
      if (!school) {
        throw new Error("School not found");
      }
    }
    if (args.providerId) {
      const provider = await ctx.db.get(args.providerId);
      if (!provider) {
        throw new Error("Provider not found");
      }
    }

    // Validate: location exists (if provided)
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (!location) {
        throw new Error("Location not found");
      }
    }

    // ✅ SECURITY: Input validation
    if (args.subject) validateLength(args.subject, "Subject", 200, 0);
    if (args.subjectTh) validateLength(args.subjectTh, "Subject (Thai)", 200, 0);
    if (args.lessonTopic) validateLength(args.lessonTopic, "Lesson Topic", 500, 0);
    if (args.lessonTopicTh) validateLength(args.lessonTopicTh, "Lesson Topic (Thai)", 500, 0);
    if (args.materials) validateLength(args.materials, "Materials", 1000, 0);
    if (args.materialsTh) validateLength(args.materialsTh, "Materials (Thai)", 1000, 0);
    if (args.preparationNotes) validateLength(args.preparationNotes, "Preparation Notes", 2000, 0);
    if (args.preparationNotesTh) validateLength(args.preparationNotesTh, "Preparation Notes (Thai)", 2000, 0);

    // Auto-approve if: 
    // 1. Booked by moderator/admin
    // 2. Class has a provider (provider classes bypass moderator approval)
    const hasProvider = args.providerId !== undefined;
    const shouldAutoApprove = isModerator || isAdmin || hasProvider;
    const status = shouldAutoApprove ? "approved" : "pending";
    const approvedAt = shouldAutoApprove ? Date.now() : undefined;
    const approvedByUserId = shouldAutoApprove ? args.bookedByUserId : undefined;
    const approvalSource = isModerator ? "moderator" : isAdmin ? "admin" : hasProvider ? "auto_provider" : undefined;

    // Insert class - use schema-compliant fields
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      providerId: args.providerId,
      studentId: args.studentId,
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      scheduledDate: args.scheduledDate,
      status,
      approvedAt,
      approvedByUserId,
      approvedByUsername: approvedByUserId ? bookedBy.username : undefined,
      bookedByUserId: args.bookedByUserId,
      bookedByUsername: bookedBy.username,
      approvalSource,
      guardianTitle: args.guardianTitle,
      duration: args.duration,
      subject: args.subject,
      subjectTh: args.subjectTh,
      lessonTopic: args.lessonTopic,
      lessonTopicTh: args.lessonTopicTh,
      materials: args.materials,
      materialsTh: args.materialsTh,
      preparationNotes: args.preparationNotes,
      preparationNotesTh: args.preparationNotesTh,
      classType: args.classType || "regular",
      createdAt: Date.now(),
    });

    // Get location for audit log
    let locationText = "Pending Location Request";
    if (args.locationId) {
      const location = await ctx.db.get(args.locationId);
      if (location) {
        locationText = location.name;
      }
    } else if (args.pendingLocationName) {
      locationText = `Pending: ${args.pendingLocationName}`;
    }

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.bookedByUserId,
      action: isModerator ? "book_class" : "request_class",
      targetType: "classes",
      targetId: classId.toString(),
      details: {
        studentName: `${student.firstName} ${student.lastName}`,
        location: locationText,
        scheduledDate: args.scheduledDate,
      },
    });

    // If auto-approved, send notification to teacher
    if (status === "approved") {
      await ctx.db.insert("notifications", {
        userId: args.teacherId,
        title: "New Class Booked",
        titleTh: "จองชั้นเรียนใหม่",
        message: `A class has been booked for ${student.firstName} ${student.lastName} at ${locationText} on ${new Date(args.scheduledDate).toLocaleString()}`,
        messageTh: `มีการจองชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationText} วันที่ ${new Date(args.scheduledDate).toLocaleString("th-TH")}`,
        type: "info",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { id: classId };
  },
});

// Mutation to acknowledge a class (teacher confirms they saw the booking)
// Note: The schema uses "acknowledged" status, not separate acknowledgedAt/By fields
export const acknowledge = mutation({
  args: {
    id: v.id("classes"),
    userId: v.id("users"), // Teacher ID
  },
  handler: async (ctx, args) => {
    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // ✅ SECURITY: Verify it's the teacher's class
    if (cls.teacherId !== args.userId) {
      throw new Error("Unauthorized: Only the assigned teacher can acknowledge");
    }

    // Update class status to acknowledged
    await ctx.db.patch(args.id, {
      status: "acknowledged",
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "acknowledge_class",
      targetType: "classes",
      targetId: args.id.toString(),
      details: {
        scheduledDate: cls.scheduledDate,
      },
    });

    return { success: true };
  },
});
