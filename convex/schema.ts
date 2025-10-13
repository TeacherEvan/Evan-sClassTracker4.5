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
  })
    .index("by_username", ["username"])
    .index("by_school", ["schoolId"])
    .index("by_role", ["role"]),

  schools: defineTable({
    name: v.string(),
    nameTh: v.string(),
    moderatorId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_moderator", ["moderatorId"]),

  classes: defineTable({
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    title: v.string(),
    titleTh: v.string(),
    description: v.string(),
    descriptionTh: v.string(),
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
    .index("by_status", ["status"]),

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
});
