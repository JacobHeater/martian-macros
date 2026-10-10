---
id: MM-76
status: in-progress
component: training
related: [MM-74, MM-75, MM-78, MM-188, MM-189]
---

# Story: An exercise library

## Context
See MM-75. Sets need exercises to belong to, and volume per muscle group (MM-78) needs to know what each exercise trains.

## Decisions (made with the product owner)
- **A built-in library of about 150 exercises.**
- **It lines up with the health platforms where they have something, with a fallback where they do not** (MM-189): each exercise
  carries an optional mapping to the platform's own exercise type. The library's names, equipment and muscle groups are still the
  app's.

Choices I made without asking (say if any is wrong):
- **Each exercise has**: a name, the equipment (barbell, dumbbell, machine, cable, bodyweight, other), a primary muscle group and any
  secondary ones, and whether it is loaded by added weight or bodyweight.
- **Muscle groups**: chest, back, shoulders, biceps, triceps, forearms, abs, glutes, quads, hamstrings, calves.
- **Users can add their own exercises** with the same fields.
- **Search by name, with recently used exercises first.**
- **Each exercise has an optional platform mapping**: the Health Connect segment type for its movement. No mapping is a normal
  state. The mappings come from MM-188 and are never written from memory. The session type is not per exercise: every workout is
  written as a strength session (MM-188).
- **An exercise has a permanent id**, separate from its name, because logged sets refer to it. A rename changes the name only.
- **Search matches the start of words**: every word typed must begin a word of the name, in any order, ignoring capitals, hyphens
  and apostrophes. Recently used exercises come first, then names that start with what was typed, then the rest by name.
- **Muscle groups the list does not have are folded into the nearest it does**: traps and lats count as back, rear delts as
  shoulders. Exercises for a group with no home (hip adduction) are left out of the built-in list; a user can add their own.
- **The library ships with the app as data**, and is not user-editable (custom exercises are separate), so an app update can correct it.

## Description
Choosing an exercise for a workout shows recent ones, then search over the library and the user's own.

## Acceptance Criteria
```gherkin
Scenario: Finding an exercise
  When "bench" is searched
  Then barbell bench press, dumbbell bench press and incline variants are listed

Scenario: Recents first
  Given squats were logged this week
  When an exercise is being chosen
  Then squat is among the first offered, before any search

Scenario: A custom exercise
  When the user creates "Landmine press" with shoulders as its primary muscle
  Then it can be chosen for a workout and counts toward shoulder volume
```

## Progress
Built (2026-10-10):
- The model (`Exercise`, `MuscleGroup`, `Equipment`, `ExerciseLoad`, `HealthConnectSegment`) and the built-in library of 164
  exercises, written for this app (no outside list was copied, so there is no license to carry). 85 carry a Health Connect type.
- The 42 Health Connect identifiers are an enum; a test compares it with the table in MM-188, which was checked against the
  client library's source.
- Search (`searchExercises`), covering the "Finding an exercise" and "Recents first" rules as a pure function.

Not built, and why:
- **The screen for choosing an exercise** has nowhere to live until the Train destination exists (MM-75).
- **Saving a user's own exercises** needs a table. It waits for MM-75, so the training tables arrive in one schema change and not
  two. The model and the search already take a custom exercise.
- **"Recents" from real workouts**: the search takes the recent ids; what supplies them is the workout log (MM-75).

Checked by tests only. Nothing here is visible in the app yet.

## Notes
- Source for the library: write it, or find an openly licensed list (check the license as carefully as for food data, MM-57).
