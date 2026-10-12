---
id: MM-191
status: in-progress
component: training
related: [MM-74, MM-75, MM-146, MM-188, MM-189]
---

# Story: Workout and set times, entered by hand or with a timer

## Context
A health platform records an exercise inside a workout only with a start and an end time (MM-188), and the workout log (MM-75) records
a set as reps, load and RIR with no times. Without times, no set can be written to a platform as anything finer than the whole session.
Timing also has its own use in the gym: knowing how long the rest was.

## Decisions (made with the product owner)
- **A set's times can be entered by hand.**
- **The app has timers**, since nothing else in it tracks time during a workout.
- **The workout clock can be paused and resumed** (2026-10-10).
- **A workout's own times can be set by hand** (its day, start and end), and time is something the user starts and stops and can
  see running, for workouts and rests, not only an elapsed figure worked out in the background (2026-10-10).

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

Choices made with the expert panel while the product owner was away (2026-10-11; say if any is wrong):
- **The rests on offer are None, 1:00, 1:30, 2:00, 3:00 and 5:00**, and an exercise starts at None. The app recommends no length of
  rest: prescribing training is a non-goal. Nothing under a minute is offered; that is the one range the evidence leans against
  (Singer et al. 2024, DOI 10.3389/fspor.2024.1429789). No length typed freely yet. (training)
- **A target is remembered per exercise**: adding the exercise to a later workout, or repeating a workout, brings its last target.
- **At the target the bar says "Target rest reached"**, not "Rest over", which reads as an order to lift. The timer then shows the
  whole rest, still counting. (training)
- **The signal is given once**, only while the workout is open, never late for a rest that ended while the app was closed, and never
  while the workout is paused or a set is being timed. (training, ux-accessibility)
- **A screen reader hears the label when it changes, not the figure every second.** (ux-accessibility)
- **A set's time is typed as hour, minute, second and AM or PM**, four separate controls with number keys, not free text: nothing
  about AM or PM is guessed. (ux-accessibility)
- **A typed time of day before the workout's start is on the next day**, when that is within twelve hours of the start and not still
  to come; otherwise it is refused as before. The twelve hours stop a slip (11:20 PM against an 11:30 PM start) from making a workout
  of nearly a day. The same holds for a set's times. (ux-accessibility)
- **Time paused counts as rest.** The rest is the gap between one set's end and the next one's start, whatever the workout clock did.

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

Scenario: Overlapping typed sets
  Given another logged set in the same workout
  When typed times overlap that set, even on a different exercise
  Then the change is refused with an explanation
  And the set keeps its previous times
  And sets that only touch at their boundaries remain allowed

Scenario: No target
  Given an exercise with no target rest
  Then the rest timer counts up, as before

Scenario: The target is reached
  Given a target rest of 1 minute
  When a minute has passed since the set ended
  Then the signal is given once
  And the timer says the target rest is reached and goes on counting the rest

Scenario: The target is changed mid-rest
  Given 40 seconds of rest against a 5 minute target
  When the target is changed to 1 minute
  Then 20 seconds are left

Scenario: The target passed while the app was closed
  When the app is opened after the target was reached
  Then the rest is shown and no signal is given

Scenario: The target is remembered
  Given the back squat had a target rest of 3 minutes last time
  When the back squat is added to a new workout
  Then its target rest is 3 minutes

Scenario: Typing seconds
  When a start of 12:02:10 PM is entered for a set
  Then the set starts at that second

Scenario: A workout that ends after midnight
  Given a workout that started at 11:30 PM
  When an end of 12:20 AM is entered
  Then it ends at 12:20 AM on the next day
  And changing the workout's day keeps the end on the day after

Scenario: A slip is not a day-long workout
  Given a workout that started at 11:30 PM
  When an end of 11:20 PM is entered
  Then it is refused

Scenario: Only timed sets reach a platform as segments
  Given a workout with one set that has both times and one that has neither
  Then only the first can be written as a segment, and the workout is still written as a session
