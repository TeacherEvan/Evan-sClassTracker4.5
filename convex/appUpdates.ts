import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to get the active update announcement
export const getActive = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("appUpdates")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .order("desc")
            .first();
    },
});

// Query to check if user has viewed an update
export const hasUserViewed = query({
    args: {
        userId: v.id("users"),
        updateId: v.id("appUpdates"),
    },
    handler: async (ctx, args) => {
        const view = await ctx.db
            .query("userUpdateViews")
            .withIndex("by_user_and_update", (q) =>
                q.eq("userId", args.userId).eq("updateId", args.updateId)
            )
            .first();

        return !!view;
    },
});// Mutation to mark update as viewed
export const markAsViewed = mutation({
    args: {
        userId: v.id("users"),
        updateId: v.id("appUpdates"),
    },
    handler: async (ctx, args) => {
        // Check if already viewed
        const existing = await ctx.db
            .query("userUpdateViews")
            .withIndex("by_user_and_update", (q) =>
                q.eq("userId", args.userId).eq("updateId", args.updateId)
            )
            .first();

        if (existing) {
            return existing;
        }

        // Create view record
        return await ctx.db.insert("userUpdateViews", {
            userId: args.userId,
            updateId: args.updateId,
            viewedAt: Date.now(),
        });
    },
});

// Mutation to create a new update announcement (admin only)
export const create = mutation({
    args: {
        userId: v.id("users"),
        version: v.string(),
        title: v.string(),
        titleTh: v.string(),
        description: v.string(),
        descriptionTh: v.string(),
        features: v.array(v.object({
            title: v.string(),
            titleTh: v.string(),
            description: v.string(),
            descriptionTh: v.string(),
            icon: v.string(),
        })),
    },
    handler: async (ctx, args) => {
        // Verify user is admin
        const user = await ctx.db.get(args.userId);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can create update announcements");
        }

        // Deactivate all previous updates
        const previousUpdates = await ctx.db
            .query("appUpdates")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        for (const update of previousUpdates) {
            await ctx.db.patch(update._id, { isActive: false });
        }

        // Create new update
        return await ctx.db.insert("appUpdates", {
            version: args.version,
            releaseDate: Date.now(),
            title: args.title,
            titleTh: args.titleTh,
            description: args.description,
            descriptionTh: args.descriptionTh,
            features: args.features,
            isActive: true,
            createdAt: Date.now(),
        });
    },
});

// Query to list all updates (admin only)
export const list = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify user is admin
        const user = await ctx.db.get(args.userId);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can view all updates");
        }

        return await ctx.db
            .query("appUpdates")
            .withIndex("by_release_date")
            .order("desc")
            .collect();
    },
});

// Mutation to toggle update active status (admin only)
export const toggleActive = mutation({
    args: {
        userId: v.id("users"),
        updateId: v.id("appUpdates"),
    },
    handler: async (ctx, args) => {
        // Verify user is admin
        const user = await ctx.db.get(args.userId);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized: Only admins can toggle update status");
        }

        const update = await ctx.db.get(args.updateId);
        if (!update) {
            throw new Error("Update not found");
        }

        // If activating, deactivate all others
        if (!update.isActive) {
            const activeUpdates = await ctx.db
                .query("appUpdates")
                .withIndex("by_active", (q) => q.eq("isActive", true))
                .collect();

            for (const activeUpdate of activeUpdates) {
                await ctx.db.patch(activeUpdate._id, { isActive: false });
            }
        }

        await ctx.db.patch(args.updateId, { isActive: !update.isActive });
        return { success: true };
    },
});
