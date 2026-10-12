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

## Decisions
Choices I made without asking (say if any is wrong):
- **The Dart tests are the reference.** Before anything is moved, the cases
  the Dart tests assert are written out as data: inputs and expected results.
  The new engine must reproduce every one, to a stated tolerance for
  floating-point results.
- **Two routes are measured before one is chosen**, on the weekly check-in
  and the weight trend: compiling the Dart packages to JavaScript and calling
  them from TypeScript, and porting them to TypeScript. The measures are the
  work involved, how the result is debugged and tested from the new app, and
  the size of what ships.
- **The simulator (MM-30) is run through whichever route is chosen**, and its
  outcomes compared with the Dart ones.
- **The evidence register keeps guarding it**: the test that every constant
  has a row, and no row names something gone, moves with the engine.

## Description
The domain types, the engine, health import and the food catalog, usable from
the React app, giving the same answers as the Dart they replace.

## Acceptance Criteria
```gherkin
Scenario: The same answers
  Given the reference cases written out from the Dart tests
  When the new engine is run on each
  Then every result matches, within the stated tolerance for non-integer results

Scenario: The simulator agrees
  When the synthetic-user simulator is run through the new engine
  Then its outcomes match those it gives in Dart

Scenario: Nothing unexplained
  Then every constant that decides something about a body or about safety still has its row in the evidence register

Scenario: The route is chosen on evidence
  Then this ticket records what compiling and porting each cost on the check-in and the trend, and why one was chosen
```

## Progress
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
