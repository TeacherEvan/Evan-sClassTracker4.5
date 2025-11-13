# start-test-servers.ps1
# Starts both Convex and Next.js dev servers for E2E testing

Write-Host "🚀 Starting test servers..." -ForegroundColor Cyan

# Start Convex dev server in background
Write-Host "Starting Convex dev server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npx convex dev" -WindowStyle Minimized

# Wait for Convex to initialize
Start-Sleep -Seconds 5

# Start Next.js dev server
Write-Host "Starting Next.js dev server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Minimized

Write-Host "✅ Test servers started!" -ForegroundColor Green
Write-Host "   - Convex: Running in background" -ForegroundColor Gray
Write-Host "   - Next.js: http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "Run 'npm run test:e2e' to execute tests" -ForegroundColor Cyan
