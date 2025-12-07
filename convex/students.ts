import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { AuditActions, AuditTargetTypes, logAudit } from "./auditHelpers";
import { checkRateLimit, validateLength } from "./rateLimit";

// Helper function to generate unique ID for GUARDIAN students
function generateGuardianStudentId(
  firstName: string,
  lastName: string,
  birthDate: number,
  area: string
): string {
  // Area code: first 5 chars of area, uppercase, alphanumeric only
  const areaCode = area.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Name hash: first 2 chars of first name + first 2 chars of last name
  const nameHash = `${firstName.substring(0, 2)}${lastName.substring(0, 2)}`.toUpperCase();
  // Birth hash: YYYYMMDD format
  const birthHash = new Date(birthDate).toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
  // Random component for collision prevention
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `${areaCode}-${nameHash}-${birthHash}-${random}`;
}

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
    schoolId: v.optional(v.id("schools")), // Optional for guardian-linked students or provider-linked students
    providerId: v.optional(v.id("providers")), // NEW - alternative to schoolId
    guardianId: v.optional(v.id("users")), // Guardian user ID
    guardianTitle: v.optional(v.string()), // Relationship description
    grade: v.string(), // Grade level (K1, K2, K3)
    class: v.optional(v.string()), // Class number (/1, /2, ..., /10)
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    createdBy: v.id("users"), // Teacher who created the student
    // Optional fields
    nickname: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()), // Timestamp - REQUIRED for guardian students
    area: v.optional(v.string()), // Teaching location area - REQUIRED for guardian students
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

    // ✅ NEW: XOR VALIDATION - Student must have EITHER schoolId OR providerId OR guardian (not multiple, not none for provider/school)
    const hasSchool = !!args.schoolId;
    const hasProvider = !!args.providerId;
    const hasGuardian = !!(args.guardianId || args.guardianName);

    // If both school and provider are provided, reject
    if (hasSchool && hasProvider) {
      throw new Error("Student cannot be linked to both a school and a provider. Please choose one.");
    }

    // Guardian students can exist without school or provider
    // Provider students require providerId
    // School students require schoolId
    if (!hasGuardian && !hasSchool && !hasProvider) {
      throw new Error("Student must be linked to either a school, provider, or guardian");
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
      // NEW: Provider-linked students (teachers and admins only)
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
    } else if (hasGuardian) {
      // Guardian-linked students
      if (creator.role === "guardian" && args.guardianId !== creator._id) {
        throw new Error("Guardians can only create students linked to themselves");
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

    // NEW: Validate provider student requirements (grade still required, but class is optional)
    if (args.providerId && !args.grade) {
      throw new Error("Grade is required for provider-linked students");
    }

    // NEW: Validate guardian student requirements
    const isGuardianStudent = hasGuardian;
    if (isGuardianStudent) {
      if (!args.dateOfBirth) {
        throw new Error("Guardian students must have a birth date for unique identification");
      }
      if (!args.area) {
        throw new Error("Guardian students must have a teaching area for unique identification");
      }
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

    // NEW: ✅ PREVENT DUPLICATES for provider students (name + grade + provider)
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

    // NEW: ✅ PREVENT DUPLICATES for guardian students (name + birthDate + area)
    if (isGuardianStudent && args.area) {
      const areaStudents = await ctx.db
        .query("students")
        .withIndex("by_area", (q) => q.eq("area", args.area!))
        .collect();

      const guardianDuplicate = areaStudents.find(
        (s) =>
          s.firstName.toLowerCase() === args.firstName.toLowerCase() &&
          (s.lastName || "").toLowerCase() === (args.lastName || "").toLowerCase() &&
          s.dateOfBirth === args.dateOfBirth
      );

      if (guardianDuplicate) {
        throw new Error(
          `Guardian student "${args.firstName}${args.lastName ? " " + args.lastName : ""}" with this birth date already exists in ${args.area} (ID: ${guardianDuplicate.studentId})`
        );
      }
    }

    // Generate unique student ID based on student type
    let studentId: string;

    if (isGuardianStudent && args.dateOfBirth && args.area) {
      // Guardian student: use birthDate + area based ID
      studentId = generateGuardianStudentId(
        args.firstName,
        args.lastName || "",
        args.dateOfBirth,
        args.area
      );
    } else if (args.providerId) {
      // NEW: Provider student: use provider-based ID
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
      if (isGuardianStudent && args.dateOfBirth && args.area) {
        studentId = generateGuardianStudentId(args.firstName, args.lastName || "", args.dateOfBirth, args.area);
      } else if (args.providerId) {
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
      providerId: args.providerId, // NEW: Provider support
      guardianId: args.guardianId,
      guardianTitle: args.guardianTitle,
      grade: args.grade,
      class: args.class,
      guardianName: args.guardianName,
      guardianPhone: args.guardianPhone,
      guardianEmail: args.guardianEmail,
      acknowledged: args.guardianId ? false : true, // Needs guardian acknowledgement if linked
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
    updatedBy: v.id("users"), // Required: user making the update
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    schoolId: v.optional(v.id("schools")),
    providerId: v.optional(v.id("providers")),
    grade: v.optional(v.string()),
    class: v.optional(v.string()),
    guardianId: v.optional(v.id("users")),
    guardianTitle: v.optional(v.string()),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
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
    } else if (user.role === "guardian") {
      // Guardians can only modify their own students
      if (student.guardianId !== user._id) {
        throw new Error("Unauthorized: Can only modify your own students");
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
    } else if (user.role === "guardian") {
      // Guardians can only delete their own students
      if (student.guardianId !== user._id) {
        throw new Error("Unauthorized: Can only delete your own students");
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
        guardianId: student.guardianId,
        area: student.area,
        affectedClasses: activeClasses.length,
        affectedClassIds: activeClasses.map(c => c._id),
      },
    });

    await ctx.db.delete(operationArgs.id);

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

// Mutation to merge two students (keep target, merge source data)
export const mergeStudents = mutation({
  args: {
    targetStudentId: v.id("students"), // Student to keep
    sourceStudentId: v.id("students"), // Student to merge and delete
    mergedBy: v.id("users"), // Admin or teacher performing merge
    fieldsToKeep: v.object({
      // Which fields to take from source (rest from target)
      nickname: v.optional(v.boolean()),
      guardianName: v.optional(v.boolean()),
      guardianPhone: v.optional(v.boolean()),
      guardianEmail: v.optional(v.boolean()),
      dateOfBirth: v.optional(v.boolean()),
      area: v.optional(v.boolean()),
      parentName: v.optional(v.boolean()),
      parentPhone: v.optional(v.boolean()),
      parentEmail: v.optional(v.boolean()),
      secondaryParentName: v.optional(v.boolean()),
      secondaryParentPhone: v.optional(v.boolean()),
      allergies: v.optional(v.boolean()),
      specialNeeds: v.optional(v.boolean()),
      medicalNotes: v.optional(v.boolean()),
      notes: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    // Verify both students exist
    const targetStudent = await ctx.db.get(args.targetStudentId);
    const sourceStudent = await ctx.db.get(args.sourceStudentId);

    if (!targetStudent) {
      throw new Error("Target student not found");
    }
    if (!sourceStudent) {
      throw new Error("Source student not found");
    }

    // Verify user permissions
    const mergedByUser = await ctx.db.get(args.mergedBy);
    if (!mergedByUser) {
      throw new Error("User not found");
    }

    // Only admins and teachers can merge students
    if (mergedByUser.role !== "admin" && mergedByUser.role !== "teacher") {
      throw new Error("Only admins and teachers can merge students");
    }

    // Prevent merging if students are in different contexts
    if (targetStudent.schoolId !== sourceStudent.schoolId) {
      throw new Error("Cannot merge students from different schools");
    }
    if (targetStudent.providerId !== sourceStudent.providerId) {
      throw new Error("Cannot merge students from different providers");
    }

    // Build update object with selected fields from source
    const updates: Record<string, string | number | undefined> = {};

    if (args.fieldsToKeep.nickname && sourceStudent.nickname) {
      updates.nickname = sourceStudent.nickname;
    }
    if (args.fieldsToKeep.guardianName && sourceStudent.guardianName) {
      updates.guardianName = sourceStudent.guardianName;
    }
    if (args.fieldsToKeep.guardianPhone && sourceStudent.guardianPhone) {
      updates.guardianPhone = sourceStudent.guardianPhone;
    }
    if (args.fieldsToKeep.guardianEmail && sourceStudent.guardianEmail) {
      updates.guardianEmail = sourceStudent.guardianEmail;
    }
    if (args.fieldsToKeep.dateOfBirth && sourceStudent.dateOfBirth) {
      updates.dateOfBirth = sourceStudent.dateOfBirth;
    }
    if (args.fieldsToKeep.area && sourceStudent.area) {
      updates.area = sourceStudent.area;
    }
    if (args.fieldsToKeep.parentName && sourceStudent.parentName) {
      updates.parentName = sourceStudent.parentName;
    }
    if (args.fieldsToKeep.parentPhone && sourceStudent.parentPhone) {
      updates.parentPhone = sourceStudent.parentPhone;
    }
    if (args.fieldsToKeep.parentEmail && sourceStudent.parentEmail) {
      updates.parentEmail = sourceStudent.parentEmail;
    }
    if (args.fieldsToKeep.secondaryParentName && sourceStudent.secondaryParentName) {
      updates.secondaryParentName = sourceStudent.secondaryParentName;
    }
    if (args.fieldsToKeep.secondaryParentPhone && sourceStudent.secondaryParentPhone) {
      updates.secondaryParentPhone = sourceStudent.secondaryParentPhone;
    }
    if (args.fieldsToKeep.allergies && sourceStudent.allergies) {
      updates.allergies = sourceStudent.allergies;
    }
    if (args.fieldsToKeep.specialNeeds && sourceStudent.specialNeeds) {
      updates.specialNeeds = sourceStudent.specialNeeds;
    }
    if (args.fieldsToKeep.medicalNotes && sourceStudent.medicalNotes) {
      updates.medicalNotes = sourceStudent.medicalNotes;
    }
    if (args.fieldsToKeep.notes) {
      // Combine notes if both exist
      if (sourceStudent.notes && targetStudent.notes) {
        updates.notes = `${targetStudent.notes}\n\n--- Merged from ${sourceStudent.firstName} ${sourceStudent.lastName} (${sourceStudent.studentId}) ---\n${sourceStudent.notes}`;
      } else if (sourceStudent.notes) {
        updates.notes = sourceStudent.notes;
      }
    }

    // Update target student with merged data
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.targetStudentId, updates);
    }

    // Update all classes that reference the source student to point to target student
    const classesToUpdate = await ctx.db
      .query("classes")
      .withIndex("by_student", (q) => q.eq("studentId", args.sourceStudentId))
      .collect();

    for (const cls of classesToUpdate) {
      await ctx.db.patch(cls._id, {
        studentId: args.targetStudentId,
      });
    }

    // Also check additionalStudentIds arrays
    let classesToCheck;
    if (targetStudent.schoolId) {
      classesToCheck = await ctx.db
        .query("classes")
        .withIndex("by_school", (q) => q.eq("schoolId", targetStudent.schoolId))
        .collect();
    } else if (targetStudent.providerId) {
      classesToCheck = await ctx.db
        .query("classes")
        .withIndex("by_provider", (q) => q.eq("providerId", targetStudent.providerId))
        .collect();
    } else {
      classesToCheck = await ctx.db.query("classes").collect();
    }
    for (const cls of classesToCheck) {
      if (cls.additionalStudentIds?.includes(args.sourceStudentId)) {
        // Replace source with target in the array
        const updatedIds = cls.additionalStudentIds.map(id =>
          id === args.sourceStudentId ? args.targetStudentId : id
        );
        // Remove duplicates if target was already in the array
        const uniqueIds = [...new Set(updatedIds)];
        await ctx.db.patch(cls._id, {
          additionalStudentIds: uniqueIds as Id<"students">[],
        });
      }
    }

    // Soft delete the source student
    await ctx.db.delete(args.sourceStudentId);

    // Log the merge in audit logs (using existing audit system)
    await logAudit(ctx, {
      userId: args.mergedBy,
      action: AuditActions.MERGE,
      targetType: AuditTargetTypes.STUDENT,
      targetId: args.targetStudentId,
      metadata: {
        mergedStudentId: args.sourceStudentId,
        mergedStudentName: `${sourceStudent.firstName} ${sourceStudent.lastName}`,
        mergedStudentStudentId: sourceStudent.studentId,
        fieldsUpdated: Object.keys(updates),
        classesUpdated: classesToUpdate.length,
      },
    });

    return {
      success: true,
      targetStudentId: args.targetStudentId,
      classesUpdated: classesToUpdate.length,
      fieldsUpdated: Object.keys(updates),
    };
  },
});
