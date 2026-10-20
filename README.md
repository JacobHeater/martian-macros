# Martian Macros

Body-composition coaching for Android: adaptive energy expenditure,
progressive macro targets, and recomposition tracking, built as a React app
inside a thin native shell (MM-228). Offline-first; your health data never
leaves the device unless you export an encrypted backup.

## Quick start

All developer tasks go through one runner, `mm`, which works the same on
Windows, macOS, and Linux. It is TypeScript run by Node itself — no build
step and no toolchain beyond Node.

| Shell              | Command          |
| ------------------ | ---------------- |
| PowerShell         | `.\mm <command>` |
| cmd.exe            | `mm <command>`   |
| macOS / Linux / WSL | `./mm <command>` (or `sh mm <command>`) |

One-time setup:

1. Install [Node](https://nodejs.org) 22.18 or newer (23.6+/24 also fine).
2. `mm bootstrap`
3. `mm doctor` to verify.

Android builds also need a JDK (21) and the Android SDK (`ANDROID_HOME`).
iOS builds need a Mac with Xcode 26.3 or newer (MM-403); a phone needs a
signing team, see [docs/ios-signing.md](docs/ios-signing.md).

## Commands

| Command | What it does |
| --- | --- |
| `mm doctor` | Checks the toolchain |
| `mm bootstrap` | Installs the exact dependencies from the lock file, and opts this machine out of Capacitor's telemetry (MM-243) |
| `mm check` | CI gate: requirements, panel, the tool's tests, then the web check (type check, tests, build, offline) |
| `mm web` | The web check alone |
| `mm test [--tool]` | The tool's tests, then the web suite (`--tool` for the tool alone) |
| `mm run [--env dev\|prod\|phone] [-d DEVICE]` | Builds, installs and launches; `--env phone` selects the one physical phone, never an emulator; `--env prod` is the real app, otherwise the dev twin |
| `mm run --ios [-d UDID] [--env prod\|dev\|demo]` | Builds, installs and launches on an iPhone simulator (`MM_SIMULATOR` sets the default); the dev twin unless said |
| `mm run --ios --phone [name \| id] [--env prod\|dev\|demo]` | Builds signed, installs and opens on the iPhone plugged in (`MM_IPHONE` sets the default; `MM_APPLE_TEAM` the signing team); the real app unless said |
| `mm demo [--seed] -d <Android device ID>` | The isolated DEMO app on an exact device; `--seed` starts it from the demo scenario on every launch |
| `mm screenshot [-d DEVICE] [path] [--clipboard]` | A device's screen as a PNG, for native behavior verification (design review is Storybook's); `--clipboard` puts it on the clipboard, instead of a file when no path is given; a simulator by its UDID |
| `mm emulator [id] [--cold]` | Starts an emulator and waits for it (`mm emulator list` to list; `--cold` if it hangs on boot; `MM_EMULATOR` sets the default) |
| `mm simulator [name \| udid]` | Starts an iPhone simulator and waits for it (`mm simulator list` to list) |
| `mm build android [--release] [--env prod\|dev]` | Builds the web app, syncs the shell and assembles the APK |
| `mm build ios [--release] [--phone] [--env prod\|dev]` | Builds the web app, syncs the iOS shell and builds it for the simulator (no signing), or signed for a phone |
| `mm food fetch\|build\|package` | Builds the food packs (MM-52); `build` needs DuckDB on PATH |
| `mm storybook [build]` | The design register: every token, icon, component and screen as built, in a browser (MM-237) |
| `mm req` | Validates `requirements/` and prints the status board (`list`, `next`, `show MM-42`) |
| `mm roadmap [--check]` | Writes `roadmap/progress.html`, the progress page |
| `mm ci` | Watches pull request checks without waiting (`mm ci help`) |
| `mm panel [run-dir]` | Validates expert-panel roles, Claude/Copilot adapters, research templates and optionally saved run state |
| `mm clean` | Removes build outputs |

## Repository expert panel

The [tool-neutral panel](agents/README.md) is development tooling, not part of
the app. It provides independent domain reviews, targeted challenges and
single-owner edits, with [portable checkpoint artifacts](agents/run-state.md).
See [native invocation and Claude-to-Copilot handoff examples](agents/native-surfaces.md)
for read-only adapters, sequential fallback and unverified surface limitations.

## Three identities

The app installs under three ids, on Android and iOS alike (MM-8): the real
app **Martian Macros** (`com.martianmacros`), the development twin
**Martian Macros Dev** (`com.martianmacros.dev`) that sits beside it so a
development build never replaces your data, and the seeded demo **Martian
Macros DEMO** (`com.martianmacros.demo`). `mm run` and `mm build` make the
dev twin unless `--env prod`; `mm demo` makes the demo.

## Isolated demo

The demo can never share another identity's sandbox. Connect a
USB-debugging-authorized Android phone (or an already running emulator),
list device IDs with `adb devices`, then run:

```powershell
.\mm.cmd demo -d <exact-Android-device-ID>
.\mm.cmd demo --seed -d <exact-Android-device-ID>
```

The command requires an explicit Android ID and does not start emulators or
choose a phone implicitly. With `--seed` the build starts from the
deterministic demo scenario on every launch (seventy days of history,
anchored to the phone's current day) and shows a DEMO strip on every screen
(MM-177); without it the demo app's data is left as it is. A normal `mm run`
or `mm build` never seeds.

## Layout

```
apps/mobile/           The app: React + TypeScript (src/), its tests (test/) and the native shells (android/, ios/)
tool/               The mm task runner: TypeScript run by Node, zero dependencies
config/             Per-environment build values (the food-pack manifest address)
requirements/       Every epic, story, task, bug and spike, as files (start with its README)
roadmap/            What to build next and in what order: workstreams, dependencies, roadmap.json
docs/               Architecture overview
```

Inside `apps/mobile/src`, the layers the Dart packages kept apart stay apart —
`lang`, `domain`, `engine`, `healthIngest`, `sql`, `foodCatalog`,
`foodPipeline`, `fixtures`, `data`, `format`, `platform`, `state`, then the
screens — enforced by `test/layers.test.ts`.

## Requirements come first

Work is tracked as tickets in [requirements/](requirements/README.md), each
with a short id such as `MM-42`. Before changing how the app behaves, write
or update the ticket for it; a pull request without one is rejected. Run
`mm req next` for the next id and `mm req` to check the folder.

See [docs/architecture.md](docs/architecture.md) for the design and the
reasoning behind it.
