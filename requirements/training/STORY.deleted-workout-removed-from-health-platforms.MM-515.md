---
id: MM-515
status: proposed
component: training
related: [MM-489, MM-189, MM-70]
---

# Story: A workout I delete is removed from my phone's health app

## Context
MM-489 writes a finished workout to Health Connect and Apple Health under the app's own id and writes it again when it is
changed. Deleting a workout in the app leaves what was written on the platform, and the terms (MM-242) say only that a
changed workout is written again. Food and water removals are mirrored already (MM-70, MM-314).

## Decisions
Choices I made without asking (say if any is wrong):
- **A removal on `HealthWorkoutWriter`**, by the workout's `clientId`, held to `healthWorkoutWriterContract`, and called
  by `MirroredWorkoutLog` when a workout is deleted, only while writing workouts is on.

## Description
Deleting a workout in the app removes the workout the app wrote for it from the health platform. Nothing another app
wrote is touched.

## Acceptance Criteria
```gherkin
Scenario: Removed
  Given a finished workout written to the health app
  When it is deleted in the app
  Then the health app no longer holds it

Scenario: Off
  Given writing workouts is off
  When a workout is deleted in the app
  Then nothing on the health app changes
```

## Notes
- The terms' sentence on workouts (section 9) changes with this ticket.
