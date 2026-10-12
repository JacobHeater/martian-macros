---
id: MM-230
status: in-progress
component: architecture
related: [MM-228, MM-229, MM-23, MM-24, MM-28, MM-30, MM-143]
---

# Task: Carry the engine and the rules over under test

## Context
Second part of MM-228. The coaching engine, the domain rules, health import
and the food catalog are 13,900 lines of pure Dart with 12,000 lines of tests
and an evidence register tied to named constants (MM-143). They decide
calorie targets, safety floors and the weight trend. A silent difference
after the move would be the worst defect this app can have, and nobody would
see it on a screen.

## Decisions (made by the product owner, 2026-10-12)
- **All of the Dart is converted to TypeScript.** Nothing is compiled from
  Dart to JavaScript and no Dart remains at the switch. The measurement
  under Progress showed compiling works; the owner chose one language.

Choices I made without asking (say if any is wrong):
- **"All" includes the `mm` task runner** as well as the packages. The
  Flutter app itself is converted by rebuilding its screens (MM-228 part 4).
- **Order:** domain, engine, health import, food catalog, fixtures, data,
  food pipeline, then the task runner. Each lands when its own tests pass.
- **The Dart tests are the reference.** Every Dart test is carried over with
  its source and must pass with the same expected values. A test is added
  only where TypeScript behaves differently from Dart and the difference
  could change a result.
- **One TypeScript file for each Dart declaration**, in the same folders, in
  `apps/web/src/`, so any file can be compared with the one it came from.
- **The Dart stays until the switch.** It is the behavior reference and the
  Flutter app still builds from it. A fix made in one is made in the other.
- **How Dart is written in TypeScript** is in `apps/web/README.md`
  ("Carrying Dart over"). The rules that guard results: rounding goes
  through one function that rounds a half away from zero as Dart does;
  typed numbers are read by one function that accepts what Dart accepts; a
  calendar day is one object per day, so days compare and key as they did.
- **Layers are enforced by a test**: `lang` imports nothing of ours and
  `domain` imports only `lang`. Each package gets its rule as it arrives.
- **The simulator (MM-30) is carried over with the engine** and its outcomes
  compared with the Dart ones.
- **The evidence register keeps guarding it**: the test that every constant
  has a row, and no row names something gone, moves with the engine.

## Description
The domain types, the engine, health import, the food catalog, the fixtures,
the data layer, the food pipeline and the task runner, in TypeScript, giving
the same answers as the Dart they replace.

## Acceptance Criteria
```gherkin
Scenario: The same answers
  Given every test of a Dart package
  When it is carried over and run against the TypeScript
  Then it passes with the same expected values

Scenario: The simulator agrees
  When the synthetic-user simulator is run through the new engine
  Then its outcomes match those it gives in Dart

Scenario: Nothing unexplained
  Then every constant that decides something about a body or about safety still has its row in the evidence register

Scenario: Layers hold
  Then a test fails if the domain imports the engine, the data layer or a screen

Scenario: No Dart is left
  Given the switch of MM-228
  Then the repository has no Dart source
```

## Progress
| Package | Dart source | Dart tests | TypeScript | Tests passing |
| --- | --- | --- | --- | --- |
| domain | 4,574 lines, 158 files | 102 | done | 105 (the 102, and 3 for what differs from Dart) |
| engine | 6,819 lines, 158 files | 567 | done | 573: all 567 (566 pass, 1 skipped for MM-173 as in Dart), and 6 added |
| health_ingest | 976 lines, 21 files | 71 | done | 71: all of them |
| food_catalog | 1,550 lines, 36 files | 2 files | not started | |
| fixtures | 3,541 lines, 54 files | | not started | |
| data | 20,359 lines, 48 files (most of it generated) | | not started | |
| food_pipeline | 922 lines, 22 files | | not started | |
| `mm` task runner | 8,361 lines | 191 | not started | |

**Domain (2026-10-12):** `apps/web/src/domain/` and `apps/web/src/lang/`.
The type check is clean and all 105 tests pass. Three things are written
differently from the Dart, on purpose:
- Lengths of time are numbers of milliseconds with `Ms` in the name
  (`pausedForMs`, `restTargetMs`, `durationMs`); JavaScript has no duration
  type.
- A repository's `watch...` returns a `Watched<T>` (subscribe, get the
  current value and each change, unsubscribe) in place of a Dart stream.
- A field Dart cleared by passing a function returning null is cleared in
  `copyWith` by giving its key as `undefined`; an absent key keeps it.

