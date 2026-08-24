import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { logAudit, AuditActions, AuditTargetTypes } from "./auditHelpers";

/**
 * Duplicate Detection System
 *
 * Detects potential duplicate students by comparing:
 * - firstName, lastName, grade, dateOfBirth, guardianPhone, area, schoolId
 * - 4+ matches → flag for admin review
 */

// Helper function to compare two students and count matches
function compareStudents(
  student1: Doc<"students">,
  student2: Doc<"students">,
): { matches: number; details: Record<string, boolean> } {
  const details = {
    firstName: false,
    lastName: false,
    grade: false,
    dateOfBirth: false,
    guardianPhone: false,
    area: false,
    schoolId: false,
  };

  let matches = 0;

  // Case-insensitive name matching
  if (student1.firstName?.toLowerCase() === student2.firstName?.toLowerCase()) {
    details.firstName = true;
    matches++;
  }
  if (student1.lastName?.toLowerCase() === student2.lastName?.toLowerCase()) {
    details.lastName = true;
    matches++;
  }

  // Exact matches for other fields
  if (student1.grade === student2.grade) {
    details.grade = true;
    matches++;
  }
  if (
    student1.dateOfBirth &&
    student2.dateOfBirth &&
    student1.dateOfBirth === student2.dateOfBirth
  ) {
    details.dateOfBirth = true;
    matches++;
  }
  if (
    student1.guardianPhone &&
    student2.guardianPhone &&
    student1.guardianPhone === student2.guardianPhone
  ) {
    details.guardianPhone = true;
    matches++;
  }
  if (student1.area && student2.area && student1.area === student2.area) {
    details.area = true;
    matches++;
  }
  if (
    student1.schoolId &&
    student2.schoolId &&
    student1.schoolId === student2.schoolId
  ) {
    details.schoolId = true;
    matches++;
  }

  return { matches, details };
}

// Detect duplicates for a newly created student
export const detectDuplicates = mutation({
  args: {
    studentId: v.id("students"),
    userId: v.id("users"), // User who created the student (for context)
  },
  handler: async (ctx, args) => {
    // Get the newly created student
    const newStudent = await ctx.db.get(args.studentId);
    if (!newStudent) {
      throw new Error("Student not found");
    }

    // Get all other students to compare
    let allStudents;
    if (newStudent.schoolId) {
      // School students: compare within same school
      allStudents = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", newStudent.schoolId!))
        .collect();
    } else if (newStudent.providerId) {
      // Provider students: compare within same provider
      const providerId = newStudent.providerId; // Capture for type safety
      allStudents = await ctx.db
        .query("students")
        .withIndex("by_provider", (q) => q.eq("providerId", providerId))
        .collect();
    } else if (newStudent.area) {
      // Area-based students: compare within same area
      const area = newStudent.area; // Capture for type safety
      allStudents = await ctx.db
        .query("students")
        .withIndex("by_area", (q) => q.eq("area", area))
        .collect();
    } else {
      // No scope available - skip duplicate detection for performance
      console.warn(
        "Student has no schoolId, providerId, or area - skipping duplicate detection",
      );
      return {
        hasDuplicates: false,
        duplicates: [],
        message: "No scope available for duplicate detection",
      };
    }

    // Filter out the new student itself
    const otherStudents = allStudents.filter((s) => s._id !== args.studentId);

    // Find potential duplicates (4+ field matches)
    const potentialDuplicates: {
      studentId: Id<"students">;
      matches: number;
      details: Record<string, boolean>;
    }[] = [];

    for (const otherStudent of otherStudents) {
      const comparison = compareStudents(newStudent, otherStudent);
      if (comparison.matches >= 4) {
        potentialDuplicates.push({
          studentId: otherStudent._id,
          matches: comparison.matches,
          details: comparison.details,
        });
      }
    }

    // If duplicates found, create watchlist entries
    if (potentialDuplicates.length > 0) {
      // Get the highest match count
      const maxMatches = Math.max(...potentialDuplicates.map((d) => d.matches));
      const bestMatch = potentialDuplicates.find(
        (d) => d.matches === maxMatches,
      )!;

      await ctx.db.insert("duplicateWatchlist", {
        studentId: args.studentId,
        possibleDuplicateIds: potentialDuplicates.map((d) => d.studentId),
        matchedFields: maxMatches,
        matchDetails: {
          firstName: bestMatch.details.firstName,
          lastName: bestMatch.details.lastName,
          grade: bestMatch.details.grade,
          dateOfBirth: bestMatch.details.dateOfBirth,
          guardianPhone: bestMatch.details.guardianPhone,
          area: bestMatch.details.area,
          schoolId: bestMatch.details.schoolId,
        },
        status: "pending",
        createdAt: Date.now(),
        userDecision: "create_new", // User proceeded with creation
        userDecisionBy: args.userId,
      });

      return {
        hasDuplicates: true,
        duplicates: potentialDuplicates,
        message: `Found ${potentialDuplicates.length} potential duplicate(s) with ${maxMatches} matching field(s)`,
      };
    }

    return {
      hasDuplicates: false,
      duplicates: [],
      message: "No duplicates found",
    };
  },
});

