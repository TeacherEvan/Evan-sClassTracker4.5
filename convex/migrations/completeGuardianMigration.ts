/**
 * Complete Guardian to Provider Migration Script
 * 
 * This script performs a comprehensive migration from guardian system to provider system:
 * 1. Converts all guardian users to provider entities
 * 2. Creates '{Teacher'sPVTclass}' pseudo-provider for self-reference students
 * 3. Migrates all students with guardian relationships
 * 4. Migrates all classes with isGuardianLinked flag
 * 5. Handles self-reference students (no schoolId, no providerId)
 * 
 * IMPORTANT: 
 * - Run in dry-run mode first to preview changes
 * - Backup database before running actual migration
 * - Deprecated fields are NOT removed (kept for rollback safety)
 * 
 * @see docs/migrations/GUARDIAN_TO_PROVIDER_MIGRATION_PLAN.md
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Constants
const PSEUDO_PROVIDER_NAME = "{Teacher'sPVTclass}";
const PSEUDO_PROVIDER_NAME_TH = "{คลาสส่วนตัวของครู}";

/**
 * Preview migration - shows what will be migrated
 * Safe to run anytime, no modifications
 */
export const previewMigration = query({
  args: {},
  handler: async (ctx) => {
    // 1. Count guardian users
    const guardianUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();

    // 2. Count students linked to guardians (by guardianId)
    const allStudents = await ctx.db.query("students").collect();
    const studentsWithGuardianId = allStudents.filter(s => s.guardianId !== undefined);
    
    // 3. Count self-reference students (no schoolId, no providerId, no guardianId)
    const selfReferenceStudents = allStudents.filter(
      s => !s.schoolId && !s.providerId && !s.guardianId
    );
    
    // 4. Count classes with isGuardianLinked
    const allClasses = await ctx.db.query("classes").collect();
    const guardianLinkedClasses = allClasses.filter(c => c.isGuardianLinked === true);
    
    // 5. Count classes for self-reference students (no schoolId, no providerId)
    const selfReferenceClasses = allClasses.filter(
      c => !c.schoolId && !c.providerId
    );

    // 6. Group self-reference students by teacher
    const selfRefByTeacher = new Map<string, { teacherId: Id<"users">; students: typeof selfReferenceStudents }>();
    for (const student of selfReferenceStudents) {
      if (student.createdBy) {
        const key = student.createdBy;
        if (!selfRefByTeacher.has(key)) {
          selfRefByTeacher.set(key, { teacherId: key, students: [] });
        }
        selfRefByTeacher.get(key)!.students.push(student);
      }
    }

    return {
      summary: {
        guardianUsers: guardianUsers.length,
        studentsWithGuardianId: studentsWithGuardianId.length,
        selfReferenceStudents: selfReferenceStudents.length,
        guardianLinkedClasses: guardianLinkedClasses.length,
        selfReferenceClasses: selfReferenceClasses.length,
        teachersNeedingPseudoProvider: selfRefByTeacher.size,
      },
      details: {
        guardianUsers: guardianUsers.map(u => ({
          id: u._id,
          username: u.username,
        })),
        selfReferenceStudentsByTeacher: Array.from(selfRefByTeacher.values()).map(entry => ({
          teacherId: entry.teacherId,
          studentCount: entry.students.length,
          studentIds: entry.students.map(s => s._id),
        })),
      },
      message: `Migration will:\n` +
        `- Create ${guardianUsers.length} provider entities from guardian users\n` +
        `- Create pseudo-providers for ${selfRefByTeacher.size} teachers with self-reference students\n` +
        `- Update ${studentsWithGuardianId.length} students with guardian links\n` +
        `- Update ${selfReferenceStudents.length} self-reference students\n` +
        `- Update ${guardianLinkedClasses.length + selfReferenceClasses.length} classes`,
    };
  },
});

/**
 * Main migration function
 * 
 * @param adminId - Must be admin role
 * @param dryRun - If true, preview without making changes
 * @returns Detailed migration report
 */
