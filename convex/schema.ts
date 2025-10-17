import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin")
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
    locationId: v.id("locations"),
    status: v.union(
      v.literal("pending"),
      v.literal("acknowledged"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    scheduledDate: v.number(),
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_school", ["schoolId"])
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_school_and_date", ["schoolId", "scheduledDate"])
    .index("by_teacher_and_date", ["teacherId", "scheduledDate"]),

  students: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    studentId: v.string(), // Unique identifier
    schoolId: v.optional(v.id("schools")), // Now optional - null if linked to guardian
    grade: v.string(),
    guardianName: v.optional(v.string()), // Guardian name if no school
    guardianPhone: v.optional(v.string()), // Guardian contact
    guardianEmail: v.optional(v.string()), // Guardian email
    createdAt: v.number(),
  })
    .index("by_student_id", ["studentId"])
    .index("by_school", ["schoolId"])
    .index("by_guardian", ["guardianName"]),

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
    isActive: v.boolean(), // Enable/disable without deleting
    createdAt: v.number(),
    createdBy: v.id("users"), // Moderator or Admin who created it
  })
    .index("by_school", ["schoolId"])
    .index("by_active", ["isActive"])
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
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_school", ["schoolId"])
    .index("by_action", ["action"])
    .index("by_created_at", ["createdAt"])
    .index("by_teacher_and_date", ["teacherId", "createdAt"])
    .index("by_school_and_date", ["schoolId", "createdAt"]),
});
