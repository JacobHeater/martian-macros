#!/usr/bin/env sh
# Martian Macros task runner (macOS/Linux). Usage: ./mm <command> [args]
set -e
root="$(cd "$(dirname "$0")" && pwd)"
script="$root/tool/bin/mm.dart"

if [ -n "$MM_FLUTTER_ROOT" ]; then
  exec "$MM_FLUTTER_ROOT/bin/dart" "$script" "$@"
elif [ -f "$root/.fvmrc" ] && command -v fvm >/dev/null 2>&1; then
  exec fvm dart "$script" "$@"
elif command -v dart >/dev/null 2>&1; then
  exec dart "$script" "$@"
else
  cat >&2 <<'EOF'
No Flutter/Dart toolchain found. One-time setup:
  1. Install FVM:          brew install fvm   (or see https://fvm.app)
  2. Install pinned SDK:   fvm install        (reads .fvmrc)
  3. Then:                 ./mm bootstrap
Alternatively, set MM_FLUTTER_ROOT to an existing Flutter SDK directory.
EOF
  exit 1
fi
