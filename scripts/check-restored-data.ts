import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://resolute-basilisk-801.convex.cloud";

async function checkRestoredData() {
  console.log("🔍 Checking restored data in Convex...\n");

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Check users
    console.log("📊 Checking users table...");
    const users = await client.query(api.users.list, {});
    console.log(`   ✅ Users count: ${users.length}`);

    if (users.length > 0) {
      const sampleUser = users[0];
      console.log(`   Sample user fields:`, Object.keys(sampleUser));

      // Check for date fields
      if (sampleUser.createdAt) {
        const createdDate = new Date(sampleUser.createdAt);
        console.log(
          `   createdAt: ${sampleUser.createdAt} → ${createdDate.toISOString()}`,
        );
        console.log(`   Is valid date: ${!isNaN(createdDate.getTime())}`);
      }

      if (sampleUser.lastSuccessfulLogin) {
        const loginDate = new Date(sampleUser.lastSuccessfulLogin);
        console.log(
          `   lastSuccessfulLogin: ${sampleUser.lastSuccessfulLogin} → ${loginDate.toISOString()}`,
        );
        console.log(`   Is valid date: ${!isNaN(loginDate.getTime())}`);
      }
    }

    // Check classes
    console.log("\n📊 Checking classes table...");
    const classes = await client.query(api.classes.list, {});
    console.log(`   ✅ Classes count: ${classes.length}`);

    if (classes.length > 0) {
      const sampleClass = classes[0];
      console.log(`   Sample class fields:`, Object.keys(sampleClass));

      // Check for date fields
      if (sampleClass.scheduledDate) {
        const schedDate = new Date(sampleClass.scheduledDate);
        console.log(
          `   scheduledDate: ${sampleClass.scheduledDate} → ${schedDate.toISOString()}`,
        );
        console.log(`   Is valid date: ${!isNaN(schedDate.getTime())}`);
      }

      if (sampleClass.createdAt) {
        const createdDate = new Date(sampleClass.createdAt);
        console.log(
          `   createdAt: ${sampleClass.createdAt} → ${createdDate.toISOString()}`,
        );
        console.log(`   Is valid date: ${!isNaN(createdDate.getTime())}`);
      }
    }

    // Check students
    console.log("\n📊 Checking students table...");
    const students = await client.query(api.students.list, {});
    console.log(`   ✅ Students count: ${students.length}`);

    if (students.length > 0) {
      const sampleStudent = students[0];
      console.log(`   Sample student fields:`, Object.keys(sampleStudent));

      if (sampleStudent.dateOfBirth) {
        const dob = new Date(sampleStudent.dateOfBirth);
        console.log(
          `   dateOfBirth: ${sampleStudent.dateOfBirth} → ${dob.toISOString()}`,
        );
        console.log(`   Is valid date: ${!isNaN(dob.getTime())}`);
      }
    }

    console.log("\n✅ Data check complete!");
  } catch (error) {
    console.error("\n❌ Error checking data:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
  }
}

checkRestoredData();
