param(
    [string]$BackupRoot = "",
    [switch]$SkipCode,
    [switch]$SkipDb
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

if ([string]::IsNullOrWhiteSpace($BackupRoot)) {
    $BackupRoot = Join-Path $repoRoot "backups"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $BackupRoot $timestamp
$codeDir = Join-Path $backupDir "code"
$dbDir = Join-Path $backupDir "db"
$tempSnapshotDir = Join-Path $backupDir "_snapshot_tmp"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Backup started at: $timestamp"
Write-Host "Backup folder: $backupDir"

if (-not $SkipCode) {
    Write-Host "Creating code backup..."

    Require-Command "git"
    New-Item -ItemType Directory -Path $codeDir -Force | Out-Null

    Push-Location $repoRoot
    try {
        $bundlePath = Join-Path $codeDir "repo.bundle"
        git bundle create $bundlePath --all | Out-Null

        $gitStatusPath = Join-Path $codeDir "git-status.txt"
        git status --short | Set-Content -Path $gitStatusPath

        New-Item -ItemType Directory -Path $tempSnapshotDir -Force | Out-Null

        $robocopyArgs = @(
            $repoRoot,
            $tempSnapshotDir,
            '/E',
            '/XD', '.git', 'node_modules', 'backups', 'restored', 'dist', 'build', '.vercel',
            '/XF', '*.log'
        )

        & robocopy @robocopyArgs | Out-Null
        $rc = $LASTEXITCODE
        if ($rc -ge 8) {
            throw "robocopy failed with exit code $rc"
        }

        $snapshotZip = Join-Path $codeDir "working-tree.zip"
        Compress-Archive -Path (Join-Path $tempSnapshotDir '*') -DestinationPath $snapshotZip -Force
    }
    finally {
        Pop-Location
        if (Test-Path $tempSnapshotDir) {
            Remove-Item -Path $tempSnapshotDir -Recurse -Force
        }
    }
}

if (-not $SkipDb) {
    Write-Host "Creating MongoDB backup..."

    Require-Command "mongodump"
    New-Item -ItemType Directory -Path $dbDir -Force | Out-Null

    $mongoUri = Get-MongoUri -ServerDir $serverDir
    & mongodump --uri="$mongoUri" --out "$dbDir"

    if ($LASTEXITCODE -ne 0) {
        throw "mongodump failed with exit code $LASTEXITCODE"
    }
}

Write-Host "Backup completed successfully."
Write-Host "Location: $backupDir"