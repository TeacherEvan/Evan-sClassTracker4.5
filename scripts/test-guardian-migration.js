#!/usr/bin/env node
/**
 * Test Guardian Migration Locally
 * 
 * This script helps test the guardian-to-provider migration on local dev data
 * without affecting production.
 * 
 * Usage:
 *   node scripts/test-guardian-migration.js
 */

console.log("===========================================");
console.log("Guardian Migration - Local Testing Helper");
console.log("===========================================\n");

console.log("Prerequisites:");
console.log("  1. Ensure Convex dev server is running: npx convex dev");
console.log("  2. Have admin user ID ready from Convex Dashboard\n");

console.log("Step 1: Preview Migration");
console.log("  Open: http://localhost:5173 (Convex Dashboard)");
console.log("  Navigate to: Functions → guardianToProviderMigration:previewMigration");
console.log("  Click: Run Function (no parameters needed)");
console.log("  Review: Output shows what will be migrated\n");

console.log("Step 2: Dry Run");
console.log("  Navigate to: Functions → guardianToProviderMigration:migrateGuardiansToProviders");
console.log("  Parameters:");
console.log("  {");
console.log('    "adminId": "YOUR_ADMIN_ID_HERE",  // From users table');
console.log('    "dryRun": true');
console.log("  }");
console.log("  Click: Run Function");
console.log("  Review: Detailed log of what would happen (no changes made)\n");

console.log("Step 3: Live Migration (Local Dev Only!)");
console.log("  ⚠️  WARNING: This modifies your local dev database");
console.log("  ⚠️  Ensure you have a backup or are using test data");
console.log("");
console.log("  Navigate to: Functions → guardianToProviderMigration:migrateGuardiansToProviders");
console.log("  Parameters:");
console.log("  {");
console.log('    "adminId": "YOUR_ADMIN_ID_HERE",');
console.log('    "dryRun": false  // LIVE MIGRATION');
console.log("  }");
console.log("  Click: Run Function");
console.log("  Wait: May take 1-5 minutes");
console.log("  Review: Migration log\n");

console.log("Step 4: Verification");
console.log("  Navigate to: Functions → guardianToProviderMigration:verifyCleanup");
console.log("  Click: Run Function (no parameters needed)");
console.log("  Review: Shows migration status and completion\n");

console.log("Step 5: Test Application");
console.log("  1. Open application: npm run dev");
console.log("  2. Login as teacher");
console.log("  3. Check student management");
console.log("  4. Check class booking");
console.log("  5. Verify providers appear correctly\n");

console.log("Step 6 (Optional): Rollback");
console.log("  If something goes wrong:");
console.log("  Navigate to: Functions → guardianToProviderMigration:rollbackMigration");
console.log("  Parameters:");
console.log("  {");
console.log('    "adminId": "YOUR_ADMIN_ID_HERE",');
console.log('    "confirm": true');
console.log("  }");
console.log("  Click: Run Function");
console.log("  This reverses the migration\n");

console.log("Step 7 (Optional): Cleanup Deprecated Fields");
console.log("  After verifying migration works:");
console.log("  Navigate to: Functions → guardianToProviderMigration:cleanupDeprecatedFields");
console.log("  Parameters:");
console.log("  {");
console.log('    "adminId": "YOUR_ADMIN_ID_HERE",');
console.log('    "confirm": true,');
console.log('    "phase": "all"  // or "students" or "classes"');
console.log("  }");
console.log("  Click: Run Function");
console.log("  This removes deprecated guardianId and isGuardianLinked fields\n");

console.log("===========================================");
console.log("Testing Tips:");
console.log("===========================================");
console.log("✓ Always run preview first");
console.log("✓ Always run dry-run before live migration");
console.log("✓ Test on dev/local data first, never production directly");
console.log("✓ Keep Convex Dashboard logs open during migration");
console.log("✓ Run verification after each step");
console.log("✓ Test application functionality before cleanup");
console.log("✓ Wait at least 24-48 hours before cleanup in production\n");

console.log("===========================================");
console.log("Quick Reference - Admin ID Location:");
console.log("===========================================");
console.log("Convex Dashboard → Data → users table");
console.log("Find user with role='admin'");
console.log("Copy _id field (format: jd7...)\n");

console.log("For full documentation, see:");
console.log("  docs/migrations/GUARDIAN_MIGRATION_RUNBOOK.md\n");

console.log("Ready to test! Open Convex Dashboard to begin.");
console.log("===========================================\n");