```

## Progress
Built (2026-10-10), schema 26:
- **The workout clock**: a card at the top of the workout shows the time running while it is in progress, and the start, end and
  length once finished. "Edit times" sets the day, start and end by hand; while in progress it can also start the clock again
  from now.
- **The set and rest timer**, a bar at the bottom of a workout in progress. "Start set" starts timing; "Add set" on an exercise
  stops it and gives the set its start and end. From then the bar counts the rest, until the next set is started. "Cancel" stops
  a set timer without logging.
- **Pause and resume** on the workout clock (schema 27). Time paused is left out of the workout's length; its start and end stay
  what the wall clock said. Pausing holds the set timer and drops a set being timed. Finishing while paused ends the pause. A
  finished workout says how long it was paused. Typed times that make the workout shorter than its pauses drop the pauses.
- A set logged without the timer gets an end and no start. A set added to a finished workout gets neither.
- **A set's start and end can be typed**, in its controls. An end not after its start, or a time outside the workout, is refused
  with the reason and the set keeps what it had.
- A timed set shows how long it took. The timers are stored times read against the app's clock, so they survive the app closing.
- Typed sets are checked for overlap across all exercises (MM-196). Adjacent
  intervals are allowed; missing times do not imply a range. A conflict is
  explained and the original times are preserved.

Built (2026-10-11), schema 28:
- **A target rest per exercise**, chosen on the exercise's card of a workout in progress and remembered for that exercise. The bar
  counts down to it, says when it is reached, and then shows the whole rest.
- **One vibration when the target is reached**, through a `RestSignal` interface so it can be replaced.
- **A set's start and end are typed to the second**, in an entry of the app's own.
- **A workout can end after midnight**, and so can a set in it; changing the workout's day keeps the end on the day after.

Not built:
- **A sound at the end of a rest.** Flutter has no system alert sound on Android or iOS, so a sound needs an audio package and a
  sound file: a new dependency, left for the product owner to decide. Only the vibration is given.
- A signal when the app is in the background (MM-146's scheduler), and a rest length typed freely.
- A workout's own start and end are still typed to the minute (the phone's time picker).
- Seen on the Android emulator (2026-10-11): choosing a target, the countdown, the bar at the target, and the time entry.
  Not seen with a screen reader, and the vibration was not felt on a phone.

## Notes
- Builds on MM-75; adds two nullable columns to the set and one to the workout (the running set timer), in schema 26; pausing adds two more to the workout in schema 27; the target rest adds one to the workout's exercise in schema 28.
- Time comes from the app's `Clock`, never the device directly (MM-190), so every scenario above is testable with a fixed clock.
- Not planned: automatic rep counting, heart rate, or timing from a watch.

## UI/UX Assets

- [Train](../ui-ux-assets/views/train.html) — Current. Draws RestAlarm,
  SetEditor, SetTimerBar, Ticking, WorkoutClockCard, WorkoutExerciseCard and
  WorkoutTimesScreen as built on 2026-10-11: none of its own, new set,
  bodyweight, timed, rest, set running, counting down, target reached, and
  more. Frames: `#workout-rest-reached`, `#workout-default`,
  `#workout-rest-counting`, `#workout-set-running`, `#workout-paused`,
  `#workout-times`. Partly compared with screenshot tests, the rest drawn from
  the source alone. Vibrates the phone when the rest target is reached; it
  draws nothing. Rebuilds its child every second; it draws nothing itself. It
  shows what exists and approves nothing.
- [Component catalog](../ui-ux-assets/components/index.html) — Current. Draws
  MmClockTimeDialog, showMmClockTime and showMmOptions as built on 2026-10-11:
  valid, refused, open, open, one chosen. Frames: `#mm-clock-time-dialog`,
  `#show-mm-options`. Drawn from the source alone; not compared with the
  running app. It shows what exists and approves nothing.
- [Flows](../ui-ux-assets/flows/index.html#log-a-workout) — Current. Draws the
  "a workout from start to finish" path as built on 2026-10-11. Drawn from the
  source alone; not compared with the running app. It shows what exists and
  approves nothing.
