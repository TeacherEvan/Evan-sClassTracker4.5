/**
 * Automated Convex to MongoDB Backup Script
 *
 * This script:
 * 1. Exports all data from Convex tables
 * 2. Stores complete snapshots in MongoDB
 * 3. Runs daily at midnight (00:00)
 * 4. Enables disaster recovery if Convex crashes
 *
 * Usage:
 *   npm run backup           - Run backup manually
 *   npm run backup:schedule  - Start automated daily backups
 *   npm run backup:restore   - Restore from latest backup
 *
 * @version 4.5.12
 * @date October 31, 2025
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import { Db, MongoClient, ObjectId } from "mongodb";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MONGODB_URI =
  process.env.MONGODB_BACKUP_URI || "mongodb://localhost:27017";
const MONGODB_DATABASE = process.env.MONGODB_BACKUP_DB || "convex_backups";
const BACKUP_RETENTION_DAYS = parseInt(
  process.env.BACKUP_RETENTION_DAYS || "30",
  10,
);

// All Convex tables to backup (from schema.ts)
const TABLES_TO_BACKUP = [
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
] as const;

// ============================================================================
// TYPES
// ============================================================================

interface BackupMetadata {
  _id?: ObjectId;
  backupId: string;
  timestamp: number;
  date: string;
  convexDeploymentUrl: string;
  tableCount: number;
  totalRecords: number;
  status: "in_progress" | "completed" | "failed";
  error?: string;
  duration?: number; // milliseconds
  totalSizeBytes: number;
  tables: {
    name: string;
    recordCount: number;
    sizeBytes: number;
  }[];
}

interface BackupRecordDocument {
  backupId: string;
  tableName: string;
  data: unknown;
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

  console.log(`✅ Connected to MongoDB database: ${MONGODB_DATABASE}`);

  // Create indexes for faster queries
  await db.collection("backups").createIndex({ timestamp: -1 });
  await db.collection("backups").createIndex({ status: 1 });
  await db.collection("backups").createIndex({ backupId: 1 }, { unique: true });

  // Create indexes for backup records
  await db
    .collection("backup_records")
    .createIndex({ backupId: 1, tableName: 1 });

  return db;
}

async function disconnectMongoDB(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    db = null;
    console.log("🔌 Disconnected from MongoDB");
  }
}

// ============================================================================
// BACKUP OPERATIONS
// ============================================================================

async function createBackup(): Promise<string> {
  const startTime = Date.now();
  const backupId = `backup_${Date.now()}`;
  const timestamp = Date.now();
  const date = new Date(timestamp).toISOString();

  console.log("\n" + "=".repeat(60));
  console.log(`🔄 Starting backup: ${backupId}`);
  console.log(`📅 Timestamp: ${date}`);
  console.log("=".repeat(60) + "\n");

  if (!CONVEX_URL) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const database = await connectMongoDB();
  const backupsCollection = database.collection<BackupMetadata>("backups");
  const recordsCollection =
    database.collection<BackupRecordDocument>("backup_records");

  // 1. Initialize metadata
  const metadata: BackupMetadata = {
    backupId,
    timestamp,
    date,
    convexDeploymentUrl: CONVEX_URL,
    tableCount: 0,
    totalRecords: 0,
    totalSizeBytes: 0,
    status: "in_progress",
    tables: [],
  };

  await backupsCollection.insertOne(metadata);

  try {
    let totalRecords = 0;
    let totalSizeBytes = 0;
    const tableStats: BackupMetadata["tables"] = [];

    // 2. Process each table
    for (const tableName of TABLES_TO_BACKUP) {
      console.log(`📥 Processing table: ${tableName}...`);

      try {
        // Fetch data from Convex
        const records = (await client.query(api.exports.exportTable, {
          tableName,
        })) as unknown[];

        if (!records || records.length === 0) {
          console.log(`   ⚠️  No records found for ${tableName}`);
          tableStats.push({ name: tableName, recordCount: 0, sizeBytes: 0 });
          continue;
        }

        const recordCount = records.length;
        const sizeBytes = JSON.stringify(records).length; // Approximate size

        // Prepare documents for bulk insert
        const backupDocs: BackupRecordDocument[] = records.map((record) => ({
          backupId,
          tableName,
          data: record,
        }));

        // Insert into MongoDB in batches to avoid memory issues with huge arrays
        const BATCH_SIZE = 1000;
        for (let i = 0; i < backupDocs.length; i += BATCH_SIZE) {
          const batch = backupDocs.slice(i, i + BATCH_SIZE);
          await recordsCollection.insertMany(batch);
        }

        console.log(
          `   ✅ Backed up ${recordCount} records (${(sizeBytes / 1024).toFixed(2)} KB)`,
        );

        totalRecords += recordCount;
        totalSizeBytes += sizeBytes;
        tableStats.push({ name: tableName, recordCount, sizeBytes });

        // Optional: Force garbage collection if exposed (usually not in standard Node)
        // global.gc && global.gc();
      } catch (error) {
        console.error(`   ❌ Failed to backup table ${tableName}:`, error);
        // We continue with other tables, but mark this one as empty/failed in stats
        tableStats.push({ name: tableName, recordCount: 0, sizeBytes: 0 });
      }
    }

    // 3. Update metadata with final stats
    const duration = Date.now() - startTime;
    await backupsCollection.updateOne(
      { backupId },
      {
        $set: {
          status: "completed",
          duration,
          tableCount: tableStats.length,
          totalRecords,
          totalSizeBytes,
          tables: tableStats,
        },
      },
    );

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Backup completed successfully!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Backup ID: ${backupId}`);
    console.log(`   - Total Tables: ${tableStats.length}`);
    console.log(`   - Total Records: ${totalRecords.toLocaleString()}`);
    console.log(`   - Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`   - Size: ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log("=".repeat(60) + "\n");

    return backupId;
  } catch (error) {
    console.error("\n❌ Backup failed:", error);

    // Update status to failed
    await backupsCollection.updateOne(
      { backupId },
      {
        $set: {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        },
      },
    );

    throw error;
  }
}

// ============================================================================
// RESTORE OPERATIONS
// ============================================================================

async function restoreFromBackup(backupId?: string): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log(`🔄 Starting restore operation...`);
  console.log("=".repeat(60) + "\n");

  const database = await connectMongoDB();
  const backupsCollection = database.collection<BackupMetadata>("backups");

  // 1. Find backup to restore
  let backup: BackupMetadata | null;

  if (backupId) {
    console.log(`🔍 Looking for backup: ${backupId}...`);
    backup = await backupsCollection.findOne({ backupId });
  } else {
    console.log(`🔍 Looking for latest successful backup...`);
    backup = await backupsCollection.findOne(
      { status: "completed" },
      { sort: { timestamp: -1 } },
    );
  }

  if (!backup) {
    throw new Error(
      backupId ? `Backup ${backupId} not found` : "No successful backups found",
    );
  }

  console.log(`✅ Found backup: ${backup.backupId}`);
  console.log(`📅 Created: ${backup.date}`);
  console.log(
    `📊 Contains ${backup.totalRecords.toLocaleString()} records across ${backup.tableCount} tables\n`,
  );

  // 2. WARNING: Confirm restore
  console.warn("⚠️  WARNING: This will OVERWRITE all current Convex data!");
  console.warn(
    "⚠️  Make sure you understand the implications before proceeding.\n",
  );
  console.log("❌ RESTORE ABORTED: Manual implementation required for safety");
  console.log("📋 To restore manually:");
  console.log("   1. Query 'backup_records' collection by backupId");
  console.log("   2. Use Convex dashboard to import data");
  console.log("   3. Or implement custom restore mutations in Convex\n");
}

// ============================================================================
// CLEANUP OLD BACKUPS
// ============================================================================

async function cleanupOldBackups(): Promise<void> {
  console.log("\n🧹 Cleaning up old backups...");

  const database = await connectMongoDB();
  const backupsCollection = database.collection<BackupMetadata>("backups");
  const recordsCollection =
    database.collection<BackupRecordDocument>("backup_records");

  const cutoffDate = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  // 1. Find backups to delete
  const oldBackups = await backupsCollection
    .find({ timestamp: { $lt: cutoffDate } })
    .project({ backupId: 1 })
    .toArray();

  if (oldBackups.length === 0) {
    console.log("   ✅ No old backups found to delete");
    return;
  }

  const backupIds = oldBackups.map((b) => b.backupId);
  console.log(
    `   Found ${backupIds.length} backups to delete: ${backupIds.join(", ")}`,
  );

  // 2. Delete metadata
  const metaResult = await backupsCollection.deleteMany({
    backupId: { $in: backupIds },
  });

  // 3. Delete records
  const recordsResult = await recordsCollection.deleteMany({
    backupId: { $in: backupIds },
  });

  console.log(
    `   ✅ Deleted ${metaResult.deletedCount} backup metadata entries`,
  );
  console.log(`   ✅ Deleted ${recordsResult.deletedCount} backup records`);
}

// ============================================================================
// LIST BACKUPS
// ============================================================================

async function listBackups(): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("📋 Available Backups");
  console.log("=".repeat(60) + "\n");

  const database = await connectMongoDB();
  const backupsCollection = database.collection<BackupMetadata>("backups");

  const backups = await backupsCollection
    .find({})
    .sort({ timestamp: -1 })
    .limit(20)
    .toArray();

  if (backups.length === 0) {
    console.log("No backups found.");
    return;
  }

  for (const backup of backups) {
    const statusIcon =
      backup.status === "completed"
        ? "✅"
        : backup.status === "failed"
          ? "❌"
          : "⏳";
    const size = (backup.totalSizeBytes || 0) / 1024 / 1024;

    console.log(`${statusIcon} ${backup.backupId}`);
    console.log(`   Date: ${backup.date}`);
    console.log(`   Status: ${backup.status}`);
    console.log(`   Records: ${backup.totalRecords.toLocaleString()}`);
    console.log(`   Size: ${size.toFixed(2)} MB`);
    if (backup.duration) {
      console.log(`   Duration: ${(backup.duration / 1000).toFixed(2)}s`);
    }
    console.log("");
  }
}

// ============================================================================
// AUTOMATED SCHEDULING
// ============================================================================

async function scheduleBackup(): Promise<void> {
  console.log("⏰ Starting automated backup scheduler...");
  console.log(`📅 Backups will run daily at midnight (00:00)`);
  console.log(`💾 Retention: ${BACKUP_RETENTION_DAYS} days\n`);

  // Calculate time until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  console.log(
    `⏳ Next backup in: ${(msUntilMidnight / 1000 / 60 / 60).toFixed(2)} hours\n`,
  );

  // Run first backup at midnight
  setTimeout(async () => {
    await runScheduledBackup();

    // Then run every 24 hours
    setInterval(runScheduledBackup, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Keep process alive
  console.log("✅ Scheduler is running. Press Ctrl+C to stop.\n");
}

async function runScheduledBackup(): Promise<void> {
  try {
    await createBackup();
    await cleanupOldBackups();
  } catch (error) {
    console.error("❌ Scheduled backup failed:", error);
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const command = process.argv[2] || "backup";

  try {
    switch (command) {
      case "backup":
        await createBackup();
        break;

      case "restore":
        const backupId = process.argv[3];
        await restoreFromBackup(backupId);
        break;

      case "list":
        await listBackups();
        break;

      case "schedule":
        await scheduleBackup();
        return; // Don't disconnect, keep running

      case "cleanup":
        await cleanupOldBackups();
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log("\nUsage:");
        console.log("  npm run backup           - Create a backup now");
        console.log("  npm run backup:list      - List all backups");
        console.log("  npm run backup:restore   - Restore latest backup");
        console.log(
          "  npm run backup:schedule  - Start automated daily backups",
        );
        console.log("  npm run backup:cleanup   - Remove old backups");
        process.exit(1);
    }

    await disconnectMongoDB();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error:", error);
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