export const migrateToProvider = mutation({
  args: {
    adminId: v.id("users"),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? true; // Default to dry run for safety
    
    // 1. Verify admin authorization
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can run migrations");
    }

    console.log(`🚀 Starting complete guardian migration (${dryRun ? 'DRY RUN' : 'LIVE'})`, {
      adminId: args.adminId,
      adminUsername: admin.username,
      timestamp: new Date().toISOString(),
    });

    const report = {
      dryRun,
      timestamp: new Date().toISOString(),
      guardianMigration: {
        usersProcessed: 0,
        providersCreated: 0,
        studentsUpdated: 0,
        classesUpdated: 0,
        errors: [] as Array<{ guardianId: string; username: string; error: string }>,
      },
      pseudoProviderMigration: {
        teachersProcessed: 0,
        pseudoProvidersCreated: 0,
        studentsUpdated: 0,
        classesUpdated: 0,
        errors: [] as Array<{ teacherId: string; error: string }>,
      },
      summary: "",
    };

    // ============================================================
    // PHASE 1: Migrate Guardian Users to Provider Entities
    // ============================================================
    console.log("📋 PHASE 1: Migrating guardian users to providers...");
    
    const guardianUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();
    
    report.guardianMigration.usersProcessed = guardianUsers.length;

    for (const guardian of guardianUsers) {
      try {
        let providerId: Id<"providers"> | undefined;
        
        if (!dryRun) {
          // Create provider entity for this guardian
          providerId = await ctx.db.insert("providers", {
            name: `Guardian - ${guardian.username}`,
            nameTh: `ผู้ปกครอง - ${guardian.username}`,
            category: "guardian",
            createdBy: args.adminId,
            isActive: true,
            createdAt: Date.now(),
            isAutoGenerated: false, // Migrated from existing guardian user
          });
          report.guardianMigration.providersCreated++;
        }

        // Find and update students linked to this guardian
        const students = await ctx.db
          .query("students")
          .withIndex("by_guardian_id", (q) => q.eq("guardianId", guardian._id))
          .collect();

        for (const student of students) {
          if (!dryRun && providerId) {
            await ctx.db.patch(student._id, {
              providerId,
              // Keep guardianId for rollback safety
            });
          }
          report.guardianMigration.studentsUpdated++;
        }

        // Find and update classes for these students
        for (const student of students) {
          const classes = await ctx.db
            .query("classes")
            .withIndex("by_student", (q) => q.eq("studentId", student._id))
            .filter((q) => q.eq(q.field("isGuardianLinked"), true))
            .collect();

          for (const classItem of classes) {
            if (!dryRun && providerId) {
              await ctx.db.patch(classItem._id, {
                providerId,
                // Keep isGuardianLinked for rollback safety
              });
            }
            report.guardianMigration.classesUpdated++;
          }
        }

        console.log(`✅ Processed guardian: ${guardian.username}`, {
          studentsUpdated: students.length,
          dryRun,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        report.guardianMigration.errors.push({
          guardianId: guardian._id,
          username: guardian.username,
          error: errorMsg,
        });
        console.error(`❌ Error processing guardian ${guardian.username}:`, errorMsg);
      }
    }

    // ============================================================
    // PHASE 2: Create Pseudo-Providers for Self-Reference Students
    // ============================================================
    console.log("📋 PHASE 2: Creating pseudo-providers for self-reference students...");
    
    // Find all students without schoolId, providerId, or guardianId
    const allStudents = await ctx.db.query("students").collect();
    const selfReferenceStudents = allStudents.filter(
      s => !s.schoolId && !s.providerId && !s.guardianId && s.createdBy
    );
    
    // Group by teacher (createdBy)
    const studentsByTeacher = new Map<Id<"users">, typeof selfReferenceStudents>();
    for (const student of selfReferenceStudents) {
      const teacherId = student.createdBy!;
      if (!studentsByTeacher.has(teacherId)) {
        studentsByTeacher.set(teacherId, []);
      }
      studentsByTeacher.get(teacherId)!.push(student);
    }

    report.pseudoProviderMigration.teachersProcessed = studentsByTeacher.size;

    // Create pseudo-provider for each teacher with self-reference students
    for (const [teacherId, students] of Array.from(studentsByTeacher.entries())) {
      try {
        const teacher = await ctx.db.get(teacherId);
        if (!teacher) {
          throw new Error(`Teacher ${teacherId} not found`);
        }
        
        // Type guard to ensure teacher is a user
        if (!('username' in teacher)) {
          throw new Error(`Record ${teacherId} is not a user`);
        }

        let pseudoProviderId: Id<"providers"> | undefined;
        
        if (!dryRun) {
          // Check if pseudo-provider already exists for this teacher
          const existingPseudoProvider = await ctx.db
            .query("providers")
            .withIndex("by_created_by", (q) => q.eq("createdBy", teacherId))
            .filter((q) => q.eq(q.field("name"), PSEUDO_PROVIDER_NAME))
            .first();

          if (existingPseudoProvider) {
            pseudoProviderId = existingPseudoProvider._id;
            console.log(`♻️ Using existing pseudo-provider for ${teacher.username}`);
          } else {
            // Create new pseudo-provider
            pseudoProviderId = await ctx.db.insert("providers", {
              name: PSEUDO_PROVIDER_NAME,
              nameTh: PSEUDO_PROVIDER_NAME_TH,
              category: "personal", // Self-reference students are personal
              createdBy: teacherId,
              isActive: true,
              createdAt: Date.now(),
              isAutoGenerated: true, // Mark as auto-generated
            });
            report.pseudoProviderMigration.pseudoProvidersCreated++;
            console.log(`✅ Created pseudo-provider for ${teacher.username}`);
          }
        }

        // Update students to link to pseudo-provider
        for (const student of students) {
          if (!dryRun && pseudoProviderId) {
            await ctx.db.patch(student._id, {
              providerId: pseudoProviderId,
            });
          }
          report.pseudoProviderMigration.studentsUpdated++;
        }

        // Update classes for these students
        for (const student of students) {
          const classes = await ctx.db
            .query("classes")
            .withIndex("by_student", (q) => q.eq("studentId", student._id))
            .filter((q) => 
              q.and(
                q.eq(q.field("schoolId"), undefined),
                q.eq(q.field("providerId"), undefined)
              )
            )
            .collect();

          for (const classItem of classes) {
            if (!dryRun && pseudoProviderId) {
              await ctx.db.patch(classItem._id, {
                providerId: pseudoProviderId,
              });
            }
            report.pseudoProviderMigration.classesUpdated++;
          }
        }

        console.log(`✅ Processed teacher ${teacher.username}:`, {
          studentsUpdated: students.length,
          dryRun,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        report.pseudoProviderMigration.errors.push({
          teacherId: teacherId,
          error: errorMsg,
        });
        console.error(`❌ Error processing teacher ${teacherId}:`, errorMsg);
      }
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    const totalErrors = 
      report.guardianMigration.errors.length +
      report.pseudoProviderMigration.errors.length;

    report.summary = 
      `Migration ${dryRun ? 'preview' : 'completed'} at ${new Date().toISOString()}\n\n` +
      `Guardian Migration:\n` +
      `- Processed ${report.guardianMigration.usersProcessed} guardian users\n` +
      `- Created ${report.guardianMigration.providersCreated} provider entities\n` +
      `- Updated ${report.guardianMigration.studentsUpdated} students\n` +
      `- Updated ${report.guardianMigration.classesUpdated} classes\n` +
      `- Errors: ${report.guardianMigration.errors.length}\n\n` +
      `Pseudo-Provider Migration:\n` +
      `- Processed ${report.pseudoProviderMigration.teachersProcessed} teachers\n` +
      `- Created ${report.pseudoProviderMigration.pseudoProvidersCreated} pseudo-providers\n` +
      `- Updated ${report.pseudoProviderMigration.studentsUpdated} students\n` +
      `- Updated ${report.pseudoProviderMigration.classesUpdated} classes\n` +
      `- Errors: ${report.pseudoProviderMigration.errors.length}\n\n` +
      `Total Errors: ${totalErrors}`;

    console.log("\n" + "=".repeat(60));
    console.log(report.summary);
    console.log("=".repeat(60) + "\n");

    if (dryRun) {
      console.log("⚠️ DRY RUN MODE - No changes were made");
      console.log("💡 Run with dryRun: false to apply changes");
    } else {
      console.log("✅ MIGRATION COMPLETE");
      console.log("⚠️ Deprecated fields (guardianId, isGuardianLinked) kept for rollback");
      console.log("💡 Use verifyMigration query to check results");
    }

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
    // 1. Count remaining guardian users
    const remainingGuardians = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "guardian"))
      .collect();

    // 2. Count provider entities (guardian category)
    const guardianProviders = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("category"), "guardian"))
      .collect();

    // 3. Count pseudo-providers
    const pseudoProviders = await ctx.db
      .query("providers")
      .filter((q) => q.eq(q.field("name"), PSEUDO_PROVIDER_NAME))
      .collect();

    // 4. Count students with providerId
    const allStudents = await ctx.db.query("students").collect();
    const studentsWithProvider = allStudents.filter(s => s.providerId !== undefined);
    const studentsWithoutProvider = allStudents.filter(
      s => !s.schoolId && !s.providerId && !s.guardianId
    );

    // 5. Count classes with providerId
    const allClasses = await ctx.db.query("classes").collect();
    const classesWithProvider = allClasses.filter(c => c.providerId !== undefined);
    const classesWithoutProvider = allClasses.filter(
      c => !c.schoolId && !c.providerId
    );

    // 6. Count legacy fields still in use
    const studentsWithGuardianId = allStudents.filter(s => s.guardianId !== undefined);
    const classesWithGuardianLinked = allClasses.filter(c => c.isGuardianLinked === true);

    const migrationComplete = 
      remainingGuardians.length === 0 &&
      studentsWithoutProvider.length === 0 &&
      classesWithoutProvider.length === 0;

    return {
      migrationStatus: migrationComplete ? "✅ COMPLETE" : "⚠️ INCOMPLETE",
      counts: {
        remainingGuardianUsers: remainingGuardians.length,
        guardianProviders: guardianProviders.length,
        pseudoProviders: pseudoProviders.length,
        studentsWithProvider: studentsWithProvider.length,
        studentsWithoutProvider: studentsWithoutProvider.length,
        classesWithProvider: classesWithProvider.length,
        classesWithoutProvider: classesWithoutProvider.length,
        studentsStillWithGuardianId: studentsWithGuardianId.length,
        classesStillWithGuardianLinked: classesWithGuardianLinked.length,
      },
      recommendations: migrationComplete
        ? [
            "✅ Migration appears successful",
            "💡 Review legacy fields: guardianId, isGuardianLinked can be removed",
            "💡 Consider removing guardian role from schema after testing",
          ]
        : [
            `⚠️ ${remainingGuardians.length} guardian users still exist`,
            `⚠️ ${studentsWithoutProvider.length} students need provider assignment`,
            `⚠️ ${classesWithoutProvider.length} classes need provider assignment`,
            "💡 Run migration again or investigate errors",
          ],
      migrationComplete,
    };
  },
});