**Engine (2026-10-12):** `apps/web/src/engine/`, 169 files from the 158.
The type check is clean.
- **The simulator agrees exactly.** `test/engine/dartParity.test.ts` runs
  four simulated people through the whole weekly loop (58 check-ins: fat
  loss with sloppy logging, recomp, a woman with glycogen swings, lean gain)
  and compares each week's targets, expenditure estimate and true weight
  with what the Dart engine printed for the same runs. The largest
  difference is zero. The test allows one part in a billion.
- **The weight trend agrees exactly** with the Dart VM on a fixed 60-day
  series, to the last digit.
- **Dart's seeded random numbers are reproduced** in
  `test/support/DartRandom.ts`, checked against sequences printed by the
  Dart VM, so the simulation tests draw the same noise and keep their
  expected values.
- **Every one of the engine's 47 test files is carried over.** All 567
  tests run with the same expected values: 566 pass and one is skipped for
  the open defect MM-173, exactly as in Dart. None needed its expected value
  changed. The evidence register test reads the constants out of the
  TypeScript source, as the Dart one read them out of the Dart.
- **Six tests are added**: the four simulator comparisons, the trend's
  digit-for-digit check, and that holding a reduction that cannot be held
  is refused (Dart checked that with an `assert`, which is off in a release
  build).
- One thing was learned the hard way and is now in the conventions table: a
  default on a destructured parameter also replaces a key given as
  `undefined`, which Dart's does not do for an explicit `null`. It bit a test
  helper, not the engine; the engine has no parameter that is both nullable
  and defaulted.
- Written differently from the Dart: `Duration` arguments are milliseconds
  (`lastRestTargetMsOf`, `restTargetMsOf`, `placeTimeOfDay`'s
  `timeOfDayMs`); a Dart file with several declarations is one file each
  (`weight_event_effects.dart` became six); `assert` in `holdReduction` is a
  thrown error.

**Health import (2026-10-12):** `apps/web/src/healthIngest/`. All 71 tests
pass unchanged, most of them the two contract suites every health source
and every store must pass. The suites are in `apps/web/test/contracts/`,
not in `src/`, so the app's source never imports the test framework; the
real Health Connect plugin and the SQLite store will be run through the
same two. The fake source and the in-memory store stay in `src/`, under
`testing/`, because the demo uses them. A day is keyed by the time of its
local midnight, since two JavaScript dates for the same moment are not the
same map key.

**Measured on 2026-10-12 (compiling the Dart to JavaScript):**
- The packages' own Dart tests were run compiled to JavaScript on Node
  (`dart test -p node`), with no change to any source file:

  | Package | Passed | Failed | Why it failed |
  | --- | --- | --- | --- |
  | engine | 565 (1 skipped, MM-173) | 1 | The evidence register test reads a file from disk, which compiled Dart cannot do on Node |
  | domain | 101 | 1 | The Health Connect identifier test reads a file from disk, the same |
  | health_ingest | 71 | 0 | |
  | food_catalog | did not compile | | It imports `sqlite3`, which needs `dart:ffi` |

  No arithmetic test failed. The two failures are tests that read
  repository files and still run on the Dart VM.
- The weight trend was exposed to JavaScript through `dart:js_interop` in a
  30-line file, compiled with `dart compile js -O2`, and called from Node on
  a 60-day series with gaps and one outlier. Its output was the same text,
  digit for digit, as the same code run on the Dart VM. The compiled file
  was 68 kB (22 kB compressed) and the call took under 6 ms.

**What this shows:** compiled Dart gives the same numbers as native Dart on
everything the tests cover, and the trend alone is small. The engine and
the domain rules can stay one source, guarded by the tests they already
have, run both ways.

**Not measured yet:**
- The weekly check-in through the same boundary. It takes and returns far
  richer types than the trend, so it decides how much boundary code the
  compile route needs.
- The size of the whole engine compiled, not the trend alone.
- What porting to TypeScript costs. The source to port would be 6,700 lines
  of engine and 3,600 of domain, with their tests.
- Integers: Dart compiled to JavaScript has 53-bit integers. No test
  failed because of it, which is evidence and not proof.
- The simulator (MM-30) compiled.

**The food catalog needs its own answer.** It reads a SQLite pack through
`dart:ffi` and cannot be compiled to JavaScript as it is. Its search and
ranking rules are separable from its storage; that split belongs with the
data layer (MM-228 part 3).
