import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Provider System - Multi-provider support for private tutoring
 * 
 * Categories:
 * - personal: Teacher's private students
 * - private: Private tutoring company
 * - language_school: Language schools (British Council, Wall Street English, etc.)
 * - educational_camp: Summer camps, workshops
 * 
 * Permissions:
 * - Teachers can create: personal, private, language_school, educational_camp
 * - Moderators: CANNOT create or access providers (school-scoped only)
 * - Admins: Full access to all providers
 */

// Create a new provider
export const create = mutation({
    args: {
        name: v.string(),
        nameTh: v.string(),
        category: v.union(
            v.literal("personal"),
            v.literal("private"),
            v.literal("language_school"),
            v.literal("educational_camp")
        ),
        createdBy: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify user exists and get role
        const user = await ctx.db.get(args.createdBy);
        if (!user) {
            throw new Error("User not found");
        }

        // Authorization: Moderators CANNOT create providers
        if (user.role === "moderator") {
            throw new Error("Moderators cannot create providers. Providers are for teachers and admins only.");
        }

        // Validate bilingual names
        if (!args.name.trim() || !args.nameTh.trim()) {
            throw new Error("Provider name is required in both languages");
        }

        // Create provider
        const providerId = await ctx.db.insert("providers", {
            name: args.name.trim(),
            nameTh: args.nameTh.trim(),
            category: args.category,
            createdBy: args.createdBy,
            isActive: true,
            createdAt: Date.now(),
        });

        return providerId;
    },
});

// List providers (filtered by permissions)
export const list = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            return [];
        }

        // Moderators see NO providers (return empty array)
        if (user.role === "moderator") {
            return [];
        }

        // Admins see all providers
        if (user.role === "admin") {
            return await ctx.db
                .query("providers")
                .withIndex("by_active", (q) => q.eq("isActive", true))
                .collect();
        }

        // Teachers see only their own providers
        return await ctx.db
            .query("providers")
            .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();
    },
});

// Get provider by ID
export const getById = query({
    args: {
        providerId: v.id("providers"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const provider = await ctx.db.get(args.providerId);
        if (!provider) {
            return null;
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            return null;
        }

        // Moderators cannot access providers
        if (user.role === "moderator") {
            return null;
        }

        // Admins can access any provider
        if (user.role === "admin") {
            return provider;
        }

        // Teachers can only access their own providers
        if (provider.createdBy === args.userId) {
            return provider;
        }

        return null;
    },
});

// Update provider (creator or admin only)
export const update = mutation({
    args: {
        providerId: v.id("providers"),
        userId: v.id("users"),
        name: v.optional(v.string()),
        nameTh: v.optional(v.string()),
        category: v.optional(
            v.union(
                v.literal("personal"),
                v.literal("private"),
                v.literal("language_school"),
                v.literal("educational_camp")
            )
        ),
    },
    handler: async (ctx, args) => {
        const provider = await ctx.db.get(args.providerId);
        if (!provider) {
            throw new Error("Provider not found");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Authorization: Only creator or admin can update
        if (user.role !== "admin" && provider.createdBy !== args.userId) {
            throw new Error("You can only update providers you created");
        }

        // Moderators cannot update providers
        if (user.role === "moderator") {
            throw new Error("Moderators cannot update providers");
        }

        // Build update object
        const updates: Partial<{
            name: string;
            nameTh: string;
            category: "personal" | "private" | "language_school" | "educational_camp";
        }> = {};
        if (args.name !== undefined) {
            if (!args.name.trim()) {
                throw new Error("Provider name cannot be empty");
            }
            updates.name = args.name.trim();
        }
        if (args.nameTh !== undefined) {
            if (!args.nameTh.trim()) {
                throw new Error("Provider Thai name cannot be empty");
            }
            updates.nameTh = args.nameTh.trim();
        }
        if (args.category !== undefined) {
            updates.category = args.category;
        }

        await ctx.db.patch(args.providerId, updates);
        return args.providerId;
    },
});

// Soft delete provider (set isActive: false)
export const softDelete = mutation({
    args: {
        providerId: v.id("providers"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const provider = await ctx.db.get(args.providerId);
        if (!provider) {
            throw new Error("Provider not found");
        }

        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Authorization: Only creator or admin can delete
        if (user.role !== "admin" && provider.createdBy !== args.userId) {
            throw new Error("You can only delete providers you created");
        }

        // Moderators cannot delete providers
        if (user.role === "moderator") {
            throw new Error("Moderators cannot delete providers");
        }

        await ctx.db.patch(args.providerId, { isActive: false });
        return args.providerId;
    },
});

// Get providers with student/class counts (for management UI)
export const listWithCounts = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            return [];
        }

        // Moderators see no providers
        if (user.role === "moderator") {
            return [];
        }

        // Get providers based on role
        let providers;
        if (user.role === "admin") {
            providers = await ctx.db
                .query("providers")
                .withIndex("by_active", (q) => q.eq("isActive", true))
                .collect();
        } else {
            providers = await ctx.db
                .query("providers")
                .withIndex("by_created_by", (q) => q.eq("createdBy", args.userId))
                .filter((q) => q.eq(q.field("isActive"), true))
                .collect();
        }

        // Get counts for each provider
        const providersWithCounts = await Promise.all(
            providers.map(async (provider) => {
                // Count students linked to this provider
                const students = await ctx.db
                    .query("students")
                    .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
                    .collect();

                // Count classes linked to this provider
                const classes = await ctx.db
                    .query("classes")
                    .withIndex("by_provider", (q) => q.eq("providerId", provider._id))
                    .collect();

                return {
                    ...provider,
                    studentCount: students.length,
                    classCount: classes.length,
                };
            })
        );

        return providersWithCounts;
    },
});
