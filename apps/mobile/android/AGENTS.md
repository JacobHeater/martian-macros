# The Android shell (`android/`)

Read with [apps/mobile/AGENTS.md](../AGENTS.md) and the root
[AGENTS.md](../../../AGENTS.md).

- A Capacitor host and the app's own Kotlin plugins: `MmDb`, `MmPacks`,
  `MmReminders`, `MmScanner`, `MmHealth`. Each sits behind an interface in
  `src/platform/` (or `src/sql/native/`, `src/foodCatalog/download/native/`),
  and has a Swift twin in `ios/`. Change both together.
- A new native plugin needs a check on a release build, not only a debug one.
  You don't run builds locally: put the check on the owner's phone checklist
  in the handoff.
- Device and emulator screenshots verify native behavior only (plugins,
  permissions, persistence, notifications, the back button), never the design.
- `mm run --live` serves the app through Vite with live reload. Don't launch
  it with PowerShell redirection (`*>`, `2>&1`).
