/**
 * Student Merge, Sync, and Soft-Delete System
 * 
 * Git-repository-like logic for students:
 * - Allow duplicates, syncing, and merging
 * - Never allow forking or renaming
 * - Maintain complete audit trail
 * - Soft-delete by default, hard-delete admin-only
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit, validateLength } from "./rateLimit";

/**
 * MUTATION: Merge two students (soft-delete source, redirect all references)
 * 
 * Authorization: Teachers/admins can merge their own school's students, admins can merge any
 * Validation: Cannot merge deleted students, cannot create circular merges, must be same school/provider
 */
export const mergeStudents = mutation({
  args: {
    userId: v.id("users"), // User performing the merge
    sourceStudentId: v.id("students"), // Student to be merged (will be soft-deleted)
    targetStudentId: v.id("students"), // Student to merge into (will receive all references)
    reason: v.string(), // Required: reason for merge (audit trail)
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // ✅ RATE LIMIT: Prevent accidental rapid merges (5 per minute - very restrictive)
    await checkRateLimit(ctx, {
      key: `merge-students:${args.userId}`,
      limit: 5,
      windowMs: 60000,
    });

    // Validate reason (min 10, max 500 chars)
    validateLength(args.reason, "Merge reason", 500, 10);

    // Get source and target students
    const sourceStudent = await ctx.db.get(args.sourceStudentId);
    const targetStudent = await ctx.db.get(args.targetStudentId);

    if (!sourceStudent) {
      throw new Error("Source student not found");
    }
    if (!targetStudent) {
      throw new Error("Target student not found");
    }

    // ✅ VALIDATION: Cannot merge the same student
    if (args.sourceStudentId === args.targetStudentId) {
      throw new Error("Cannot merge a student with itself");
    }

    // ✅ VALIDATION: Cannot merge already deleted students
    if (sourceStudent.isDeleted) {
      throw new Error("Source student is already deleted and cannot be merged");
    }
    if (targetStudent.isDeleted) {
      throw new Error("Target student is deleted and cannot be merged into");
    }

    // ✅ VALIDATION: Cannot merge already merged students
    if (sourceStudent.mergedIntoId) {
      throw new Error("Source student has already been merged into another student");
    }

    // ✅ VALIDATION: Prevent circular merges
    if (targetStudent.mergedIntoId) {
      throw new Error("Target student has been merged into another student. Circular merges are not allowed.");
    }

    // ✅ VALIDATION: Must be same school OR same provider (cannot merge across boundaries)
    if (sourceStudent.schoolId !== targetStudent.schoolId) {
      throw new Error("Cannot merge students from different schools");
    }
    if (sourceStudent.providerId !== targetStudent.providerId) {
      throw new Error("Cannot merge students from different providers");
    }

    // ✅ SECURITY: Verify user permissions
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Role-based access control
    if (user.role === "teacher" || user.role === "moderator") {
      // Teachers/moderators can only merge students from their school
      if (sourceStudent.schoolId !== user.schoolId || targetStudent.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Cannot merge students from other schools");
      }
    } else if (user.role === "guardian") {
      throw new Error("Unauthorized: Guardians cannot merge students");
    } else if (user.role !== "admin") {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // STEP 1: Update all class references (primary student)
    const classesWithSource = await ctx.db
      .query("classes")
      .withIndex("by_student", (q) => q.eq("studentId", args.sourceStudentId))
      .collect();

    let updatedClassCount = 0;
    for (const classItem of classesWithSource) {
      await ctx.db.patch(classItem._id, {
        studentId: args.targetStudentId,
      });
      updatedClassCount++;
    }

    // STEP 2: Update all class references (additional students)
    // Use an index if available, otherwise filter at the DB level
    const classesWithAdditional = await ctx.db
      .query("classes")
      .filter((q) =>
        q.and(
          q.neq(q.field("additionalStudentIds"), undefined),
          q.any(q.field("additionalStudentIds"), args.sourceStudentId)
        )
      )
      .collect();
    let updatedAdditionalCount = 0;
    for (const classItem of classesWithAdditional) {
      const updatedAdditional = classItem.additionalStudentIds.map((id) =>
        id === args.sourceStudentId ? args.targetStudentId : id
      );
      await ctx.db.patch(classItem._id, {
        additionalStudentIds: updatedAdditional,
      });
      updatedAdditionalCount++;
    }

    // STEP 3: Update all post-class notes references
    const notesWithSource = await ctx.db
      .query("postClassNotes")
      .withIndex("by_student", (q) => q.eq("studentId", args.sourceStudentId))
      .collect();

    let updatedNotesCount = 0;
    for (const note of notesWithSource) {
      await ctx.db.patch(note._id, {
        studentId: args.targetStudentId,
      });
      updatedNotesCount++;
    }

    // STEP 4: Update all teacher logs references
    const logsWithSource = await ctx.db
      .query("teacherLogs")
      .withIndex("by_related_student", (q) => q.eq("relatedStudentId", args.sourceStudentId))
      .collect();
    let updatedLogsCount = 0;
    for (const log of logsWithSource) {
      await ctx.db.patch(log._id, {
        relatedStudentId: args.targetStudentId,
      });
      updatedLogsCount++;
    }

    // STEP 5: Soft-delete the source student (mark as merged)
    await ctx.db.patch(args.sourceStudentId, {
      isDeleted: true,
      deletedAt: Date.now(),
      deletedBy: args.userId,
      deletionReason: `Merged into ${targetStudent.firstName} ${targetStudent.lastName} (${targetStudent.studentId}): ${args.reason}`,
      mergedIntoId: args.targetStudentId,
      mergedAt: Date.now(),
      mergedBy: args.userId,
    });

    const executionTime = Date.now() - startTime;

    // ✅ AUDIT LOG: Record the merge operation
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.MERGE_STUDENTS,
      targetType: AuditTargetTypes.STUDENTS,
      targetId: args.sourceStudentId,
      targetName: `${sourceStudent.firstName} ${sourceStudent.lastName}`,
      reason: args.reason,
      schoolId: sourceStudent.schoolId,
      details: {
        sourceStudentId: sourceStudent.studentId,
        targetStudentId: targetStudent.studentId,
        targetStudentName: `${targetStudent.firstName} ${targetStudent.lastName}`,
        updatedClasses: updatedClassCount,
        updatedAdditionalClasses: updatedAdditionalCount,
        updatedNotes: updatedNotesCount,
        updatedLogs: updatedLogsCount,
        totalReferencesUpdated: updatedClassCount + updatedAdditionalCount + updatedNotesCount + updatedLogsCount,
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
      executionTime,
    });

    return {
      success: true,
      mergedStudent: {
        id: args.sourceStudentId,
        name: `${sourceStudent.firstName} ${sourceStudent.lastName}`,
      },
      targetStudent: {
        id: args.targetStudentId,
        name: `${targetStudent.firstName} ${targetStudent.lastName}`,
      },
      updatedReferences: {
        classes: updatedClassCount,
        additionalClasses: updatedAdditionalCount,
        notes: updatedNotesCount,
        logs: updatedLogsCount,
        total: updatedClassCount + updatedAdditionalCount + updatedNotesCount + updatedLogsCount,
      },
    };
  },
});

