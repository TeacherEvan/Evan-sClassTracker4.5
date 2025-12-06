<#
.SYNOPSIS
    Complete Guardian to Provider Migration Script

.DESCRIPTION
    This script runs the comprehensive guardian migration process:
    1. Preview migration (dry-run)
    2. Run migration (with confirmation)
    3. Verify migration results
    
    Handles:
    - Guardian users → Provider entities
    - Self-reference students → Pseudo-provider creation
    - All student/class relationships updated
    
.PARAMETER DryRun
    Run in dry-run mode (preview only, no changes)
    
.PARAMETER SkipPreview
    Skip the initial preview step
    
.PARAMETER SkipVerification
    Skip the post-migration verification
    
.PARAMETER AdminId
    Admin user ID (required for live migration)
    If not provided, will prompt for username
    
.EXAMPLE
    .\run-guardian-migration.ps1
    Runs full migration with preview, confirmation, and verification
    
.EXAMPLE
    .\run-guardian-migration.ps1 -DryRun
    Preview what will be migrated without making changes
    
.EXAMPLE
    .\run-guardian-migration.ps1 -AdminId "j12345678" -SkipPreview
    Run migration directly with specified admin ID

.NOTES
    File Name      : run-guardian-migration.ps1
    Prerequisite   : Convex CLI must be installed and configured
    Requires       : Admin role in the application
    Author         : GitHub Copilot
    Date           : December 2025
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipPreview,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipVerification,
    
    [Parameter(Mandatory=$false)]
    [string]$AdminId,
    
    [Parameter(Mandatory=$false)]
    [string]$AdminUsername
)

# Colors for output
$ErrorColor = "Red"
$WarningColor = "Yellow"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$HighlightColor = "Magenta"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor $HighlightColor
    Write-Host " $Title" -ForegroundColor $HighlightColor
    Write-Host ("=" * 70) -ForegroundColor $HighlightColor
    Write-Host ""
}

function Get-AdminUserId {
    param([string]$Username)
    
    Write-ColorOutput "🔍 Looking up admin user: $Username..." $InfoColor
    
    $query = @"
{
  "path": "users:list",
  "args": {}
}
"@
    
    try {
        $result = npx convex run users:list --no-push 2>&1 | ConvertFrom-Json
        $admin = $result | Where-Object { $_.username -eq $Username -and $_.role -eq "admin" }
        
        if ($admin) {
            Write-ColorOutput "✅ Found admin: $($admin.username) (ID: $($admin._id))" $SuccessColor
            return $admin._id
        } else {
            Write-ColorOutput "❌ Admin user '$Username' not found" $ErrorColor
            return $null
        }
    } catch {
        Write-ColorOutput "❌ Error looking up user: $_" $ErrorColor
        return $null
    }
}

function Invoke-ConvexFunction {
    param(
        [string]$FunctionPath,
        [hashtable]$Args
    )
    
    $argsJson = $Args | ConvertTo-Json -Compress
    
    try {
        Write-ColorOutput "📡 Calling: $FunctionPath" $InfoColor
        $result = npx convex run $FunctionPath "$argsJson" --no-push 2>&1
        
        # Try to parse as JSON
        try {
            return $result | ConvertFrom-Json
        } catch {
            # If not JSON, return as string
            return $result
        }
    } catch {
        Write-ColorOutput "❌ Error calling function: $_" $ErrorColor
        throw
    }
}

# ============================================================
# MAIN SCRIPT
# ============================================================

Write-Section "🚀 Complete Guardian to Provider Migration"

Write-ColorOutput "This script will migrate:" $InfoColor
Write-ColorOutput "  1️⃣  Guardian users → Provider entities" $InfoColor
Write-ColorOutput "  2️⃣  Self-reference students → '{Teacher'sPVTclass}' pseudo-providers" $InfoColor
Write-ColorOutput "  3️⃣  All student/class relationships" $InfoColor
Write-Host ""

# Step 0: Verify Convex is available
Write-ColorOutput "🔍 Checking Convex CLI..." $InfoColor
try {
    $convexVersion = npx convex --version 2>&1
    Write-ColorOutput "✅ Convex CLI found: $convexVersion" $SuccessColor
} catch {
    Write-ColorOutput "❌ Convex CLI not found. Please install: npm install -g convex" $ErrorColor
    exit 1
}

# Step 1: Preview Migration (unless skipped)
if (-not $SkipPreview) {
    Write-Section "📋 STEP 1: Preview Migration"
    
    try {
        $preview = Invoke-ConvexFunction -FunctionPath "migrations/completeGuardianMigration:previewMigration" -Args @{}
        
        Write-ColorOutput "`n$($preview.message)" $InfoColor
        Write-Host ""
        Write-ColorOutput "Summary:" $HighlightColor
        Write-ColorOutput "  Guardian Users: $($preview.summary.guardianUsers)" $InfoColor
        Write-ColorOutput "  Students with Guardian ID: $($preview.summary.studentsWithGuardianId)" $InfoColor
        Write-ColorOutput "  Self-Reference Students: $($preview.summary.selfReferenceStudents)" $InfoColor
        Write-ColorOutput "  Guardian Linked Classes: $($preview.summary.guardianLinkedClasses)" $InfoColor
        Write-ColorOutput "  Self-Reference Classes: $($preview.summary.selfReferenceClasses)" $InfoColor
        Write-ColorOutput "  Teachers Needing Pseudo-Provider: $($preview.summary.teachersNeedingPseudoProvider)" $InfoColor
        
        if ($preview.summary.guardianUsers -eq 0 -and $preview.summary.selfReferenceStudents -eq 0) {
            Write-ColorOutput "`n✅ No migration needed - all data already migrated!" $SuccessColor
            exit 0
        }
        
    } catch {
        Write-ColorOutput "❌ Error during preview: $_" $ErrorColor
        exit 1
    }
    
    if (-not $DryRun) {
        Write-Host ""
        $continue = Read-Host "Continue with migration? (yes/no)"
        if ($continue -ne "yes") {
            Write-ColorOutput "❌ Migration cancelled by user" $WarningColor
            exit 0
        }
    }
} else {
    Write-ColorOutput "⏭️  Skipping preview step" $WarningColor
}