// Query to list all watchlist entries (admin only)
export const listWatchlist = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("merged"),
        v.literal("dismissed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Get watchlist entries
    const baseQuery = ctx.db.query("duplicateWatchlist");

    let entries;
    if (args.status) {
      entries = await baseQuery
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      entries = await baseQuery
        .withIndex("by_created_at")
        .order("desc")
        .collect();
    }

    // Fetch student details for each entry
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const student = await ctx.db.get(entry.studentId);
        const possibleDuplicates = await Promise.all(
          entry.possibleDuplicateIds.map((id) => ctx.db.get(id)),
        );

        return {
          ...entry,
          student,
          possibleDuplicates: possibleDuplicates.filter(Boolean), // Filter out nulls
        };
      }),
    );

    return enrichedEntries;
  },
});

// Query to get a specific watchlist entry with full details
export const getWatchlistEntry = query({
  args: {
    entryId: v.id("duplicateWatchlist"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      return null;
    }

    // Fetch student details
    const student = await ctx.db.get(entry.studentId);
    const possibleDuplicates = await Promise.all(
      entry.possibleDuplicateIds.map((id) => ctx.db.get(id)),
    );

    // Get classes for all students
    const studentClasses = await ctx.db
      .query("classes")
      .withIndex("by_student", (q) => q.eq("studentId", entry.studentId))
      .collect();

    const duplicateClasses = await Promise.all(
      entry.possibleDuplicateIds.map((id) =>
        ctx.db
          .query("classes")
          .withIndex("by_student", (q) => q.eq("studentId", id))
          .collect(),
      ),
    );

    return {
      ...entry,
      student,
      possibleDuplicates: possibleDuplicates.filter(Boolean),
      studentClasses,
      duplicateClasses,
    };
  },
});

// Mutation to dismiss a watchlist entry (mark as non-duplicate)
export const dismissDuplicate = mutation({
  args: {
    entryId: v.id("duplicateWatchlist"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.entryId, {
      status: "dismissed",
      reviewedBy: args.userId,
      reviewedAt: Date.now(),
      notes: args.notes,
      notesTh: args.notesTh,
    });

    return { success: true };
  },
});

