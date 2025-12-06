import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Query to find potential duplicate students based on 4+ field match
 * Checks: firstName, lastName, grade, school/provider, dateOfBirth, guardianPhone
 */
export const findPotentialDuplicates = query({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    // Get all students to check for duplicates
    let candidates: typeof student[] = [];

    if (student.schoolId) {
      // School students: check within same school
      candidates = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", student.schoolId!))
        .collect();
    } else if (student.providerId) {
      // Provider students: check within same provider
      candidates = await ctx.db
        .query("students")
        .withIndex("by_provider", (q) => q.eq("providerId", student.providerId!))
        .collect();
    } else {
      // Guardian/orphan students: check all
      candidates = await ctx.db.query("students").collect();
    }

    // Filter out the current student
    candidates = candidates.filter((s) => s._id !== student._id);

    // Check for matches on multiple fields
    const potentialDuplicates: Array<{
      student: typeof student;
      matchedFields: string[];
      matchCount: number;
    }> = [];

    for (const candidate of candidates) {
      const matchedFields: string[] = [];

      // Compare firstName (case-insensitive)
      if (
        student.firstName.toLowerCase().trim() ===
        candidate.firstName.toLowerCase().trim()
      ) {
        matchedFields.push("firstName");
      }

      // Compare lastName (case-insensitive)
      if (
        (student.lastName || "").toLowerCase().trim() ===
        (candidate.lastName || "").toLowerCase().trim() &&
        student.lastName // Only count if lastName exists
      ) {
        matchedFields.push("lastName");
      }

      // Compare grade
      if (student.grade === candidate.grade) {
        matchedFields.push("grade");
      }

      // Compare class
      if (student.class && candidate.class && student.class === candidate.class) {
        matchedFields.push("class");
      }

      // Compare school/provider
      if (student.schoolId && candidate.schoolId && student.schoolId === candidate.schoolId) {
        matchedFields.push("school");
      }
      if (student.providerId && candidate.providerId && student.providerId === candidate.providerId) {
        matchedFields.push("provider");
      }

      // Compare dateOfBirth (if both have it)
      if (student.dateOfBirth && candidate.dateOfBirth && student.dateOfBirth === candidate.dateOfBirth) {
        matchedFields.push("dateOfBirth");
      }

      // Compare guardianPhone (if both have it)
      if (
        student.guardianPhone &&
        candidate.guardianPhone &&
        student.guardianPhone.replace(/\s/g, "") === candidate.guardianPhone.replace(/\s/g, "")
      ) {
        matchedFields.push("guardianPhone");
      }

      // Compare parentPhone (if both have it)
      if (
        student.parentPhone &&
        candidate.parentPhone &&
        student.parentPhone.replace(/\s/g, "") === candidate.parentPhone.replace(/\s/g, "")
      ) {
        matchedFields.push("parentPhone");
      }

      // If 4+ fields match, add to potential duplicates
      if (matchedFields.length >= 4) {
        potentialDuplicates.push({
          student: candidate,
          matchedFields,
          matchCount: matchedFields.length,
        });
      }
    }

    // Sort by match count (highest first)
    potentialDuplicates.sort((a, b) => b.matchCount - a.matchCount);

    return potentialDuplicates;
  },
});

/**
 * Mutation to flag a student as a potential duplicate
 */
export const flagStudent = mutation({
  args: {
    studentId: v.id("students"),
    potentialDuplicateIds: v.array(v.id("students")),
    matchedFields: v.array(v.string()),
    reason: v.string(),
    reasonTh: v.string(),
    flaggedBy: v.id("users"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already flagged
    const existing = await ctx.db
      .query("studentWatchlist")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      // Update existing entry
      await ctx.db.patch(existing._id, {
        potentialDuplicateIds: args.potentialDuplicateIds,
        matchedFields: args.matchedFields,
        notes: args.notes,
        notesTh: args.notesTh,
        flaggedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new watchlist entry
    const id = await ctx.db.insert("studentWatchlist", {
      studentId: args.studentId,
      potentialDuplicateIds: args.potentialDuplicateIds,
      reason: args.reason,
      reasonTh: args.reasonTh,
      status: "pending",
      notes: args.notes,
      notesTh: args.notesTh,
      flaggedBy: args.flaggedBy,
      flaggedAt: Date.now(),
      matchedFields: args.matchedFields,
    });

    return id;
  },
});

/**
 * Query to list all watchlist entries
 */
export const listWatchlist = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("resolved"),
      v.literal("dismissed")
    )),
  },
  handler: async (ctx, args) => {
    let entries;

    if (args.status) {
      entries = await ctx.db
        .query("studentWatchlist")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      entries = await ctx.db.query("studentWatchlist").collect();
    }

    // Enrich with student data
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const student = await ctx.db.get(entry.studentId);
        const potentialDuplicates = await Promise.all(
          entry.potentialDuplicateIds.map((id) => ctx.db.get(id))
        );

        const flaggedByUser = await ctx.db.get(entry.flaggedBy);
        const resolvedByUser = entry.resolvedBy ? await ctx.db.get(entry.resolvedBy) : null;

        return {
          ...entry,
          student,
          potentialDuplicates: potentialDuplicates.filter(Boolean),
          flaggedByUser,
          resolvedByUser,
        };
      })
    );

    // Sort by flagged date (newest first)
    return enrichedEntries.sort((a, b) => b.flaggedAt - a.flaggedAt);
  },
});

/**
 * Mutation to dismiss a watchlist entry
 */
export const dismissWatchlistEntry = mutation({
  args: {
    id: v.id("studentWatchlist"),
    resolvedBy: v.id("users"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "dismissed",
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
      notes: args.notes,
      notesTh: args.notesTh,
    });
  },
});

/**
 * Mutation to resolve a watchlist entry (after merge)
 */
export const resolveWatchlistEntry = mutation({
  args: {
    id: v.id("studentWatchlist"),
    resolvedBy: v.id("users"),
    mergedIntoId: v.id("students"),
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "resolved",
      resolvedBy: args.resolvedBy,
      resolvedAt: Date.now(),
      mergedIntoId: args.mergedIntoId,
      notes: args.notes,
      notesTh: args.notesTh,
    });
  },
});
