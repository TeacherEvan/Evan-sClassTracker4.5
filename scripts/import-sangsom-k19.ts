/**
 * Import Sangsom School K1/9 Students
 *
 * This script imports students from the class roster image into the system.
 *
 * USAGE:
 * 1. Make sure Convex is running: npx convex dev
 * 2. Run: npx tsx scripts/import-sangsom-k19.ts
 *
 * OR manually via Convex Dashboard:
 * 1. Go to https://dashboard.convex.dev
 * 2. Navigate to your project
 * 3. Go to "Functions" tab
 * 4. Find "importSangsomStudents:findSangsomSchool" and run it to get schoolId
 * 5. Find "importSangsomStudents:importK19Students" and run with:
 *    {
 *      "schoolId": "<schoolId from step 4>",
 *      "createdBy": "<your admin/teacher userId>"
 *    }
 */

import { ConvexHttpClient } from "convex/browser";
import * as dotenv from "dotenv";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  console.error("   Make sure Convex is set up: npx convex dev");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  console.log("🔍 Checking for Sangsom School...\n");

  // Step 1: Find Sangsom School
  const schoolCheck = await client.mutation(
    api.importSangsomStudents.findSangsomSchool,
    {},
  );

  if (!schoolCheck.found) {
    console.error("❌ Error: Sangsom School not found!");
    console.error("   Please create 'Sangsom School' in the system first.");
    console.error("   Then run this script again.");
    process.exit(1);
  }

  console.log("✅ Found Sangsom School:");
  console.log(`   ID: ${schoolCheck.schoolId}`);
  console.log(
    `   Name: ${schoolCheck.schoolName} / ${schoolCheck.schoolNameTh}\n`,
  );

  // Step 2: Get admin/teacher user ID
  console.log("⚠️  You need to provide a createdBy userId (admin or teacher)");
  console.log("   Run this query in Convex dashboard to get user IDs:");
  console.log("   users.list -> find your admin/teacher user\n");

  const userId = process.env.ADMIN_USER_ID || process.env.TEACHER_USER_ID;

  if (!userId) {
    console.error("❌ Error: No user ID provided!");
    console.error("   Set ADMIN_USER_ID or TEACHER_USER_ID in .env.local");
    console.error("   Example: ADMIN_USER_ID=j57abc123def456");
    console.error("\n   OR run the import manually via Convex Dashboard:");
    console.error("   1. Go to Functions tab");
    console.error("   2. Run importSangsomStudents:importK19Students");
    console.error(`   3. Use schoolId: ${schoolCheck.schoolId}`);
    process.exit(1);
  }

  console.log(`👤 Using user ID: ${userId}\n`);
  console.log("🚀 Starting student import...\n");
  // Step 3: Import students
  const result = await client.mutation(
    api.importSangsomStudents.importK19Students,
    {
      schoolId: schoolCheck.schoolId as Id<"schools">,
      createdBy: userId as Id<"users">,
    },
  );

  // Display results
  console.log("=".repeat(60));
  console.log(result.message);
  console.log("=".repeat(60));
  console.log(`\n✅ Successfully imported: ${result.imported} students`);
  console.log(`❌ Failed: ${result.failed} students\n`);

  if (result.results.length > 0) {
    console.log("📋 Imported Students:");
    result.results.forEach((student, index: number) => {
      console.log(
        `   ${index + 1}. ${student.nickname} (${student.thaiName}) - ID: ${student.studentId}`,
      );
    });
    console.log("");
  }

  if (result.errors.length > 0) {
    console.log("⚠️  Errors:");
    result.errors.forEach((error) => {
      console.log(`   - ${error.nickname}: ${error.error}`);
      if (error.studentId) {
        console.log(`     (Existing student ID: ${error.studentId})`);
      }
    });
    console.log("");
  }

  console.log("✨ Import complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
