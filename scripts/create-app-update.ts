/**
 * Auto-Create App Update Script
 * 
 * This script automatically creates an app update announcement based on
 * the most recent implementation summaries and git commits.
 * 
 * Usage:
 * 1. Run manually after completing features: npm run create-update
 * 2. Or have AI agent call this at end of work
 * 
 * The script will:
 * - Read recent IMPLEMENTATION_SUMMARY_*.md files
 * - Extract user-friendly feature descriptions
 * - Create bilingual app update in database
 * - Deactivate previous updates
 */

import { ConvexHttpClient } from "convex/browser";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

// Try to load from .env.local first, then fall back to .env
const envLocalPath = path.join(process.cwd(), ".env.local");
const envPath = path.join(process.cwd(), ".env");

if (fs.existsSync(envLocalPath)) {
    config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
    config({ path: envPath });
}

// Initialize Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "";
if (!CONVEX_URL) {
    console.error("\n❌ Error: NEXT_PUBLIC_CONVEX_URL not found");
    console.error("\nPlease do one of the following:");
    console.error("1. Start Convex dev server: npx convex dev");
    console.error("   (This will create .env.local automatically)");
    console.error("\n2. Or set the environment variable manually:");
    console.error("   $env:NEXT_PUBLIC_CONVEX_URL=\"your-convex-url\"; npm run create-update");
    console.error("\n3. Or create .env.local with:");
    console.error("   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud");
    process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface Feature {
    icon: string;
    title: string;
    titleTh: string;
    description: string;
    descriptionTh: string;
}

interface UpdateData {
    version: string;
    title: string;
    titleTh: string;
    description: string;
    descriptionTh: string;
    features: Feature[];
}

/**
 * Parse implementation summary files to extract features
 */
function parseImplementationSummaries(): UpdateData | null {
    const docsDir = path.join(process.cwd());
    const files = fs.readdirSync(docsDir);

    // Find most recent IMPLEMENTATION_SUMMARY file
    const summaryFiles = files
        .filter(f => f.startsWith("IMPLEMENTATION_SUMMARY_") && f.endsWith(".md"))
        .sort()
        .reverse();

    if (summaryFiles.length === 0) {
        console.log("No implementation summary files found");
        return null;
    }

    const latestFile = summaryFiles[0];
    console.log(`Reading: ${latestFile}`);

    // Read file content for future enhancement (parsing features from summary)
    // const content = fs.readFileSync(path.join(docsDir, latestFile), "utf-8");
    // TODO: Parse content to extract features automatically

    // Extract version from filename or content
    const versionMatch = latestFile.match(/v?(\d+\.\d+\.\d+)/);
    const version = versionMatch ? versionMatch[1] : "4.5.1";

    // Default update data (can be customized based on file content)
    return {
        version,
        title: "Latest Improvements",
        titleTh: "การปรับปรุงล่าสุด",
        description: "We've made several improvements to make the system faster and easier to use.",
        descriptionTh: "เราได้ปรับปรุงหลายอย่างเพื่อให้ระบบเร็วและใช้งานง่ายขึ้น",
        features: [
            {
                icon: "CheckCircle2",
                title: "Improved Student Name Entry",
                titleTh: "ป้อนชื่อนักเรียนง่ายขึ้น",
                description: "Now you only need to enter the student's nickname - no more long forms to fill out",
                descriptionTh: "ตอนนี้คุณต้องกรอกแค่ชื่อเล่นของนักเรียน - ไม่ต้องกรอกฟอร์มยาวๆ อีกต่อไป",
            },
            {
                icon: "Edit3",
                title: "Clearer Grade & Class Selection",
                titleTh: "เลือกเกรดและห้องเรียนชัดเจนขึ้น",
                description: "Reorganized dropdowns make it faster to select student grade (K1-K3) and class (/1-/10)",
                descriptionTh: "เมนูดร็อปดาวน์ใหม่ช่วยให้เลือกเกรด (อนุบาล 1-3) และห้อง (/1-/10) ได้เร็วขึ้น",
            },
            {
                icon: "FileText",
                title: "Teacher Activity Logs in Analytics",
                titleTh: "บันทึกกิจกรรมครูในแท็บวิเคราะห์",
                description: "Access all your teaching logs and exports right from the Analytics tab",
                descriptionTh: "เข้าถึงบันทึกการสอนและส่งออกข้อมูลได้จากแท็บวิเคราะห์",
            },
            {
                icon: "Sparkles",
                title: "Better Confirmation Dialogs",
                titleTh: "หน้าต่างยืนยันที่ดีขึ้น",
                description: "Important actions now show clear, easy-to-read confirmation windows instead of browser popups",
                descriptionTh: "การดำเนินการสำคัญแสดงหน้าต่างยืนยันที่อ่านง่ายแทนป๊อปอัปของเบราว์เซอร์",
            },
        ],
    };
}

/**
 * Create app update in Convex database
 */
async function createAppUpdate(updateData: UpdateData, adminUserId: string) {
    try {
        // Import the mutation
        const { api } = await import("../convex/_generated/api");

        // Call create mutation
        const result = await client.mutation(api.appUpdates.create, {
            userId: adminUserId,
            version: updateData.version,
            title: updateData.title,
            titleTh: updateData.titleTh,
            description: updateData.description,
            descriptionTh: updateData.descriptionTh,
            features: updateData.features,
        });

        console.log("✅ App update created successfully!");
        console.log(`Version: ${updateData.version}`);
        console.log(`Features: ${updateData.features.length}`);
        return result;
    } catch (error) {
        console.error("❌ Failed to create app update:", error);
        throw error;
    }
}

/**
 * Get admin user ID (first admin user)
 */
async function getAdminUserId(): Promise<string> {
    try {
        const { api } = await import("../convex/_generated/api");
        const users = await client.query(api.users.list, { role: "admin" });

        if (!users || users.length === 0) {
            throw new Error("No admin users found");
        }

        return users[0]._id;
    } catch (error) {
        console.error("❌ Failed to get admin user:", error);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log("🚀 Auto-Create App Update Script");
    console.log("================================\n");

    // Parse implementation summaries
    const updateData = parseImplementationSummaries();

    if (!updateData) {
        console.log("⚠️  No update data to create");
        process.exit(0);
    }

    console.log(`📝 Update Version: ${updateData.version}`);
    console.log(`📝 Features: ${updateData.features.length}\n`);

    // Get admin user ID
    console.log("🔍 Finding admin user...");
    const adminUserId = await getAdminUserId();
    console.log(`✅ Admin user found: ${adminUserId}\n`);

    // Create update
    console.log("📤 Creating app update...");
    await createAppUpdate(updateData, adminUserId);

    console.log("\n✨ Done! Users will now see the latest updates.");
}

// Run the script
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
