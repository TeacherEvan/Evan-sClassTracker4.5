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
    // Push notification subscription (JSON stringified)
    pushSubscription: v.optional(v.string()),
  })
    .index("by_username", ["username"])
    .index("by_school", ["schoolId"])
    .index("by_role", ["role"])
    .index("by_device_type", ["deviceType"]),

  schools: defineTable({
    name: v.string(),
    nameTh: v.string(),
    moderatorId: v.optional(v.id("users")),
    locations: v.optional(v.array(v.string())), // Array of location strings for this school
    createdAt: v.number(),
  })
    .index("by_moderator", ["moderatorId"])
    .index("by_created_at", ["createdAt"]),

  classes: defineTable({
    teacherId: v.id("users"),
    schoolId: v.id("schools"),
    name: v.string(), // Changed from title/titleTh to single name field
    location: v.string(), // Changed from description/descriptionTh to single location field
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

  conversations: defineTable({
    name: v.optional(v.string()), // Optional name for group conversations
    nameTh: v.optional(v.string()),
    participants: v.array(v.id("users")), // Array of user IDs in this conversation
    schoolId: v.optional(v.id("schools")), // Optional school context
    type: v.union(v.literal("direct"), v.literal("group")),
    lastMessageAt: v.number(), // Timestamp of last message for sorting
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_last_message", ["lastMessageAt"])
    .index("by_school", ["schoolId"])
    .index("by_created_at", ["createdAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.union(v.id("users"), v.literal("system")), // Allow system messages
    content: v.string(), // Message content
    readBy: v.array(v.id("users")), // Array of user IDs who have read this message
    messageType: v.optional(v.union(
      v.literal("user"),
      v.literal("system"),
      v.literal("acknowledgment")
    )),
    createdAt: v.number(),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_created_at", ["createdAt"]),

  // Push notification subscriptions (separate table for better management)
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string()
    }),
    deviceInfo: v.optional(v.string()), // Browser/device info
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});
