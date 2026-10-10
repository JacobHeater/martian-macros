---
id: MM-75
status: proposed
component: training
related: [MM-74, MM-76, MM-77, MM-28, MM-61, MM-68, MM-189, MM-191]
---

# Story: Log a workout, set by set

## Context
See MM-74. Logging happens between sets, one-handed, often with sweaty hands.

## Decisions (made with the product owner)
- **A set is reps, load and reps in reserve (RIR).**

Choices I made without asking (say if any is wrong):
- **Each new set starts as a copy of the previous one**, so a typical set is confirmed with one tap and adjusted with large plus and minus
  buttons.
- **The previous session's sets for that exercise are shown beside the current ones.**
- **RIR is optional**, 0 to 5+.
- **Load is in the user's weight unit**, stored in kilograms. Bodyweight exercises record added load (which may be zero or negative for
  assisted work).
- **A workout can be started empty or from a previous workout.** Saved routines come later.
- **A fourth tab, "Train"**, joins Today, Progress and Coach.
- **A session imported from a health platform** (MM-68) appears as a workout with duration only; the user can add sets to it.

## Description
Start a workout, add exercises, log sets, finish. A workout has a date, a start and end time, and its exercises in order. Finished
workouts are listed and can be opened and corrected.

## Acceptance Criteria
```gherkin
Scenario: Logging a set quickly
  Given a set of 8 reps at 100 kg was just logged
  When the next set is confirmed without changes
  Then a second set of 8 at 100 kg is recorded with one tap

Scenario: Last time
  Given squats were logged last week
  When squat is added to today's workout
  Then last week's sets are shown alongside

Scenario: Pounds
  Given the user's unit is pounds
  When 225 is entered
  Then 102.1 kg is stored and 225 lb is shown

Scenario: Interrupted
  Given a workout in progress
  When the app is closed and reopened
  Then the workout is still in progress with its sets intact
```

## Notes
- New tables: needs migrations (MM-61).
- When each set happened, and the set and rest timers, are MM-191 (the owner's decision). A set here is logged without times.
