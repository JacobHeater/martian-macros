---
id: MM-490
status: proposed
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

## Notes
- 2026-10-21 (`fix/health-plugins-review`): a workout the platform says the app wrote is never offered for import,
  whatever its client id (MM-489's `ours` mark).