/**
 * QUERY: Find potential duplicate students
 * 
 * Uses fuzzy matching on name + grade + school/provider to suggest merges
 */
export const findDuplicates = query({
  args: {
    userId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
    providerId: v.optional(v.id("providers")),
  },
  handler: async (ctx, args) => {
    // Get user for authorization
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get students based on scope
    let students;
    if (args.schoolId) {
      students = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
        .collect();
    } else if (args.providerId) {
      students = await ctx.db
        .query("students")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId))
        .collect();
    } else if (user.role === "admin") {
      students = await ctx.db.query("students").collect();
    } else {
      throw new Error("Must specify schoolId or providerId, or be admin");
    }

    // Filter out deleted and merged students
    const activeStudents = students.filter((s) => !s.isDeleted && !s.mergedIntoId);

    // Find duplicates using fuzzy matching
    interface DuplicateGroup {
      students: typeof activeStudents;
      matchType: string;
    }

    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < activeStudents.length; i++) {
      const student1 = activeStudents[i];
      if (processedIds.has(student1._id)) continue;

      const group: typeof activeStudents = [student1];

      for (let j = i + 1; j < activeStudents.length; j++) {
        const student2 = activeStudents[j];
        if (processedIds.has(student2._id)) continue;

        // Match criteria: same grade AND similar name
        const sameGrade = student1.grade === student2.grade;
        const similarName =
          student1.firstName.toLowerCase().trim() === student2.firstName.toLowerCase().trim() &&
          (student1.lastName || "").toLowerCase().trim() === (student2.lastName || "").toLowerCase().trim();

        if (sameGrade && similarName) {
          group.push(student2);
          processedIds.add(student2._id);
        }
      }

      // If we found duplicates, add to results
      if (group.length > 1) {
        processedIds.add(student1._id);
        duplicateGroups.push({
          students: group,
          matchType: "exact_name_and_grade",
        });
      }
    }

    return duplicateGroups;
  },
});

