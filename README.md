# Martian Macros

Body-composition coaching for iOS and Android: adaptive energy expenditure,
progressive macro targets, and recomposition tracking, built with Flutter.
Offline-first; your health data never leaves the device unless you export an
encrypted backup.

## Quick start

All developer tasks go through one runner, `mm`, which works the same on
Windows, macOS, and Linux and wraps every Flutter/Dart CLI call.

| Shell              | Command          |
| ------------------ | ---------------- |
| PowerShell         | `.\mm <command>` |
| cmd.exe            | `mm <command>`   |
| macOS / Linux / WSL | `./mm <command>` (or `sh mm <command>`) |

One-time setup:

1. Install [FVM](https://fvm.app). The Flutter version is pinned in `.fvmrc`.
2. `fvm install`
3. `mm bootstrap`
4. `mm doctor` to verify.

If you already have a Flutter SDK, you can skip FVM by setting
`MM_FLUTTER_ROOT` to its directory.

## Commands

| Command | What it does |
| --- | --- |
| `mm doctor` | Checks the toolchain against the pinned version |
| `mm bootstrap` | Resolves dependencies for the whole workspace |
| `mm check` | CI gate: format check, analyze, all tests |
| `mm test [path ...]` | Tests every package, or only the given ones (e.g. `packages/engine`) |
| `mm analyze` / `mm format` | Static analysis / formatting (`--check` to verify only) |
| `mm run [--env dev\|prod]` | Runs the app with `config/<env>.json` defines; starts an emulator if no device is connected |
| `mm emulator [id] [--cold]` | Starts an emulator and waits for it (`mm emulator list` to list; `--cold` if it hangs on boot; `MM_EMULATOR` sets the default) |
| `mm build android\|ios` | Builds an app bundle or IPA (iOS requires macOS) |
| `mm gen` | Runs `build_runner` in packages that use it |
| `mm req` | Validates `requirements/` and prints the status board (`list`, `next`, `show MM-42`) |
| `mm clean` | Removes build outputs |

## Layout

```
apps/mobile/        Flutter app (UI only)
packages/domain/    Pure Dart: entities, units, BiologicalSex, observations, screening
packages/engine/    Pure Dart: weight trend, adaptive TDEE, partition, safety bounds, targets, coach
packages/data/      Pure Dart: Drift/SQLite database and the MmStore API (run `mm gen` after schema changes)
tool/               The mm task runner (zero dependencies)
config/             Per-environment --dart-define files
requirements/       Every epic, story, task, bug and spike, as files (start with its README)
roadmap/            What to build next and in what order: workstreams, dependencies, roadmap.json
docs/               Architecture overview
```

## Requirements come first

Work is tracked as tickets in [requirements/](requirements/README.md), each
with a short id such as `MM-42`. Before changing how the app behaves, write
or update the ticket for it; a pull request without one is rejected. Run
`mm req next` for the next id and `mm req` to check the folder.

This is a [pub workspace](https://dart.dev/tools/pub/workspaces): one
lockfile and one dependency resolution for all packages.

See [docs/architecture.md](docs/architecture.md) for the design and the
reasoning behind it.
