# Quick Setup Script for Testing Pipeline
# Run this in PowerShell

Write-Host "🚀 Evan's Class Tracker - Testing Pipeline Setup" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.test.local exists
if (Test-Path .env.test.local) {
    Write-Host "✅ .env.test.local already exists" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env.test.local from template..." -ForegroundColor Yellow
    Copy-Item .env.test.local.template .env.test.local
    Write-Host "✅ Created .env.test.local - PLEASE EDIT IT WITH YOUR CREDENTIALS!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Convex Test Deployment
Write-Host "1️⃣  CREATE CONVEX TEST DEPLOYMENT" -ForegroundColor Yellow
Write-Host "   → Go to: https://dashboard.convex.dev/" -ForegroundColor White
Write-Host "   → Click 'New Deployment'" -ForegroundColor White
Write-Host "   → Name: evan-sclasstracker-test" -ForegroundColor White
Write-Host "   → Copy the deployment URL" -ForegroundColor White
Write-Host "   → Go to Settings → Deploy Keys" -ForegroundColor White
Write-Host "   → Copy the deploy key" -ForegroundColor White
Write-Host "   → Update .env.test.local with both values" -ForegroundColor White
Write-Host ""

# Step 3: Docker Hub Access Token
Write-Host "2️⃣  CREATE DOCKER HUB ACCESS TOKEN" -ForegroundColor Yellow
Write-Host "   → Go to: https://hub.docker.com/settings/security" -ForegroundColor White
Write-Host "   → Login as: evilevan91" -ForegroundColor White
Write-Host "   → Click 'New Access Token'" -ForegroundColor White
Write-Host "   → Name: 'GitHub Actions - Evan Class Tracker'" -ForegroundColor White
Write-Host "   → Copy the token (you won't see it again!)" -ForegroundColor White
Write-Host ""

# Step 4: GitHub Secrets
Write-Host "3️⃣  ADD GITHUB REPOSITORY SECRETS" -ForegroundColor Yellow
Write-Host "   → Go to: https://github.com/TeacherEvan/Evan-sClassTracker4.5/settings/secrets/actions" -ForegroundColor White
Write-Host "   → Click 'New repository secret'" -ForegroundColor White
Write-Host ""
Write-Host "   Add these secrets:" -ForegroundColor Cyan
Write-Host "   ├─ CONVEX_TEST_DEPLOY_KEY = [from Convex dashboard]" -ForegroundColor White
Write-Host "   ├─ DOCKER_USERNAME = evilevan91" -ForegroundColor White
Write-Host "   ├─ DOCKER_PASSWORD = [Docker Hub access token]" -ForegroundColor White
Write-Host "   ├─ TEST_ADMIN_PASSWORD = AdminTest123!" -ForegroundColor White
Write-Host "   ├─ TEST_TEACHER_PASSWORD = TeacherTest123!" -ForegroundColor White
Write-Host "   └─ TEST_MODERATOR_PASSWORD = ModeratorTest123!" -ForegroundColor White
Write-Host ""

# Step 5: Install Dependencies
Write-Host "4️⃣  INSTALL PLAYWRIGHT (run this now)" -ForegroundColor Yellow
Write-Host "   npm install -D @playwright/test" -ForegroundColor White
Write-Host "   npx playwright install" -ForegroundColor White
Write-Host ""

# Step 6: Docker Login
Write-Host "5️⃣  LOGIN TO DOCKER HUB (run this now)" -ForegroundColor Yellow
Write-Host "   docker login" -ForegroundColor White
Write-Host "   Username: evilevan91" -ForegroundColor White
Write-Host "   Password: [Your Docker Hub password or token]" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CHECKLIST:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[ ] Created Convex test deployment" -ForegroundColor White
Write-Host "[ ] Updated .env.test.local with Convex URLs" -ForegroundColor White
Write-Host "[ ] Created Docker Hub access token" -ForegroundColor White
Write-Host "[ ] Added all 6 GitHub Secrets" -ForegroundColor White
Write-Host "[ ] Installed Playwright" -ForegroundColor White
Write-Host "[ ] Logged in to Docker Hub" -ForegroundColor White
Write-Host ""

Write-Host "📖 Full guide: docs/ENVIRONMENT_SETUP_GUIDE.md" -ForegroundColor Cyan
Write-Host ""

# Optional: Open files for editing
$response = Read-Host "Open .env.test.local for editing now? (y/n)"
if ($response -eq 'y') {
    notepad .env.test.local
}

Write-Host ""
Write-Host "✨ Setup script complete! Follow the steps above." -ForegroundColor Green
