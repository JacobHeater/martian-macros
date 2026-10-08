---
id: MM-76
status: proposed
component: training
related: [MM-74, MM-75, MM-78]
---

# Story: An exercise library

## Context
See MM-75. Sets need exercises to belong to, and volume per muscle group (MM-78) needs to know what each exercise trains.

## Decisions (made with the product owner)
- **A built-in library of about 150 exercises.**

Choices I made without asking (say if any is wrong):
- **Each exercise has**: a name, the equipment (barbell, dumbbell, machine, cable, bodyweight, other), a primary muscle group and any
  secondary ones, and whether it is loaded by added weight or bodyweight.
- **Muscle groups**: chest, back, shoulders, biceps, triceps, forearms, abs, glutes, quads, hamstrings, calves.
- **Users can add their own exercises** with the same fields.
- **Search by name, with recently used exercises first.**
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

## Notes
- Source for the library: write it, or find an openly licensed list (check the license as carefully as for food data, MM-57).
