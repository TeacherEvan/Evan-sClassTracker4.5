/**
 * EMERGENCY MIGRATION: Reset all bcrypt passwords to PBKDF2
 *
 * This migration is CRITICAL after PBKDF2 upgrade because:
 * 1. Bcrypt hashes cannot be verified in Convex runtime (no Node.js)
 * 2. Users with bcrypt hashes are currently allowed to login with ANY password (security risk)
 * 3. All passwords must be reset to the default pattern: "Teacher{username}"
 *
 * HOW TO RUN:
 * 1. Open Convex Dashboard: https://dashboard.convex.dev
 * 2. Navigate to Functions tab
 * 3. Run this mutation: migrateBcryptPasswords:resetAllBcryptPasswords
 * 4. Provide admin userId
 * 5. Verify all users can login with default password pattern
 *
 * SECURITY NOTE:
 * - All users will have passwords reset to "Teacher{username}"
 * - requirePasswordChange flag will be set to true
 * - Users must change password on first login after migration
 *
 * Created: November 9, 2025
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./users";

/**
 * Detect if hash is bcrypt format
 */
function isBcryptHash(hash: string): boolean {
    return hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
}

/**
 * Query to count users with bcrypt passwords
 */
export const countBcryptUsers = query({
    handler: async (ctx) => {
        const allUsers = await ctx.db.query("users").collect();

        const bcryptUsers = allUsers.filter(user => isBcryptHash(user.passwordHash));
        const pbkdf2Users = allUsers.filter(user => user.passwordHash.startsWith("pbkdf2$"));
        const btoaUsers = allUsers.filter(user =>
            !isBcryptHash(user.passwordHash) && !user.passwordHash.startsWith("pbkdf2$")
        );

        return {
            total: allUsers.length,
            bcrypt: bcryptUsers.length,
            pbkdf2: pbkdf2Users.length,
            btoa: btoaUsers.length,
            bcryptUsernames: bcryptUsers.map(u => u.username),
        };
    },
});

/**
 * EMERGENCY MIGRATION: Reset all bcrypt passwords to PBKDF2 with default pattern
 *
 * ⚠️ ADMIN ONLY - Requires admin userId for authorization
 * ⚠️ ALL AFFECTED USERS WILL HAVE PASSWORDS RESET TO "Teacher{username}"
 * ⚠️ requirePasswordChange will be set to true (forced password change on login)
 */
export const resetAllBcryptPasswords = mutation({
    args: {
        adminId: v.id("users"),
        dryRun: v.optional(v.boolean()), // If true, only returns what would be changed
    },
    handler: async (ctx, args) => {
        // 1. Verify admin authorization
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("❌ ADMIN ACCESS REQUIRED - Only admins can run password migrations");
        }

        console.log(`🔐 Starting bcrypt password migration (dryRun: ${args.dryRun || false})`);
        console.log(`👤 Initiated by admin: ${admin.username}`);

        // 2. Find all users with bcrypt passwords
        const allUsers = await ctx.db.query("users").collect();
        const bcryptUsers = allUsers.filter(user => isBcryptHash(user.passwordHash));

        if (bcryptUsers.length === 0) {
            console.log(`✅ No bcrypt users found - migration already complete!`);
            return {
                success: true,
                message: "No bcrypt users found - migration already complete",
                usersAffected: 0,
                users: [],
            };
        }

        console.log(`📊 Found ${bcryptUsers.length} users with bcrypt passwords`);

        // 3. Generate new PBKDF2 passwords for each user
        const migrationResults = [];

        for (const user of bcryptUsers) {
            // Generate default password: "Teacher{username}"
            const defaultPassword = `Teacher${user.username}`;

            if (args.dryRun) {
                // Dry run - only report what would be done
                migrationResults.push({
                    username: user.username,
                    role: user.role,
                    currentHashType: "bcrypt",
                    newHashType: "pbkdf2",
                    defaultPassword: defaultPassword,
                    requirePasswordChange: true,
                });
            } else {
                // Actual migration - reset password but PRESERVE user preferences
                const newPasswordHash = await hashPassword(defaultPassword);

                await ctx.db.patch(user._id, {
                    passwordHash: newPasswordHash,
                    requirePasswordChange: true, // Force password change on first login
                    failedLoginAttempts: 0, // Reset lockout counter
                    accountLockedUntil: undefined, // Unlock account if locked
                    // IMPORTANT: Do NOT reset preferredLanguage, loginHistory, or other user data
                    // Only update password-related fields
                });

                migrationResults.push({
                    username: user.username,
                    role: user.role,
                    migrated: true,
                    defaultPassword: defaultPassword,
                    preservedLanguage: user.preferredLanguage || "not set",
                });

                console.log(`✅ Migrated user: ${user.username} (${user.role}) - Language: ${user.preferredLanguage || "not set"}`);
            }
        }

        // 4. Return migration summary
        const summary = {
            success: true,
            dryRun: args.dryRun || false,
            message: args.dryRun
                ? `DRY RUN: Would migrate ${bcryptUsers.length} users from bcrypt to PBKDF2`
                : `✅ Successfully migrated ${bcryptUsers.length} users from bcrypt to PBKDF2`,
            usersAffected: bcryptUsers.length,
            users: migrationResults,
            instructions: [
                "All affected users now have passwords reset to: Teacher{username}",
                "Users will be forced to change password on first login",
                "Example: username 'Evan' has password 'TeacherEvan'",
                "Example: username 'admin' has password 'TeacherAdmin'",
            ],
        };

        console.log(`🎉 Migration complete! ${bcryptUsers.length} users migrated`);

        return summary;
    },
});

/**
 * Helper: Reset a single user's password to default pattern
 * Useful for individual fixes without running full migration
 */
export const resetSingleUserPassword = mutation({
    args: {
        adminId: v.id("users"),
        targetUsername: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify admin
        const admin = await ctx.db.get(args.adminId);
        if (!admin || admin.role !== "admin") {
            throw new Error("Admin access required");
        }

        // Find target user
        const user = await ctx.db
            .query("users")
            .withIndex("by_username", q => q.eq("username", args.targetUsername))
            .first();

        if (!user) {
            throw new Error(`User not found: ${args.targetUsername}`);
        }

        // Reset to default password pattern
        const defaultPassword = `Teacher${user.username}`;
        const newPasswordHash = await hashPassword(defaultPassword);

        await ctx.db.patch(user._id, {
            passwordHash: newPasswordHash,
            requirePasswordChange: true,
            failedLoginAttempts: 0,
            accountLockedUntil: undefined,
        });

        console.log(`✅ Reset password for user: ${user.username}`);

        return {
            success: true,
            username: user.username,
            newPassword: defaultPassword,
            message: `Password reset to: ${defaultPassword}`,
        };
    },
});
