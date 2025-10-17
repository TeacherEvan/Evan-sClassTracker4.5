import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    },
    handler: async (ctx, args) => {
        // Validate inputs
        if (!args.name.trim() || !args.nameTh.trim()) {
            throw new Error("Location name is required in both languages");
        }

        const locationId = await ctx.db.insert("locations", {
            name: args.name,
            nameTh: args.nameTh,
            schoolId: args.schoolId,
            isActive: true,
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
        if (!args.name.trim() || !args.nameTh.trim()) {
            throw new Error("Location name is required in both languages");
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
