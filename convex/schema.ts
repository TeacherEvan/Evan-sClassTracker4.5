import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin"),
      v.literal("guardian")
    ),
    schoolId: v.optional(v.id("schools")),
    requirePasswordChange: v.boolean(),
    createdAt: v.number(),
    // Device detection fields
    deviceType: v.optional(v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop")
    )),
    lastDeviceUpdate: v.optional(v.number()),
    pushSubscription: v.optional(v.string()), // JSON stringified PushSubscription
  })
    .index("by_username", ["username"])
    .index("by_school", ["schoolId"])
    .index("by_role", ["role"])
    .index("by_device_type", ["deviceType"]),

  schools: defineTable({
    name: v.string(),
    nameTh: v.string(),
    moderatorId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_moderator", ["moderatorId"])
    .index("by_created_at", ["createdAt"]),

  classes: defineTable({
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    studentId: v.id("students"),
    additionalStudentIds: v.optional(v.array(v.id("students"))), // For multi-student classes
    locationId: v.optional(v.id("locations")), // Optional if using pending location
    pendingLocationName: v.optional(v.string()), // For teacher-requested locations (English)
    pendingLocationNameTh: v.optional(v.string()), // For teacher-requested locations (Thai)
    guardianTitle: v.optional(v.string()), // Guardian relationship title for guardian-linked classes
    isGuardianLinked: v.optional(v.boolean()), // Flag for guardian-linked classes (bypasses moderator approval)
    status: v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    scheduledDate: v.number(),
    createdAt: v.number(),
    // NEW OPTIONAL FIELDS
    duration: v.optional(v.number()), // Minutes (default 60)
    subject: v.optional(v.string()), // Math, English, etc.
    subjectTh: v.optional(v.string()), // Thai translation
    lessonTopic: v.optional(v.string()), // Specific topic
    lessonTopicTh: v.optional(v.string()), // Thai translation
    materials: v.optional(v.string()), // Required materials
    materialsTh: v.optional(v.string()), // Thai translation
    preparationNotes: v.optional(v.string()), // Teacher prep notes
    preparationNotesTh: v.optional(v.string()), // Thai translation
    classType: v.optional(v.union( // Type classification
      v.literal("regular"),
      v.literal("makeup"),
      v.literal("assessment"),
      v.literal("trial")
    )),
    // EDIT AUDIT TRAIL
    isEdited: v.optional(v.boolean()),
    lastEditedAt: v.optional(v.number()),
    lastEditedBy: v.optional(v.id("users")),
    editHistory: v.optional(v.array(v.object({
      editedAt: v.number(),
      editedBy: v.id("users"),
      editedByName: v.string(), // Cache for performance
      editedByRole: v.string(),
      changes: v.array(v.object({
        field: v.string(),
        oldValue: v.string(),
        newValue: v.string(),
      })),
    }))),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_school", ["schoolId"])
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_school_and_date", ["schoolId", "scheduledDate"])
    .index("by_teacher_and_date", ["teacherId", "scheduledDate"])
    .index("by_edited", ["isEdited"])
    .index("by_last_edited", ["lastEditedAt"]),

  students: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    studentId: v.string(), // Unique identifier
    schoolId: v.optional(v.id("schools")), // Optional - null if linked to guardian
    guardianId: v.optional(v.id("users")), // Guardian user ID if linked to guardian
    guardianTitle: v.optional(v.string()), // Guardian relationship description (e.g., "Parent", "Tutor")
    grade: v.string(),
    class: v.optional(v.string()), // Class designation (e.g., "K1", "K2", "K3") - required for school-linked students
    guardianName: v.optional(v.string()), // Guardian name if no school
    guardianPhone: v.optional(v.string()), // Guardian contact
    guardianEmail: v.optional(v.string()), // Guardian email
    acknowledged: v.optional(v.boolean()), // For guardian-acknowledged students (optional for backward compatibility)
    createdBy: v.optional(v.id("users")), // Teacher who created the student (optional for backward compatibility)
    createdAt: v.number(),
    // NEW OPTIONAL FIELDS
    nickname: v.optional(v.string()), // Preferred name
    dateOfBirth: v.optional(v.number()), // For age calculation
    parentName: v.optional(v.string()), // Primary parent
    parentPhone: v.optional(v.string()), // Contact number
    parentEmail: v.optional(v.string()), // Email contact
    secondaryParentName: v.optional(v.string()),
    secondaryParentPhone: v.optional(v.string()),
    allergies: v.optional(v.string()), // Medical info
    specialNeeds: v.optional(v.string()), // Learning accommodations
    medicalNotes: v.optional(v.string()), // Medical conditions/medications
    notes: v.optional(v.string()), // General notes
  })
    .index("by_student_id", ["studentId"])
    .index("by_school", ["schoolId"])
    .index("by_guardian", ["guardianName"])
    .index("by_guardian_id", ["guardianId"])
    .index("by_created_by", ["createdBy"]),

  notifications: defineTable({
    title: v.string(),
    titleTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    userId: v.optional(v.union(v.string(), v.id("users"))),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_read", ["read"]),

  messages: defineTable({
    senderId: v.id("users"),
    recipientId: v.optional(v.id("users")), // Optional - null for group messages
    schoolId: v.optional(v.id("schools")), // For school-specific group chats
    groupId: v.optional(v.id("groups")), // For custom moderator-created groups
    content: v.string(),
    contentTh: v.string(),
    isGroupMessage: v.boolean(),
    read: v.boolean(),
    acknowledged: v.boolean(), // For acknowledgment messages
    createdAt: v.number(),
  })
    .index("by_sender", ["senderId"])
    .index("by_recipient", ["recipientId"])
    .index("by_school", ["schoolId"])
    .index("by_group", ["groupId"])
    .index("by_created_at", ["createdAt"])
    .index("by_conversation", ["senderId", "recipientId"])
    .index("by_school_and_date", ["schoolId", "createdAt"]),

  groups: defineTable({
    name: v.string(),
    nameTh: v.string(),
    schoolId: v.id("schools"),
    creatorId: v.id("users"), // Moderator who created the group
    memberIds: v.array(v.id("users")), // Array of user IDs in the group
    createdAt: v.number(),
  })
    .index("by_school", ["schoolId"])
    .index("by_creator", ["creatorId"])
    .index("by_created_at", ["createdAt"]),

  teacherResources: defineTable({
    title: v.string(),
    titleTh: v.string(),
    description: v.string(),
    descriptionTh: v.string(),
    url: v.string(),
    category: v.string(),
    categoryTh: v.string(),
    order: v.number(), // Display order (1, 2, 3, etc.)
    isActive: v.boolean(), // Enable/disable without deleting
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"), // Admin who created it
  })
    .index("by_order", ["order"])
    .index("by_active", ["isActive"])
    .index("by_category", ["category"])
    .index("by_created_at", ["createdAt"]),

  locations: defineTable({
    name: v.string(),
    nameTh: v.string(),
    schoolId: v.id("schools"),
    type: v.optional(v.union(
      v.literal("school"),
      v.literal("guardian")
    )), // Location type - guardian locations bypass moderator approval
    isActive: v.boolean(), // Enable/disable without deleting
    isPending: v.optional(v.boolean()), // For teacher-requested locations awaiting approval (optional for backward compatibility)
    requestedBy: v.optional(v.id("users")), // Teacher who requested this location
    approvedBy: v.optional(v.id("users")), // Moderator who approved it
    proposedBy: v.optional(v.id("users")), // Teacher who proposed this location (new workflow)
    approved: v.optional(v.boolean()), // Approval status for proposals
    pendingApproval: v.optional(v.boolean()), // Waiting for moderator review
    proposalDate: v.optional(v.number()), // When the location was proposed
    rejectionReason: v.optional(v.string()), // Why proposal was rejected (English)
    rejectionReasonTh: v.optional(v.string()), // Rejection reason (Thai)
    createdAt: v.number(),
    createdBy: v.id("users"), // Moderator or Admin who created it (or teacher who requested)
  })
    .index("by_school", ["schoolId"])
    .index("by_active", ["isActive"])
    .index("by_pending", ["isPending"])
    .index("by_requested_by", ["requestedBy"])
    .index("by_pending_approval", ["pendingApproval"])
    .index("by_proposed_by", ["proposedBy"])
    .index("by_created_at", ["createdAt"]),

  cancellationRequests: defineTable({
    classId: v.id("classes"),
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    reason: v.string(),
    reasonTh: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")), // Moderator who approved/rejected
  })
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"])
    .index("by_school", ["schoolId"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  teacherLogs: defineTable({
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    action: v.string(), // e.g., "class_requested", "class_cancelled", "login", etc.
    actionTh: v.string(),
    details: v.string(), // Additional details about the action
    detailsTh: v.string(),
    relatedClassId: v.optional(v.id("classes")), // If action is related to a class
    relatedStudentId: v.optional(v.id("students")), // If action is related to a student
    acknowledged: v.optional(v.boolean()), // Whether admin/moderator acknowledged this log
    acknowledgedBy: v.optional(v.id("users")), // Admin/moderator who acknowledged
    acknowledgedAt: v.optional(v.number()), // When it was acknowledged
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_school", ["schoolId"])
    .index("by_action", ["action"])
    .index("by_created_at", ["createdAt"])
    .index("by_teacher_and_date", ["teacherId", "createdAt"])
    .index("by_school_and_date", ["schoolId", "createdAt"])
    .index("by_acknowledged", ["acknowledged"]),

  postClassNotes: defineTable({
    classId: v.id("classes"),
    teacherId: v.id("users"),
    studentId: v.id("students"),
    schoolId: v.id("schools"),
    // Bilingual content
    notes: v.optional(v.string()),
    notesTh: v.optional(v.string()),
    // Structured feedback
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
    homework: v.optional(v.string()), // Homework assigned
    homeworkTh: v.optional(v.string()),
    createdAt: v.number(),
    skipped: v.boolean(), // User chose to skip
  })
    .index("by_class", ["classId"])
    .index("by_teacher", ["teacherId"])
    .index("by_student", ["studentId"])
    .index("by_school", ["schoolId"])
    .index("by_created_at", ["createdAt"]),

  appUpdates: defineTable({
    version: v.string(), // "2.0.0"
    releaseDate: v.number(),
    title: v.string(),
    titleTh: v.string(),
    description: v.string(), // Markdown supported
    descriptionTh: v.string(),
    features: v.array(v.object({
      title: v.string(),
      titleTh: v.string(),
      description: v.string(),
      descriptionTh: v.string(),
      icon: v.string(), // Lucide icon name
    })),
    isActive: v.boolean(), // Show this update
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_release_date", ["releaseDate"])
    .index("by_version", ["version"]),

  userUpdateViews: defineTable({
    userId: v.id("users"),
    updateId: v.id("appUpdates"),
    viewedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_update", ["updateId"])
    .index("by_user_and_update", ["userId", "updateId"]),
});
