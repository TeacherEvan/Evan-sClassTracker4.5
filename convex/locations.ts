import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateLength } from "./rateLimit";

// Query to list all locations
export const list = query({
    args: {
        schoolId: v.optional(v.id("schools")),
        activeOnly: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const query = ctx.db.query("locations");

        if (args.schoolId) {
            const locations = await query
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .collect(); if (args.activeOnly) {
                    return locations.filter((loc) => loc.isActive);
                }
            return locations;
        }

        const allLocations = await query.collect();

        if (args.activeOnly) {
            return allLocations.filter((loc) => loc.isActive);
        }
        return allLocations;
    },
});

// Query to get location by ID
export const getById = query({
    args: {
        id: v.id("locations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Mutation to create a new location
export const create = mutation({
    args: {
        name: v.string(),
        nameTh: v.string(),
        schoolId: v.id("schools"),
        createdBy: v.id("users"),
        isPending: v.optional(v.boolean()), // For teacher-requested locations
        requestedBy: v.optional(v.id("users")), // Teacher who requested
    },
    handler: async (ctx, args) => {
        // ✅ SECURITY: Input validation - location names max 200 chars
        validateLength(args.name, "Location name", 200, 0);
        validateLength(args.nameTh, "Thai location name", 200, 0);

        // Validate inputs
        if (!args.name.trim() && !args.nameTh.trim()) {
            throw new Error("Location name is required in at least one language");
        }

        const locationId = await ctx.db.insert("locations", {
            name: args.name,
            nameTh: args.nameTh,
            schoolId: args.schoolId,
            isActive: args.isPending ? false : true, // Inactive until approved if pending
            isPending: args.isPending || false,
            requestedBy: args.requestedBy,
            createdAt: Date.now(),
            createdBy: args.createdBy,
        });

        return locationId;
    },
});

// Mutation to update a location
export const update = mutation({
    args: {
        id: v.id("locations"),
        name: v.string(),
        nameTh: v.string(),
    },
    handler: async (ctx, args) => {
        // Validate inputs
        if (!args.name.trim() && !args.nameTh.trim()) {
            throw new Error("Location name is required in at least one language");
        }

        await ctx.db.patch(args.id, {
            name: args.name,
            nameTh: args.nameTh,
        });

        return { success: true };
    },
});

// Mutation to toggle location active status
export const toggleActive = mutation({
    args: {
        id: v.id("locations"),
    },
    handler: async (ctx, args) => {
        const location = await ctx.db.get(args.id);

        if (!location) {
            throw new Error("Location not found");
        }

        await ctx.db.patch(args.id, {
            isActive: !location.isActive,
        });

        return { success: true };
    },
});

// Mutation to approve a pending teacher-requested location
export const approvePending = mutation({
    args: {
        id: v.id("locations"),
        approvedBy: v.id("users"), // Moderator approving
    },
    handler: async (ctx, args) => {
        const location = await ctx.db.get(args.id);

        if (!location) {
            throw new Error("Location not found");
        }

        if (!location.isPending) {
            throw new Error("Location is not pending approval");
        }

        await ctx.db.patch(args.id, {
            isPending: false,
            isActive: true,
            approvedBy: args.approvedBy,
        });

        // Notify the teacher who requested it
        if (location.requestedBy) {
            await ctx.db.insert("notifications", {
                title: "Location Request Approved",
                titleTh: "คำขอสถานที่ได้รับการอนุมัติ",
                message: `Your location request "${location.name}" has been approved.`,
                messageTh: `คำขอสถานที่ "${location.nameTh}" ของคุณได้รับการอนุมัติแล้ว`,
                type: "success",
                userId: location.requestedBy,
                read: false,
                createdAt: Date.now(),
            });
        }

        return { success: true };
    },
});

// Query to get pending location requests
export const getPending = query({
    args: {
        schoolId: v.optional(v.id("schools")),
    },
    handler: async (ctx, args) => {
        if (args.schoolId) {
            return await ctx.db
                .query("locations")
                .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId!))
                .filter((q) => q.eq(q.field("isPending"), true))
                .collect();
        }

        return await ctx.db
            .query("locations")
            .withIndex("by_pending", (q) => q.eq("isPending", true))
            .collect();
    },
});

// Mutation to delete a location
export const remove = mutation({
    args: {
        id: v.id("locations"),
    },
    handler: async (ctx, args) => {
        // Check if location is used in any classes
        const classesUsingLocation = await ctx.db
            .query("classes")
            .filter((q) => q.eq(q.field("locationId"), args.id))
            .first();

        if (classesUsingLocation) {
            throw new Error(
                "Cannot delete location that is used in class bookings. Please deactivate it instead."
            );
        }

        await ctx.db.delete(args.id);

        return { success: true };
    },
});
