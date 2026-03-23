param(
    [string]$BackupPath = ""
)

$ErrorActionPreference = "Stop"

function Get-MongoUri {
    param([string]$ServerDir)

    if ($env:MONGO_URI) {
        return $env:MONGO_URI
    }

    $envPath = Join-Path $ServerDir ".env"
    if (-not (Test-Path $envPath)) {
        throw "MONGO_URI not found in environment and $envPath is missing."
    }

    $line = Get-Content $envPath | Where-Object { $_ -match '^\s*MONGO_URI\s*=' } | Select-Object -First 1
    if (-not $line) {
        throw "MONGO_URI is missing in $envPath"
    }

    return (($line -split '=', 2)[1]).Trim()
}

function Require-Command {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "$CommandName is not installed or not available in PATH."
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverDir = Join-Path $repoRoot "server"
$backupRoot = Join-Path $repoRoot "backups"

Require-Command "mongorestore"

if ([string]::IsNullOrWhiteSpace($BackupPath)) {
    if (-not (Test-Path $backupRoot)) {
        throw "No backups directory found at $backupRoot"
    }

    $latest = Get-ChildItem -Path $backupRoot -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName "db") } |
        Sort-Object Name -Descending |
        Select-Object -First 1

    if (-not $latest) {
        throw "No DB backup found under $backupRoot"
    }

    $BackupPath = $latest.FullName
}

$dbPath = Join-Path $BackupPath "db"
if (-not (Test-Path $dbPath)) {
    throw "DB backup folder not found: $dbPath"
}

$mongoUri = Get-MongoUri -ServerDir $serverDir

Write-Host "Restoring MongoDB from: $dbPath"
& mongorestore --uri="$mongoUri" --drop "$dbPath"

if ($LASTEXITCODE -ne 0) {
    throw "mongorestore failed with exit code $LASTEXITCODE"
}

Write-Host "MongoDB restore completed successfully."