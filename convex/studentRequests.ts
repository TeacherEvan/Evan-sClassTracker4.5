import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list student requests
export const list = query({
  args: {
    teacherId: v.optional(v.id("users")),
    schoolId: v.optional(v.id("schools")),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (args.schoolId && args.status) {
      return await ctx.db
        .query("studentRequests")
        .withIndex("by_school_and_status", (q) =>
          q.eq("schoolId", args.schoolId!).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    } else if (args.schoolId) {
      return await ctx.db
        .query("studentRequests")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .order("desc")
        .collect();
    } else if (args.teacherId) {
      return await ctx.db
        .query("studentRequests")
        .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId!))
        .order("desc")
        .collect();
    } else if (args.status) {
      return await ctx.db
        .query("studentRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("studentRequests")
      .order("desc")
      .collect();
  },
});

// Query to get student request by ID
export const getById = query({
  args: {
    id: v.id("studentRequests"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a student request (teachers only)
export const create = mutation({
  args: {
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    firstName: v.string(),
    lastName: v.string(),
    grade: v.string(),
    notes: v.string(),
    notesTh: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify the teacher
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) {
      throw new Error("Teacher not found");
    }

    if (teacher.role !== "teacher") {
      throw new Error("Only teachers can create student requests");
    }

    // Verify the school exists
    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    // Create the request
    const requestId = await ctx.db.insert("studentRequests", {
      teacherId: args.teacherId,
      schoolId: args.schoolId,
      firstName: args.firstName,
      lastName: args.lastName,
      grade: args.grade,
      notes: args.notes,
      notesTh: args.notesTh,
      status: "pending",
      createdAt: Date.now(),
    });

    // Send notification to moderator
    if (school.moderatorId) {
      await ctx.db.insert("notifications", {
        title: "New Student Request",
        titleTh: "คำขอเพิ่มนักเรียนใหม่",
        message: `Teacher ${teacher.username} has requested to add a new student: ${args.firstName} ${args.lastName} (Grade ${args.grade}). Please review and approve or reject.`,
        messageTh: `ครู ${teacher.username} ได้ขอเพิ่มนักเรียนใหม่: ${args.firstName} ${args.lastName} (ชั้น ${args.grade}) กรุณาตรวจสอบและอนุมัติหรือปฏิเสธ`,
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
      action: "student_requested",
      actionTh: "ขอเพิ่มนักเรียน",
      details: `Requested to add student: ${args.firstName} ${args.lastName} (Grade ${args.grade})`,
      detailsTh: `ขอเพิ่มนักเรียน: ${args.firstName} ${args.lastName} (ชั้น ${args.grade})`,
      createdAt: Date.now(),
    });

    return requestId;
  },
});

// Helper function to generate unique student ID
function generateStudentId(
  firstName: string,
  lastName: string,
  schoolId: string
): string {
  const timestamp = Date.now().toString(36);
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const schoolHash = schoolId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}

// Mutation to approve a student request (moderators only)
export const approve = mutation({
  args: {
    requestId: v.id("studentRequests"),
    moderatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request has already been processed");
    }

    // Verify moderator
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
      throw new Error("Only moderators can approve requests");
    }

    // Verify moderator has access to this school
    if (moderator.role === "moderator" && moderator.schoolId !== request.schoolId) {
      throw new Error("Moderator does not have access to this school");
    }

    // Generate unique student ID
    const schoolIdForHash = request.schoolId.toString();
    let studentId = generateStudentId(
      request.firstName,
      request.lastName,
      schoolIdForHash
    );

    // Check for duplicates and regenerate if necessary
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await ctx.db
        .query("students")
        .withIndex("by_student_id", (q) => q.eq("studentId", studentId))
        .first();

      if (!existing) {
        break;
      }

      studentId = generateStudentId(
        request.firstName,
        request.lastName,
        schoolIdForHash
      );
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique student ID");
    }

    // Create the student
    const createdStudentId = await ctx.db.insert("students", {
      firstName: request.firstName,
      lastName: request.lastName,
      studentId,
      schoolId: request.schoolId,
      grade: request.grade,
      createdAt: Date.now(),
    });

    // Update the request
    await ctx.db.patch(args.requestId, {
      status: "approved",
      resolvedAt: Date.now(),
      resolvedBy: args.moderatorId,
      createdStudentId,
    });

    // Get teacher info (unused but kept for reference)
    // const teacher = await ctx.db.get(request.teacherId);

    // Send notification to teacher
    await ctx.db.insert("notifications", {
      title: "Student Request Approved",
      titleTh: "คำขอเพิ่มนักเรียนได้รับการอนุมัติ",
      message: `Your request to add ${request.firstName} ${request.lastName} has been approved. The student has been added to the system.`,
      messageTh: `คำขอเพิ่ม ${request.firstName} ${request.lastName} ของคุณได้รับการอนุมัติแล้ว นักเรียนได้ถูกเพิ่มเข้าระบบแล้ว`,
      type: "success",
      userId: request.teacherId,
      read: false,
      createdAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: request.teacherId,
      schoolId: request.schoolId,
      action: "student_approved",
      actionTh: "นักเรียนได้รับอนุมัติ",
      details: `Student request approved by ${moderator?.username || "moderator"}: ${request.firstName} ${request.lastName}`,
      detailsTh: `คำขอเพิ่มนักเรียนได้รับอนุมัติโดย ${moderator?.username || "ผู้ดูแล"}: ${request.firstName} ${request.lastName}`,
      relatedStudentId: createdStudentId,
      createdAt: Date.now(),
    });

    return { success: true, studentId: createdStudentId };
  },
});

// Mutation to reject a student request (moderators only)
export const reject = mutation({
  args: {
    requestId: v.id("studentRequests"),
    moderatorId: v.id("users"),
    reason: v.string(),
    reasonTh: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Request has already been processed");
    }

    // Verify moderator
    const moderator = await ctx.db.get(args.moderatorId);
    if (!moderator || (moderator.role !== "moderator" && moderator.role !== "admin")) {
      throw new Error("Only moderators can reject requests");
    }

    // Verify moderator has access to this school
    if (moderator.role === "moderator" && moderator.schoolId !== request.schoolId) {
      throw new Error("Moderator does not have access to this school");
    }

    // Update the request
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      resolvedAt: Date.now(),
      resolvedBy: args.moderatorId,
      rejectionReason: args.reason,
      rejectionReasonTh: args.reasonTh,
    });

    // Send notification to teacher
    await ctx.db.insert("notifications", {
      title: "Student Request Rejected",
      titleTh: "คำขอเพิ่มนักเรียนถูกปฏิเสธ",
      message: `Your request to add ${request.firstName} ${request.lastName} has been rejected. Reason: ${args.reason}`,
      messageTh: `คำขอเพิ่ม ${request.firstName} ${request.lastName} ของคุณถูกปฏิเสธ เหตุผล: ${args.reasonTh}`,
      type: "error",
      userId: request.teacherId,
      read: false,
      createdAt: Date.now(),
    });

    // Log the action
    await ctx.db.insert("teacherLogs", {
      teacherId: request.teacherId,
      schoolId: request.schoolId,
      action: "student_rejected",
      actionTh: "นักเรียนถูกปฏิเสธ",
      details: `Student request rejected by ${moderator?.username || "moderator"}: ${request.firstName} ${request.lastName}`,
      detailsTh: `คำขอเพิ่มนักเรียนถูกปฏิเสธโดย ${moderator?.username || "ผู้ดูแล"}: ${request.firstName} ${request.lastName}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});
