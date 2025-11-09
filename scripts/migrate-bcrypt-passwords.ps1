# BCRYPT PASSWORD MIGRATION SCRIPT
# 
# This script helps you migrate all bcrypt passwords to PBKDF2 format
# after the November 2025 security upgrade.
#
# WHAT THIS DOES:
# 1. Checks how many users have bcrypt passwords
# 2. Resets all bcrypt passwords to "Teacher{username}" pattern
# 3. Forces password change on first login
#
# HOW TO USE:
# 1. Ensure Convex dev is running: npx convex dev
# 2. Run this script: .\scripts\migrate-bcrypt-passwords.ps1
# 3. Follow the prompts
#
# Created: November 9, 2025

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  BCRYPT PASSWORD MIGRATION TOOL" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Convex dev is running
Write-Host "⚙️  Checking Convex connection..." -ForegroundColor Yellow
npx convex dev --once 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Convex dev server not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Convex dev in another terminal:" -ForegroundColor Yellow
    Write-Host "  npx convex dev" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Convex connected" -ForegroundColor Green
Write-Host ""

# Step 1: Check bcrypt user count
Write-Host "📊 Checking for users with bcrypt passwords..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening Convex Dashboard to run migration..." -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL STEPS:" -ForegroundColor Yellow
Write-Host "1. Go to: https://dashboard.convex.dev" -ForegroundColor White
Write-Host "2. Select your deployment (greedy-partridge-29)" -ForegroundColor White
Write-Host "3. Click 'Functions' tab" -ForegroundColor White
Write-Host "4. Search for: migrateBcryptPasswords:countBcryptUsers" -ForegroundColor White
Write-Host "5. Click 'Run' (no arguments needed)" -ForegroundColor White
Write-Host "6. Note the number of bcrypt users" -ForegroundColor White
Write-Host ""

# Open dashboard
Start-Process "https://dashboard.convex.dev/t/evilevan/evan-sclasstracker/greedy-partridge-29/functions"

# Wait for user
$continue = Read-Host "Press Enter when you've checked the bcrypt user count (or 'q' to quit)"
if ($continue -eq 'q') {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  STEP 2: RUN MIGRATION (DRY RUN FIRST)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MANUAL STEPS:" -ForegroundColor Yellow
Write-Host "1. In Convex Dashboard Functions tab" -ForegroundColor White
Write-Host "2. Search for: migrateBcryptPasswords:resetAllBcryptPasswords" -ForegroundColor White
Write-Host "3. Click 'Run' with arguments:" -ForegroundColor White
Write-Host "   {" -ForegroundColor Gray
Write-Host '     "adminId": "<your_admin_user_id>",' -ForegroundColor Gray
Write-Host '     "dryRun": true' -ForegroundColor Gray
Write-Host "   }" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Review the DRY RUN results" -ForegroundColor White
Write-Host "5. If everything looks good, run again with:" -ForegroundColor White
Write-Host "   {" -ForegroundColor Gray
Write-Host '     "adminId": "<your_admin_user_id>",' -ForegroundColor Gray
Write-Host '     "dryRun": false' -ForegroundColor Gray
Write-Host "   }" -ForegroundColor Gray
Write-Host ""
Write-Host "TIP: To find your admin ID:" -ForegroundColor Yellow
Write-Host "  - Go to Data tab → users table" -ForegroundColor White
Write-Host "  - Find user with username 'admin'" -ForegroundColor White
Write-Host "  - Copy the _id field" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Press Enter when migration is complete (or 'q' to quit)"
if ($continue -eq 'q') {
    Write-Host "❌ Migration process stopped" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All bcrypt users now have passwords reset to:" -ForegroundColor Green
Write-Host "   Password Pattern: Teacher{username}" -ForegroundColor White
Write-Host ""
Write-Host "Examples:" -ForegroundColor Yellow
Write-Host "  - Username: admin   → Password: TeacherAdmin" -ForegroundColor White
Write-Host "  - Username: Evan    → Password: TeacherEvan" -ForegroundColor White
Write-Host "  - Username: moderator1 → Password: TeacherModerator1" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  All affected users will be forced to change password on first login" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Test login with default passwords" -ForegroundColor White
Write-Host "2. Run E2E tests: npm run test:e2e" -ForegroundColor White
Write-Host "3. Verify all tests pass" -ForegroundColor White
Write-Host ""
