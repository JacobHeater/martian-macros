---
id: MM-191
status: proposed
component: training
related: [MM-74, MM-75, MM-146, MM-188, MM-189]
---

# Story: When each set happened, entered by hand or with a timer

## Context
A health platform records an exercise inside a workout only with a start and an end time (MM-188), and the workout log (MM-75) records
a set as reps, load and RIR with no times. Without times, no set can be written to a platform as anything finer than the whole session.
Timing also has its own use in the gym: knowing how long the rest was.

## Decisions (made with the product owner)
- **A set's times can be entered by hand.**
- **The app has timers**, since nothing else in it tracks time during a workout.

Choices I made without asking (say if any is wrong):
- **Times are optional.** A set is still logged with one tap and no times (MM-75). Nobody is made to time anything.
- **A set has a start and an end.** Either can be typed or corrected afterwards, on the set, to the second.
- **A set timer**: start it when the set begins and stop it when it ends, and the set gets both times. Stopping it is the same tap that
  confirms the set.
- **A rest timer** starts by itself when a set ends and counts up; the user can set a target rest per exercise and it then counts down
  to it. The rest is not stored as its own record: it is the gap between one set's end and the next one's start.
- **A set confirmed without the set timer gets an end time only** (the moment it was confirmed), never an invented start.
- **Nothing is made up for a platform.** A set with both times can be written as a segment; a set missing either is left out of the
  segments and the workout is still written as a session (MM-189's fallback). Times are never spread evenly or guessed.
- **A timer survives the app closing.** It is a stored start time read against the app's clock, not a counter that has to keep running.
- **The first version signals the end of a rest inside the app only** (sound and vibration, respecting the phone's silent mode). A
  notification when the app is in the background is a later step, through the reminder scheduler (MM-146).
- **Times must make sense**: an end after its start, both inside the workout, and sets of one workout not overlapping. A typed time that
  breaks this is refused with the reason, not silently moved.

## Description
Optional start and end times on a set, a way to type and correct them, a set timer and a rest timer in the workout screen. The times are
what later lets a set be written to Health Connect as a segment.

## Acceptance Criteria
```gherkin
Scenario: Timing a set
  Given a workout in progress
  When the set timer is started, and the set is confirmed 40 seconds later
  Then the set has a start and an end 40 seconds apart

Scenario: Typing the times
  Given a logged set with no times
  When a start of 18:02:10 and an end of 18:02:55 are entered
  Then the set has those times

Scenario: A set without the timer
  When a set is confirmed without starting the set timer
  Then it has an end time and no start time

Scenario: Rest
  Given a set ended 90 seconds ago and the exercise's target rest is 2 minutes
  Then the rest timer shows 30 seconds left

Scenario: The app is closed mid-rest
  Given a rest timer running
  When the app is closed and reopened a minute later
  Then the rest timer shows a minute more than before

Scenario: Times that cannot be
  When an end before the start is entered
  Then it is refused and the set keeps its previous times

Scenario: Only timed sets reach a platform as segments
  Given a workout with one set that has both times and one that has neither
  Then only the first can be written as a segment, and the workout is still written as a session
```

## Notes
- Builds on MM-75; adds two nullable columns to the set, so it needs a migration (MM-61) and takes the schema lane.
- Time comes from the app's `Clock`, never the device directly (MM-190), so every scenario above is testable with a fixed clock.
- Not planned: automatic rep counting, heart rate, or timing from a watch.
