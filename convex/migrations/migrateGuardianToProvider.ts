/**
 * Guardian to Provider Migration Script
 *
 * Purpose: Migrate guardian users to provider system
 * Status: SCAFFOLD - Dry-run mode only (safe to deploy)
 *
 * Timeline:
 * - Phase 0: Non-breaking compatibility layer (NOW)
 * - Phase 1: Data migration (after E2E stable)
 * - Phase 2: UI migration
 * - Phase 3: Role removal (breaking)
 *
 * Documentation: docs/migrations/GUARDIAN_ROLE_REMOVAL_REPORT_NOV_9_2025.md
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

/**
 * Count guardian users in the system
 * Safe query - no modifications
 */
export const countGuardianUsers = query({
  args: {},
  handler: async (ctx) => {
    const guardians = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();

    const guardiansWithStudents = await Promise.all(
      guardians.map(async (guardian) => {
        const students = await ctx.db
          .query("students")
          .withIndex("by_guardian_id", (q) => q.eq("guardianId", guardian._id))
          .collect();

        return {
          guardianId: guardian._id,
          username: guardian.username,
          studentCount: students.length,
        };
      }),
    );

    return {
      totalGuardians: guardians.length,
      details: guardiansWithStudents,
    };
  },
});

/**
 * Migrate guardian users to provider system
 *
 * WARNING: Modifies data when dryRun = false
 *
 * Steps:
 * 1. Verify admin authorization
 * 2. Find all guardian users
 * 3. For each guardian:
 *    - Create provider entity (category: "guardian")
 *    - Update students to set providerId
 *    - Update classes to set providerId
 *    - Keep guardianId for rollback capability
 *
 * @param adminId - Must be admin role
 * @param dryRun - If true, reports what would change without modifying data
 * @returns Migration report with counts and errors
 */
export const migrateGuardiansToProviders = mutation({
  args: {
    adminId: v.id("users"),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    // 1. Verify admin authorization
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required for migration");
    }

    console.log("🔄 Starting guardian to provider migration", {
      adminId: args.adminId,
      adminUsername: admin.username,
      dryRun: args.dryRun,
      timestamp: new Date().toISOString(),
    });

    // 2. Find all guardian users
    const guardians = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();

    const report = {
      guardiansFound: guardians.length,
      providersCreated: 0,
      studentsUpdated: 0,
      classesUpdated: 0,
      errors: [] as Array<{
        guardianId: string;
        username: string;
        error: string;
      }>,
      details: [] as Array<{
        guardianId: string;
        username: string;
        providerId?: string;
        studentsUpdated: number;
        classesUpdated: number;
      }>,
    };

    console.log(`📊 Found ${guardians.length} guardian users to migrate`);

    // 3. For each guardian, create provider and update relationships
    for (const guardian of guardians) {
      try {
        const guardianReport = {
          guardianId: guardian._id,
          username: guardian.username,
          providerId: undefined as string | undefined,
          studentsUpdated: 0,
          classesUpdated: 0,
        };

        if (!args.dryRun) {
          // Create provider entity
          const providerId = await ctx.db.insert("providers", {
            name: `Guardian - ${guardian.username}`,
            nameTh: `ผู้ปกครอง - ${guardian.username}`,
            category: "guardian",
            createdBy: args.adminId,
            isActive: true,
            createdAt: Date.now(),
          });

          guardianReport.providerId = providerId;
          report.providersCreated++;

          console.log(`✅ Created provider for guardian ${guardian.username}`, {
            providerId,
          });

          // Update students linked to this guardian
          const students = await ctx.db
            .query("students")
            .withIndex("by_guardian_id", (q) =>
              q.eq("guardianId", guardian._id),
            )
            .collect();

          for (const student of students) {
            await ctx.db.patch(student._id, {
              providerId,
              // Keep guardianId for rollback capability
            });
            guardianReport.studentsUpdated++;
          }

          report.studentsUpdated += guardianReport.studentsUpdated;

          console.log(
            `✅ Updated ${students.length} students for guardian ${guardian.username}`,
          );

          // Update classes for this guardian's students
          const classesForStudents = await Promise.all(
            students.map(async (student) => {
              const classes = await ctx.db
                .query("classes")
                .withIndex("by_student", (q) => q.eq("studentId", student._id))
                .filter((q) => q.eq(q.field("isGuardianLinked"), true))
                .collect();
              return classes;
            }),
          );

          const allClasses = classesForStudents.flat();

          for (const classItem of allClasses) {
            await ctx.db.patch(classItem._id, {
              providerId,
              // Keep isGuardianLinked for backward compatibility
            });
            guardianReport.classesUpdated++;
          }

          report.classesUpdated += guardianReport.classesUpdated;

          console.log(
            `✅ Updated ${allClasses.length} classes for guardian ${guardian.username}`,
          );
        } else {
          // Dry-run mode - count what would be updated
          const students = await ctx.db
            .query("students")
            .withIndex("by_guardian_id", (q) =>
              q.eq("guardianId", guardian._id),
            )
            .collect();

          guardianReport.studentsUpdated = students.length;
          report.studentsUpdated += students.length;

          const classesForStudents = await Promise.all(
            students.map(async (student) => {
              const classes = await ctx.db
                .query("classes")
                .withIndex("by_student", (q) => q.eq("studentId", student._id))
                .filter((q) => q.eq(q.field("isGuardianLinked"), true))
                .collect();
              return classes;
            }),
          );

          const allClasses = classesForStudents.flat();
          guardianReport.classesUpdated = allClasses.length;
          report.classesUpdated += allClasses.length;

          console.log(
            `📋 [DRY-RUN] Would migrate guardian ${guardian.username}`,
            {
              studentsToUpdate: students.length,
              classesToUpdate: allClasses.length,
            },
          );
        }

        report.details.push(guardianReport);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        report.errors.push({
          guardianId: guardian._id,
          username: guardian.username,
          error: errorMessage,
        });
        console.error(`❌ Error migrating guardian ${guardian.username}`, {
          error: errorMessage,
        });
      }
    }

    // Final summary
    console.log("✅ Migration complete", {
      dryRun: args.dryRun,
      guardiansFound: report.guardiansFound,
      providersCreated: report.providersCreated,
      studentsUpdated: report.studentsUpdated,
      classesUpdated: report.classesUpdated,
      errors: report.errors.length,
    });

    return report;
  },
});

