---
id: MM-557
status: done
component: developer-tooling
related: [MM-300, MM-412, MM-552, MM-8]
---

# Story: Live reload on the iPhone

## Context
The owner, 2026-10-22, tuning the Martian palette on their iPhone: "I want hot reload on iPhone so I don't have to keep
pushing." `mm run --live` (MM-300) serves the app from the Vite dev server on an Android device through adb reverse;
the iPhone run (MM-412) only builds, installs and opens the bundled app, a full Xcode build for every change.

## Decisions
- **`mm run --ios --phone --live [--port N]`** builds the shell once with its synced, git-ignored
  `capacitor.config.json` pointed at the dev server, installs and opens it, and keeps Vite running until Ctrl+C. A saved
  file under `apps/mobile/src` reloads on the phone.
- **Over the Wi-Fi the Mac and the phone share.** An iPhone has no adb reverse, so Vite listens on the Mac's own Wi-Fi
  address only (from `ipconfig getifaddr`, or `MM_LIVE_HOST`), never on every interface.
- **The identity is the phone run's**: the real app unless `--env dev|demo` (MM-412), so the owner sees their own data.
  While the session is off the live app cannot load; the command says to run `mm run --ios --phone` afterwards, and the
  next sync replaces the live URL.
- **Info.plist allows local networking only** (`NSAllowsLocalNetworking`, not arbitrary loads) and says why it asks
  for the local network. Both are development needs; MM-552's release gate covers them with the screenshot plugin.

## Acceptance Criteria
- [x] The plan serves on the Mac's address and port, and points the synced config there in cleartext, keeping its other keys (`tool/test/iosLivePlan.test.ts`).
- [x] A bad port or a missing address is a usage error, before anything is built.
- [x] Vite does not reload on the iOS shell's synced files.
- [x] `docs/ios-signing.md` and `mm help` describe the live run.