/**
 * Rollback migration (emergency use only)
 * 
 * WARNING: Only works if legacy fields (guardianId, isGuardianLinked) still exist
 * 
 * @param adminId - Must be admin role
 * @param dryRun - If true, preview without making changes
 */
export const rollbackMigration = mutation({
  args: {
    adminId: v.id("users"),
    dryRun: v.optional(v.boolean()),
    confirm: v.boolean(), // Must be true to execute
  },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Rollback not confirmed - set confirm: true to proceed");
    }

    const dryRun = args.dryRun ?? true;

    // Verify admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can run rollback");
    }

    console.log(`⚠️ Starting migration rollback (${dryRun ? 'DRY RUN' : 'LIVE'})...`);

    const report = {
      dryRun,
      providersDeleted: 0,
      studentsReverted: 0,
      classesReverted: 0,
      errors: [] as Array<{ error: string }>,
    };

    try {
      // 1. Find all guardian providers (including pseudo-providers)
      const guardianProviders = await ctx.db
        .query("providers")
        .filter((q) => q.eq(q.field("category"), "guardian"))
        .collect();
      
      const pseudoProviders = await ctx.db
        .query("providers")
        .filter((q) => q.eq(q.field("name"), PSEUDO_PROVIDER_NAME))
        .collect();

      const allMigrationProviders = [...guardianProviders, ...pseudoProviders];

      if (!dryRun) {
        // 2. Delete all migration-created providers
        for (const provider of allMigrationProviders) {
          await ctx.db.delete(provider._id);
          report.providersDeleted++;
        }
      } else {
        report.providersDeleted = allMigrationProviders.length;
      }

      // 3. Revert students (clear providerId where guardianId exists)
      const students = await ctx.db.query("students").collect();
      const studentsToRevert = students.filter(s => s.providerId && s.guardianId);

      for (const student of studentsToRevert) {
        if (!dryRun) {
          await ctx.db.patch(student._id, {
            providerId: undefined,
          });
        }
        report.studentsReverted++;
      }

      // 4. Revert classes (clear providerId where isGuardianLinked exists)
      const classes = await ctx.db.query("classes").collect();
      const classesToRevert = classes.filter(c => c.providerId && c.isGuardianLinked);

      for (const classItem of classesToRevert) {
        if (!dryRun) {
          await ctx.db.patch(classItem._id, {
            providerId: undefined,
          });
        }
        report.classesReverted++;
      }

      console.log("✅ Rollback complete:", report);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      report.errors.push({ error: errorMsg });
      console.error("❌ Rollback error:", errorMsg);
    }

    return report;
  },
});
