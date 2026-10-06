# Martian Macros task runner (PowerShell). Usage: .\mm.ps1 <command> [args]
# Run `.\mm.ps1 help` for commands. From cmd.exe, use mm.cmd.
$ErrorActionPreference = 'Stop'
$script = Join-Path $PSScriptRoot 'tool/bin/mm.dart'

if ($env:MM_FLUTTER_ROOT) {
    & (Join-Path $env:MM_FLUTTER_ROOT 'bin/dart') $script @args
} elseif ((Test-Path (Join-Path $PSScriptRoot '.fvmrc')) -and (Get-Command fvm -ErrorAction SilentlyContinue)) {
    & fvm dart $script @args
} elseif (Get-Command dart -ErrorAction SilentlyContinue) {
    & dart $script @args
} else {
    Write-Host @'
No Flutter/Dart toolchain found. One-time setup:
  1. Install FVM:          choco install fvm   (or see https://fvm.app)
  2. Install pinned SDK:   fvm install          (reads .fvmrc)
  3. Then:                 .\mm bootstrap
Alternatively, set MM_FLUTTER_ROOT to an existing Flutter SDK directory.
'@ -ForegroundColor Yellow
    exit 1
}
exit $LASTEXITCODE
