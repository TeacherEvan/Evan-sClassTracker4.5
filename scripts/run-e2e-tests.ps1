# run-e2e-tests.ps1
# Efficient E2E test runner - starts both Convex and Next.js, runs tests, then cleans up

param(
    [switch]$UI,
    [switch]$Headed,
    [switch]$Debug
)

Write-Host "🧪 E2E Test Runner" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# Kill any existing node processes on ports 3000, 3001
Write-Host "🧹 Cleaning up existing servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $processId = $_.Id
    $connections = netstat -ano | Select-String ":3000 " -Context 0, 0
    $connections += netstat -ano | Select-String ":3001 " -Context 0, 0
    $connections -match $processId
} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Start Convex dev server
Write-Host "🔷 Starting Convex dev server..." -ForegroundColor Cyan
$currentPath = Get-Location
$convexJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    npx convex dev 2>&1
} -ArgumentList $currentPath

# Wait for Convex to initialize
Write-Host "   Waiting for Convex to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Check if Convex started successfully
$convexOutput = Receive-Job -Job $convexJob
if ($convexOutput -match 'error|failed') {
    Write-Host "❌ Convex failed to start!" -ForegroundColor Red
    Write-Host $convexOutput -ForegroundColor Red
    Stop-Job -Job $convexJob
    Remove-Job -Job $convexJob
    exit 1
}

Write-Host "   ✅ Convex running" -ForegroundColor Green

# Start Next.js dev server
Write-Host "🔷 Starting Next.js dev server..." -ForegroundColor Cyan
$nextJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location $path
    $env:NEXT_TELEMETRY_DISABLED = "1"
    $env:__NEXT_TEST_MODE = "true"
    npm run dev 2>&1
} -ArgumentList $currentPath

# Wait for Next.js to be ready
Write-Host "   Waiting for Next.js to be ready..." -ForegroundColor Gray
$attempts = 0
$maxAttempts = 30
$ready = $false

while ($attempts -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $ready = $true
    }
    catch {
        $attempts++
        Write-Host "   Attempt $attempts/$maxAttempts..." -ForegroundColor Gray
    }
}

if (-not $ready) {
    Write-Host "❌ Next.js failed to start!" -ForegroundColor Red
    Stop-Job -Job $convexJob, $nextJob
    Remove-Job -Job $convexJob, $nextJob
    exit 1
}

Write-Host "   ✅ Next.js ready at http://localhost:3001" -ForegroundColor Green
Write-Host ""

# Run tests
Write-Host "🎭 Running Playwright tests..." -ForegroundColor Cyan
Write-Host ""

try {
    if ($UI) {
        npm run test:e2e:ui
    }
    elseif ($Headed) {
        npm run test:e2e:headed
    }
    elseif ($Debug) {
        npm run test:e2e:debug
    }
    else {
        npm run test:e2e
    }
    $testExitCode = $LASTEXITCODE
}
finally {
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Stop-Job -Job $convexJob, $nextJob -ErrorAction SilentlyContinue
    Remove-Job -Job $convexJob, $nextJob -ErrorAction SilentlyContinue
    Write-Host "   ✅ Servers stopped" -ForegroundColor Green
}

Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
}
else {
    Write-Host "❌ Some tests failed (exit code: $testExitCode)" -ForegroundColor Red
    Write-Host "Run 'npm run test:e2e:report' to view the HTML report" -ForegroundColor Yellow
}

exit $testExitCode
