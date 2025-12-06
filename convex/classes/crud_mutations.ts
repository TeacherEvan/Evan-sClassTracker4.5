import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyClassAccess } from "./helpers";

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

