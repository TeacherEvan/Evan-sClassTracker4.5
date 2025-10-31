# ====================================================================================
# WINDOWS TASK SCHEDULER SETUP FOR AUTOMATED BACKUPS
# ====================================================================================
#
# This script creates a Windows Task Scheduler task that runs the backup
# automatically every day at midnight (00:00).
#
# Usage:
#   1. Open PowerShell as Administrator
#   2. Navigate to this project directory
#   3. Run: .\scripts\setup-windows-backup-task.ps1
#
# Last Updated: October 31, 2025
# ====================================================================================

# Configuration
$TaskName = "ConvexBackupToMongoDB"
$Description = "Automated daily backup of Convex data to MongoDB at midnight"
$ProjectPath = $PSScriptRoot | Split-Path -Parent  # Parent directory of scripts folder
$BackupScript = Join-Path $ProjectPath "scripts\backup-to-mongodb.ts"
$NodePath = (Get-Command node).Path
$NpmPath = (Get-Command npm).Path

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Setting up automated Convex backup task" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 Project Path: $ProjectPath" -ForegroundColor Gray
Write-Host "📄 Backup Script: $BackupScript" -ForegroundColor Gray
Write-Host "🔧 Node Path: $NodePath" -ForegroundColor Gray
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$TaskName' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to replace it? (y/n)"
    
    if ($response -eq 'y' -or $response -eq 'Y') {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "✅ Removed existing task" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Cancelled" -ForegroundColor Red
        exit 0
    }
}

# Create the scheduled task action (run npm backup command)
$Action = New-ScheduledTaskAction `
    -Execute $NpmPath `
    -Argument "run backup" `
    -WorkingDirectory $ProjectPath

# Create the trigger (daily at midnight)
$Trigger = New-ScheduledTaskTrigger -Daily -At "00:00"

# Create settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Create the principal (run as current user)
$Principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType S4U `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $Description `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  ✅ Backup task created successfully!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Task Details:" -ForegroundColor Cyan
    Write-Host "   - Name: $TaskName" -ForegroundColor White
    Write-Host "   - Schedule: Daily at 00:00 (midnight)" -ForegroundColor White
    Write-Host "   - Command: npm run backup" -ForegroundColor White
    Write-Host "   - Working Directory: $ProjectPath" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Configure MongoDB connection in .env.local" -ForegroundColor White
    Write-Host "      Copy .env.backup.example and set MONGODB_BACKUP_URI" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Test the backup manually:" -ForegroundColor White
    Write-Host "      npm run backup" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. View scheduled task:" -ForegroundColor White
    Write-Host "      Task Scheduler → Task Scheduler Library → $TaskName" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   4. Run task manually (for testing):" -ForegroundColor White
    Write-Host "      schtasks /run /tn $TaskName" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   5. View task history:" -ForegroundColor White
    Write-Host "      Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo" -ForegroundColor Gray
    Write-Host ""
    
}
catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to create scheduled task" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Display task info
Write-Host "🔍 Task Status:" -ForegroundColor Cyan
$taskInfo = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
Write-Host "   - State: $($taskInfo.TaskState)" -ForegroundColor White
Write-Host "   - Last Run: $($taskInfo.LastRunTime)" -ForegroundColor White
Write-Host "   - Next Run: $($taskInfo.NextRunTime)" -ForegroundColor White
Write-Host ""

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
