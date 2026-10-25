---
id: MM-613
status: done
component: training
related: [MM-189, MM-78, MM-366, MM-609]
---

# Bug: An imported set without repetitions breaks weekly volume and strength trends

## Context
MM-189 imports a platform segment as a set. "Where the platform gives no repetitions or weight the set has 0 of each, for the user
to edit" (`workoutFromPlatform.ts:42-47`). `WorkoutSet` accepts 0 reps. But `countHardSets.ts:23-29` throws `ArgumentError`
("Invalid set") on `reps < 1`, so `buildWeeklyVolume` fails. By inspection, the volume jump (`volumeJumpInsights`) and
`buildStrengthTrends` fail too. A single strength session imported from Apple Health or Health Connect without repetition counts
would leave weekly volume failing to load until its sets are edited.

Found by the training panel on 2026-10-24 and confirmed by source inspection. It has not been reproduced at run time.

## Description
A set with unknown reps (0, as imported) is evidence of nothing. Weekly volume, the volume jump and strength trends skip it rather
than throw. A set entered by hand still cannot have 0 reps. The imported workout keeps its sets, for the user to edit, as MM-189
says.

## Acceptance Criteria
```gherkin
Scenario: Imported set without reps
  Given an imported strength session with a bench press segment and no repetitions
  Then weekly volume, the volume jump and strength trends load
  And the set counts toward none of them

Scenario: Once edited
  When the user edits that set to 8 reps
  Then it counts as any other set

Scenario: Hand entry unchanged
  Then a set entered by hand with 0 reps is still refused
```

## Notes
Regression test: import the `importedWorkouts.test.tsx` fixture's segment without repetitions, and assert that weekly volume,
the volume jump and strength trends load.

## Progress
Built 2026-10-24. A set with 0 reps is skipped as evidence of nothing; negative reps are still an error.
- `apps/mobile/src/engine/countHardSets.ts` skips a set with 0 reps instead of throwing, so weekly volume
  (`buildWeeklyVolume`) and the volume jump (`volumeJumpInsights`) load and count it toward no group.
- `apps/mobile/src/engine/buildStrengthTrends.ts` leaves sets with 0 reps out before taking a session's best, so a
  session of them is no session of the lift. `estimatedOneRepMax` still refuses 0 reps when called directly.
- The imported workout keeps its sets with 0 reps, for the user to edit (MM-189); once edited they count as any other set.
- Hand entry is unchanged: "Finish workout" stays disabled until a set has reps (`WorkoutScreen.tsx`'s `hasWork`), guarded
  by `test/train/train.test.tsx` "finishing lists the workout, which can be reopened" ("a set with no reps yet").

Tests, in `apps/mobile/test/engine/importedSetWithoutReps.test.ts`: "the import keeps the sets without reps, for the user
to edit", "weekly volume loads, and a set without reps counts toward no group", "the volume jump loads, and sets without
reps make no jump", "strength trends load, and a session of sets without reps is no session of the lift", "once edited to
8 reps, the sets count as any other".

Not run locally; CI validates.
