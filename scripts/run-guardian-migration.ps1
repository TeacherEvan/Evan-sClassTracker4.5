<#
.SYNOPSIS
    Guardian to Provider Migration Runner Script

.DESCRIPTION
    Automates the guardian-to-provider migration process with safety checks,
    backup verification, dry-run support, and post-migration cleanup.

.PARAMETER DryRun
    Run in preview mode without making changes (default: true)

.PARAMETER Backup
    Create backup before migration (default: true)

.PARAMETER Cleanup
    Run cleanup of deprecated fields after migration (default: false)

.PARAMETER CleanupPhase
    Which cleanup phase to run: students, classes, or all (default: all)

.EXAMPLE
    .\run-guardian-migration.ps1 -DryRun $true
    Preview migration without making changes

.EXAMPLE
    .\run-guardian-migration.ps1 -DryRun $false -Backup $true
    Run actual migration with backup

.EXAMPLE
    .\run-guardian-migration.ps1 -Cleanup $true -CleanupPhase "all"
    Clean up deprecated fields after migration
#>

param(
    [bool]$DryRun = $true,
    [bool]$Backup = $true,
    [bool]$Cleanup = $false,
    [ValidateSet("students", "classes", "all")]
    [string]$CleanupPhase = "all"
)

# Script configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Guardian to Provider Migration Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if Convex is running
function Test-ConvexConnection {
    Write-Host "[CHECK] Testing Convex connection..." -ForegroundColor Yellow
    
    # Check if .env.local exists
    $envFile = Join-Path $ProjectRoot ".env.local"
    if (-not (Test-Path $envFile)) {
        Write-Host "  ✗ .env.local not found" -ForegroundColor Red
        Write-Host "  Run: npx convex dev" -ForegroundColor Yellow
        return $false
    }

    # Check if NEXT_PUBLIC_CONVEX_URL is set
    $convexUrl = Get-Content $envFile | Where-Object { $_ -match "NEXT_PUBLIC_CONVEX_URL" }
    if (-not $convexUrl) {
        Write-Host "  ✗ NEXT_PUBLIC_CONVEX_URL not found in .env.local" -ForegroundColor Red
        return $false
    }

    Write-Host "  ✓ Convex configuration found" -ForegroundColor Green
    return $true
}

