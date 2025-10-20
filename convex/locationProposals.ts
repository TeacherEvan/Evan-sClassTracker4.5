import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Teacher proposes a new location
export const proposeLocation = mutation({
  args: {
    name: v.string(),
    nameTh: v.string(),
    schoolId: v.id("schools"),
    type: v.union(v.literal("school"), v.literal("guardian")),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user and verify teacher role
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "teacher") {
      throw new Error("Only teachers can propose locations");
    }

    // Create location with pending approval status
    const locationId = await ctx.db.insert("locations", {
      name: args.name,
      nameTh: args.nameTh,
      schoolId: args.schoolId,
      type: args.type,
      isActive: false, // Not active until approved
      proposedBy: user._id,
      approved: false,
      pendingApproval: true,
      proposalDate: Date.now(),
      createdAt: Date.now(),
      createdBy: user._id,
    });

    // Get school name for notification
    const school = await ctx.db.get(args.schoolId);

    // Notify all moderators about the proposal
    const moderators = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("role"), "moderator"),
          q.eq(q.field("role"), "admin")
        )
      )
      .collect();

    for (const moderator of moderators) {
      await ctx.db.insert("notifications", {
        title: "New Location Proposed",
        titleTh: "มีการเสนอสถานที่ใหม่",
        message: `Teacher ${user.username} proposed a new ${args.type} location "${args.name}" at ${school?.name || "Unknown School"}`,
        messageTh: `ครู ${user.username} เสนอสถานที่ประเภท ${args.type === "guardian" ? "ผู้ปกครอง" : "โรงเรียน"} ชื่อ "${args.nameTh}" ที่ ${school?.nameTh || "โรงเรียนไม่ทราบชื่อ"}`,
        type: "info",
        userId: moderator._id,
        read: false,
        createdAt: Date.now(),
      });
    }

    return locationId;
  },
});

// Query to list pending location proposals (for moderators)
export const listPendingProposals = query({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user and verify moderator/admin role
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();

    if (!user || !["moderator", "admin"].includes(user.role)) {
      return [];
    }

    // Get all pending proposals
    const proposals = await ctx.db
      .query("locations")
      .withIndex("by_pending_approval", (q) => q.eq("pendingApproval", true))
      .collect();

    // Enrich with school and proposer info
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const school = proposal.schoolId
          ? await ctx.db.get(proposal.schoolId)
          : null;
        const proposer = proposal.proposedBy
          ? await ctx.db.get(proposal.proposedBy)
          : null;

        return {
          ...proposal,
          schoolName: school?.name || "Unknown",
          schoolNameTh: school?.nameTh || "ไม่ทราบ",
          proposerUsername: proposer?.username || "Unknown",
        };
      })
    );

    // Sort by proposal date (newest first)
    return enrichedProposals.sort((a, b) => 
      (b.proposalDate || 0) - (a.proposalDate || 0)
    );
  },
});

// Moderator approves a location proposal
export const approveProposal = mutation({
  args: {
    locationId: v.id("locations"),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user and verify moderator/admin role
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();

    if (!user || !["moderator", "admin"].includes(user.role)) {
      throw new Error("Unauthorized: Only moderators and admins can approve proposals");
    }

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    // Update location to approved and active
    await ctx.db.patch(args.locationId, {
      approved: true,
      pendingApproval: false,
      isActive: true,
      approvedBy: user._id,
    });

    // Notify the teacher who proposed it
    if (location.proposedBy) {
      const school = await ctx.db.get(location.schoolId);

      await ctx.db.insert("notifications", {
        title: "Location Proposal Approved",
        titleTh: "อนุมัติสถานที่แล้ว",
        message: `Your proposed location "${location.name}" at ${school?.name || "Unknown School"} has been approved by ${user.username}`,
        messageTh: `สถานที่ที่คุณเสนอ "${location.nameTh}" ที่ ${school?.nameTh || "โรงเรียนไม่ทราบชื่อ"} ได้รับการอนุมัติจาก ${user.username}`,
        type: "success",
        userId: location.proposedBy,
        read: false,
        createdAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Moderator rejects a location proposal
export const rejectProposal = mutation({
  args: {
    locationId: v.id("locations"),
    reason: v.string(),
    reasonTh: v.string(),
  },
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user and verify moderator/admin role
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();

    if (!user || !["moderator", "admin"].includes(user.role)) {
      throw new Error("Unauthorized: Only moderators and admins can reject proposals");
    }

    const location = await ctx.db.get(args.locationId);
    if (!location) {
      throw new Error("Location not found");
    }

    // Update location to rejected
    await ctx.db.patch(args.locationId, {
      approved: false,
      pendingApproval: false,
      isActive: false,
      rejectionReason: args.reason,
      rejectionReasonTh: args.reasonTh,
      approvedBy: user._id, // Track who rejected it
    });

    // Notify the teacher who proposed it
    if (location.proposedBy) {
      const school = await ctx.db.get(location.schoolId);

      await ctx.db.insert("notifications", {
        title: "Location Proposal Rejected",
        titleTh: "ปฏิเสธสถานที่",
        message: `Your proposed location "${location.name}" at ${school?.name || "Unknown School"} was rejected by ${user.username}. Reason: ${args.reason}`,
        messageTh: `สถานที่ที่คุณเสนอ "${location.nameTh}" ที่ ${school?.nameTh || "โรงเรียนไม่ทราบชื่อ"} ถูกปฏิเสธโดย ${user.username} เหตุผล: ${args.reasonTh}`,
        type: "warning",
        userId: location.proposedBy,
        read: false,
        createdAt: Date.now(),
      });
    }

    // Optionally delete the rejected location after notification
    // await ctx.db.delete(args.locationId);

    return { success: true };
  },
});

// Query to get teacher's own proposed locations
export const myProposals = query({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    // Get user's proposals
    const proposals = await ctx.db
      .query("locations")
      .withIndex("by_proposed_by", (q) => q.eq("proposedBy", user._id))
      .collect();

    // Enrich with school info
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const school = proposal.schoolId
          ? await ctx.db.get(proposal.schoolId)
          : null;

        return {
          ...proposal,
          schoolName: school?.name || "Unknown",
          schoolNameTh: school?.nameTh || "ไม่ทราบ",
        };
      })
    );

    // Sort by proposal date (newest first)
    return enrichedProposals.sort((a, b) => 
      (b.proposalDate || 0) - (a.proposalDate || 0)
    );
  },
});
