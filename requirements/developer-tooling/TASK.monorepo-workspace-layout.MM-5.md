---
id: MM-5
status: done
component: developer-tooling
related: [MM-1, MM-2]
---

# Task: One workspace, with the engine kept free of Flutter

## Context
The first scaffold was a single Flutter app at the repository root. The metabolic engine is the part that most needs to be exact and
testable, and it should not need a device, a widget tree or Flutter to test.

## Decisions (made with the product owner)
- **A monorepo**, structured as I recommend.

Choices I made without asking (say if any is wrong):
- **Native Dart pub workspaces**, not Melos: one lockfile and one resolution, with no extra tool.
- **Layers as packages**, each depending only on those above it in this list:

| package | holds | Flutter? |
|---|---|---|
| `packages/domain` (`mm_domain`) | entities, units, `BiologicalSex`, observations, screening | no |
| `packages/engine` (`mm_engine`) | trend, energy expenditure, partition, safety bounds, targets, coach | no |
| `packages/data` (`mm_data`) | the SQLite database and `MmStore` | no |
| `apps/mobile` (`martian_macros`) | screens and state only | yes |
| `tool` (`mm_tool`) | the task runner | no |

- **The app id stays `com.martianmacros.martian_macros`**, as in the first scaffold.

## Acceptance Criteria
```gherkin
Scenario: One resolution
  When "mm bootstrap" is run at the root
  Then every package's dependencies are resolved into a single pubspec.lock

Scenario: The engine tests without Flutter
  When "dart test" is run in packages/engine
  Then the tests run with no Flutter SDK features and no device

Scenario: The app sees only domain objects
  Then no file under apps/mobile imports a database table or row type
```

## Notes (built and verified)
- Root `pubspec.yaml` lists the workspace members; each member has `resolution: workspace`. Shared lints are in the root
  `analysis_options.yaml` (strict casts, inference and raw types).
- `mm_data` exports only `AppDatabase` (to be constructed with a platform executor) and `MmStore`.
