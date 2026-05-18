# Force UTF-8 encoding
chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
$OutputEncoding = [System.Text.UTF8Encoding]::new()

$ErrorActionPreference = 'Stop'
$Repo = "prajwl-dh/cronify"

# -----------------------------
# Check Admin
# -----------------------------
$principal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent()
)

if (-not $principal.IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator
)) {
    Write-Host "❌ Run PowerShell as Administrator." -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "🚀 Installing Cronify..." -ForegroundColor Cyan

# -----------------------------
# Fetch latest release
# -----------------------------
$ApiUrl = "https://api.github.com/repos/$Repo/releases/latest"
$Release = Invoke-RestMethod -Uri $ApiUrl

$Asset = $Release.assets | Where-Object {
    $_.name -match "windows-x64\.zip"
} | Select-Object -First 1

if (-not $Asset) {
    throw "Windows asset not found."
}

# -----------------------------
# Temp paths
# -----------------------------
$TempZip = "$env:TEMP\cronify.zip"
$ExtractDir = "$env:TEMP\cronify_extract"

# -----------------------------
# Download
# -----------------------------
Write-Host "⬇️ Downloading..."
Invoke-WebRequest `
    -Uri $Asset.browser_download_url `
    -OutFile $TempZip

# -----------------------------
# Extract
# -----------------------------
Write-Host "📦 Extracting..."

if (Test-Path $ExtractDir) {
    Remove-Item $ExtractDir -Recurse -Force
}

Expand-Archive $TempZip $ExtractDir -Force

# -----------------------------
# Find EXE
# -----------------------------
$FoundExe = Get-ChildItem `
    -Path $ExtractDir `
    -Filter "cronify.exe" `
    -Recurse |
    Select-Object -First 1

if (-not $FoundExe) {
    throw "cronify.exe not found in archive."
}

# -----------------------------
# Install directory
# -----------------------------
$InstallDir = "$env:LOCALAPPDATA\Cronify"

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir | Out-Null
}

$ExePath = Join-Path $InstallDir "cronify.exe"

# -----------------------------
# Copy binary
# -----------------------------
Write-Host "📦 Installing binary to $InstallDir"

Copy-Item $FoundExe.FullName $ExePath -Force
Unblock-File $ExePath

# -----------------------------
# Cleanup
# -----------------------------
Remove-Item $TempZip -Force
Remove-Item $ExtractDir -Recurse -Force

# -----------------------------
# PATH update
# -----------------------------
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")

if ($UserPath -notlike "*$InstallDir*") {
    Write-Host "🌐 Adding to USER PATH..."
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$UserPath;$InstallDir",
        "User"
    )
}

# =========================================================
# 🔥 IMPORTANT: DIRECT INSTALL CALL (NO UAC WRAPPER YET)
# =========================================================

Write-Host ""
Write-Host "⚙️ Running: cronify install (DIRECT DEBUG CALL)" -ForegroundColor Yellow
Write-Host "--------------------------------------------"

$installOutput = & "$ExePath" install 2>&1
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "📤 OUTPUT:"
Write-Host $installOutput

Write-Host ""
Write-Host "📌 EXIT CODE: $exitCode"

if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "❌ INSTALL FAILED" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Installation complete"
