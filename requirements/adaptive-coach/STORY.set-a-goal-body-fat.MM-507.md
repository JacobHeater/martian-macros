---
id: MM-507
status: done
component: adaptive-coach
related: [MM-36, MM-28, MM-34, MM-129]
---

# Story: Set a goal body fat, kept across restarts

## Context
MM-36 plans the phases ahead and lets a goal body fat replace the cut's default line (`PhaseRule.cutGoalPercent`, 15% for men and
23% for women). The engine takes the goal (`planPhases`'s `goal`), checks it against the floors (`SafetyBounds.checkGoalBodyFat`) and
words a refusal or a limit (`goalBodyFatCheckText`). Storing it needs a table, and the schema was held in another change when MM-36
was built, so MM-36 stopped at the repository's interface (`GoalBodyFatRepository`), its in-memory fixture and its contract suite. No
screen sets a goal yet: a setting that forgets itself on restart would be worse than none.

## Decisions
Choices I made without asking (say if any is wrong):
- **One row, the goal and the day it was set** (`GoalBodyFat`); clearing it returns the plan to its default line.
- **The goal is set from the Coach's goal section**, beside the phase rows (MM-36), with the reason under it as the user types: refused
  under the hard floor, accepted with a warning and a time limit under the soft floor.
- **Never offered with an eating-disorder history**, as MM-36 projects nothing from body fat for that history.
- **Offered only in fat loss and recomp** (coordinator's decision, panel review 2026-10-21): the goal is where a cut
  runs to, so the row is hidden in lean gain and maintenance.
- **A refusal is said once the value is typed** (on leaving the field or pressing Done), never on a partial value
  such as the "1" of "12"; "Set goal" stays off meanwhile, and until the value differs from the goal in force. The
  soft-floor warning is said politely as it is typed, and the snack after saving restates the limit.
- **The row's subtitle stays short** ("12%, set Oct 3"); a soft-floor warning is a caution notice (icon and "Heads
  up") under the row, the goal section's own notice pattern (sibling: the target flags' cautions above it).

## Description
A SQL table and `SqlGoalBodyFatRepository` (schema migration, tested from every earlier version), run through
`goalBodyFatRepositoryContract`; the repository in `InMemoryRepositories`, `AppServices`, backup and erase; `state.phasePlan` passing the
stored goal to `planPhases`; and the row that sets it, with its gallery story.

## Acceptance Criteria
```gherkin
Scenario: A goal too low
  Given a woman enters a goal of 14% body fat
  Then it is refused, with the reason, and nothing is stored

Scenario: Under the soft floor
  Given a man enters a goal of 9%
  Then it is stored with a warning that, once reached, it is held four weeks at most

Scenario: Kept across a restart
  Given a goal of 18% is set
  When the app is closed and opened again
  Then the plan runs the cut to 18%

Scenario: An eating-disorder history
  Given an eating-disorder history
  Then no goal body fat is offered
```

## Notes
- A gain's end is MM-129's `LeanGainRule.stopBodyFatPercent` and `stopWeeks`, which `planPhases` reads; the goal does not change it.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Schema 21 (stacked on MM-456's 20): a `goal_body_fat` table of one row (`id` held at 1, `percent` above 0 and
  under 100, `set_epoch_day`). `currentSchemaVersion`, `currentSchema`, `tables` (so erase, backup and restore carry
  it), the step keyed 20 in `migrationSteps`, and the fingerprint for 21.
- `SqlGoalBodyFatRepository` in `SqlRepositories`, `openAppServices` and `AppServices` (`goalBodyFat`); the in-memory
  fixture in `InMemoryRepositories` and its eraser; `state.goalBodyFat`, passed to `planPhases` by `state.phasePlan`.
- The Coach's goal section has a "Goal body fat" row under the phase rows (sibling: "What to expect", the row
  beside it), saying the goal and when it was set, its warning under the soft floor, or the plan's own line. It opens
  `GoalBodyFatSheet` (built like the pace sheets): a percentage, refused under the hard floor with the reason and
  "Set goal" off; under the soft floor the warning and time limit as a warning under the field; with a goal set,
  "Use the plan's 15%" (or 23%) clears it. No row with an eating-disorder history.
- Guarding tests: `goalBodyFatRepositoryContract` now run against SQL too; `dataEraserContract` asks that no goal is
  left (both); `test/data/restore.test.ts` (a backup's goal comes over); `test/data/upgrade.test.ts` (a version 20
  database comes up with none and keeps one set after); `test/data/schema.test.ts`; `test/coach/goalBodyFat.test.tsx`
  (a woman's 14% refused with the reason and nothing stored; a man's 9% stored with the four-week warning; 18% kept
  across a restart and the projected end reads 18%; clearing returns to 15%; no row with an eating-disorder history).
- Stories: `CoachGoalBodyFat`, `CoachGoalBodyFatRefused`, `CoachGoalBodyFatLow`, `CoachGoalBodyFatSet`.
- Panel review fixes (2026-10-21): `MmTextField` takes `onBlur` and `helperPolite` (the helper in a polite live
  region); `GoalBodyFatSheet` says the refusal only once the value is finished, holds "Set goal" until the value
  differs, reads "Without one, the plan aims for 15%"; `goalBodyFatSubtitle` is short; the warning is a caution
  `Notice` under the row; snacks "Goal body fat set to 9%, held 4 weeks at most once reached." and "The plan's own
  goal, 15%, is back."; the row only in fat loss and recomp. Tests in `test/coach/goalBodyFat.test.tsx` (no alert on
  a partial value; the refusal on leaving the field; the polite warning, the snack and the notice; "Set goal" off for
  the goal in force; no row in lean gain or maintenance, a row in recomp). Story `CoachGoalBodyFatSetLow`.

## Owed on a phone
- A goal set on the owner's phone survives closing and reopening the app, and the upgrade from 20 to 21 keeps
  everything there.