# Step 2: Get Admin ID
if (-not $AdminId) {
    if ($AdminUsername) {
        $AdminId = Get-AdminUserId -Username $AdminUsername
        if (-not $AdminId) {
            Write-ColorOutput "❌ Could not find admin user: $AdminUsername" $ErrorColor
            exit 1
        }
    } else {
        Write-Host ""
        $username = Read-Host "Enter admin username"
        $AdminId = Get-AdminUserId -Username $username
        if (-not $AdminId) {
            Write-ColorOutput "❌ Could not find admin user: $username" $ErrorColor
            exit 1
        }
    }
}

# Step 3: Run Migration
Write-Section "🚀 STEP 2: Running Migration"

if ($DryRun) {
    Write-ColorOutput "⚠️  DRY RUN MODE - No changes will be made" $WarningColor
} else {
    Write-ColorOutput "⚠️  LIVE MODE - Changes will be applied!" $WarningColor
    Write-Host ""
    $confirm = Read-Host "Type 'MIGRATE' to confirm"
    if ($confirm -ne "MIGRATE") {
        Write-ColorOutput "❌ Migration cancelled - confirmation not provided" $ErrorColor
        exit 0
    }
}

try {
    $migrationResult = Invoke-ConvexFunction -FunctionPath "migrations/completeGuardianMigration:migrateToProvider" -Args @{
        adminId = $AdminId
        dryRun = $DryRun.IsPresent
    }
    
    Write-Host ""
    Write-ColorOutput $migrationResult.summary $SuccessColor
    
    # Show errors if any
    $totalErrors = $migrationResult.guardianMigration.errors.Count + $migrationResult.pseudoProviderMigration.errors.Count
    if ($totalErrors -gt 0) {
        Write-ColorOutput "`n⚠️  Migration completed with $totalErrors errors:" $WarningColor
        
        if ($migrationResult.guardianMigration.errors.Count -gt 0) {
            Write-ColorOutput "`nGuardian Migration Errors:" $WarningColor
            foreach ($error in $migrationResult.guardianMigration.errors) {
                Write-ColorOutput "  - $($error.username): $($error.error)" $ErrorColor
            }
        }
        
        if ($migrationResult.pseudoProviderMigration.errors.Count -gt 0) {
            Write-ColorOutput "`nPseudo-Provider Migration Errors:" $WarningColor
            foreach ($error in $migrationResult.pseudoProviderMigration.errors) {
                Write-ColorOutput "  - Teacher $($error.teacherId): $($error.error)" $ErrorColor
            }
        }
    }
    
} catch {
    Write-ColorOutput "`n❌ Migration failed: $_" $ErrorColor
    exit 1
}

# Step 4: Verify Migration (unless skipped or dry-run)
if (-not $SkipVerification -and -not $DryRun) {
    Write-Section "✅ STEP 3: Verifying Migration"
    
    try {
        $verification = Invoke-ConvexFunction -FunctionPath "migrations/completeGuardianMigration:verifyMigration" -Args @{}
        
        Write-ColorOutput $verification.migrationStatus $SuccessColor
        Write-Host ""
        Write-ColorOutput "Counts:" $HighlightColor
        Write-ColorOutput "  Remaining Guardian Users: $($verification.counts.remainingGuardianUsers)" $InfoColor
        Write-ColorOutput "  Guardian Providers: $($verification.counts.guardianProviders)" $InfoColor
        Write-ColorOutput "  Pseudo-Providers: $($verification.counts.pseudoProviders)" $InfoColor
        Write-ColorOutput "  Students with Provider: $($verification.counts.studentsWithProvider)" $InfoColor
        Write-ColorOutput "  Students without Provider: $($verification.counts.studentsWithoutProvider)" $InfoColor
        Write-ColorOutput "  Classes with Provider: $($verification.counts.classesWithProvider)" $InfoColor
        Write-ColorOutput "  Classes without Provider: $($verification.counts.classesWithoutProvider)" $InfoColor
        
        Write-Host ""
        Write-ColorOutput "Recommendations:" $HighlightColor
        foreach ($rec in $verification.recommendations) {
            Write-ColorOutput "  $rec" $InfoColor
        }
        
        if ($verification.migrationComplete) {
            Write-Host ""
            Write-ColorOutput "🎉 Migration completed successfully!" $SuccessColor
        } else {
            Write-Host ""
            Write-ColorOutput "⚠️  Migration incomplete - review recommendations above" $WarningColor
        }
        
    } catch {
        Write-ColorOutput "`n❌ Verification failed: $_" $ErrorColor
        Write-ColorOutput "Migration may have completed, but verification check failed" $WarningColor
    }
} elseif ($DryRun) {
    Write-ColorOutput "`n💡 This was a dry run - no changes were made" $InfoColor
    Write-ColorOutput "💡 Run without -DryRun to apply changes" $InfoColor
}

Write-Host ""
Write-ColorOutput "=" * 70 $HighlightColor
Write-ColorOutput "Migration script completed" $SuccessColor
Write-ColorOutput "=" * 70 $HighlightColor
Write-Host ""
