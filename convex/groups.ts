import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Query to list all groups for a school
export const listBySchool = query({
    args: {
        schoolId: v.id("schools"),
    },
    handler: async (ctx, args) => {
        const groups = await ctx.db
            .query("groups")
            .withIndex("by_school", (q) => q.eq("schoolId", args.schoolId))
            .collect();

        // Populate creator information
        const groupsWithCreators = await Promise.all(
            groups.map(async (group) => {
                const creator = await ctx.db.get(group.creatorId);
                return {
                    ...group,
                    creatorUsername: creator?.username || "Unknown",
                };
            })
        );

        return groupsWithCreators;
    },
});

// Query to get a single group by ID
export const getById = query({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);

        if (!group) {
            return null;
        }

        const creator = await ctx.db.get(group.creatorId);

        // Get member information
        const members = await Promise.all(
            group.memberIds.map(async (memberId) => {
                const member = await ctx.db.get(memberId);
                return member ? { _id: member._id, username: member.username } : null;
            })
        );

        return {
            ...group,
            creatorUsername: creator?.username || "Unknown",
            members: members.filter((m) => m !== null),
        };
    },
});

// Query to list groups where user is a member
export const listForUser = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const allGroups = await ctx.db.query("groups").collect();

        // Filter groups where user is a member
        const userGroups = allGroups.filter((group) =>
            group.memberIds.includes(args.userId)
        );

        // Populate creator information
        const groupsWithCreators = await Promise.all(
            userGroups.map(async (group) => {
                const creator = await ctx.db.get(group.creatorId);
                return {
                    ...group,
                    creatorUsername: creator?.username || "Unknown",
                };
            })
        );

        return groupsWithCreators;
    },
});

// Mutation to create a new group (moderators only)
export const create = mutation({
    args: {
        name: v.string(),
        nameTh: v.string(),
        schoolId: v.id("schools"),
        creatorId: v.id("users"),
        memberIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        // Verify creator is a moderator or admin
        const creator = await ctx.db.get(args.creatorId);

        if (!creator) {
            throw new Error("Creator not found");
        }

        if (creator.role !== "moderator" && creator.role !== "admin") {
            throw new Error("Only moderators and admins can create groups");
        }

        // Verify all members exist
        const members = await Promise.all(
            args.memberIds.map((id) => ctx.db.get(id))
        );

        if (members.some((m) => !m)) {
            throw new Error("One or more member IDs are invalid");
        }

        const groupId = await ctx.db.insert("groups", {
            name: args.name,
            nameTh: args.nameTh,
            schoolId: args.schoolId,
            creatorId: args.creatorId,
            memberIds: args.memberIds,
            createdAt: Date.now(),
        });

        return groupId;
    },
});

// Mutation to add members to a group
export const addMembers = mutation({
    args: {
        groupId: v.id("groups"),
        memberIds: v.array(v.id("users")),
        updaterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);

        if (!group) {
            throw new Error("Group not found");
        }

        // Verify updater is creator, moderator, or admin
        const updater = await ctx.db.get(args.updaterId);

        if (!updater) {
            throw new Error("Updater not found");
        }

        if (
            group.creatorId !== args.updaterId &&
            updater.role !== "moderator" &&
            updater.role !== "admin"
        ) {
            throw new Error("Only group creator, moderators, or admins can add members");
        }

        // Add new members (avoid duplicates)
        const currentMembers = new Set(group.memberIds);
        args.memberIds.forEach((id) => currentMembers.add(id));

        await ctx.db.patch(args.groupId, {
            memberIds: Array.from(currentMembers),
        });

        return { success: true };
    },
});

// Mutation to remove members from a group
export const removeMembers = mutation({
    args: {
        groupId: v.id("groups"),
        memberIds: v.array(v.id("users")),
        updaterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);

        if (!group) {
            throw new Error("Group not found");
        }

        // Verify updater is creator, moderator, or admin
        const updater = await ctx.db.get(args.updaterId);

        if (!updater) {
            throw new Error("Updater not found");
        }

        if (
            group.creatorId !== args.updaterId &&
            updater.role !== "moderator" &&
            updater.role !== "admin"
        ) {
            throw new Error("Only group creator, moderators, or admins can remove members");
        }

        // Remove members
        const updatedMembers = group.memberIds.filter(
            (id) => !args.memberIds.includes(id)
        );

        await ctx.db.patch(args.groupId, {
            memberIds: updatedMembers,
        });

        return { success: true };
    },
});

// Mutation to delete a group
export const deleteGroup = mutation({
    args: {
        groupId: v.id("groups"),
        deleterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);

        if (!group) {
            throw new Error("Group not found");
        }

        // Verify deleter is creator, moderator, or admin
        const deleter = await ctx.db.get(args.deleterId);

        if (!deleter) {
            throw new Error("Deleter not found");
        }

        if (
            group.creatorId !== args.deleterId &&
            deleter.role !== "moderator" &&
            deleter.role !== "admin"
        ) {
            throw new Error("Only group creator, moderators, or admins can delete groups");
        }

        await ctx.db.delete(args.groupId);

        return { success: true };
    },
});

// Mutation to update group name
export const updateName = mutation({
    args: {
        groupId: v.id("groups"),
        name: v.string(),
        nameTh: v.string(),
        updaterId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId);

        if (!group) {
            throw new Error("Group not found");
        }

        // Verify updater is creator, moderator, or admin
        const updater = await ctx.db.get(args.updaterId);

        if (!updater) {
            throw new Error("Updater not found");
        }

        if (
            group.creatorId !== args.updaterId &&
            updater.role !== "moderator" &&
            updater.role !== "admin"
        ) {
            throw new Error("Only group creator, moderators, or admins can update group name");
        }

        await ctx.db.patch(args.groupId, {
            name: args.name,
            nameTh: args.nameTh,
        });

        return { success: true };
    },
});