# Function to create backup
function Invoke-Backup {
    Write-Host "[BACKUP] Creating database backup..." -ForegroundColor Yellow
    
    Push-Location $ProjectRoot
    
    try {
        # Check if backup script exists
        $backupScript = Join-Path $ScriptDir "backup-convex.ps1"
        if (-not (Test-Path $backupScript)) {
            Write-Host "  ✗ Backup script not found: $backupScript" -ForegroundColor Red
            return $false
        }

        # Run backup
        & $backupScript
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Backup completed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ✗ Backup failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "  ✗ Backup error: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
}

# Function to get admin ID from user
function Get-AdminId {
    Write-Host ""
    Write-Host "[INPUT] Enter Admin User ID" -ForegroundColor Yellow
    Write-Host "  You can find this in Convex Dashboard → users table" -ForegroundColor Gray
    Write-Host "  Format: jd7... (starts with table prefix)" -ForegroundColor Gray
    Write-Host ""
    
    $adminId = Read-Host "Admin ID"
    
    if ([string]::IsNullOrWhiteSpace($adminId)) {
        Write-Host "  ✗ Admin ID is required" -ForegroundColor Red
        exit 1
    }
    
    return $adminId.Trim()
}

# Function to run preview
function Invoke-Preview {
    Write-Host ""
    Write-Host "[PREVIEW] Checking migration requirements..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Open Convex Dashboard and run:" -ForegroundColor Cyan
    Write-Host "  Functions → guardianToProviderMigration:previewMigration" -ForegroundColor White
    Write-Host ""
    Write-Host "  This will show:" -ForegroundColor Gray
    Write-Host "  - Number of guardian users to migrate" -ForegroundColor Gray
    Write-Host "  - Number of students needing provider" -ForegroundColor Gray
    Write-Host "  - Number of orphan students (will get pseudo-provider)" -ForegroundColor Gray
    Write-Host "  - Number of classes to update" -ForegroundColor Gray
    Write-Host ""
    
    $continue = Read-Host "Have you reviewed the preview? (y/n)"
    return $continue -eq "y"
}

# Function to run migration
function Invoke-Migration {
    param([string]$AdminId, [bool]$IsDryRun)
    
    $mode = if ($IsDryRun) { "DRY RUN" } else { "LIVE" }
    
    Write-Host ""
    Write-Host "[$mode] Running migration..." -ForegroundColor $(if ($IsDryRun) { "Yellow" } else { "Red" })
    Write-Host ""
    Write-Host "  Open Convex Dashboard and run:" -ForegroundColor Cyan
    Write-Host "  Functions → guardianToProviderMigration:migrateGuardiansToProviders" -ForegroundColor White
    Write-Host ""
    Write-Host "  Parameters:" -ForegroundColor Gray
    Write-Host "  {" -ForegroundColor White
    Write-Host "    `"adminId`": `"$AdminId`"," -ForegroundColor White
    Write-Host "    `"dryRun`": $($IsDryRun.ToString().ToLower())" -ForegroundColor White
    Write-Host "  }" -ForegroundColor White
    Write-Host ""
    
    if (-not $IsDryRun) {
        Write-Host "  ⚠️  WARNING: This will modify your database!" -ForegroundColor Red
        Write-Host "  ⚠️  Ensure backup is complete before proceeding" -ForegroundColor Red
        Write-Host ""
    }
    
    $continue = Read-Host "Run migration now? (y/n)"
    return $continue -eq "y"
}

# Function to run cleanup
function Invoke-Cleanup {
    param([string]$AdminId, [string]$Phase)
    
    Write-Host ""
    Write-Host "[CLEANUP] Running cleanup phase: $Phase..." -ForegroundColor Red
    Write-Host ""
    Write-Host "  ⚠️  WARNING: This will permanently remove deprecated fields!" -ForegroundColor Red
    Write-Host "  ⚠️  Only run after migration is verified working!" -ForegroundColor Red
    Write-Host "  ⚠️  This operation CANNOT be undone!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Open Convex Dashboard and run:" -ForegroundColor Cyan
    Write-Host "  Functions → guardianToProviderMigration:cleanupDeprecatedFields" -ForegroundColor White
    Write-Host ""
    Write-Host "  Parameters:" -ForegroundColor Gray
    Write-Host "  {" -ForegroundColor White
    Write-Host "    `"adminId`": `"$AdminId`"," -ForegroundColor White
    Write-Host "    `"confirm`": true," -ForegroundColor White
    Write-Host "    `"phase`": `"$Phase`"" -ForegroundColor White
    Write-Host "  }" -ForegroundColor White
    Write-Host ""
    
    $continue = Read-Host "Run cleanup now? (y/n)"
    return $continue -eq "y"
}

# Function to verify migration
function Invoke-Verification {
    Write-Host ""
    Write-Host "[VERIFY] Checking migration status..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Open Convex Dashboard and run:" -ForegroundColor Cyan
    Write-Host "  Functions → guardianToProviderMigration:verifyCleanup" -ForegroundColor White
    Write-Host ""
    Write-Host "  This will show:" -ForegroundColor Gray
    Write-Host "  - Students with/without guardianId" -ForegroundColor Gray
    Write-Host "  - Classes with/without isGuardianLinked" -ForegroundColor Gray
    Write-Host "  - Remaining guardian users" -ForegroundColor Gray
    Write-Host "  - Overall cleanup status" -ForegroundColor Gray
    Write-Host ""
}

# Main execution flow
try {
    # Step 1: Check Convex connection
    if (-not (Test-ConvexConnection)) {
        Write-Host ""
        Write-Host "Please ensure Convex is running and try again" -ForegroundColor Red
        exit 1
    }

    # Step 2: Get admin ID
    $adminId = Get-AdminId

    # Step 3: Run preview
    if (-not (Invoke-Preview)) {
        Write-Host ""
        Write-Host "Migration cancelled" -ForegroundColor Yellow
        exit 0
    }

    # Step 4: Create backup (if not cleanup mode)
    if (-not $Cleanup -and $Backup) {
        if (-not (Invoke-Backup)) {
            Write-Host ""
            $continue = Read-Host "Backup failed. Continue anyway? (y/n)"
            if ($continue -ne "y") {
                Write-Host "Migration cancelled" -ForegroundColor Yellow
                exit 0
            }
        }
    }

    # Step 5: Run migration or cleanup
    if ($Cleanup) {
        # Cleanup mode
        if (Invoke-Cleanup -AdminId $adminId -Phase $CleanupPhase) {
            Write-Host ""
            Write-Host "✓ Cleanup instructions provided" -ForegroundColor Green
            Write-Host "  Run the verification query to check status" -ForegroundColor Gray
        }
    }
    else {
        # Migration mode
        if (Invoke-Migration -AdminId $adminId -IsDryRun $DryRun) {
            Write-Host ""
            if ($DryRun) {
                Write-Host "✓ Dry run instructions provided" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "  1. Review dry run output in Convex Dashboard" -ForegroundColor Gray
                Write-Host "  2. If satisfied, run: .\run-guardian-migration.ps1 -DryRun `$false" -ForegroundColor Gray
            }
            else {
                Write-Host "✓ Migration instructions provided" -ForegroundColor Green
                Write-Host ""
                Write-Host "Next steps:" -ForegroundColor Cyan
                Write-Host "  1. Review migration output in Convex Dashboard" -ForegroundColor Gray
                Write-Host "  2. Test application functionality" -ForegroundColor Gray
                Write-Host "  3. Run verification: Invoke-Verification" -ForegroundColor Gray
                Write-Host "  4. If all good, run cleanup: .\run-guardian-migration.ps1 -Cleanup `$true" -ForegroundColor Gray
            }
        }
    }

    # Step 6: Offer verification
    Write-Host ""
    $verify = Read-Host "Show verification instructions? (y/n)"
    if ($verify -eq "y") {
        Invoke-Verification
    }

    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Migration script completed" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan

}
catch {
    Write-Host ""
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
