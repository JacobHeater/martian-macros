#!/usr/bin/env sh
# Martian Macros task runner (macOS/Linux). Usage: ./mm <command> [args]
# TypeScript run by Node itself (22.18+); no build step.
set -e
root="$(cd "$(dirname "$0")" && pwd)"
exec node "$root/tool/mm.ts" "$@"
