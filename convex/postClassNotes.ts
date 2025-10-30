import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

// Query to get classes needing feedback (completed but no notes)
// For merged classes (with additionalStudentIds), creates individual entries per student
export const getClassesNeedingFeedback = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || user.role !== "teacher") {
            return [];
        }

        // Get yesterday and today timestamps
        const now = Date.now();
        const yesterday = now - (24 * 60 * 60 * 1000);

        // Get approved classes from yesterday and today
        const recentClasses = await ctx.db
            .query("classes")
            .withIndex("by_teacher_and_date", (q) =>
                q.eq("teacherId", args.userId)
                    .gte("scheduledDate", yesterday)
                    .lte("scheduledDate", now)
            )
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        // Collect all unique student IDs (primary + additional)
        const allStudentIds = new Set<Id<"students">>();
        for (const cls of recentClasses) {
            allStudentIds.add(cls.studentId);
            if (cls.additionalStudentIds) {
                cls.additionalStudentIds.forEach(id => allStudentIds.add(id));
            }
        }

        // Batch fetch all students
        const students = await Promise.all([...allStudentIds].map((id) => ctx.db.get(id)));
        const studentMap = new Map(students.map((s) => [s?._id, s]));

        // Expand classes into individual student entries
        const expandedClasses = [];
        for (const cls of recentClasses) {
            // Get all students for this class (primary + additional)
            const studentIdsForClass = [cls.studentId, ...(cls.additionalStudentIds || [])];

            for (const studentId of studentIdsForClass) {
                // Check if notes already exist for this student in this class
                // Use composite index for efficient lookup
                const existingNote = await ctx.db
                    .query("postClassNotes")
                    .withIndex("by_class_and_student", (q) =>
                        q.eq("classId", cls._id).eq("studentId", studentId))
                    .first();

                if (!existingNote) {
                    expandedClasses.push({
                        ...cls,
                        student: studentMap.get(studentId),
                        currentStudentId: studentId, // Track which student this entry is for
                    });
                }
            }
        }

        return expandedClasses;
    },
});

// Mutation to create post-class notes
// For merged classes, studentId parameter specifies which student the notes are for
export const create = mutation({
    args: {
        classId: v.id("classes"),
        teacherId: v.id("users"),
        studentId: v.optional(v.id("students")), // For merged classes - which student is this note for?
        notes: v.optional(v.string()),
        notesTh: v.optional(v.string()),
        attendance: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
        behavior: v.optional(v.union(
            v.literal("excellent"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("needs_improvement")
        )),
        participation: v.optional(v.union(
            v.literal("excellent"),
            v.literal("good"),
            v.literal("fair"),
            v.literal("needs_improvement")
        )),
        homework: v.optional(v.string()),
        homeworkTh: v.optional(v.string()),
        skipped: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Verify user is authenticated
        const user = await ctx.db.get(args.teacherId);
        if (!user) {
            throw new Error("Not authenticated");
        }

        // Get class data
        const classData = await ctx.db.get(args.classId);
        if (!classData) {
            throw new Error("Class not found");
        }

        // Verify user owns this class
        if (classData.teacherId !== args.teacherId) {
            throw new Error("Unauthorized: You can only add notes to your own classes");
        }

        // Determine which student this note is for
        // If studentId provided (merged class), use it. Otherwise use primary student.
        const targetStudentId = args.studentId || classData.studentId;

        // Verify student is actually in this class
        const allStudentIds = [classData.studentId, ...(classData.additionalStudentIds || [])];
        if (!allStudentIds.includes(targetStudentId)) {
            throw new Error("Student is not enrolled in this class");
        }

        // Check if notes already exist for this student in this class
        // Use composite index for efficient lookup
        const existing = await ctx.db
            .query("postClassNotes")
            .withIndex("by_class_and_student", (q) =>
                q.eq("classId", args.classId).eq("studentId", targetStudentId))
            .first();

        if (existing) {
            throw new Error("Notes already exist for this student in this class");
        }

        // Create notes
        const noteId = await ctx.db.insert("postClassNotes", {
            classId: args.classId,
            teacherId: args.teacherId,
            studentId: targetStudentId, // Use the determined student ID
            schoolId: classData.schoolId,
            notes: args.notes,
            notesTh: args.notesTh,
            attendance: args.attendance,
            behavior: args.behavior,
            participation: args.participation,
            homework: args.homework,
            homeworkTh: args.homeworkTh,
            skipped: args.skipped,
            createdAt: Date.now(),
        });

        // Log the action if not skipped
        if (!args.skipped) {
            const student = await ctx.db.get(targetStudentId);
            await ctx.db.insert("teacherLogs", {
                teacherId: args.teacherId,
                schoolId: classData.schoolId,
                action: "post_class_notes_added",
                actionTh: "เพิ่มบันทึกหลังเรียน",
                details: `Added post-class notes for ${student?.firstName} ${student?.lastName} on ${new Date(classData.scheduledDate).toLocaleDateString()}`,
                detailsTh: `เพิ่มบันทึกหลังเรียนสำหรับ ${student?.firstName} ${student?.lastName} วันที่ ${new Date(classData.scheduledDate).toLocaleDateString("th-TH")}`,
                relatedClassId: args.classId,
                createdAt: Date.now(),
            });
        }

        return noteId;
    },
});

// Query to get notes for a class
export const getByClass = query({
    args: {
        classId: v.id("classes"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("postClassNotes")
            .withIndex("by_class", (q) => q.eq("classId", args.classId))
            .first();
    },
});

// Query to get notes by teacher
export const getByTeacher = query({
    args: {
        teacherId: v.id("users"),
        startDate: v.optional(v.number()),
        endDate: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let notes = await ctx.db
            .query("postClassNotes")
            .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
            .collect();

        // Filter by date if provided
        if (args.startDate && args.endDate) {
            notes = notes.filter(
                (note) => note.createdAt >= args.startDate! && note.createdAt <= args.endDate!
            );
        }

        return notes;
    },
});

// Query to get notes by student (for parent view)
export const getByStudent = query({
    args: {
        studentId: v.id("students"),
    },
    handler: async (ctx, args) => {
        const notes = await ctx.db
            .query("postClassNotes")
            .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
            .collect();

        // Batch fetch related classes
        const classIds = notes.map((n) => n.classId);
        const classes = await Promise.all(classIds.map((id) => ctx.db.get(id)));
        const classMap = new Map(classes.map((c) => [c?._id, c]));

        return notes.map((note) => ({
            ...note,
            class: classMap.get(note.classId),
        }));
    },
});
