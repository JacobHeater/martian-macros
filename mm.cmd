@echo off
rem Martian Macros task runner (cmd.exe). Delegates to mm.ps1 without
rem requiring a relaxed PowerShell execution policy.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mm.ps1" %*
exit /b %ERRORLEVEL%
