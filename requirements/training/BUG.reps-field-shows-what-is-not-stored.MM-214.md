---
id: MM-214
status: done
component: training
related: [MM-75, MM-212]
---

# Bug: A set's reps field can show a value the set does not have

## Context
Found on 2026-10-11 by the walkthrough review of workout logging (MM-212, run
`docs/agent-runs/mm212-workout-logging-walkthrough/`, finding UXA-3), and
confirmed by a test.

## Decisions
Choices I made without asking (say if any is wrong):
- **An empty field means zero**, for reps and for load, as a new set's
  empty fields already do. The ticket left this to the fix.
- **Text that is not a whole number of reps (or not a number of load) is
  said not to be kept**, under the field, with what the set has instead:
  "Whole reps only. The set has 8." The field keeps what was typed, so a
  slip can be corrected rather than retyped.
- **The reps keyboard has no decimal point**: a new text field kind,
  `count` (a numeric keyboard), next to `number` (decimal).

## Description
A set's controls save each change as it is typed (Dart app:
`apps/mobile/lib/src/train/set_editor_state.dart`, `_typedReps`; React app:
`apps/mobile/src/train/SetEditor.tsx`, `typedReps`). Text that
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

Scenario: Clearing the load
  Given a set of 100 kg with its controls open
  When the load field is cleared
  Then the set has no load, as the empty field says

Scenario: The reps keyboard
  Given a set's controls are open
  Then the reps field asks for a keyboard without a decimal point
```

## Notes
- Guarded first by `apps/mobile/test/workout_set_editor_findings_test.dart`
  (two cases), carried over to `apps/mobile/test/train/train.test.tsx`
  ("MM-214: the reps field shows what is stored", skipped until the fix).
- Built 2026-10-21: `SetEditor.tsx` (`typedReps`, `typedLoad`) and the
  `count` kind of `MmTextFieldKind`/`MmTextField`. Guarding tests in
  `apps/mobile/test/train/train.test.tsx`, "the set controls keep the field
  and the set in step": the two enabled cases, "a number of reps that is not
  whole is said not to be kept", "a cleared load is no load", "the reps
  keyboard has no decimal point". Story: Screens/Train,
  `WorkoutSetRepsRefused`. Not run locally; CI validates.
- Not checked on a phone: which keyboard Android and iOS show for
  `inputmode="numeric"`.
