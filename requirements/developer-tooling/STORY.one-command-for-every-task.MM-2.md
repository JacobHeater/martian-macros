---
id: MM-2
status: done
component: developer-tooling
related: [MM-1, MM-4, MM-5, MM-6]
---

# Story: One command for every task, on every operating system

## Context
See MM-1. The first scaffold needed raw `flutter` commands and had no shared scripts.

## Decisions (made with the product owner)
- **Scripts must work on Windows, macOS and Linux**, and hide direct Flutter CLI calls.
- **Windows is the primary development machine**; the launchers are written for it first.

Choices I made without asking (say if any is wrong):
- **The runner is pure Dart with zero dependencies**, started as a script (`dart tool/bin/mm.dart`), so it runs before `pub get` has ever
  been run (one of its jobs is to run it). Make is not native on Windows, and Melos or Grind would add a dependency to solve a problem a
  200-line script solves.
- **Environment is chosen with `--env dev|prod`**, which passes `--dart-define-from-file=config/<env>.json`.
- **An iOS build on a non-macOS host stops with a clear message** and a distinct exit code, not a Flutter stack trace.

## Description
`mm <command>` from the repository root, through `.\mm` (PowerShell), `mm` (cmd.exe) or `./mm` (macOS, Linux, WSL):

| command | does |
|---|---|
| `bootstrap` | resolves dependencies for the whole workspace |
| `check` | the CI gate: format check, requirements check, analyze, every test |
| `test [path ...]` | tests every package, or only the named ones |
| `analyze`, `format [--check]` | static analysis; formatting |
| `gen` | runs `build_runner` in packages that use it |
| `run [--env ..]` | runs the app (see MM-3) |
| `build android\|ios [--env ..]` | builds an app bundle or IPA |
| `clean` | removes build outputs |

When no Flutter or Dart is found, the launcher prints the setup steps instead of a shell error.

## Acceptance Criteria
```gherkin
Scenario: The same command on each operating system
  Given a machine with the pinned Flutter installed
  When "mm check" is run from PowerShell, cmd.exe, or a POSIX shell
  Then it formats, validates requirements, analyzes and tests every package, and exits 0 when all pass

Scenario: No toolchain installed
  Given a machine with no Flutter or Dart on PATH
  When any mm command is run
  Then the launcher prints the one-time setup steps and exits non-zero

Scenario: iOS build off macOS
  When "mm build ios" is run on Windows or Linux
  Then it says iOS builds need macOS and does not start a build

Scenario: Testing one package
  When "mm test packages/engine" is run
  Then only the engine package's tests run
```

## Notes (built and verified)
- `tool/bin/mm.dart`, `tool/src/commands.dart`, `tool/src/toolchain.dart`; launchers `mm.ps1`, `mm.cmd`, `mm` at the root.
- Verified by running on native Windows (PowerShell via `mm.cmd`) and in WSL Ubuntu (`sh ./mm`). The no-toolchain message was seen on
  Windows before Flutter was installed. **Not verified on macOS.** The iOS-off-macOS message has not been exercised.
- `./mm` needs its executable bit set in git (`git update-index --chmod=+x mm`) the first time it is committed from Windows; until then
  `sh mm` works.
