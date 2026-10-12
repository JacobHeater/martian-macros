# Martian Macros task runner (PowerShell). Usage: .\mm.ps1 <command> [args]
# Run `.\mm.ps1 help` for commands. From cmd.exe, use mm.cmd.
# TypeScript run by Node itself (22.18+); no build step.
$ErrorActionPreference = 'Stop'
node --disable-warning=ExperimentalWarning (Join-Path $PSScriptRoot 'tool/mm.ts') @args
exit $LASTEXITCODE
