---
id: MM-613
status: proposed
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
