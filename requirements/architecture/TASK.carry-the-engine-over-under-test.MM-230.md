---
id: MM-230
status: proposed
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

## Notes
- Not started.
