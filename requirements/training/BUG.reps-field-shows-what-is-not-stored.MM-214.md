---
id: MM-214
status: proposed
component: training
related: [MM-75, MM-212]
---

# Bug: A set's reps field can show a value the set does not have

## Context
Found on 2026-10-11 by the walkthrough review of workout logging (MM-212, run
`docs/agent-runs/mm212-workout-logging-walkthrough/`, finding UXA-3), and
confirmed by a test.

## Description
A set's controls save each change as it is typed
(`apps/mobile/lib/src/train/set_editor_state.dart`, `_typedReps`). Text that
is not a whole number is ignored: the stored reps stay as they were while the
field shows what was typed. Clearing the field leaves 8 stored behind an empty
field; typing "8.5" leaves 8 stored behind "8.5". The field's keyboard offers a
decimal point. Nothing says the value was not taken. Load behaves the same
when cleared (`_typedLoad`).

Expected: what the field shows is what the set has, or the screen says the
typed value was not kept.

## Acceptance Criteria
```gherkin
Scenario: Clearing the reps
  Given a set of 8 reps with its controls open
  When the reps field is cleared
  Then the set's reps and the field agree, or the field says the value was not kept

Scenario: A number that is not whole
  Given a set of 8 reps with its controls open
  When "8.5" is typed for reps
  Then the set's reps and the field agree, or the field says the value was not kept
```

## Notes
- Guarded by `apps/mobile/test/workout_set_editor_findings_test.dart` (two
  cases). Run enabled once: both failed as they should (stored 8, shown empty
  or "8.5"). Skipped with this ticket's ID until the fix.
- Whether an empty field means zero reps or "put the old value back" is the
  fix's to decide.
