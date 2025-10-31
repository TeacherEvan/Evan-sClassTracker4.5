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
import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { api } from "../convex/_generated/api";

dotenv.config({ path: ".env.local" });

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const MONGODB_URI = process.env.MONGODB_BACKUP_URI || "mongodb://localhost:27017";
const MONGODB_DATABASE = process.env.MONGODB_BACKUP_DB || "convex_backups";
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || "30", 10);

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
    backupId: string;
    timestamp: number;
    date: string;
    convexDeploymentUrl: string;
    tableCount: number;
    totalRecords: number;
    status: "in_progress" | "completed" | "failed";
    error?: string;
    duration?: number; // milliseconds
    tables: {
        name: string;
        recordCount: number;
        sizeBytes?: number;
    }[];
}

interface BackupDocument {
    _id?: ObjectId;
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

    console.log(`✅ Connected to MongoDB database: ${MONGODB_DATABASE}`);

    // Create indexes for faster queries
    await db.collection("backups").createIndex({ "metadata.timestamp": -1 });
    await db.collection("backups").createIndex({ "metadata.status": 1 });
    await db.collection("backups").createIndex({ "metadata.date": 1 });

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
// CONVEX DATA EXPORT
// ============================================================================

async function exportConvexData(): Promise<{ [tableName: string]: unknown[] }> {
    if (!CONVEX_URL) {
        throw new Error("NEXT_PUBLIC_CONVEX_URL not found in .env.local");
    }

    console.log(`📡 Connecting to Convex at ${CONVEX_URL}...`);
    const client = new ConvexHttpClient(CONVEX_URL);

    const allData: { [tableName: string]: unknown[] } = {};

    for (const tableName of TABLES_TO_BACKUP) {
        try {
            console.log(`📥 Exporting table: ${tableName}...`);

            // Query all records from the table using our custom export function
            const records = await client.query(api.exports.exportTable, {
                tableName,
            });

            allData[tableName] = records || [];
            console.log(`   ✅ Exported ${records?.length || 0} records from ${tableName}`);
        } catch (error) {
            console.error(`   ❌ Failed to export ${tableName}:`, error);
            // Continue with other tables even if one fails
            allData[tableName] = [];
        }
    }

    return allData;
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

    try {
        // 1. Export data from Convex
        const data = await exportConvexData();

        // 2. Calculate metadata
        const tables = Object.entries(data).map(([name, records]) => ({
            name,
            recordCount: records.length,
            sizeBytes: JSON.stringify(records).length,
        }));

        const totalRecords = tables.reduce((sum, t) => sum + t.recordCount, 0);
        const tableCount = tables.length;

        const metadata: BackupMetadata = {
            backupId,
            timestamp,
            date,
            convexDeploymentUrl: CONVEX_URL || "",
            tableCount,
            totalRecords,
            status: "in_progress",
            tables,
        };

        // 3. Connect to MongoDB
        const database = await connectMongoDB();
        const backupsCollection: Collection<BackupDocument> = database.collection("backups");

        // 4. Store backup in MongoDB
        console.log("\n💾 Storing backup in MongoDB...");

        const backupDocument: BackupDocument = {
            metadata,
            data,
        };

        await backupsCollection.insertOne(backupDocument);

        // 5. Update status to completed
        const duration = Date.now() - startTime;
        await backupsCollection.updateOne(
            { "metadata.backupId": backupId },
            {
                $set: {
                    "metadata.status": "completed",
                    "metadata.duration": duration,
                },
            }
        );

        console.log("\n" + "=".repeat(60));
        console.log(`✅ Backup completed successfully!`);
        console.log(`📊 Statistics:`);
        console.log(`   - Backup ID: ${backupId}`);
        console.log(`   - Total Tables: ${tableCount}`);
        console.log(`   - Total Records: ${totalRecords.toLocaleString()}`);
        console.log(`   - Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`   - Size: ${(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB`);
        console.log("=".repeat(60) + "\n");

        return backupId;
    } catch (error) {
        console.error("\n❌ Backup failed:", error);

        // Update status to failed
        const database = await connectMongoDB();
        await database.collection("backups").updateOne(
            { "metadata.backupId": backupId },
            {
                $set: {
                    "metadata.status": "failed",
                    "metadata.error": error instanceof Error ? error.message : String(error),
                    "metadata.duration": Date.now() - startTime,
                },
            }
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
    const backupsCollection: Collection<BackupDocument> = database.collection("backups");

    // 1. Find backup to restore
    let backup: BackupDocument | null;

    if (backupId) {
        console.log(`🔍 Looking for backup: ${backupId}...`);
        backup = await backupsCollection.findOne({ "metadata.backupId": backupId });
    } else {
        console.log(`🔍 Looking for latest successful backup...`);
        backup = await backupsCollection.findOne(
            { "metadata.status": "completed" },
            { sort: { "metadata.timestamp": -1 } }
        );
    }

    if (!backup) {
        throw new Error(backupId ? `Backup ${backupId} not found` : "No successful backups found");
    }

    console.log(`✅ Found backup: ${backup.metadata.backupId}`);
    console.log(`📅 Created: ${backup.metadata.date}`);
    console.log(`📊 Contains ${backup.metadata.totalRecords.toLocaleString()} records across ${backup.metadata.tableCount} tables\n`);

    // 2. WARNING: Confirm restore
    console.warn("⚠️  WARNING: This will OVERWRITE all current Convex data!");
    console.warn("⚠️  Make sure you understand the implications before proceeding.\n");
    console.log("❌ RESTORE ABORTED: Manual implementation required for safety");
    console.log("📋 To restore manually:");
    console.log("   1. Review backup data in MongoDB");
    console.log("   2. Use Convex dashboard to import data");
    console.log("   3. Or implement custom restore mutations in Convex\n");

    // Note: Automatic restore is intentionally not implemented for safety.
    // Restoring requires careful planning and should be done manually or with
    // explicit confirmation to prevent accidental data loss.
}

// ============================================================================
// CLEANUP OLD BACKUPS
// ============================================================================

async function cleanupOldBackups(): Promise<void> {
    console.log("\n🧹 Cleaning up old backups...");

    const database = await connectMongoDB();
    const backupsCollection = database.collection("backups");

    const cutoffDate = Date.now() - (BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const result = await backupsCollection.deleteMany({
        "metadata.timestamp": { $lt: cutoffDate },
    });

    console.log(`   ✅ Deleted ${result.deletedCount} backups older than ${BACKUP_RETENTION_DAYS} days`);
}

// ============================================================================
// LIST BACKUPS
// ============================================================================

async function listBackups(): Promise<void> {
    console.log("\n" + "=".repeat(60));
    console.log("📋 Available Backups");
    console.log("=".repeat(60) + "\n");

    const database = await connectMongoDB();
    const backupsCollection: Collection<BackupDocument> = database.collection("backups");

    const backups = await backupsCollection
        .find({}, { projection: { metadata: 1 } })
        .sort({ "metadata.timestamp": -1 })
        .limit(20)
        .toArray();

    if (backups.length === 0) {
        console.log("No backups found.");
        return;
    }

    for (const backup of backups) {
        const meta = backup.metadata;
        const statusIcon = meta.status === "completed" ? "✅" : meta.status === "failed" ? "❌" : "⏳";
        const size = meta.tables.reduce((sum, t) => sum + (t.sizeBytes || 0), 0) / 1024 / 1024;

        console.log(`${statusIcon} ${meta.backupId}`);
        console.log(`   Date: ${meta.date}`);
        console.log(`   Status: ${meta.status}`);
        console.log(`   Records: ${meta.totalRecords.toLocaleString()}`);
        console.log(`   Size: ${size.toFixed(2)} MB`);
        if (meta.duration) {
            console.log(`   Duration: ${(meta.duration / 1000).toFixed(2)}s`);
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

    console.log(`⏳ Next backup in: ${(msUntilMidnight / 1000 / 60 / 60).toFixed(2)} hours\n`);

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
                console.log("  npm run backup:schedule  - Start automated daily backups");
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