/**
 * QUERY: Get merge suggestions for a specific student
 */
export const getMergeSuggestions = query({
  args: {
    userId: v.id("users"),
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Cannot suggest merges for deleted or already merged students
    if (student.isDeleted || student.mergedIntoId) {
      return [];
    }

    // Find similar students in the same school/provider
    let similarStudents;
    if (student.schoolId) {
      similarStudents = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", student.schoolId!))
        .filter((q) =>
          q.and(
            q.neq(q.field("_id"), args.studentId),
            q.eq(q.field("grade"), student.grade),
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("mergedIntoId"), undefined)
          )
        )
        .collect();
    } else if (student.providerId) {
      similarStudents = await ctx.db
        .query("students")
        .withIndex("by_provider", (q) => q.eq("providerId", student.providerId!))
        .filter((q) =>
          q.and(
            q.neq(q.field("_id"), args.studentId),
            q.eq(q.field("grade"), student.grade),
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("mergedIntoId"), undefined)
          )
        )
        .collect();
    } else {
      return [];
    }

    // Filter to only similar names
    const suggestions = similarStudents.filter((s) => {
      const nameMatch =
        s.firstName.toLowerCase().trim() === student.firstName.toLowerCase().trim() &&
        (s.lastName || "").toLowerCase().trim() === (student.lastName || "").toLowerCase().trim();
      return nameMatch;
    });

    // Batch fetch all classes and notes for all relevant students (source + suggestions)
    const allStudentIds = [args.studentId, ...suggestions.map(s => s._id)];

    // Fetch all classes for these students
    const allClasses = await ctx.db
      .query("classes")
      .withIndex("by_student")
      .collect();
    const classesByStudent = new Map();
    for (const cls of allClasses) {
      if (allStudentIds.some(id => id.equals(cls.studentId))) {
        const count = classesByStudent.get(cls.studentId) || 0;
        classesByStudent.set(cls.studentId, count + 1);
      }
    }

    // Fetch all notes for these students
    const allNotes = await ctx.db
      .query("postClassNotes")
      .withIndex("by_student")
      .collect();
    const notesByStudent = new Map();
    for (const note of allNotes) {
      if (allStudentIds.some(id => id.equals(note.studentId))) {
        const count = notesByStudent.get(note.studentId) || 0;
        notesByStudent.set(note.studentId, count + 1);
      }
    }

    // Enrich suggestions with counts for each suggestion's studentId
    const enrichedSuggestions = suggestions.map((suggestion) => ({
      ...suggestion,
      matchScore: 100, // Exact name + grade match
      affectedClasses: classesByStudent.get(suggestion._id) || 0,
      affectedNotes: notesByStudent.get(suggestion._id) || 0,
    }));
    return enrichedSuggestions;
  },
});

/**
 * MUTATION: Restore a soft-deleted student (admin only)
 */
export const restoreStudent = mutation({
  args: {
    userId: v.id("users"),
    studentId: v.id("students"),
    reason: v.string(),
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ RATE LIMIT: Prevent accidental rapid restores
    await checkRateLimit(ctx, {
      key: `restore-student:${args.userId}`,
      limit: 10,
      windowMs: 60000,
    });

    validateLength(args.reason, "Restore reason", 500, 10);

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    if (!student.isDeleted) {
      throw new Error("Student is not deleted");
    }

    // ✅ SECURITY: Admin only
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can restore students");
    }

    // Cannot restore merged students (data has been redirected)
    if (student.mergedIntoId) {
      throw new Error("Cannot restore a merged student. Please unmerge first by restoring the original merge.");
    }

    // Restore the student
    await ctx.db.patch(args.studentId, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      deletionReason: undefined,
    });

    // ✅ AUDIT LOG
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.RESTORE_STUDENT,
      targetType: AuditTargetTypes.STUDENTS,
      targetId: args.studentId,
      targetName: `${student.firstName} ${student.lastName}`,
      reason: args.reason,
      schoolId: student.schoolId,
      details: {
        studentId: student.studentId,
        originalDeletionDate: student.deletedAt,
        originalDeletionReason: student.deletionReason,
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    return { success: true };
  },
});

