---
id: MM-447
status: proposed
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

## Notes
- Not built. Each point waits on the owner's answer above.