// Mutation to merge duplicate students
//
// #136 Student Merge/Sync/Soft-delete:
// - Survivor-wins conflict policy: the kept student's fields are authoritative;
//   differing fields on merged students are discarded (recorded in the audit log).
// - No renaming or forking: student identity fields on the survivor are never modified.
// - ALL references to each merged student are redirected across every table that
//   stores a student id, then the non-survivor is soft-deleted (isDeleted +
//   mergedIntoId) so history remains auditable. Hard deletes remain admin-only
//   via students.remove.
export const mergeDuplicateStudents = mutation({
  args: {
    entryId: v.id("duplicateWatchlist"),
    keepStudentId: v.id("students"), // Student to keep
    deleteStudentIds: v.array(v.id("students")), // Students to merge and delete
    userId: v.id("users"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Verify the entry exists
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Watchlist entry not found");
    }

    // Validate: Cannot merge a student into itself
    if (args.deleteStudentIds.includes(args.keepStudentId)) {
      throw new Error("Cannot merge a student into itself");
    }
    // Validate: keepStudentId must be related to this watchlist entry
    const entryDuplicateSet: Id<"students">[] = [
      entry.studentId,
      ...(entry.possibleDuplicateIds ?? []),
    ];
    if (!entryDuplicateSet.includes(args.keepStudentId)) {
      throw new Error("Keep student must be part of this duplicate set");
    }
    // Validate: every merged student must also be part of this duplicate set
    for (const deleteId of args.deleteStudentIds) {
      if (!entryDuplicateSet.includes(deleteId)) {
        throw new Error(
          "Merge student is not part of this duplicate set - no renaming/forking permitted",
        );
      }
    }

    const keepStudent = await ctx.db.get(args.keepStudentId);
    if (!keepStudent) {
      throw new Error("Keep student not found");
    }
    if (keepStudent.isDeleted) {
      throw new Error("Keep student is already deleted");
    }

    // Aggregate redirect counts for the audit trail
    const redirectCounts = {
      classes: 0,
      classRosters: 0,
      postClassNotes: 0,
      teacherLogs: 0,
      userRecentStudents: 0,
      watchlistEntries: 0,
    };
    const mergedStudents: {
      mergedId: Id<"students">;
      name: string;
      studentCode: string;
    }[] = [];

    for (const deleteId of args.deleteStudentIds) {
      const deleteStudent = await ctx.db.get(deleteId);
      if (!deleteStudent) {
        throw new Error(`Student to merge not found: ${deleteId}`);
      }
      if (deleteStudent.isDeleted) {
        throw new Error(`Student to merge is already deleted: ${deleteId}`);
      }

      // 1. classes.studentId — reassign primary ownership
      const ownedClasses = await ctx.db
        .query("classes")
        .withIndex("by_student", (q) => q.eq("studentId", deleteId))
        .collect();
      for (const cls of ownedClasses) {
        await ctx.db.patch(cls._id, { studentId: args.keepStudentId });
      }
      redirectCounts.classes += ownedClasses.length;

      // 2. classes.additionalStudentIds — remove from old rosters, add to survivor
      //    (no index on additionalStudentIds; full scan keeps this correct)
      const rosterClasses = (await ctx.db.query("classes").collect()).filter(
        (cls) => (cls.additionalStudentIds ?? []).includes(deleteId),
      );
      for (const cls of rosterClasses) {
        const nextRoster = (cls.additionalStudentIds ?? [])
          .filter((id) => id !== deleteId)
          .filter((id) => id !== args.keepStudentId);
        await ctx.db.patch(cls._id, {
          additionalStudentIds: [
            ...new Set([args.keepStudentId, ...nextRoster]),
          ],
        });
      }
      redirectCounts.classRosters += rosterClasses.length;

      // 3. postClassNotes.studentId — note history follows the survivor
      const notes = await ctx.db
        .query("postClassNotes")
        .withIndex("by_student", (q) => q.eq("studentId", deleteId))
        .collect();
      for (const note of notes) {
        await ctx.db.patch(note._id, { studentId: args.keepStudentId });
      }
      redirectCounts.postClassNotes += notes.length;

      // 4. teacherLogs.relatedStudentId — historical logs point at survivor
      //    (no index on relatedStudentId; filter scan)
      const logs = (await ctx.db.query("teacherLogs").collect()).filter(
        (log) => log.relatedStudentId === deleteId,
      );
      for (const log of logs) {
        await ctx.db.patch(log._id, { relatedStudentId: args.keepStudentId });
      }
      redirectCounts.teacherLogs += logs.length;

      // 5. users.wizardPreferences.recentStudentIds — drop stale shortcut entries
      //    pointing at the merged student; substitute the survivor so UX keeps working
      const usersWithRecent = (await ctx.db.query("users").collect()).filter(
        (u) => (u.wizardPreferences?.recentStudentIds ?? []).includes(deleteId),
      );
      for (const u of usersWithRecent) {
        const recent = (u.wizardPreferences?.recentStudentIds ?? [])
          .filter((id) => id !== deleteId)
          .filter((id) => id !== args.keepStudentId);
        await ctx.db.patch(u._id, {
          wizardPreferences: {
            ...u.wizardPreferences,
            recentStudentIds: [args.keepStudentId, ...recent].slice(0, 5),
          },
        });
      }
      redirectCounts.userRecentStudents += usersWithRecent.length;

      // 6. duplicateWatchlist — other entries referencing the merged student are
      //    redirected so future reviews resolve to the survivor (the current
      //    entry is finalized below instead)
      const watchlistEntries = (
        await ctx.db.query("duplicateWatchlist").collect()
      ).filter(
        (e) =>
          e._id !== args.entryId &&
          (e.studentId === deleteId ||
            (e.possibleDuplicateIds ?? []).includes(deleteId) ||
            e.mergedIntoId === deleteId),
      );
      for (const e of watchlistEntries) {
        const nextDuplicates = [
          ...new Set(
            (e.possibleDuplicateIds ?? [])
              .filter((id) => id !== deleteId)
              .concat(args.keepStudentId),
          ),
        ].filter((id) => id !== e.studentId);
        await ctx.db.patch(e._id, {
          studentId:
            e.studentId === deleteId ? args.keepStudentId : e.studentId,
          possibleDuplicateIds: nextDuplicates,
          mergedIntoId:
            e.mergedIntoId === deleteId ? args.keepStudentId : e.mergedIntoId,
        });
      }
      redirectCounts.watchlistEntries += watchlistEntries.length;

      // Soft-delete the merged student (Pattern #8): preserves audit trail and
      // records which record absorbed it. See #136.
      await ctx.db.patch(deleteId, {
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: args.userId,
        deletionReason: "Merged into another student record",
        mergedIntoId: args.keepStudentId,
      });

      mergedStudents.push({
        mergedId: deleteId,
        name: `${deleteStudent.firstName} ${deleteStudent.lastName ?? ""}`.trim(),
        studentCode: deleteStudent.studentId,
      });
    }

    // Finalize the watchlist entry that drove this merge
    await ctx.db.patch(args.entryId, {
      status: "merged",
      reviewedBy: args.userId,
      reviewedAt: Date.now(),
      mergedIntoId: args.keepStudentId,
      notes: args.notes,
      notesTh: args.notesTh,
    });

    // Audit trail (#136): one summary entry per merge operation. Survivor-wins
    // policy means conflicting field values on merged students were discarded;
    // the discarded records' identities are preserved here and via soft deletes.
    const keepSchoolId = keepStudent.schoolId;
    await logAudit(ctx, {
      userId: args.userId,
      action: AuditActions.MERGE_STUDENTS,
      targetType: AuditTargetTypes.STUDENTS,
      targetId: args.keepStudentId,
      targetName:
        `${keepStudent.firstName} ${keepStudent.lastName ?? ""}`.trim(),
      reason: args.notes ?? "Merged duplicate students",
      affectedCount: mergedStudents.length,
      schoolId: keepSchoolId,
      details: {
        conflictPolicy: "survivor_wins_with_audit",
        keptStudentId: args.keepStudentId,
        keptStudentName:
          `${keepStudent.firstName} ${keepStudent.lastName ?? ""}`.trim(),
        mergedStudents,
        redirects: redirectCounts,
        watchlistEntryId: args.entryId,
      },
    });

    return {
      success: true,
      message: `Successfully merged ${args.deleteStudentIds.length} duplicate(s) into student ${args.keepStudentId}`,
      redirects: redirectCounts,
      mergedStudentIds: mergedStudents.map((m) => m.mergedId),
    };
  },
});

// Mutation to mark entry as reviewed (but not merged/dismissed)
export const markAsReviewed = mutation({
  args: {
    entryId: v.id("duplicateWatchlist"),
    userId: v.id("users"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.patch(args.entryId, {
      status: "reviewed",
      reviewedBy: args.userId,
      reviewedAt: Date.now(),
      notes: args.notes,
      notesTh: args.notesTh,
    });

    return { success: true };
  },
});

// Query to get watchlist statistics (for dashboard)
export const getWatchlistStats = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const allEntries = await ctx.db.query("duplicateWatchlist").collect();

    const stats = {
      total: allEntries.length,
      pending: allEntries.filter((e) => e.status === "pending").length,
      reviewed: allEntries.filter((e) => e.status === "reviewed").length,
      merged: allEntries.filter((e) => e.status === "merged").length,
      dismissed: allEntries.filter((e) => e.status === "dismissed").length,
    };

    return stats;
  },
});
