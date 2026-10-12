---
id: MM-79
status: done
component: training
related: [MM-74, MM-75, MM-77, MM-78]
---

# Story: A suggestion for what to lift next time

## Context
See MM-74. Progressive overload means doing slightly more over time, and many people simply repeat last week.

## Decisions (made with the product owner)
- **Suggestions follow double progression**: add reps within a range until the top of the range is reached on every set, then add load and
  return to the bottom of the range.

Choices I made without asking (say if any is wrong):
- **The rep range is per exercise**, defaulting to 6 to 10 for barbell lifts and 8 to 12 otherwise, and editable.
- **The load step** is 2.5 kg (5 lb) for barbell lifts and the smallest sensible step otherwise.
- **A suggestion is shown, never imposed**: it pre-fills the first set and the user changes it freely.
- **After two sessions with no progress on a lift, the app says so** and suggests holding the load, rather than suggesting more.
- **In a deficit, holding strength is success.** The wording changes with the goal: on fat loss the suggestion is to match last time.

Choices made with the expert panel while the product owner was away (2026-10-11, `panel-training`; say if any is wrong). Where they
differ from the choices above, these are what was built:
- **Only the sets at the session's heaviest load count.** Warm-up sets are logged as ordinary sets, and nothing marks them.
- **Progress is more load, or more reps in all at the same load.** An estimated one-rep max is not used: it moves with reps in
  reserve, which is a judgment, and it is not worked out above 12 reps.
- **A stall is three sessions at one load, no more than 28 days apart, where neither of the last two had more reps than the first.**
  Two sessions, as first written, is one comparison and would fire on one bad day.
- **On fat loss nothing is said about a stall**: "no progress" contradicts "holding strength is success".
- **The load step** is a round number in the user's own unit: 2.5 kg or 5 lb; a dumbbell 2 kg or 5 lb; a machine 5 kg or 10 lb.
  Assisted work takes 5 kg or 10 lb less help, never past none. A bodyweight exercise with no load gets more reps, past the range.
  These are equipment conventions, not tested thresholds.
- **A suggestion never lowers the load**, and says nothing about effort when every set was to failure.
- **The first set starts from the suggestion; every later set copies the set before it**, as now.
- **The rep ranges are conventions, not optima.** The evidence finds no best range for muscle growth (Schoenfeld et al. 2021,
  DOI 10.3390/sports9020032).
- **The wording offers rather than tells**: "One more rep on any set would be a step up."

## Description
When an exercise is added to a workout, the first set is pre-filled with the suggestion and a one-line reason ("All sets hit 10 last time;
add 2.5 kg").

## Acceptance Criteria
```gherkin
Scenario: Add reps
  Given last session was 3 sets of 8, 8, 7 at 60 kg in a 6-10 range
  Then the suggestion is 60 kg for 8 or more

Scenario: Add load
  Given last session was 3 sets of 10 at 60 kg in a 6-10 range
  Then the suggestion is 62.5 kg for 6

Scenario: On a cut
  Given the goal is fat loss
  Then the suggestion is to match last session, and says that holding strength is the aim

Scenario: Stalled
  Given three sessions at the same load, the last two with no more reps than the first
  Then the app says so and suggests holding the load

Scenario: Warm-up sets
  Given last session was 10 at 20 kg, then 8 and 7 at 60 kg
  Then the suggestion is made from the sets at 60 kg

Scenario: Pounds
  Given the user lifts in pounds and every set reached the top at 135 lb
  Then the suggestion is 140 lb

Scenario: No load to add
  Given a bodyweight exercise done with no added weight
  Then the suggestion is one more rep, and no load is named

Scenario: Never done
  Given an exercise with no finished session
  Then nothing is suggested and the first set starts empty

Scenario: The suggestion is only a start
  When the first set is added
  Then it holds the suggested load and reps, and both can be changed
```

## Progress
Built (2026-10-11):
- `suggestProgression` in the engine, a pure function of the finished workouts, with the rules above.
- A line on each exercise of a workout in progress, with the reason, and the first set started from it.

Built (2026-10-11), schema 31:
- **A rep range and a load step per exercise, set by the user**: a row on each exercise of a workout in progress says what
  suggestions use ("6 to 10 reps · 5 lb steps") and opens a screen to change them or go back to the defaults. Kept in their own
  table (`exercise_progressions`), for built-in exercises and the user's own alike. An empty step keeps the usual one for the
  equipment. A range has to run from at least 1 to at most 50 with the top above the bottom.
- The user's step also applies to weight added to the body and to assisted work, which still never goes past none.

Not built:
- On fat loss with every set at the top of the range, offering the load step as well (the panel proposed it; undecided).
- The settings are reached from a workout in progress only, not from the exercise library.
- Seen on the Android emulator on a fat loss goal only: the suggestion line, the "Suggestions use" row, and the settings screen as it opens.
  Saving from it was not confirmed there; the widget tests cover it.

## Notes
- This is deliberately simple. Periodization, deloads and programs are out of scope.

## UI/UX Assets

- [Train](../ui-ux-assets/views/train.html) — Current. Draws
  ProgressionSettingsScreen and WorkoutExerciseCard as built on 2026-10-11:
  defaults, invalid range, with sets, suggestion, rest target options, remove
  confirm. Frames: `#progression-settings`, `#workout-default`. Partly
  compared with screenshot tests, the rest drawn from the source alone. It
  shows what exists and approves nothing.
- [Flows](../ui-ux-assets/flows/index.html#log-a-workout) — Current. Draws the
  "a workout from start to finish" path as built on 2026-10-11. Drawn from the
  source alone; not compared with the running app. It shows what exists and
  approves nothing.
