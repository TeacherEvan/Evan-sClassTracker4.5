/**
 * Convex Restore Mutations
 *
 * Used by restore-from-mongodb.ts script to restore data from backups.
 *
 * ⚠️ ADMIN ONLY - These mutations can delete and restore all data
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";

// ============================================================================
// RESTORE TABLE MUTATION (Batch Processing)
// ============================================================================

export const restoreTableBatch = mutation({
  args: {
    tableName: v.string(),
    records: v.any(), // Small batch of records (max 50 at a time)
    isFirstBatch: v.optional(v.boolean()), // If true, clears table first
  },
  handler: async (ctx, args) => {
    const { tableName, records, isFirstBatch } = args;

    console.log(
      `🔄 Restoring table batch: ${tableName} with ${records.length} records`,
    );

    // Validate table name
    const validTables = [
      "users",
      "schools",
      "providers",
      "classes",
      "students",
      "locations",
      "teacherResources",
      "messages",
      "notifications",
      "notificationWindows",
      "appUpdates",
      "postClassNotes",
      "teacherClassCountCycles",
      "adminContactRequests",
      "errorReports",
      "auditLogs",
      "teacherLogs",
      "sangsomEvents",
      "sangsomDeletedStudents",
    ];

    if (!validTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    // ========================================================================
    // STEP 1: Delete all existing records ONLY on first batch
    // ========================================================================

    if (isFirstBatch) {
      console.log(`🗑️  Deleting existing records in ${tableName}...`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingRecords = await ctx.db.query(tableName as any).collect();
      console.log(
        `   Found ${existingRecords.length} existing records to delete`,
      );

      for (const record of existingRecords) {
        await ctx.db.delete(record._id);
      }

      console.log(`   ✅ Deleted ${existingRecords.length} records`);
    }

    // ========================================================================
    // STEP 2: Insert records from backup
    // ========================================================================

    console.log(`📥 Inserting ${records.length} records into ${tableName}...`);

    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];

        // Remove MongoDB-specific fields and Convex internal fields
        const cleanRecord = { ...record };
        delete cleanRecord._id;
        delete cleanRecord._creationTime;

        // Insert the record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.insert(tableName as any, cleanRecord);
        insertedCount++;
      } catch (error) {
        const errorMsg = `Record ${i}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`   ✅ Inserted ${insertedCount}/${records.length} records`);

    if (errors.length > 0) {
      console.warn(`   ⚠️  ${errors.length} errors occurred during restore`);
      console.warn(`   First 5 errors:`, errors.slice(0, 5));
    }

    return {
      tableName,
      totalRecords: records.length,
      insertedCount,
      errorCount: errors.length,
      success: insertedCount > 0,
    };
  },
});

// Legacy mutation kept for compatibility
export const restoreTable = mutation({
  args: {
    tableName: v.string(),
    records: v.any(), // Array of records to restore
  },
  handler: async (ctx, args) => {
    const { tableName, records } = args;

    console.log(
      `🔄 Restoring table: ${tableName} with ${records.length} records`,
    );

    // Validate table name
    const validTables = [
      "users",
      "schools",
      "providers",
      "classes",
      "students",
      "locations",
      "teacherResources",
      "messages",
      "notifications",
      "notificationWindows",
      "appUpdates",
      "postClassNotes",
      "teacherClassCountCycles",
      "adminContactRequests",
      "errorReports",
      "auditLogs",
      "teacherLogs",
      "sangsomEvents",
      "sangsomDeletedStudents",
    ];

    if (!validTables.includes(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }

    // ========================================================================
    // STEP 1: Delete all existing records in the table
    // ========================================================================

    console.log(`🗑️  Deleting existing records in ${tableName}...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingRecords = await ctx.db.query(tableName as any).collect();
    console.log(
      `   Found ${existingRecords.length} existing records to delete`,
    );

    for (const record of existingRecords) {
      await ctx.db.delete(record._id);
    }

    console.log(`   ✅ Deleted ${existingRecords.length} records`);

    // ========================================================================
    // STEP 2: Insert records from backup
    // ========================================================================

    console.log(`📥 Inserting ${records.length} records into ${tableName}...`);

    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];

        // Remove MongoDB-specific fields and Convex internal fields
        const cleanRecord = { ...record };
        delete cleanRecord._id;
        delete cleanRecord._creationTime;

        // Insert the record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await ctx.db.insert(tableName as any, cleanRecord);
        insertedCount++;

        // Progress logging every 100 records
        if ((i + 1) % 100 === 0) {
          console.log(
            `   Progress: ${i + 1}/${records.length} records inserted`,
          );
        }
      } catch (error) {
        const errorMsg = `Record ${i}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    console.log(`   ✅ Inserted ${insertedCount}/${records.length} records`);

    if (errors.length > 0) {
      console.warn(`   ⚠️  ${errors.length} errors occurred during restore`);
      console.warn(`   First 5 errors:`, errors.slice(0, 5));
    }

    return {
      tableName,
      totalRecords: records.length,
      insertedCount,
      errorCount: errors.length,
      success: insertedCount > 0,
    };
  },
});

// ============================================================================
// CLEAR ALL TABLES (Emergency use only)
// ============================================================================

export const clearAllTables = mutation({
  args: {
    confirmationCode: v.string(), // Must be "DELETE_ALL_DATA_CONFIRMED"
  },
  handler: async (ctx, args) => {
    if (args.confirmationCode !== "DELETE_ALL_DATA_CONFIRMED") {
      throw new Error("Invalid confirmation code");
    }

    console.log("🗑️  CLEARING ALL TABLES - THIS CANNOT BE UNDONE!");

    const tables = [
      "users",
      "schools",
      "providers",
      "classes",
      "students",
      "locations",
      "teacherResources",
      "messages",
      "notifications",
      "notificationWindows",
      "appUpdates",
      "postClassNotes",
      "teacherClassCountCycles",
      "adminContactRequests",
      "errorReports",
      "auditLogs",
      "teacherLogs",
      "sangsomEvents",
      "sangsomDeletedStudents",
    ];

    let totalDeleted = 0;

    for (const tableName of tables) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const records = await ctx.db.query(tableName as any).collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      console.log(
        `   ✅ Cleared ${tableName}: ${records.length} records deleted`,
      );
      totalDeleted += records.length;
    }

    console.log(`   ✅ Total records deleted: ${totalDeleted}`);

    return {
      success: true,
      totalDeleted,
      clearedTables: tables.length,
    };
  },
});