/**
 * MUTATION: Hard delete a student (admin only, permanent)
 * 
 * WARNING: This is irreversible. Should only be used in exceptional cases.
 * All references must be cleaned up first (no active classes, notes, etc.)
 */
export const hardDeleteStudent = mutation({
  args: {
    userId: v.id("users"),
    studentId: v.id("students"),
    reason: v.string(),
    confirmationText: v.string(), // Must type "PERMANENTLY DELETE" to confirm
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ RATE LIMIT: Very restrictive (3 per minute)
    await checkRateLimit(ctx, {
      key: `hard-delete-student:${args.userId}`,
      limit: 3,
      windowMs: 60000,
    });

    validateLength(args.reason, "Hard delete reason", 1000, 20);

    // Validate confirmation text
    if (args.confirmationText !== "PERMANENTLY DELETE") {
      throw new Error("Confirmation text must be exactly 'PERMANENTLY DELETE'");
    }

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // ✅ SECURITY: Admin only
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can permanently delete students");
    }

    // ✅ VALIDATION: Check for active references
    const activeClasses = await ctx.db
      .query("classes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (activeClasses.length > 0) {
      throw new Error(
        `Cannot hard delete student with ${activeClasses.length} class reference(s). Please clean up or soft-delete instead.`
      );
    }

    const activeNotes = await ctx.db
      .query("postClassNotes")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    if (activeNotes.length > 0) {
      throw new Error(
        `Cannot hard delete student with ${activeNotes.length} note reference(s). Please clean up or soft-delete instead.`
      );
    }

    // ✅ AUDIT LOG BEFORE deletion (so we can track it)
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.HARD_DELETE_STUDENT,
      targetType: AuditTargetTypes.STUDENTS,
      targetId: args.studentId,
      targetName: `${student.firstName} ${student.lastName}`,
      reason: args.reason,
      schoolId: student.schoolId,
      details: {
        studentId: student.studentId,
        wasSoftDeleted: student.isDeleted,
        wasMerged: !!student.mergedIntoId,
        grade: student.grade,
        class: student.class,
      },
      userAgent: args.userAgent,
      screenResolution: args.screenResolution,
      timezone: args.timezone,
      locale: args.locale,
      sessionId: args.sessionId,
    });

    // PERMANENTLY DELETE
    await ctx.db.delete(args.studentId);

    return { success: true };
  },
});

/**
 * QUERY: Get soft-deleted students (admin/moderator only)
 */
export const getDeletedStudents = query({
  args: {
    userId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Admin or moderator only
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized: Admin or moderator access required");
    }

    // Get deleted students
    const deletedStudents = await ctx.db
      .query("students")
      .withIndex("by_deleted", (q) => q.eq("isDeleted", true))
      .collect();

    // Filter by school for moderators
    if (user.role === "moderator" && user.schoolId) {
      return deletedStudents.filter((s) => s.schoolId === user.schoolId);
    }

    // Filter by school if specified
    if (args.schoolId) {
      return deletedStudents.filter((s) => s.schoolId === args.schoolId);
    }

    return deletedStudents;
  },
});

/**
 * QUERY: Get merged students (admin/moderator only)
 */
export const getMergedStudents = query({
  args: {
    userId: v.id("users"),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Admin or moderator only
    if (user.role !== "admin" && user.role !== "moderator") {
      throw new Error("Unauthorized: Admin or moderator access required");
    }

    // Get all students with mergedIntoId set (use index for performance)
    const mergedStudents = await ctx.db
      .query("students")
      .withIndex("by_merged_into")
      .filter((q) => q.neq(q.field("mergedIntoId"), undefined))
      .collect();

    // Filter by school for moderators
    if (user.role === "moderator" && user.schoolId) {
      const filtered = mergedStudents.filter((s) => s.schoolId === user.schoolId);
      
      // Enrich with target student info
      const enriched = await Promise.all(
        filtered.map(async (s) => {
          const target = s.mergedIntoId ? await ctx.db.get(s.mergedIntoId) : null;
          return {
            ...s,
            targetStudent: target,
          };
        })
      );
      return enriched;
    }

    // Filter by school if specified
    const filtered = args.schoolId
      ? mergedStudents.filter((s) => s.schoolId === args.schoolId)
      : mergedStudents;

    // Enrich with target student info
    const enriched = await Promise.all(
      filtered.map(async (s) => {
        const target = s.mergedIntoId ? await ctx.db.get(s.mergedIntoId) : null;
        return {
          ...s,
          targetStudent: target,
        };
      })
    );

    return enriched;
  },
});
