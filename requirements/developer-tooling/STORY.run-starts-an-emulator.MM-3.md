---
id: MM-3
status: done
component: developer-tooling
related: [MM-1, MM-2]
---

# Story: Running the app starts an emulator when nothing is connected

## Context
The first `mm run` on a fresh machine failed with "No supported devices connected": the emulator was not running, and Flutter only
offered Windows and browsers, which this app does not build for. Having to remember to start the emulator first is friction.

## Description
- `mm run` checks for a connected phone, tablet, or running emulator or simulator. If there is none it starts an installed emulator, waits
  for it, and then runs the app. An explicit `-d <device>` is passed through untouched.
- `mm emulator [id]` starts an emulator and waits for it; `mm emulator list` lists the installed ones.
- The emulator used is the one named, else the `MM_EMULATOR` environment variable, else the first installed.
- `mm emulator --cold` boots without the saved snapshot.

## Acceptance Criteria
```gherkin
Scenario: Nothing connected
  Given an installed emulator and no connected device
  When "mm run" is run
  Then the emulator is started, mm waits until it is connected, and the app is run on it

Scenario: A device is already connected
  Given a running emulator or a connected phone
  When "mm run" is run
  Then no emulator is started

Scenario: No emulator installed
  Given no connected device and no installed emulator
  When "mm run" is run
  Then it says to create one or plug in a device, and does not start a build

Scenario: An emulator that hangs while booting
  Given an emulator that never finishes booting
  When mm has waited three minutes
  Then it stops waiting and suggests "mm emulator --cold"
```

## Notes (built and verified)
- `_ensureDevice` and `_emulator` in `tool/src/commands.dart`; `mobileDeviceIds` and `emulatorIds` in `tool/src/toolchain.dart`.
- Connected devices come from `flutter devices --machine` (JSON). `flutter emulators` has no machine-readable mode, so its table is parsed;
  on Windows its bullet separators arrive in the wrong code page, so the output is decoded as UTF-8 and split on any non-ASCII separator.
- Why `--cold` exists: the first launch of a brand-new virtual device hung for over ten minutes restoring a saved snapshot (the emulator
  process had used two seconds of CPU). A cold boot fixed it.
- Verified on Windows: `mm emulator list`, `mm emulator` detecting a running device, `mm emulator --cold` booting one. The interactive
  `mm run` session itself was run by the product owner, not by an automated check.
