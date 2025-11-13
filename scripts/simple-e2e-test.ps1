# simple-e2e-test.ps1
# Simplified E2E test runner

Write-Host "🧪 Starting E2E Tests" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes
Write-Host "Cleaning up..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Set environment variables to suppress dev overlay
$env:NEXT_TELEMETRY_DISABLED = "1"
$env:__NEXT_TEST_MODE = "true"

# Start Convex in background (new window)
Write-Host "Starting Convex..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npx convex dev" -WindowStyle Minimized

# Wait for Convex
Write-Host "Waiting 10 seconds for Convex..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Start Next.js in background (new window)
Write-Host "Starting Next.js..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Minimized

# Wait for Next.js
Write-Host "Waiting 15 seconds for Next.js..." -ForegroundColor Gray
Start-Sleep -Seconds 15

# Check if Next.js is ready
Write-Host "Checking Next.js..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Next.js ready" -ForegroundColor Green
}
catch {
    Write-Host "⚠️ Next.js may not be ready, continuing anyway..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Cyan
Write-Host ""

# Run tests
npm run test:e2e

$exitCode = $LASTEXITCODE

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ Tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Tests failed (exit code: $exitCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "To stop servers, close the minimized PowerShell windows" -ForegroundColor Yellow
Write-Host "Or run: Get-Process -Name node | Stop-Process -Force" -ForegroundColor Gray

exit $exitCode
