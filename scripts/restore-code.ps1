param(
    [string]$BackupPath = "",
    [string]$DestinationRoot = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$backupRoot = Join-Path $repoRoot "backups"

if ([string]::IsNullOrWhiteSpace($BackupPath)) {
    if (-not (Test-Path $backupRoot)) {
        throw "No backups directory found at $backupRoot"
    }

    $latest = Get-ChildItem -Path $backupRoot -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName "code\working-tree.zip") } |
        Sort-Object Name -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw "No code backup found under $backupRoot"
    }

    $BackupPath = $latest.FullName
}

$snapshotZip = Join-Path $BackupPath "code\working-tree.zip"
if (-not (Test-Path $snapshotZip)) {
    throw "Code snapshot not found: $snapshotZip"
}

if ([string]::IsNullOrWhiteSpace($DestinationRoot)) {
    $DestinationRoot = Join-Path $repoRoot "restored"
}

$restoreDir = Join-Path $DestinationRoot ("restore-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $restoreDir -Force | Out-Null

Expand-Archive -Path $snapshotZip -DestinationPath $restoreDir -Force

Write-Host "Code restore extracted successfully."
Write-Host "Restored files at: $restoreDir"