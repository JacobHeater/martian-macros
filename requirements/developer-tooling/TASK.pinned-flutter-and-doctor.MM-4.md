---
id: MM-4
status: done
component: developer-tooling
related: [MM-1, MM-2]
---

# Task: A pinned Flutter version, and a doctor command that checks it

## Context
"Clone and run" only holds if everyone builds with the same Flutter. Without a pin, a contributor on a newer SDK gets different lints,
different generated code, and sometimes a different lockfile.

## Description
- `.fvmrc` pins the Flutter version (3.47.5 at the time of writing).
- The runner finds the toolchain in this order: the `MM_FLUTTER_ROOT` environment variable; FVM, when `.fvmrc` exists and `fvm` is on PATH;
  `flutter` and `dart` on PATH.
- `mm doctor` prints the operating system, which toolchain was found, the pinned version and the version found, and fails if they differ
  or Flutter is missing. Off macOS it notes that only Android can be built.

## Acceptance Criteria
```gherkin
Scenario: Versions agree
  Given FVM has installed the pinned version
  When "mm doctor" is run
  Then it prints "Toolchain OK" and exits 0

Scenario: Wrong version
  Given the Flutter on PATH is not the pinned version and FVM is absent
  When "mm doctor" is run
  Then it names both versions, says how to fix it, and exits non-zero

Scenario: An existing SDK without FVM
  Given MM_FLUTTER_ROOT points at a Flutter SDK
  When any mm command is run
  Then that SDK is used
```

## Notes (built and verified)
- `Toolchain.detect` and `_doctor`. Verified on Windows with FVM (pinned and found both 3.47.5) and in WSL with a snap-installed Flutter
  on PATH. The wrong-version and `MM_FLUTTER_ROOT` paths have not been exercised.
- A machine-specific trap worth recording: `fvm install` run from an elevated shell leaves the SDK folder owned by Administrators, and git
  then refuses to read it ("dubious ownership"), which stops Flutter from starting. The fix is
  `git config --global --add safe.directory <sdk path>`, or installing from a normal shell.
