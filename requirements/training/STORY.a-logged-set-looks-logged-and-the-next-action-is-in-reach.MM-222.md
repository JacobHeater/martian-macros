---
id: MM-222
status: proposed
component: training
related: [MM-75, MM-79, MM-191, MM-212, MM-214, MM-215]
---

# Story: A logged set looks logged, and the next action is in reach

## Context
Proposed by the walkthrough review of workout logging (MM-212, run
`docs/agent-runs/mm212-workout-logging-walkthrough/`). The reviewers were
given four tasks and no suggested findings; working apart, both arrived at the
first four points below. **Nothing here is decided.**

What the built screen does today (source and screenshot tests):
- **A recorded set looks like an unfinished form.** "Add set" records a set
  at once and opens its controls: a headed form with outlined fields, no sign
  that it is saved, and no way to close it. Earlier sets are one-line rows.
  The next button down is "Add set", which a person can take for "save this
  one"; that tap records a second set and restarts the rest
  (PD-1, UXA-3; high, every set).
- **With a set open, "Add set" is off screen while the bar points at it.**
  The screenshot `workout_set_running_dark` shows a set being timed: the bar
  says "Tap Add set when the set is done." and offers only "Cancel"; "Add
  set" is below the open controls and two settings rows. A timed set's
  length then includes the time taken to scroll to the button
  (PD-2, UXA-2; high, every set after the first).
- **"Add set" stamps the set's end and starts the rest, and nothing says
  so.** A person who taps it before lifting, to fill in planned numbers,
  records times they did not mean to (UXA-1). That confirming a set ends it
  is MM-191's decision.
- **A logged set does not look as if it opens.** Its row has small text at
  the right where every other row that opens has a chevron (PD-3, UXA-4).
- **"Start set" before there is an exercise.** It is the only filled button
  on a new workout, it works, and its instruction names a button that is not
  there (UXA-5, PD-5). `design/design-principles.md` asks for one primary
  action per screen; the workout screen has "Start set", "Finish workout" and,
  when paused, "Resume".
- **"Edit times" is the first thing that says "times"**, and it edits the
  workout's, not a set's. The screen it opens has "Start the clock again from
  now", which moves the workout's start in one tap (PD-4).
- **Correcting a time.** The set's length is shown only on its closed row,
  not where the times are edited (PD-6). A refused time closes the dialog
  first, loses what was typed, and "overlaps another set" does not say which
  (UXA-6).
- **Paused.** The bar says "Paused" beside a disabled "Start set"; "Resume"
  is at the top of the list, and pausing drops a running set time without a
  word (UXA-7).

## Description
A set that is recorded reads as recorded where it is edited; the control that
records the next set is on screen when a set ends and cannot be taken for the
one that keeps the current set; a row that opens shows that it does; and the
bar's instruction always names something the screen offers.

Open to the owner:
- which action should carry the screen's one emphasis while a workout is in
  progress: timing a set, recording one, or finishing;
- whether the latest set should stay open or return to a row;
- whether a timed rest should be readable after it ends (MM-191 says the
  rest is not its own record; PD-8);
- whether finishing a workout should be confirmable or reversible (UXA-10);
- whether Train should have a section in `design/screen-direction.md`; it
  has none (PD-9).

## Acceptance Criteria
```gherkin
Scenario: The set just added
  Given a set has been added
  Then it is plain, where its numbers are shown, that it is recorded

Scenario: Ending a timed set
  Given a 360 by 800 screen with a set being timed and the previous set's controls open
  Then the control that records the set is visible without scrolling

Scenario: What "Add set" does
  Given an exercise with "Add set" offered
  Then the screen says it records a finished set at that moment

Scenario: Opening an earlier set
  Then a closed set shows that it can be opened, as other rows on the card do

Scenario: The bar's instruction
  Then whatever the timer bar tells the person to tap is on the screen

Scenario: Correcting a time
  Given a set's start or end has been changed
  Then the set's length is shown without closing the set
  And a refused time says which set it clashes with and keeps what was typed
```

## Notes
- Evidence: the step records for the four tasks in both reports; screenshot
  tests `workout_dark`, `workout_martian`, `workout_set_running_dark` (added
  at the reviewers' request), `train_dark`, `exercise_picker_dark`.
- Two confirmed defects from the same review are tracked on their own:
  MM-214 (a reps field showing what is not stored) and MM-215 (removing a
  set cannot be undone).
- Not checked, and needing a phone: whether the rest signal fires with the
  display off (UXA-8); screen-reader wording, target sizes and large text
  (UXA-9).
- This is analysis of the built screen. Nobody was observed using it.
