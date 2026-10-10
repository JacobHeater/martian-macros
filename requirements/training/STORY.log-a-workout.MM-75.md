---
id: MM-75
status: done
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
- **A "Train" destination** joins the others, between Food and Progress (five in all, since the Dashboard was added).
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

## Progress
Built (2026-10-10), storage only:
- The model: a `Workout` has a day, a start, an end (none while in progress) and its exercises in order; a `WorkoutExercise` has
  its sets; a `WorkoutSet` is reps, load in kilograms and optional RIR (0 to 5, where 5 means five or more).
- Schema 25: workouts, their exercises, their sets, and the user's own exercises (MM-76), in one migration. Checked by the
  migration tests from every earlier version.
- `WorkoutRepository` and `CustomExerciseRepository`, over the database and in memory, held to the same contract tests. Erasing
  all data empties them.
- `previousSetsOf` ("last time") and `recentExerciseIds` as pure functions.

The screens:
- **Train** is the third of five destinations. It offers "Start workout" and, once there is one, "Repeat last workout" (the same
  exercises, no sets); while a workout is in progress it offers only "Continue". Finished workouts are listed and reopen for
  correction.
- **The workout screen**: each exercise is a card with last time's sets, today's sets as lines, and "Add set". Adding a set records
  a copy of the previous one at once and opens its controls: reps and load, each typed or stepped with large buttons (5 lb or
  2.5 kg), and reps in reserve. Every change is saved as it is made.
- "Finish workout" is available once a set is logged. An empty workout is deleted from the top bar.

Not built:
- Changing a finished workout's date or times.
- A workout imported from a health platform (MM-68) has no way in yet; health sync does not exist.
- Reordering exercises.

Checked by tests, and by the screenshots generated on Linux in all three themes. Not seen on the emulator.

Choices made while building (say if any is wrong):
- The same exercise can appear twice in one workout, as two entries.
- "Last time" is the most recent earlier workout in which the exercise has at least one set.
- The first set of an exercise starts as a copy of last time's first set. Reps in reserve are never copied: they are a judgment
  of one set.
- For a bodyweight exercise the load is the weight added, stepped below zero for assisted work and shown as "assisted".
- Only one workout is in progress at a time.
- A workout an exercise was deleted from keeps the sets of its other exercises; deleting one of the user's own exercises does not
  delete sets logged against it.

## Notes
- New tables: needs migrations (MM-61).
- When each set happened, and the set and rest timers, are MM-191 (the owner's decision). A set here is logged without times.
