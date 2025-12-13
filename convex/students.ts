import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit, validateLength } from "./rateLimit";

// Helper function to generate unique ID for SCHOOL students
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

// Mutation to create a new student
export const create = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    schoolId: v.optional(v.id("schools")), // Optional for provider-linked students
    providerId: v.optional(v.id("providers")), // Alternative to schoolId
    grade: v.string(), // Grade level (K1, K2, K3)
    class: v.optional(v.string()), // Class number (/1, /2, ..., /10)
    createdBy: v.id("users"), // Teacher who created the student
    // Optional fields
    nickname: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()), // Timestamp
    area: v.optional(v.string()), // Teaching location area
    parentName: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    secondaryParentName: v.optional(v.string()),
    secondaryParentPhone: v.optional(v.string()),
    allergies: v.optional(v.string()),
    specialNeeds: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ✅ RATE LIMIT: Prevent accidental rapid student creation (20 per minute - soft limit)
    await checkRateLimit(ctx, {
      key: `create-student:${args.createdBy}`,
      limit: 20,
      windowMs: 60000, // 1 minute
    });

    // ✅ XOR VALIDATION - Student must have EITHER schoolId OR providerId (not both, not neither)
    const hasSchool = !!args.schoolId;
    const hasProvider = !!args.providerId;

    // If both school and provider are provided, reject
    if (hasSchool && hasProvider) {
      throw new Error("Student cannot be linked to both a school and a provider. Please choose one.");
    }

    // Student must have either school or provider
    if (!hasSchool && !hasProvider) {
      throw new Error("Student must be linked to either a school or provider");
    }

    // ✅ SECURITY: Verify user permissions
    const creator = await ctx.db.get(args.createdBy);
    if (!creator) {
      throw new Error("Creator user not found");
    }

    // ✅ SECURITY: Role-based access control
    if (args.schoolId) {
      // School-linked students require school access
      if (creator.role === "teacher" || creator.role === "moderator") {
        // Teachers and moderators can only create students for their own school
        if (creator.schoolId !== args.schoolId) {
          throw new Error("Unauthorized: Cannot create students for other schools");
        }
      } else if (creator.role !== "admin") {
        throw new Error("Unauthorized: Only teachers, moderators, and admins can create school-linked students");
      }
    } else if (args.providerId) {
      // Provider-linked students (teachers and admins only)
      if (creator.role === "moderator") {
        throw new Error("Unauthorized: Moderators cannot create provider-linked students");
      }

      // Verify provider exists and teacher has access
      const provider = await ctx.db.get(args.providerId);
      if (!provider) {
        throw new Error("Provider not found");
      }

      // Teachers can only use their own providers, admins can use any
      if (creator.role === "teacher" && provider.createdBy !== creator._id) {
        throw new Error("Unauthorized: You can only create students for providers you created");
      }
    }

    // ✅ SECURITY: Input validation - student names max 100 chars
    validateLength(args.firstName, "First name", 100, 1);
    // Allow empty lastName for Thai students who use single names/nicknames
    if (args.lastName) {
      validateLength(args.lastName, "Last name", 100, 0);
    }
    if (args.nickname) validateLength(args.nickname, "Nickname", 100, 0);
    if (args.notes) validateLength(args.notes, "Notes", 2000, 0);
    if (args.area) validateLength(args.area, "Area", 100, 0);

    // Validate: class is required for school-linked students
    if (args.schoolId && !args.class) {
      throw new Error("Class is required for students linked to a school");
    }

    // Validate provider student requirements (grade still required, but class is optional)
    if (args.providerId && !args.grade) {
      throw new Error("Grade is required for provider-linked students");
    }

    // ✅ PREVENT DUPLICATES: Check if student already exists with same name + grade + class + school
    if (args.schoolId) {
      const duplicateCheck = await ctx.db
        .query("students")
        .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
        .collect();

      const duplicate = duplicateCheck.find(
        (s) =>
          s.firstName.toLowerCase() === args.firstName.toLowerCase() &&
          (s.lastName || "").toLowerCase() === (args.lastName || "").toLowerCase() &&
          s.grade === args.grade &&
          s.class === args.class
      );

      if (duplicate) {
        throw new Error(
          `Student "${args.firstName}${args.lastName ? " " + args.lastName : ""}" already exists in ${args.grade}${args.class}`
        );
      }
    }

    // ✅ PREVENT DUPLICATES for provider students (name + grade + provider)
    if (args.providerId) {
      const providerStudents = await ctx.db
        .query("students")
        .withIndex("by_provider", (q) => q.eq("providerId", args.providerId!))
        .collect();

      const providerDuplicate = providerStudents.find(
        (s) =>
          s.firstName.toLowerCase() === args.firstName.toLowerCase() &&
          (s.lastName || "").toLowerCase() === (args.lastName || "").toLowerCase() &&
          s.grade === args.grade
      );

      if (providerDuplicate) {
        const provider = await ctx.db.get(args.providerId);
        throw new Error(
          `Student "${args.firstName}${args.lastName ? " " + args.lastName : ""}" already exists in ${args.grade} for provider "${provider?.name || "Unknown"}" (ID: ${providerDuplicate.studentId})`
        );
      }
    }

    // ✅ GENERATE UNIQUE STUDENT ID
    let studentId: string;

    if (args.providerId) {
      // Provider student: use provider-based ID
      const providerIdForHash = args.providerId;
      studentId = generateStudentId(args.firstName, args.lastName || "", providerIdForHash);
    } else {
      // School student: use school-based ID
      const schoolIdForHash = args.schoolId || "NOSCHOOL";
      studentId = generateStudentId(args.firstName, args.lastName || "", schoolIdForHash);
    }

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

      // Regenerate with new random component based on student type
      if (args.providerId) {
        studentId = generateStudentId(args.firstName, args.lastName || "", args.providerId);
      } else {
        const schoolIdForHash = args.schoolId || "NOSCHOOL";
        studentId = generateStudentId(args.firstName, args.lastName || "", schoolIdForHash);
      }
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
      providerId: args.providerId,
      grade: args.grade,
      class: args.class,
      acknowledged: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
      // Optional fields
      nickname: args.nickname,
      dateOfBirth: args.dateOfBirth,
      area: args.area, // NEW: Teaching location area
      parentName: args.parentName,
      parentPhone: args.parentPhone,
      parentEmail: args.parentEmail,
      secondaryParentName: args.secondaryParentName,
      secondaryParentPhone: args.secondaryParentPhone,
      allergies: args.allergies,
      specialNeeds: args.specialNeeds,
      medicalNotes: args.medicalNotes,
      notes: args.notes,
    });

    return { id, studentId };
  },
});

