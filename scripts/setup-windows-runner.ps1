# ============================================
# Windows Runner Setup Script
# One-time setup for ct201 Windows self-hosted runner
# ============================================
# Purpose: Pre-install build tools to eliminate runtime overhead
# Target: ct201 Windows runner
# Run: SSH to ct201 and execute this script as Administrator
# ============================================

param(
    [switch]$Verify,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Forge Windows Runner Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    exit 1
}

# Function to check if a command exists
function Test-CommandExists {
    param([string]$Command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        if (Get-Command $Command) { return $true }
    } catch { }
    finally {
        $ErrorActionPreference = $oldPreference
    }
    return $false
}

# Verify mode - just check what's installed
if ($Verify) {
    Write-Host "Verifying installed tools..." -ForegroundColor Yellow
    Write-Host ""

    $tools = @(
        @{Name="Chocolatey"; Command="choco"; Version="choco --version"},
        @{Name="Strawberry Perl"; Command="perl"; Version="perl --version"},
        @{Name="NASM"; Command="nasm"; Version="nasm -v"},
        @{Name="Rust"; Command="rustc"; Version="rustc --version"},
        @{Name="Cargo"; Command="cargo"; Version="cargo --version"}
    )

    foreach ($tool in $tools) {
        if (Test-CommandExists $tool.Command) {
            $version = Invoke-Expression $tool.Version 2>&1 | Select-Object -First 1
            Write-Host "  [OK] $($tool.Name): $version" -ForegroundColor Green
        } else {
            Write-Host "  [MISSING] $($tool.Name)" -ForegroundColor Red
        }
    }

    Write-Host ""
    exit 0
}

# ============================================
# Install Chocolatey (if not present)
# ============================================
Write-Host "[1/4] Checking Chocolatey..." -ForegroundColor Yellow

if (-not (Test-CommandExists "choco")) {
    Write-Host "  Installing Chocolatey..." -ForegroundColor Cyan
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "  Chocolatey already installed" -ForegroundColor Green
}

# ============================================
# Install Strawberry Perl
# ============================================
Write-Host "[2/4] Checking Strawberry Perl..." -ForegroundColor Yellow

if (-not (Test-CommandExists "perl") -or $Force) {
    Write-Host "  Installing Strawberry Perl..." -ForegroundColor Cyan
    choco install strawberryperl -y --no-progress

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "  Strawberry Perl already installed" -ForegroundColor Green
}

# ============================================
# Install NASM (Netwide Assembler)
# ============================================
Write-Host "[3/4] Checking NASM..." -ForegroundColor Yellow

if (-not (Test-CommandExists "nasm") -or $Force) {
    Write-Host "  Installing NASM..." -ForegroundColor Cyan
    choco install nasm -y --no-progress

    # Add NASM to PATH if not already there
    $nasmPath = "C:\Program Files\NASM"
    if (Test-Path $nasmPath) {
        $currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::Machine)
        if (-not $currentPath.Contains($nasmPath)) {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$nasmPath", [EnvironmentVariableTarget]::Machine)
            Write-Host "  Added NASM to system PATH" -ForegroundColor Cyan
        }
    }

    # Refresh PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "  NASM already installed" -ForegroundColor Green
}

# ============================================
# Verify Rust is installed
# ============================================
Write-Host "[4/4] Checking Rust toolchain..." -ForegroundColor Yellow

if (Test-CommandExists "rustc") {
    $rustVersion = rustc --version
    Write-Host "  Rust installed: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Rust not found. Install via rustup: https://rustup.rs" -ForegroundColor Yellow
}

# ============================================
# Final Verification
# ============================================
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Installation Complete" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Run verification
& $PSCommandPath -Verify

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart the GitHub Actions runner service" -ForegroundColor White
Write-Host "  2. Verify tools are available in a new CI job" -ForegroundColor White
Write-Host ""
