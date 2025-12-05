import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { logAudit } from "../auditHelpers";
import { checkRateLimit, validateLength } from "../rateLimit";
import { verifyClassAccess } from "./helpers";

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
    const scheduledDateOnly = new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()).getTime();

    const existingClasses = await ctx.db
      .query("classes")
      .withIndex("by_teacher_date", (q) =>
        q
          .eq("teacherId", args.teacherId)
          .eq("scheduledDateOnly", scheduledDateOnly)
      )
      .filter((q) => q.eq(q.field("deleted"), false))
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
          studentIds: c.studentIds,
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

    // Auto-approve if booked by moderator or admin
    const status = isModerator || isAdmin ? "approved" : "pending";
    const approvedAt = isModerator || isAdmin ? Date.now() : undefined;
    const approvedBy = isModerator || isAdmin ? args.bookedByUserId : undefined;

    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      providerId: args.providerId,
      studentIds: [args.studentId],
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      scheduledDate: args.scheduledDate,
      scheduledDateOnly,
      status,
      approvedAt,
      approvedBy,
      bookedByUserId: args.bookedByUserId,
      bookedByUsername: bookedBy.username,
      approvalSource: isModerator ? "moderator" : isAdmin ? "admin" : undefined,
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
      deleted: false,
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
      actionTh: isModerator ? "จองชั้นเรียน" : "ขอชั้นเรียน",
      details: `${isModerator ? "Booked" : "Requested"} class for ${student.firstName} ${student.lastName} at ${locationText} on ${new Date(args.scheduledDate).toLocaleDateString()}`,
      detailsTh: `${isModerator ? "จอง" : "ขอ"}ชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} วันที่ ${new Date(args.scheduledDate).toLocaleDateString("th-TH")}`,
      relatedClassId: classId,
      relatedStudentId: args.studentId,
      createdAt: Date.now(),
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

    // Calculate scheduled date (date only, no time)
    const scheduledDate = new Date(args.scheduledDate);
    const scheduledDateOnly = new Date(
      scheduledDate.getFullYear(),
      scheduledDate.getMonth(),
      scheduledDate.getDate()
    ).getTime();

    // Auto-approve if booked by moderator or admin
    const status = isModerator || isAdmin ? "approved" : "pending";
    const approvedAt = isModerator || isAdmin ? Date.now() : undefined;
    const approvedBy = isModerator || isAdmin ? args.bookedByUserId : undefined;

    // Insert class
    const classId = await ctx.db.insert("classes", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      providerId: args.providerId,
      studentIds: [args.studentId],
      locationId: args.locationId,
      pendingLocationName: args.pendingLocationName,
      pendingLocationNameTh: args.pendingLocationNameTh,
      scheduledDate: args.scheduledDate,
      scheduledDateOnly,
      status,
      approvedAt,
      approvedBy,
      bookedByUserId: args.bookedByUserId,
      bookedByUsername: bookedBy.username,
      approvalSource: isModerator ? "moderator" : isAdmin ? "admin" : undefined,
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
      deleted: false,
      createdAt: Date.now(),
    });

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

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.bookedByUserId,
      action: isModerator ? "book_class" : "request_class",
      actionTh: isModerator ? "จองชั้นเรียน" : "ขอชั้นเรียน",
      details: `${isModerator ? "Booked" : "Requested"} class for ${student.firstName} ${student.lastName} at ${locationText} on ${new Date(args.scheduledDate).toLocaleDateString()}`,
      detailsTh: `${isModerator ? "จอง" : "ขอ"}ชั้นเรียนสำหรับ ${student.firstName} ${student.lastName} ที่ ${locationTextTh} วันที่ ${new Date(args.scheduledDate).toLocaleDateString("th-TH")}`,
      relatedClassId: classId,
      relatedStudentId: args.studentId,
      createdAt: Date.now(),
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

    return { id: classId };
  },
});

// Mutation to acknowledge a class (teacher confirms they saw the booking)
export const acknowledge = mutation({
  args: {
    id: v.id("classes"),
    userId: v.id("users"), // Teacher ID
  },
  handler: async (ctx, args) => {
    // ✅ SECURITY: Verify teacher permissions
    await verifyClassAccess(ctx, args.id, args.userId);

    // Get class
    const cls = await ctx.db.get(args.id);
    if (!cls) {
      throw new Error("Class not found");
    }

    // Verify it's the teacher's class
    if (cls.teacherId !== args.userId) {
      throw new Error("Unauthorized: Only the assigned teacher can acknowledge");
    }

    // Update class
    await ctx.db.patch(args.id, {
      acknowledgedAt: Date.now(),
      acknowledgedBy: args.userId,
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: "acknowledge_class",
      actionTh: "ยืนยันการรับทราบชั้นเรียน",
      details: `Acknowledged class on ${new Date(cls.scheduledDate || 0).toLocaleDateString()}`,
      detailsTh: `ยืนยันการรับทราบชั้นเรียนวันที่ ${new Date(cls.scheduledDate || 0).toLocaleDateString("th-TH")}`,
      relatedClassId: args.id,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
