---
id: MM-160
status: done
component: architecture
related: [MM-159, MM-104, MM-5, MM-2]
---

# Task: One declaration per file, enforced

## Context
See MM-159, rule 7. Twenty-four library files define more than one top-level type today. A rule that is only written down decays, so the same change adds the check.

## Decisions
Made with the product owner: every model, interface, class, enum, extension and type alias has its own file; no file defines more than one module.

Choices I made without asking (say if any is wrong):
- **`mm arch`** is a new `tool/` command, run by `mm check`. It scans every `.dart` file under `apps/`, `packages/` and `tool/` (skipping `*.g.dart`, `build/`, `.dart_tool/` and generated migration tests) and fails when a file declares more than one top-level type, extension or typedef.
- **A baseline file** (`tool/arch_baseline.txt`) lists today's offending files so the check can start passing now. The check fails on a file that is not in the baseline, and **also fails when a baseline file has been fixed and not removed**, so the list can only shrink.
- **File names are the type's name in snake_case** (`MacroBar` in `macro_bar.dart`); a file that disagrees fails the check. Extensions are named for what they do (`goal_mode_label.dart`).
- **Order of the split**: `domain`, `engine`, `data`, `tool`, then `apps/mobile`. Each package is one commit with `mm check` green. The app's screens are split together with their migration to design-system components (MM-104), because splitting a screen twice is waste; until then they stay in the baseline.
- **Barrels**: each package keeps one public library file that `export`s the individual files. A barrel declares nothing.
- **Drift tables** each get a file; `database.dart` declares only `AppDatabase`; the migration step type and the exception each get a file.
- **Private nested helpers** (`_DayPicker`, `_Macro`) become public components in their own files, or are removed; they are not exempt.

## Description
The command, its baseline, and the splitting of every baselined file in `packages/*` and `tool/`. Behavior of the app does not change.

## Acceptance Criteria
```gherkin
Scenario: A new file with two classes
  Given a file under packages/ that declares two top-level classes and is not in the baseline
  When "mm arch" is run
  Then it names the file and the two types, and exits non-zero

Scenario: A fixed file left in the baseline
  Given a baseline entry whose file now declares one type
  Then "mm arch" fails and says to remove it from the baseline

Scenario: Name mismatch
  Given a file named util.dart that declares only class MacroBar
  Then "mm arch" reports that the file should be macro_bar.dart

Scenario: Generated code is exempt
  Given database.g.dart, which declares many types
  Then "mm arch" does not report it

Scenario: Packages are clean
  When the split is done for domain, engine, data and tool
  Then none of their files is in the baseline and mm check passes

Scenario: No behavior change
  Then every existing test passes unchanged except import paths
```

## Notes
- `mm check` order: format, req, arch, analyze, test.
- A barrel file (only `export` lines) is allowed and is recognized by having no declarations.
- Splitting `database.dart` changes what Drift's generator sees; run `mm gen` and `mm schema`'s snapshot test to prove the schema did not change.

## Notes (built and verified)
- `tool/src/arch/` (itself one declaration per file) with tests in `tool/test/`. `mm arch` runs in `mm check`. It checks one declaration per file, that the file is named for it,
  layering imports (MM-161, MM-162) and raw Material controls (MM-163).
- The split is complete: `domain`, `engine`, `data`, `tool` and `apps/mobile` (284 Dart files). **`tool/arch_baseline.txt` is empty**, so nothing is exempt.
- `tool` is now a tested package and part of `mm test`. The Drift schema snapshot test passes unchanged after the split.
- **Sealed hierarchies**: Dart requires the subtypes of a `sealed` class to share a library. `Outcome` keeps one declaration per file by making its cases `part of` files. This is the only
  use of `part` other than Drift's generated code.
- **Public State classes**: where a screen needs state, the `State` class is public in its own file (`OnboardingScreenState`, `AddFoodSheetState`, ...). The rule forces it; widgets that can be
  stateless are.
- Top-level functions and constants are not "types": a file may hold one function or a cohesive group (`coach_constants.dart`); they never share a file with a type.
- **Not verified**: the split was checked by analysis and the tests, and the app was seen on the Android emulator (Today, Coach, Progress). Settings and Onboarding were exercised by widget
  tests only.
