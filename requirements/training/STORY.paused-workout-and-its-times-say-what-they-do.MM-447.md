---
id: MM-447
status: done
component: training
related: [MM-191, MM-212, MM-222]
---

# Story: A paused workout, and a workout's times, say what they do

## Context
Split from MM-222 on 2026-10-21. MM-222 built the points of the workout
logging walkthrough (MM-212, run
`docs/agent-runs/mm212-workout-logging-walkthrough/`) that its acceptance
criteria asked for: a set that reads as recorded, "Set done" on the timer
bar, a row that shows it opens, and a refused time said in the clock. The
review's other findings need an owner decision and are kept here.

What the built screen does today:
- **Paused** (UXA-7). The bar says "Paused" beside a disabled "Start set";
  "Resume" is at the top of the list; pausing drops a set being timed
  without a word.
- **"Edit times"** (PD-4) is the first thing that says "times", and it
  edits the workout's, not a set's. Its screen has "Start the clock again
  from now", which moves the workout's start in one tap.
- **A rest that has ended** cannot be read back (PD-8). MM-191 says the rest
  is not its own record.
- **"Finish workout"** acts at once, and a finished workout cannot be put
  back in progress (UXA-10).
- **Train has no section** in `design/screen-direction.md` (PD-9).

## Description
Open to the owner:
- whether the bar offers "Resume" while paused, and says that a set being
  timed was dropped;
- whether "Edit times" is named for the workout, and whether "Start the
  clock again from now" asks first;
- whether a timed rest should be readable after it ends;
- whether finishing a workout should be confirmable or reversible;
- whether Train gets a section in `design/screen-direction.md`.

## Acceptance Criteria
```gherkin
Scenario: Paused
  Given a workout in progress is paused
  Then the timer bar names a control on the screen that resumes it

Scenario: Pausing while a set is timed
  Given a set is being timed
  When the workout is paused
  Then the screen says the set's timing was dropped

Scenario: The workout's times
  Then the control that edits the workout's times says they are the workout's
  And starting the clock again from now can be taken back or is asked first
```

## Decisions
The owner's answers were not given; the coordinator, for the owner (2026-10-21), had the recommended answer built as
the default for each, and these are easy to overrule:
- **The bar offers "Resume" while paused**, in place of the disabled "Start set", and says "Tap Resume to start the
  clock again." The clock card keeps its own Resume beside Pause, the sibling it toggles with.
- **Pausing says when it drops a set being timed**: a snack, "Paused. The set being timed was dropped; start it again
  after you resume." Nothing is said when no set was being timed. The set is still dropped (MM-191: a pause is not part
  of a set).
- **"Edit times" is "Edit workout times"**; a set's times stay on the set.
- **"Start the clock again from now" asks first** (title "Start the clock again from now?", confirm "Start again",
  Cancel the stronger choice, MM-280), since it cannot be taken back.
- **Train has a section in `design/screen-direction.md`** ("Train and a workout"), written from the built screen.
- **Finishing a workout stays one tap, neither confirmed nor reversible**: a finished workout's sets and times can
  still be corrected, and it can be deleted. A reopen would also have to take back what was written to the health
  platform (MM-489), which is the health-sync lane's; ask for it as its own ticket if it is wanted.
- **A rest that has ended is not made readable here**: MM-191 holds that a rest is not its own record, and set times
  and timers are MM-191's.

Siblings reused (MM-318): the clock card's Resume (label and play icon) for the bar's; the workout's delete question
(`overlays.confirm`) for the restart question; the pack download's paused wording for the snack.

## Notes
- Built 2026-10-21: `SetTimerBar.tsx` (Resume while paused, its instruction), `WorkoutClockCard.tsx` (the dropped-set
  snack, "Edit workout times"), `WorkoutTimesScreen.tsx` (the restart question).
- Tests: `test/train/workoutTimes.test.tsx` ("holds the set timer, and drops a set being timed" now checks the dropped
  set is said and the bar's Resume; "says nothing was dropped when no set was being timed"; "can be started again from
  now" confirms; "is not started again when the question is turned down"; "names the times it edits as the
  workout's"). Stories `Train/WorkoutPausedDroppedSet` and `Train/WorkoutTimesRestartAsks`.
- Not run locally; CI validates. Not reviewed by the design panel: the changes reuse existing controls and wording on
  the same screen.
