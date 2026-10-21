---
id: MM-215
status: done
component: training
related: [MM-75, MM-212]
---

# Bug: Removing a set happens at once and cannot be undone

## Context
Found on 2026-10-11 by the walkthrough review of workout logging (MM-212, run
`docs/agent-runs/mm212-workout-logging-walkthrough/`, finding UXA-10), and
confirmed by a test. `design/interaction-and-motion.md` ("Confirmation, undo,
destructive actions") says: "Undo for reversible deletes".

## Decisions
Choices I made without asking (say if any is wrong):
- **Undo, not a confirmation**, as the design rule says and as removing a
  food entry does: the set goes at once and a snack offers "Undo".
- **The set goes back where it was**, as it was when removed (reps, load,
  reps in reserve, start and end), in the workout as it is by then. If the
  exercise itself was removed or moved in the meantime, Undo does nothing.

## Description
"Remove set" in a set's controls deletes the set immediately (Dart app:
`apps/mobile/lib/src/train/workout_exercise_card_state.dart`, `onRemove`;
React app: `apps/mobile/src/train/WorkoutExerciseCard.tsx`).
There is no Undo and no confirmation. Removing an exercise and deleting a
workout both ask first; removing a food entry offers Undo. A set removed by a
slip of the thumb, mid-workout, is gone with its reps, load and times.

Expected: removing a set can be undone, as the design rule says.

## Acceptance Criteria
```gherkin
Scenario: A set removed by mistake
  Given a workout with a set of 8 reps
  When the set is removed
  Then an Undo is offered
  And taking it puts the set back as it was, times included
```

## Notes
- Guarded first by `apps/mobile/test/workout_set_editor_findings_test.dart`,
  carried over to `apps/mobile/test/train/train.test.tsx` ("MM-215:
  removing a set can be undone", skipped until the fix).
- Built 2026-10-21: `WorkoutExerciseCard.tsx` (`removeSet`) and
  `WorkoutController.restoreSet`. The test is enabled and now also checks
  the set comes back equal, times included. Story: Screens/Train,
  `WorkoutSetRemoved`. Not run locally; CI validates.
- The same review noted that "Finish workout" also acts at once and that a
  finished workout cannot be put back in progress. No rule asks for either,
  so that is a question for the owner (see MM-222), not part of this bug.
