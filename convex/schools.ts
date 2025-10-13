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
    const schoolId = await ctx.db.insert("schools", {
      name: args.name,
      nameTh: args.nameTh,
      moderatorId: args.moderatorId,
      createdAt: Date.now(),
    });
    
    return schoolId;
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
