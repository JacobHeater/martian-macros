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
| food_catalog | 1,550 lines, 36 files | 17 + the download's | reading, searching and writing packs done; downloading a pack is not (see MM-231) | 25: 17 carried over, the manifest's 2, and 6 added |
| fixtures | 3,541 lines, 54 files | 141 | done (it never touched SQLite; the first count here was wrong to say it waited) | 144: all 141 carried over and 3 added |
| data | 20,359 lines, 48 files (18,030 of them generated) | the contract suites and 22 of its own | done on the SQLite seam, with the schema at version 1 (MM-231); the 31 released upgrade steps and their 10 tests are not carried over, by that decision | 147: every contract suite (125 tests), 12 of its own carried over and 10 added |
| food_pipeline | 922 lines, 22 files | 30 | done, except its two command-line entry points, which move with the task runner | 36: all 30 carried over (one changed, below) and 6 added |
| the Flutter app's wording (`apps/mobile/lib/src/format`) | 1,293 lines, 50 files | none of its own: tested through the screens | done | 70, all new: 45 compare with what Dart printed, 25 test the sentences |
| the rest of the Flutter app (`apps/mobile`) | about 19,400 lines of screens and their state, 81 test files | | not started: rebuilt as screens (MM-228 part 4) | |
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
- **The food pipeline builds what the Dart pipeline built.**
  `test/foodPipeline/dartParity.test.ts` reads 230 invented candidates
  (shared barcodes, older versions, bad check digits, missing and impossible
  values, raw and cooked names) and compares the report and every row of
  both packs with what the Dart package made of the same files, under each
  of the three conflict rules. All equal. Not measured: a build from the
  real sources. The Dart pipeline wrote a pack straight to disk; this one
  builds it in memory and writes it out whole, and nobody has yet built the
  full barcode pack that way, so whether it fits in memory is unknown.
- One pipeline test changed: Dart installed a published pack through the
  app's download code, which is not carried over yet (MM-231). The test now
  unpacks the published file and reads it as a pack.
- **The fixtures are carried over**: an in-memory implementation of every
  repository and seam (`apps/web/src/fixtures/`) and the 23 contract suites
  any implementation must pass (`apps/web/test/contracts/`). The suites take
  a repository that may arrive later, so the database's repositories can run
  them unchanged. One Dart test became a compile-time check: scripting a
  backup to fail with something that is not a failure is now refused by the
  type checker, and the test fails the typecheck if it ever stops being
  refused. A broken repository was tried on purpose (weigh-ins listed newest
  first): the contract failed, as it should.
- The Flutter app's test of the demo seed is carried over
  (`test/data/demoSeed.test.ts`) and passes against both the in-memory
  repositories and the database. I first wrote that Dart had no test of the
  seed; that was wrong, and the pull request that said so is corrected.
- **What the user reads is what the Flutter app showed**
  (`apps/web/src/format/`): numbers, dates, units and the fixed wording of
  every label and sentence. Three checks, of different strength:
  - Compared with what Dart printed, from a file the Dart formatters wrote:
    weights, lengths and waist changes in both unit systems over 46 awkward
    numbers, energy, paces, loads, file sizes, timers, times of day, days,
    typed numbers, and every label of 29 kinds. All equal.
  - Compared word for word with the Dart source: 295 pieces of wording
    from the 50 Dart files are all present in the TypeScript. A word was
    changed on purpose and the comparison reported it. This is a script run
    once (it reads the Dart source, which will be deleted), not a test.
  - Tested here, with the expected text taken from the Dart source: sets,
    suggestions, a workout in a line, what was eaten, where a food came
    from, why targets changed, how sure the coach is, and four notices.
  - **Not tested beyond the wording comparison:** the sentences for a
    stall, an insight, the week's adherence, the recomp signal and review,
    and the monthly report. Their branches were tested in Flutter through
    the screens that show them, and those tests come over with the screens.
  Dates and thousands separators are written out in the code and not asked
  of the device, so they read the same on every phone.
- `mm food build` and `mm food publish` still run the Dart pipeline. They
  switch when the task runner is converted.
- Files that read and write disk live in a folder called `node`, and a test
  fails if any other file imports a Node module or that folder, so a
  developer tool cannot leak into the app.
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
