---
id: MM-490
status: done
component: training
related: [MM-71, MM-75, MM-189, MM-489]
---

# Story: Workouts from and to the health platform, in the app

## Context
MM-189 built the rules (`workoutForPlatform`, `workoutFromPlatform`, `writeWorkoutToPlatform`) and MM-489 reaches the phone.
Nothing in the app calls them yet: there is no switch for writing workouts, a finished workout is not written, and a platform's
workouts are not imported into the log.

## Decisions
Choices I made without asking (say if any is wrong):
- **An imported workout keeps its platform id in a stored column**, so reading the platform again updates it and never adds a
  second (MM-71). That is a schema change, made after the health-sync settings change in flight takes its own.
- **"Other exercise" is shown by name, and its sets can be moved to an exercise the user chooses.** It is not in the picker and
  counts toward no muscle group.
- **Only strength sessions are imported (coordinator's decision, 2026-10-21, from the integrations review).** MM-188's
  strength types (Health Connect's strength training, weightlifting and calisthenics types; HealthKit's traditional and
  functional strength training and core training), which both shells already flag as `strength`; the walks and runs a
  watch detects are not brought into the training log. The filter is in `workoutFromPlatform`, so the shells read as before.
- **The same session recorded twice is imported once (panel review, 2026-10-21).** A new import whose span overlaps
  80% or more of the shorter of its span and that of a workout logged in the app, or of one imported from another
  source, is left out: the session timed live in the app and recorded by a watch, or written by two apps.
- **A re-read moves a workout only when its start or end changed (panel review, 2026-10-21)**; the same instants keep
  the stored day, which the user may have set.

## Description
- A switch for writing workouts in the health platform's settings, off until the user turns it on; turning it on asks the
  platform.
- A finished workout is written once writing is permitted, and written again when it is edited.
- Workouts on the platform are imported into the log as `workoutFromPlatform` gives them, each kept with its platform id; one
  the app wrote is never imported.
- The Train screens show an imported workout and "Other exercise", each with its story.

## Acceptance Criteria
```gherkin
Scenario: Writing is off until the user turns it on
  Given the user has not turned on writing workouts
  When they finish a workout
  Then nothing is written to the platform

Scenario: An imported workout is not imported twice
  Given a workout imported from the platform
  When the platform is read again
  Then the log still has one workout for it

Scenario: Other exercise
  Given an imported workout with a segment the library cannot place
  Then it shows as "Other exercise" with its time
  And the user can move its sets to an exercise they choose
```

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Already there from MM-489: the "Workouts you finish" switch in the health platform's writing card, off until turned
  on and asking the platform; a finished workout written once permitted and written again when edited
  (`MirroredWorkoutLog`). Its first two description items needed nothing more.
- Schema 22 (stacked on MM-507's 21): `workouts` gains `platform_id` (unique) and `platform_source_name`, none for
  what is already logged; `deleted_platform_workouts` keeps the platform id of an imported workout deleted in the app,
  so a later read does not bring it back (a decision: deleting an import is meant to last). Step keyed 21, fingerprint
  for 22, `tables`.
- `Workout.imported` (`ImportedWorkout`: platform id and source name), kept through every change; `WorkoutRepository`
  gains `DeletedImportsReader`; SQL, in-memory and the mirror implement it. An imported workout is never written back
  to the platform, finished or edited.
- `platformWorkoutImports` (engine): each platform workout once, as `workoutFromPlatform` gives it; one already
  logged is never added again, and read again its day and span follow the platform while its sets stay as the user
  has them (a decision: the user's moved sets are not overwritten); one this app wrote, or deleted in the app, is
  not brought in. `AppState.importWorkouts` runs it on every read of the health platform, over the last 30 days.
- Train: an imported workout's summary says where from ("· from Watch"); "Other exercise" is named
  (`exerciseNameOf`), says it counts toward no muscle, and "Move sets to an exercise" opens the exercise picker
  (`WorkoutController.moveExercise`, sets and times kept). Repeating a workout leaves "Other exercise" out.
- Guarding tests: `workoutRepositoryContract` (an import keeps its platform id through a change; deleting it
  remembers the id; in memory, SQL and the mirror); `test/engine/platformWorkoutImports.test.ts`;
  `test/healthWrite/mirroredLogs.test.ts` (an import is never written back); `test/train/importedWorkouts.test.tsx`
  (not imported twice across a reopen; a deleted one stays deleted; Other exercise shown with its time and moved;
  nothing with reading not allowed); `test/data/upgrade.test.ts` (from 21). Writing off until turned on stays
  guarded by MM-489's tests.
- Stories: `TrainImportedWorkout`, `ImportedWorkoutOtherExercise` in `Train.stories.tsx`.

Review fixes 2026-10-21 (branch fix/body-comp-review). Not run locally; CI validates.
- `workoutFromPlatform`: nothing for a session that is not strength. `platformWorkoutImports`: moved only on changed
  instants; a new import overlapping 80% of an app-logged workout or another source's import is left out.
- Tests: `test/engine/platformWorkoutImports.test.ts` (same instants with a different stored day: no change; another
  source's session overlapping 80%: not imported, in the log or in one read, and one overlapping 50% is; a live app
  session and a watch's recording: one; a walk: not imported); `test/engine/platformWorkouts.test.ts` (a non-strength
  session gives nothing; a HealthKit strength session with no segments is a session).

## Owed on a phone
- Health Connect: a strength workout recorded by another app (a watch) appears in Train after opening the app, once,
  with its exercise segments; reopening does not add a second; deleting it in the app keeps it deleted.
- Apple Health: a workout from another app imports as a session with its span and no exercises.
- A workout finished in the app with writing on is not imported back on the next read.