/**
 * Verify migration success
 * Safe query - no modifications
 */
export const verifyMigration = query({
  args: {},
  handler: async (ctx) => {
    // Count guardian providers
    const guardianProviders = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("category"), "guardian"))
      .collect();

    // Count students with providerId
    const studentsWithProvider = await ctx.db
      .query("students")
      .filter((q) => q.neq(q.field("providerId"), undefined))
      .collect();

    // Count guardian users still in system
    const remainingGuardians = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();

    return {
      guardianProviders: guardianProviders.length,
      studentsWithProvider: studentsWithProvider.length,
      remainingGuardianUsers: remainingGuardians.length,
      migrationComplete:
        guardianProviders.length > 0 && remainingGuardians.length === 0,
    };
  },
});

/**
 * Rollback migration (emergency use only)
 *
 * WARNING: Only works if guardianId fields still exist
 *
 * @param adminId - Must be admin role
 * @param dryRun - If true, reports what would change without modifying data
 */
export const rollbackMigration = mutation({
  args: {
    adminId: v.id("users"),
    dryRun: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Verify admin authorization
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Admin access required for rollback");
    }

    console.log("⚠️ Starting migration rollback", {
      adminId: args.adminId,
      dryRun: args.dryRun,
      timestamp: new Date().toISOString(),
    });

    const report = {
      providersDeleted: 0,
      studentsReverted: 0,
      classesReverted: 0,
      errors: [] as Array<{ error: string }>,
    };

    try {
      // Find all guardian providers
      const guardianProviders = await ctx.db
        .query("providers")
        .filter((q) => q.eq(q.field("category"), "guardian"))
        .collect();

      if (!args.dryRun) {
        // Delete guardian providers
        for (const provider of guardianProviders) {
          await ctx.db.delete(provider._id);
          report.providersDeleted++;
        }

        // Revert students (remove providerId, keep guardianId)
        const students = await ctx.db
          .query("students")
          .filter((q) => q.neq(q.field("providerId"), undefined))
          .collect();

        for (const student of students) {
          await ctx.db.patch(student._id, {
            providerId: undefined,
          });
          report.studentsReverted++;
        }

        // Revert classes (remove providerId, keep isGuardianLinked)
        const classes = await ctx.db
          .query("classes")
          .filter((q) => q.neq(q.field("providerId"), undefined))
          .collect();

        for (const classItem of classes) {
          await ctx.db.patch(classItem._id, {
            providerId: undefined,
          });
          report.classesReverted++;
        }
      } else {
        report.providersDeleted = guardianProviders.length;

        const students = await ctx.db
          .query("students")
          .filter((q) => q.neq(q.field("providerId"), undefined))
          .collect();
        report.studentsReverted = students.length;

        const classes = await ctx.db
          .query("classes")
          .filter((q) => q.neq(q.field("providerId"), undefined))
          .collect();
        report.classesReverted = classes.length;
      }

      console.log("✅ Rollback complete", report);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      report.errors.push({ error: errorMessage });
      console.error("❌ Rollback error", { error: errorMessage });
    }

    return report;
  },
});
