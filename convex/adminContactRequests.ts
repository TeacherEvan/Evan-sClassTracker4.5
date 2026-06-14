import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { checkRateLimit } from "./rateLimit";

// Query to list all contact requests (admin only)
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("resolved"),
        v.literal("dismissed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can view contact requests");
    }

    // Filter by status if provided
    const { status } = args;
    if (status) {
      const requests = await ctx.db
        .query("adminContactRequests")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
      return requests;
    }

    // Otherwise, return all requests
    const requests = await ctx.db
      .query("adminContactRequests")
      .order("desc")
      .collect();

    return requests;
  },
});

// Query to get user's own contact requests
export const myRequests = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("adminContactRequests")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return requests;
  },
});

// Generate upload URL for screenshot attachment
export const generateUploadUrl = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Generate upload URL (valid for 1 hour)
    return await ctx.storage.generateUploadUrl();
  },
});

// Query to get attachment URL
export const getAttachmentUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Mutation to create a contact request
export const create = mutation({
  args: {
    userId: v.id("users"),
    requestType: v.union(
      v.literal("general"),
      v.literal("feature_suggestion"),
      v.literal("bug_report"),
      v.literal("help_request"),
      v.literal("notification_window_request"),
    ),
    subject: v.string(),
    subjectTh: v.string(),
    message: v.string(),
    messageTh: v.string(),
    attachmentStorageId: v.optional(v.id("_storage")),
    attachmentName: v.optional(v.string()),
    attachmentType: v.optional(v.string()),
    attachmentSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Rate limiting: 10 requests per 10 minutes
    await checkRateLimit(ctx, {
      key: `admin_contact_${args.userId}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    // Get user info
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate input
    if (!args.subject.trim() && !args.subjectTh.trim()) {
      throw new Error("Subject is required in at least one language");
    }
    if (!args.message.trim() && !args.messageTh.trim()) {
      throw new Error("Message is required in at least one language");
    }

    // Validate attachment if provided
    if (args.attachmentStorageId) {
      // Verify file exists in storage
      const fileUrl = await ctx.storage.getUrl(args.attachmentStorageId);
      if (!fileUrl) {
        throw new Error("Attachment file not found");
      }

      // Validate file type (images only)
      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/gif",
      ];
      if (args.attachmentType && !allowedTypes.includes(args.attachmentType)) {
        throw new Error("Invalid file type. Only images are allowed.");
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (args.attachmentSize && args.attachmentSize > maxSize) {
        throw new Error("File size exceeds 5MB limit");
      }
    }

    // Create request
    const requestId = await ctx.db.insert("adminContactRequests", {
      userId: args.userId,
      userRole: user.role,
      username: user.username,
      requestType: args.requestType,
      subject: args.subject,
      subjectTh: args.subjectTh,
      message: args.message,
      messageTh: args.messageTh,
      status: "pending",
      createdAt: Date.now(),
      attachmentStorageId: args.attachmentStorageId,
      attachmentName: args.attachmentName,
      attachmentType: args.attachmentType,
      attachmentSize: args.attachmentSize,
    });

    // Create notification for all admins
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();

    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        title: `New Contact Request: ${args.requestType.replace(/_/g, " ")}`,
        titleTh: `คำขอติดต่อใหม่: ${args.requestType.replace(/_/g, " ")}`,
        message: `${user.username} (${user.role}) sent a ${args.requestType.replace(/_/g, " ")}: ${args.subject || args.subjectTh}`,
        messageTh: `${user.username} (${user.role}) ส่ง ${args.requestType.replace(/_/g, " ")}: ${args.subjectTh || args.subject}`,
        type: "info",
        read: false,
        createdAt: Date.now(),
      });
    }

    return requestId;
  },
});

// Mutation to update request status (admin only)
export const updateStatus = mutation({
  args: {
    adminId: v.id("users"),
    requestId: v.id("adminContactRequests"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("dismissed"),
    ),
    adminNotes: v.optional(v.string()),
    adminNotesTh: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update request status");
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new Error("Request not found");
    }

    // Update request
    await ctx.db.patch(args.requestId, {
      status: args.status,
      adminNotes: args.adminNotes,
      adminNotesTh: args.adminNotesTh,
      resolvedBy: args.adminId,
      resolvedAt: Date.now(),
    });

    // Notify the user who made the request
    if (args.status === "resolved" || args.status === "dismissed") {
      await ctx.db.insert("notifications", {
        userId: request.userId,
        title: "Contact Request Updated",
        titleTh: "คำขอติดต่อได้รับการอัปเดต",
        message: `Your ${request.requestType.replace(/_/g, " ")} has been ${args.status}. ${args.adminNotes || ""}`,
        messageTh: `${request.requestType.replace(/_/g, " ")} ของคุณได้รับการ ${args.status}. ${args.adminNotesTh || ""}`,
        type: args.status === "resolved" ? "success" : "info",
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Mutation to delete a request (admin only)
export const remove = mutation({
  args: {
    adminId: v.id("users"),
    requestId: v.id("adminContactRequests"),
  },
  handler: async (ctx, args) => {
    // Verify user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete requests");
    }

    await ctx.db.delete(args.requestId);
    return { success: true };
  },
});
