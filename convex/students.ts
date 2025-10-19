import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper function to generate unique student ID
function generateStudentId(firstName: string, lastName: string, schoolId: string): string {
  const timestamp = Date.now().toString(36);
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  const schoolHash = schoolId.substring(0, 4).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${schoolHash}-${nameHash}-${timestamp}-${random}`;
}

// Query to list students
export const list = query({
  args: {
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    if (args.schoolId) {
      return await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .collect();
    }

    return await ctx.db.query("students").collect();
  },
});

// Query to get student by ID
export const getById = query({
  args: {
    id: v.id("students"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Query to get student by student ID
export const getByStudentId = query({
  args: {
    studentId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .first();
  },
});

// Query to get students by guardian
export const getByGuardian = query({
  args: {
    guardianName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_guardian", (q) => q.eq("guardianName", args.guardianName))
      .collect();
  },
});

// Mutation to create a new student
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    schoolId: v.optional(v.id("schools")), // Optional for guardian-linked students
    guardianId: v.optional(v.id("users")), // Guardian user ID
    guardianTitle: v.optional(v.string()), // Relationship description
    grade: v.string(),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    createdBy: v.id("users"), // Teacher who created the student
  },
  handler: async (ctx, args) => {
    // Generate unique student ID
    const schoolIdForHash = args.schoolId || "GUARDIAN";
    let studentId = generateStudentId(args.firstName, args.lastName, schoolIdForHash);

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

      // Regenerate with new random component
      studentId = generateStudentId(args.firstName, args.lastName, schoolIdForHash);
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique student ID after multiple attempts");
    }

    const id = await ctx.db.insert("students", {
      firstName: args.firstName,
      lastName: args.lastName,
      studentId,
      schoolId: args.schoolId,
      guardianId: args.guardianId,
      guardianTitle: args.guardianTitle,
      grade: args.grade,
      guardianName: args.guardianName,
      guardianPhone: args.guardianPhone,
      guardianEmail: args.guardianEmail,
      acknowledged: args.guardianId ? false : true, // Needs guardian acknowledgement if linked
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // If guardian is linked, create notification for guardian
    if (args.guardianId) {
      const teacher = await ctx.db.get(args.createdBy);
      await ctx.db.insert("notifications", {
        title: `New Student Added: ${args.firstName} ${args.lastName}`,
        titleTh: `นักเรียนใหม่ถูกเพิ่ม: ${args.firstName} ${args.lastName}`,
        message: `Teacher ${teacher?.username || "Unknown"} has added you as guardian for ${args.firstName} ${args.lastName}. Please review and acknowledge.`,
        messageTh: `ครู ${teacher?.username || "Unknown"} ได้เพิ่มคุณเป็นผู้ปกครองของ ${args.firstName} ${args.lastName} กรุณาตรวจสอบและยืนยัน`,
        type: "info",
        userId: args.guardianId,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { id, studentId };
  },
});

// Mutation to update student
export const update = mutation({
  args: {
    id: v.id("students"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    grade: v.optional(v.string()),
    guardianId: v.optional(v.id("users")),
    guardianTitle: v.optional(v.string()),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);

    return { success: true };
  },
});

// Mutation to delete student
export const remove = mutation({
  args: {
    id: v.id("students"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    return { success: true };
  },
});

// Mutation to duplicate a student (for guardian-linked students)
export const duplicate = mutation({
  args: {
    id: v.id("students"),
  },
  handler: async (ctx, args) => {
    const originalStudent = await ctx.db.get(args.id);

    if (!originalStudent) {
      throw new Error("Student not found");
    }

    // Only allow duplication for guardian-linked students
    if (originalStudent.schoolId) {
      throw new Error("Can only duplicate guardian-linked students");
    }

    // Generate new unique student ID
    const schoolIdForHash = "GUARDIAN";
    let studentId = generateStudentId(originalStudent.firstName, originalStudent.lastName, schoolIdForHash);

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

      studentId = generateStudentId(originalStudent.firstName, originalStudent.lastName, schoolIdForHash);
      attempts++;
    }

    if (attempts === maxAttempts) {
      throw new Error("Failed to generate unique student ID after multiple attempts");
    }

    // Create duplicate with new ID
    const newId = await ctx.db.insert("students", {
      firstName: originalStudent.firstName,
      lastName: originalStudent.lastName,
      studentId,
      schoolId: originalStudent.schoolId,
      guardianId: originalStudent.guardianId,
      guardianTitle: originalStudent.guardianTitle,
      grade: originalStudent.grade,
      guardianName: originalStudent.guardianName,
      guardianPhone: originalStudent.guardianPhone,
      guardianEmail: originalStudent.guardianEmail,
      acknowledged: originalStudent.acknowledged,
      createdBy: originalStudent.createdBy,
      createdAt: Date.now(),
    });

    return { id: newId, studentId };
  },
});

// Query to get students created by a specific teacher
export const getByTeacher = query({
  args: {
    teacherId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_created_by", (q) => q.eq("createdBy", args.teacherId))
      .collect();
  },
});

// Query to get students for a guardian
export const getByGuardianId = query({
  args: {
    guardianId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_guardian_id", (q) => q.eq("guardianId", args.guardianId))
      .collect();
  },
});

// Mutation for guardian to acknowledge a student
export const acknowledgeStudent = mutation({
  args: {
    studentId: v.id("students"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, {
      acknowledged: true,
    });

    return { success: true };
  },
});