// Mutation to update student
export const update = mutation({
  args: {
    id: v.id("students"),
    updatedBy: v.id("users"), // Required: user making the update
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    schoolId: v.optional(v.id("schools")),
    providerId: v.optional(v.id("providers")),
    grade: v.optional(v.string()),
    class: v.optional(v.string()),
    // Optional fields
    nickname: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()), // Timestamp
    parentName: v.optional(v.string()),
    parentPhone: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    secondaryParentName: v.optional(v.string()),
    secondaryParentPhone: v.optional(v.string()),
    allergies: v.optional(v.string()),
    specialNeeds: v.optional(v.string()),
    medicalNotes: v.optional(v.string()),
    notes: v.optional(v.string()),
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      id,
      updatedBy,
      userAgent: _userAgent,
      screenResolution: _screenResolution,
      timezone: _timezone,
      locale: _locale,
      sessionId: _sessionId,
      ...updates
    } = args;

    // ✅ RATE LIMIT: Prevent accidental rapid updates (30 per minute - soft limit)
    await checkRateLimit(ctx, {
      key: `update-student:${updatedBy}`,
      limit: 30,
      windowMs: 60000,
    });

    // Get existing student to validate schoolId requirement
    const student = await ctx.db.get(id);
    if (!student) {
      throw new Error("Student not found");
    }

    // ✅ SECURITY: Verify user permissions
    const user = await ctx.db.get(updatedBy);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Role-based access control
    if (user.role === "teacher" || user.role === "moderator") {
      // Teachers/moderators can only modify students from their school
      if (!student.schoolId || student.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Cannot modify students from other schools");
      }
    } else if (user.role !== "admin") {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // ✅ SECURITY: Input validation for updated fields
    if (updates.firstName) validateLength(updates.firstName, "First name", 100, 1);
    if (updates.lastName) validateLength(updates.lastName, "Last name", 100, 1);
    if (updates.nickname) validateLength(updates.nickname, "Nickname", 100, 0);
    if (updates.notes) validateLength(updates.notes, "Notes", 2000, 0);

    // Validate: class is required for school-linked students
    if (student.schoolId && updates.class === "") {
      throw new Error("Class is required for students linked to a school");
    }

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
    deletedBy: v.id("users"), // Required: user deleting the student
    reason: v.string(), // Required: reason for deletion (audit trail)
    // Optional: Client-side performance tracking
    userAgent: v.optional(v.string()),
    screenResolution: v.optional(v.string()),
    timezone: v.optional(v.string()),
    locale: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      userAgent: _userAgent,
      screenResolution: _screenResolution,
      timezone: _timezone,
      locale: _locale,
      sessionId: _sessionId,
      ...operationArgs
    } = args;

    // ✅ RATE LIMIT: Prevent accidental rapid deletions (10 per minute - more restrictive)
    await checkRateLimit(ctx, {
      key: `delete-student:${operationArgs.deletedBy}`,
      limit: 10,
      windowMs: 60000,
    });

    // Get student details before deletion
    const student = await ctx.db.get(operationArgs.id);
    if (!student) {
      throw new Error("Student not found");
    }

    // ✅ SECURITY: Verify user permissions
    const user = await ctx.db.get(operationArgs.deletedBy);
    if (!user) {
      throw new Error("User not found");
    }

    // ✅ SECURITY: Role-based access control
    if (user.role === "teacher" || user.role === "moderator") {
      // Teachers/moderators can only delete students from their school
      if (!student.schoolId || student.schoolId !== user.schoolId) {
        throw new Error("Unauthorized: Cannot delete students from other schools");
      }
    } else if (user.role !== "admin") {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Check for active classes with this student
    const activeClasses = await ctx.db
      .query("classes")
      .withIndex("by_student", (q) => q.eq("studentId", operationArgs.id))
      .collect();

    if (activeClasses.length > 0) {
      // Get count by status
      const pendingOrApproved = activeClasses.filter(
        (c) => c.status === "pending" || c.status === "acknowledged" || c.status === "approved"
      ).length;

      if (pendingOrApproved > 0) {
        throw new Error(
          `Cannot delete student with ${pendingOrApproved} active/pending classes. Please cancel or complete classes first.`
        );
      }
    }

    // ✅ CRITICAL: Audit logging BEFORE deletion (so we can track WHO/WHEN/WHY/WHAT)
    await logAudit(ctx, {
      userId: operationArgs.deletedBy,
      action: AuditActions.DELETE_STUDENT,
      targetType: AuditTargetTypes.STUDENTS,
      targetId: operationArgs.id,
      targetName: `${student.firstName} ${student.lastName}`,
      reason: operationArgs.reason,
      schoolId: student.schoolId,
      details: {
        studentId: student.studentId,
        grade: student.grade,
        class: student.class,
        providerId: student.providerId,
        area: student.area,
        affectedClasses: activeClasses.length,
        affectedClassIds: activeClasses.map(c => c._id),
      },
    });

    await ctx.db.delete(operationArgs.id);

    return { success: true };
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

// Migration mutation to auto-classify existing students with "K" pattern
export const migrateClassField = mutation({
  args: {},
  handler: async (ctx) => {
    const allStudents = await ctx.db.query("students").collect();
    let updatedCount = 0;

    for (const student of allStudents) {
      // Skip if class is already set or student is not linked to a school
      if (student.class || !student.schoolId) {
        continue;
      }

      // Check grade, firstName, lastName, nickname, and notes for K1, K2, or K3
      const nickname = "nickname" in student ? student.nickname : "";
      const notes = "notes" in student ? student.notes : "";
      const searchFields = [
        student.grade,
        student.firstName,
        student.lastName,
        nickname || "",
        notes || "",
      ].join(" ").toUpperCase();

      let detectedClass: string | null = null;

      // Check for K1, K2, K3 patterns
      if (/\bK1\b/.test(searchFields) || /\bK\s*1\b/.test(searchFields)) {
        detectedClass = "K1";
      } else if (/\bK2\b/.test(searchFields) || /\bK\s*2\b/.test(searchFields)) {
        detectedClass = "K2";
      } else if (/\bK3\b/.test(searchFields) || /\bK\s*3\b/.test(searchFields)) {
        detectedClass = "K3";
      }

      // Update student if class was detected
      if (detectedClass) {
        await ctx.db.patch(student._id, { class: detectedClass });
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} student(s) with detected class`,
      updatedCount
    };
  },
});
