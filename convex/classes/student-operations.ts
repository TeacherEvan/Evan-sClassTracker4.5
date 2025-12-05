import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyClassAccess } from "./helpers";
import { checkRateLimit } from "../rateLimit";

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

