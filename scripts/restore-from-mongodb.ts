/**
 * MongoDB to Convex Restore Script
 *
 * This script restores Convex data from MongoDB backups.
 *
 * ⚠️ WARNING: This will OVERWRITE all current Convex data!
 *
 * Usage:
 *   npm run backup:restore           - Restore from latest backup
 *   npm run backup:restore <id>      - Restore from specific backup
 *
 * @version 1.0.0
 * @date November 3, 2025
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import { Collection, Db, MongoClient } from "mongodb";
import * as readline from "readline";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MONGODB_URI =
  process.env.MONGODB_BACKUP_URI || "mongodb://localhost:27017";
const MONGODB_DATABASE = process.env.MONGODB_BACKUP_DB || "convex_backups";

interface BackupMetadata {
  backupId: string;
  timestamp: number;
  date: string;
  convexDeploymentUrl: string;
  tableCount: number;
  totalRecords: number;
  status: "in_progress" | "completed" | "failed";
  error?: string;
  duration?: number;
  tables: {
    name: string;
    recordCount: number;
    sizeBytes?: number;
  }[];
}

interface BackupDocument {
  _id?: unknown;
  metadata: BackupMetadata;
  data: {
    [tableName: string]: unknown[];
  };
}

// ============================================================================
// MONGODB CONNECTION
// ============================================================================

let mongoClient: MongoClient | null = null;
let db: Db | null = null;

async function connectMongoDB(): Promise<Db> {
  if (db) return db;

  console.log(`📡 Connecting to MongoDB at ${MONGODB_URI}...`);
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  db = mongoClient.db(MONGODB_DATABASE);
  console.log(`✅ Connected to MongoDB database: ${MONGODB_DATABASE}\n`);

  return db;
}

async function disconnectMongoDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// ============================================================================
// USER CONFIRMATION
// ============================================================================

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ============================================================================
// RESTORE OPERATIONS
// ============================================================================

async function restoreFromBackup(backupId?: string): Promise<void> {
  console.log("\n" + "=".repeat(70));
  console.log("🔄 CONVEX DATA RESTORE FROM MONGODB");
  console.log("=".repeat(70) + "\n");

  if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  }

  const database = await connectMongoDB();
  const backupsCollection: Collection<BackupDocument> =
    database.collection("backups");

  // ============================================================================
  // STEP 1: Find backup to restore
  // ============================================================================

  console.log("📋 STEP 1: Finding backup...\n");

  let backup: BackupDocument | null;

  if (backupId) {
    console.log(`🔍 Looking for backup: ${backupId}...`);
    backup = await backupsCollection.findOne({ "metadata.backupId": backupId });
  } else {
    console.log(`🔍 Looking for latest successful backup...`);
    backup = await backupsCollection.findOne(
      { "metadata.status": "completed" },
      { sort: { "metadata.timestamp": -1 } },
    );
  }

  if (!backup) {
    throw new Error(
      backupId ? `Backup ${backupId} not found` : "No successful backups found",
    );
  }

  // ============================================================================
  // STEP 2: Display backup information
  // ============================================================================

  console.log("✅ Found backup:\n");
  console.log(`   Backup ID:    ${backup.metadata.backupId}`);
  console.log(`   Created:      ${backup.metadata.date}`);
  console.log(`   Status:       ${backup.metadata.status}`);
  console.log(`   Tables:       ${backup.metadata.tableCount}`);
  console.log(
    `   Total Records: ${backup.metadata.totalRecords.toLocaleString()}`,
  );
  console.log(`   Source:       ${backup.metadata.convexDeploymentUrl}`);
  console.log(`   Target:       ${CONVEX_URL}`);
  console.log("");

  console.log("📊 Tables in backup:");
  for (const table of backup.metadata.tables) {
    const size = table.sizeBytes
      ? `(${(table.sizeBytes / 1024).toFixed(1)} KB)`
      : "";
    console.log(
      `   - ${table.name}: ${table.recordCount.toLocaleString()} records ${size}`,
    );
  }
  console.log("");

  // ============================================================================
  // STEP 3: WARNING and confirmation
  // ============================================================================

  console.log("⚠️  WARNING! WARNING! WARNING! ⚠️\n");
  console.log("This operation will:");
  console.log("  1. DELETE ALL existing data in your Convex database");
  console.log("  2. REPLACE it with data from the backup");
  console.log("  3. This action CANNOT be undone!");
  console.log("");
  console.log("Current Convex deployment: " + CONVEX_URL);
  console.log("");

  const answer1 = await askQuestion(
    "Type 'YES' in ALL CAPS to proceed with restore: ",
  );

  if (answer1 !== "YES") {
    console.log("\n❌ Restore cancelled. No changes were made.");
    return;
  }

  const answer2 = await askQuestion(
    "\nAre you ABSOLUTELY sure? Type 'RESTORE' in ALL CAPS: ",
  );

  if (answer2 !== "RESTORE") {
    console.log("\n❌ Restore cancelled. No changes were made.");
    return;
  }

  console.log("\n✅ Confirmation received. Starting restore...\n");

  // ============================================================================
  // STEP 4: Connect to Convex and restore data
  // ============================================================================

  console.log("📡 Connecting to Convex...");
  const client = new ConvexHttpClient(CONVEX_URL);

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  console.log("\n" + "=".repeat(70));
  console.log("🔄 RESTORING DATA (Batch Processing)");
  console.log("=".repeat(70) + "\n");

  const BATCH_SIZE = 25; // Process 25 records at a time to stay under 1MB limit

  // Tables that need to be restored in a specific order due to dependencies
  const orderedTables = [
    "users", // First - referenced by many tables
    "schools", // Second - referenced by users, classes, etc.
    "providers", // Third - referenced by classes, students
    "locations", // Referenced by classes
    "students", // Referenced by classes
    "teacherResources",
    "classes", // After students and schools
    "postClassNotes", // After classes
    "teacherClassCountCycles",
    "messages",
    "notifications",
    "notificationWindows",
    "appUpdates",
    "adminContactRequests",
    "errorReports",
    "auditLogs",
    "teacherLogs",
    "sangsomEvents",
    "sangsomDeletedStudents",
  ];

  for (const tableName of orderedTables) {
    const tableData = backup.data[tableName];

    if (!tableData) {
      console.log(`⏭️  Skipping ${tableName} (not in backup)`);
      continue;
    }

    try {
      console.log(`\n🔄 Restoring ${tableName}...`);
      console.log(`   Records to restore: ${tableData.length}`);

      if (tableData.length === 0) {
        console.log(`   ✅ ${tableName} - empty, skipped`);
        continue;
      }

      // Process in batches to avoid Convex 1MB argument limit
      const batches = [];
      for (let i = 0; i < tableData.length; i += BATCH_SIZE) {
        batches.push(tableData.slice(i, i + BATCH_SIZE));
      }

      console.log(
        `   Processing ${batches.length} batches of ${BATCH_SIZE} records...`,
      );

      let totalInserted = 0;
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const isFirstBatch = batchIndex === 0;

        try {
          const result = await client.mutation(
            api.restore.restoreTableBatch,  
            {
              tableName,
              records: batch,
              isFirstBatch,
            },
          );

          totalInserted += result.insertedCount || batch.length;

          // Progress indicator
          if ((batchIndex + 1) % 5 === 0 || batchIndex === batches.length - 1) {
            console.log(
              `   Progress: ${batchIndex + 1}/${batches.length} batches (${totalInserted} records)`,
            );
          }
        } catch (batchError) {
          console.error(`   ❌ Batch ${batchIndex + 1} failed:`, batchError);
          throw batchError; // Fail the whole table if a batch fails
        }
      }

      console.log(`   ✅ ${tableName} - restored ${totalInserted} records`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ ${tableName} - FAILED:`, error);
      errors.push(
        `${tableName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      errorCount++;
    }
  }

  // ============================================================================
  // STEP 5: Summary
  // ============================================================================

  const duration = Date.now() - startTime;

  console.log("\n" + "=".repeat(70));
  console.log("📊 RESTORE SUMMARY");
  console.log("=".repeat(70) + "\n");
  console.log(`✅ Successful tables: ${successCount}`);
  console.log(`❌ Failed tables:     ${errorCount}`);
  console.log(`⏱️  Duration:          ${(duration / 1000).toFixed(2)}s`);
  console.log(`📅 Backup date:       ${backup.metadata.date}`);
  console.log(`🆔 Backup ID:         ${backup.metadata.backupId}`);

  if (errors.length > 0) {
    console.log("\n⚠️  Errors encountered:");
    errors.forEach((err) => console.log(`   - ${err}`));
    console.log(
      "\n⚠️  WARNING: Restore completed with errors. Some data may be missing!",
    );
  } else {
    console.log("\n🎉 Restore completed successfully!");
  }

  console.log("\n" + "=".repeat(70));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const backupId = process.argv[2];

  try {
    await restoreFromBackup(backupId);
    await disconnectMongoDB();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Restore failed:", error);
    await disconnectMongoDB();
    process.exit(1);
  }
}

// ============================================================================
// RUN
// ============================================================================

if (require.main === module) {
  main();
}
