import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list all schools
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});

// Query to get school by ID
export const getById = query({
  args: {
    id: v.id("schools"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Mutation to create a new school
export const create = mutation({
  args: {
    name: v.string(),
    nameTh: v.string(),
    moderatorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate inputs
    if (!args.name.trim() || !args.nameTh.trim()) {
      throw new Error("School name is required in both languages");
    }

    const schoolId = await ctx.db.insert("schools", {
      name: args.name,
      nameTh: args.nameTh,
      moderatorId: args.moderatorId,
      locations: [], // Initialize with empty locations array
      createdAt: Date.now(),
    });

    return schoolId;
  },
});

// Mutation to add a location to a school
export const addLocation = mutation({
  args: {
    schoolId: v.id("schools"),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.location.trim()) {
      throw new Error("Location cannot be empty");
    }

    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    const currentLocations = school.locations || [];

    // Check if location already exists (case-insensitive)
    const locationExists = currentLocations.some(
      loc => loc.toLowerCase() === args.location.trim().toLowerCase()
    );

    if (locationExists) {
      throw new Error("This location already exists for this school");
    }

    const updatedLocations = [...currentLocations, args.location.trim()];

    await ctx.db.patch(args.schoolId, {
      locations: updatedLocations,
    });

    return { success: true, locations: updatedLocations };
  },
});

// Query to get locations for a specific school
export const getLocations = query({
  args: {
    schoolId: v.id("schools"),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    return school?.locations || [];
  },
});

// Mutation to update school moderator
export const updateModerator = mutation({
  args: {
    schoolId: v.id("schools"),
    moderatorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.schoolId, {
      moderatorId: args.moderatorId,
    });

    return { success: true };
  },
});

// Mutation to delete a school
export const remove = mutation({
  args: {
    id: v.id("schools"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    return { success: true };
  },
});
