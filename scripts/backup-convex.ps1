# Convex Backup Script
# Purpose: Automated daily backup of Convex production data
# Usage: pwsh -File scripts/backup-convex.ps1

param(
    [string]$BackupPath = "./backups",
    [switch]$IncludeFileStorage = $true,
    [switch]$UploadToCloud = $false,
    [string]$CloudProvider = "none",  # Options: "s3", "r2", "azure", "gcs", "none"
    [int]$RetentionDays = 30
)

# Configuration
$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyy-MM-dd-HHmm"
$BackupFilename = "convex-backup-$Date.zip"
$FullBackupPath = Join-Path $BackupPath $BackupFilename

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Failure { Write-Host $args -ForegroundColor Red }

Write-Info "🔄 Starting Convex backup process..."
Write-Info "📅 Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Info "📁 Backup path: $FullBackupPath"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupPath)) {
    Write-Info "📁 Creating backup directory: $BackupPath"
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
}

# Export from Convex
Write-Info "📤 Exporting data from Convex production deployment..."

try {
    $exportArgs = @(
        "convex", "export",
        "--path", $FullBackupPath,
        "--prod"
    )
    
    if ($IncludeFileStorage) {
        $exportArgs += "--include-file-storage"
        Write-Info "📦 Including file storage in backup"
    }
    
    $startTime = Get-Date
    $exportProcess = Start-Process -FilePath "npx" -ArgumentList $exportArgs -NoNewWindow -Wait -PassThru
    $duration = (Get-Date) - $startTime
    
    if ($exportProcess.ExitCode -ne 0) {
        throw "Convex export failed with exit code $($exportProcess.ExitCode)"
    }
    
    # Get file size
    $fileSize = (Get-Item $FullBackupPath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    
    Write-Success "✅ Export complete!"
    Write-Info "⏱️  Duration: $($duration.TotalSeconds) seconds"
    Write-Info "📊 File size: $fileSizeMB MB"
    
} catch {
    Write-Failure "❌ Convex export failed: $_"
    exit 1
}

# Upload to cloud storage (if configured)
if ($UploadToCloud -and $CloudProvider -ne "none") {
    Write-Info "☁️  Uploading to $CloudProvider..."
    
    try {
        switch ($CloudProvider.ToLower()) {
            "s3" {
                # AWS S3
                if (-not $env:AWS_S3_BUCKET) {
                    throw "AWS_S3_BUCKET environment variable not set"
                }
                
                aws s3 cp $FullBackupPath "s3://$env:AWS_S3_BUCKET/convex-backups/$BackupFilename"
                Write-Success "✅ Uploaded to S3: s3://$env:AWS_S3_BUCKET/convex-backups/$BackupFilename"
            }
            
            "r2" {
                # Cloudflare R2
                if (-not $env:R2_BUCKET) {
                    throw "R2_BUCKET environment variable not set"
                }
                
                # Requires wrangler CLI: npm install -g wrangler
                wrangler r2 object put "$env:R2_BUCKET/convex-backups/$BackupFilename" --file=$FullBackupPath
                Write-Success "✅ Uploaded to Cloudflare R2: $env:R2_BUCKET/convex-backups/$BackupFilename"
            }
            
            "azure" {
                # Azure Blob Storage
                if (-not $env:AZURE_STORAGE_ACCOUNT -or -not $env:AZURE_STORAGE_CONTAINER) {
                    throw "AZURE_STORAGE_ACCOUNT or AZURE_STORAGE_CONTAINER environment variable not set"
                }
                
                az storage blob upload `
                    --account-name $env:AZURE_STORAGE_ACCOUNT `
                    --container-name $env:AZURE_STORAGE_CONTAINER `
                    --name "convex-backups/$BackupFilename" `
                    --file $FullBackupPath
                
                Write-Success "✅ Uploaded to Azure Blob Storage: $env:AZURE_STORAGE_CONTAINER/convex-backups/$BackupFilename"
            }
            
            "gcs" {
                # Google Cloud Storage
                if (-not $env:GCS_BUCKET) {
                    throw "GCS_BUCKET environment variable not set"
                }
                
                gsutil cp $FullBackupPath "gs://$env:GCS_BUCKET/convex-backups/$BackupFilename"
                Write-Success "✅ Uploaded to GCS: gs://$env:GCS_BUCKET/convex-backups/$BackupFilename"
            }
            
            default {
                Write-Warning "⚠️  Unknown cloud provider: $CloudProvider (skipping upload)"
            }
        }
    } catch {
        Write-Failure "❌ Cloud upload failed: $_"
        Write-Warning "⚠️  Local backup retained: $FullBackupPath"
    }
}

# Clean up old backups (retention policy)
Write-Info "🧹 Cleaning up old backups (retention: $RetentionDays days)..."

try {
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldBackups = Get-ChildItem $BackupPath -Filter "convex-backup-*.zip" | 
        Where-Object { $_.LastWriteTime -lt $cutoffDate }
    
    if ($oldBackups) {
        foreach ($backup in $oldBackups) {
            Write-Info "🗑️  Deleting old backup: $($backup.Name) ($(Get-Date $backup.LastWriteTime -Format 'yyyy-MM-dd'))"
            Remove-Item $backup.FullName -Force
        }
        Write-Success "✅ Deleted $($oldBackups.Count) old backup(s)"
    } else {
        Write-Info "ℹ️  No old backups to delete"
    }
} catch {
    Write-Warning "⚠️  Failed to clean up old backups: $_"
}

# Summary
Write-Success ""
Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "✅ Backup Complete!"
Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "📁 Local backup: $FullBackupPath"
Write-Info "📊 File size: $fileSizeMB MB"
Write-Info "📅 Created: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

if ($UploadToCloud -and $CloudProvider -ne "none") {
    Write-Info "☁️  Cloud backup: Uploaded to $CloudProvider"
}

Write-Info "📆 Retention: $RetentionDays days"
Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit with success
exit 0
