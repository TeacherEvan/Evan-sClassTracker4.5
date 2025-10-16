import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple password hashing (in production, use bcrypt or similar)
// TODO: Replace with bcrypt for production use
// This is a simple hash for demonstration. In production, use proper hashing
function hashPassword(password: string): string {
  // Using btoa for browser-compatible base64 encoding (works in Convex runtime)
  // SECURITY WARNING: This is NOT secure for production use
  // Install and use bcrypt: `npm install bcrypt` then:
  // import bcrypt from 'bcrypt';
  // const saltRounds = 10;
  // return await bcrypt.hash(password, saltRounds);
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Query to get user by username
export const getByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) return null;

    // Don't return password hash to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Query to get user by ID
export const getById = query({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (!user) return null;

    // Don't return password hash to client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
});

// Query to list all users (admin only)
export const list = query({
  args: {
    role: v.optional(v.union(
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin")
    )),
  },
  handler: async (ctx, args) => {
    const users = args.role
      ? await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", args.role!))
        .collect()
      : await ctx.db.query("users").collect();

    // Don't return password hashes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ passwordHash: _passwordHash, ...user }) => user);
  },
});

// Mutation to create a new user with default password
export const create = mutation({
  args: {
    username: v.string(),
    role: v.union(
      v.literal("teacher"),
      v.literal("moderator"),
      v.literal("admin")
    ),
    schoolId: v.optional(v.id("schools")),
  },
  handler: async (ctx, args) => {
    // Validate username
    if (!args.username.trim() || args.username.length < 3) {
      throw new Error("Username must be at least 3 characters");
    }

    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new Error("Username already exists");
    }

    // Generate default password: "Teacher{username}"
    const defaultPassword = `Teacher${args.username}`;
    const passwordHash = hashPassword(defaultPassword);

    const userId = await ctx.db.insert("users", {
      username: args.username,
      passwordHash,
      role: args.role,
      schoolId: args.schoolId,
      requirePasswordChange: true, // Force password change on first login
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Mutation to authenticate user
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      throw new Error("Invalid username or password");
    }

    // Return user without password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      requirePasswordChange: user.requirePasswordChange,
    };
  },
});

// Mutation to change password
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate password is not empty
    if (!args.newPassword || args.newPassword.length < 1) {
      throw new Error("Password cannot be empty");
    }

    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    if (!verifyPassword(args.currentPassword, user.passwordHash)) {
      throw new Error("Current password is incorrect");
    }

    // Update password
    const newPasswordHash = hashPassword(args.newPassword);
    await ctx.db.patch(args.userId, {
      passwordHash: newPasswordHash,
      requirePasswordChange: false,
    });

    return { success: true };
  },
});

// Mutation to reset password (admin only)
export const resetPassword = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Reset to default password
    const defaultPassword = `Teacher${user.username}`;
    const passwordHash = hashPassword(defaultPassword);

    await ctx.db.patch(args.userId, {
      passwordHash,
      requirePasswordChange: true,
    });

    return { success: true };
  },
});

// Mutation to update device type
export const updateDeviceType = mutation({
  args: {
    userId: v.id("users"),
    deviceType: v.union(
      v.literal("mobile"),
      v.literal("tablet"),
      v.literal("desktop")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      deviceType: args.deviceType,
      lastDeviceUpdate: Date.now(),
    });

    return { success: true };
  },
});

// Mutation to update push subscription
export const updatePushSubscription = mutation({
  args: {
    userId: v.id("users"),
    pushSubscription: v.string(), // JSON stringified PushSubscription
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      pushSubscription: args.pushSubscription,
    });

    return { success: true };
  },
});

// Mutation to remove push subscription
export const removePushSubscription = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      pushSubscription: undefined,
    });

    return { success: true };
  },
});

// Query to get current user (includes device info)
export const getCurrentUser = query({
  handler: async () => {
    // This would require authentication setup
    // For now, returning null as a placeholder
    return null;
  },
});
