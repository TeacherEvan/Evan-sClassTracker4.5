import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { mutation } from "../_generated/server";
import { verifyClassAccess } from "./helpers";
import { logAudit } from "../auditHelpers";
import { checkRateLimit, validateLength } from "../rateLimit";

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
        allowTeacherOwner: true,
      });
    } else {
      await verifyClassAccess(ctx, args.userId, targetClass, {
        requireModeratorOrAdmin: true,
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
      args.sourceClassIds.map((id) => ctx.db.get(id)),
    );

    console.log(
      "Source classes:",
      sourceClasses.map((c) =>
        c
          ? {
              id: c._id,
              scheduledDate: new Date(c.scheduledDate).toISOString(),
              locationId: c.locationId,
              teacherId: c.teacherId,
              schoolId: c.schoolId,
            }
          : null,
      ),
    );

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
      const timeDiff = Math.abs(
        sourceClass.scheduledDate - targetClass.scheduledDate,
      );
      if (timeDiff > TIME_TOLERANCE) {
        const sourceDate = new Date(sourceClass.scheduledDate).toLocaleString();
        const targetDate = new Date(targetClass.scheduledDate).toLocaleString();
        const minutesDiff = Math.round(timeDiff / 60000);
        throw new Error(
          `Can only merge classes scheduled within 5 minutes of each other. ` +
            `Source class: ${sourceDate}, Target class: ${targetDate}, ` +
            `Time difference: ${minutesDiff} minutes`,
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

export const bulkApprove = mutation({
  args: {
    userId: v.id("users"),
    classIds: v.array(v.id("classes")),
    teacherId: v.optional(v.id("users")), // For filtering classes by teacher
    dateRange: v.optional(
      v.object({
        startDate: v.number(),
        endDate: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Verify user and role
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "moderator" && user.role !== "admin") {
      throw new Error(
        "Unauthorized: Only moderators and admins can bulk approve classes",
      );
    }

    // 2. Validate batch size
    if (args.classIds.length > 100) {
      throw new Error("Maximum 100 classes can be approved at once");
    }

    const results = {
      approved: 0,
      skipped: 0,
      failed: [] as Array<{
        classId: string;
        error: string;
        studentName?: string;
      }>,
    };

    // 3. Batch fetch all classes to approve
    const classes = await Promise.all(
      args.classIds.map((id) => ctx.db.get(id)),
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
              error:
                "Unauthorized: Can only approve classes from your assigned school",
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
      throw new Error(
        "Maximum 50 classes can be deleted in a recurring series at once",
      );
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

/**
 * Find and Clean Up Unpopulated Classes
 * Finds classes that have missing/invalid student references or are orphaned
 * Admin-only operation with dry-run support
 */

export const cleanUpUnpopulatedClasses = mutation({
  args: {
    userId: v.id("users"),
    classIds: v.array(v.id("classes")), // Specific classes to delete
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const admin = await ctx.db.get(args.userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required for cleanup operation");
    }

    // Validate batch size
    if (args.classIds.length > 500) {
      throw new Error("Maximum 500 classes can be cleaned up at once");
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

        // Verify it's actually unpopulated
        const student = await ctx.db.get(classData.studentId);
        if (student) {
          results.failed.push({
            classId: classId.toString(),
            error: "Class has valid student reference - cannot clean up",
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
          targetName: `Unpopulated class on ${new Date(classData.scheduledDate).toLocaleDateString()}`,
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
