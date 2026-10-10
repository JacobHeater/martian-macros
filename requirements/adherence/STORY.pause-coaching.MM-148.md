---
id: MM-148
status: in-progress
component: adherence
related: [MM-145, MM-23, MM-24, MM-31, MM-92, MM-117, MM-134, MM-135, MM-136, MM-146, MM-147]
---

# Story: Pause for a holiday, an illness or an injury without it counting against me

## Context
See MM-145. Some weeks are not going to be tracked, and the user knows in advance: a wedding, a two-week trip, flu, a hospital stay. The
app has no way to be told. The days appear as failed logging, the estimator works around them, reminders fire into a hotel room, and the
user returns to the gap flow (MM-147) as if they had lapsed.

A planned break is the opposite of a lapse. It is the flexible control that the evidence favors (MM-145), and declaring it is a sign of
commitment. The app should treat it that way.

## Decisions
Choices I made without asking (say if any is wrong):
- **A pause has a reason** (travel or holiday; illness; injury; other) **and an end date**, up to 28 days ahead, extendable once. It can be
  started for today or scheduled.
- **During a pause**:
  - targets are shown at maintenance, labelled "paused", as a guide and nothing more; nothing is judged against them (no "over", no band);
  - logging and weigh-ins still work and are welcome, never requested;
  - no check-in runs and targets do not change;
  - all reminders are silent (MM-146);
  - no notices about training lapses (MM-134), stalls or adherence are produced;
  - process counts neither advance nor break (MM-92): the streak is where it was.
- **The estimator leaves pause days out of its window** unless the user logged them and marked them complete. Eating on holiday is not the
  eating the coach is trying to measure.
- **Illness and injury also record a weight event** (MM-136) for the same dates, so the scale's behavior is discounted without the user
  being asked twice.
- **A pause of 7 days or more counts as a diet break** and restarts the unbroken-deficit count (MM-31, MM-135).
- **A lean-gain surplus is suspended during an injury pause** (MM-134): maintenance, without comment.
- **Ending a pause** (on its date, or early by the user) shows the same single return screen as MM-147 without the word "back" implying
  absence: "Ready to resume? A weigh-in gets the coach going again." Targets return to what they were; the first check-in is 7 days
  later, and the expected water shift is explained (MM-130's wording).
- **Pauses are limited only by honesty about what they are**: more than 56 paused days in any 120 prompts one neutral question about
  whether maintenance would suit better as the goal for now. No refusal.

Where the experts disagreed:
- The bodybuilding coach: a holiday is exactly when a user most needs targets, and "pause" teaches that the plan is optional. The
  behavior-change expert: the user decides that with or without the app's blessing; the only question is whether they come back. The
  maintenance guide remains visible for those who want it.
- The engineer preferred excluding pause days from the estimator absolutely. Marked-complete days are kept because a user who logs
  carefully through a business trip has given good data.

## Description
A pause record (dates, reason); the shell, check-in, estimator, reminders and notices each consult it.

## Acceptance Criteria
```gherkin
Scenario: Scheduling a holiday
  When a pause is set for travel from the 10th to the 20th
  Then from the 10th the targets are shown at maintenance and labelled paused, and no reminder is sent

Scenario: Nothing is judged
  Given a paused day with 3,400 kcal logged
  Then no screen describes it as over, and no insight or notice refers to it

Scenario: The estimator skips it
  Given ten paused days with patchy logging
  Then none of those days is used in the expenditure estimate

Scenario: Logged carefully anyway
  Given paused days that are logged and marked complete
  Then those days are used

Scenario: Counts as a break
  Given nine unbroken weeks of deficit, then a 10-day pause
  Then the unbroken-deficit count is zero after it

Scenario: Streaks neither advance nor break
  Given a logging streak of 12 before a 7-day pause
  Then it is 12 on the first day after

Scenario: Illness
  When a pause is started for illness
  Then a weight event covering the same days exists

Scenario: Resuming
  When the pause ends
  Then the previous targets are restored, the return screen asks for a weigh-in, and the next check-in is 7 days later
```

## Notes
- Priority: should-have. Ship before the first holiday season after launch.
- A pause is a kind of phase change for the glycogen rule (MM-131) at both ends.
- For pregnancy, surgery and anything longer than a few weeks, the right tool is a goal change through the health check (MM-112), not a
  pause.

## Progress
Built:
- **A pause record**: dates, reason and whether it has been extended (`Pause`, `PauseReason`; the `PauseRepository` interface with a
  Drift implementation and an in-memory one under one contract; schema version 20). One pause per start day.
- **Setting one**: Settings, "Pause". A reason (travel, illness, injury, other), a start from today to 28 days ahead, and a length of 1
  to 28 days. While one is running or set, the same screen shows it with "Resume now" (or "Cancel this pause") and "Extend by a week",
  which works once.
- **During a pause**: the dashboard and the Food screen show a maintenance guide in place of targets, labelled paused, with what was
  logged and never "over" or "left" (`pausedGuide`; a test logs 3,400 kcal and forbids the word). The dashboard's status line and a
  notice on the Coach screen say until when. No check-in runs and no target changes, including for a goal change (`nextTargets`). The
  weekly summary, the stall diagnosis and insights say nothing while a paused day is inside the stretch they look at, and the
  under-eating rule does not see paused days.
- **The estimator** leaves paused days out unless they were logged and marked complete (`withoutPausedDays`, in `analyze`).
- **Not a lapse**: a paused day is never part of a gap (MM-147), so the welcome-back flow does not fire for a pause.
- **Illness and injury** record weight events for the pause's dates, one a week (the trend takes at most two in 14 days into
  account): illness as "illness", injury as "other". Ending or cancelling a pause removes the ones it no longer covers.
- **Counts as a break**: a pause of 7 days or more restarts the unbroken-deficit count on the day after it, or on its seventh day
  while it is still running (`pauseDeficitRestartOn`).
- **Resuming**: when a pause has ended, on its date or early, the single return screen reads "Ready to resume? A weigh-in gets the
  coach going again." and says the targets are what they were, the next check-in is in a week, and the scale will move while water
  settles. A test forbids "back", "away", "missed", "streak", "gap" and "lost" on it. The stored targets are untouched by a pause, so
  they are what they were; the next weekly check-in waits until 7 days after the pause ends.
- **Heavy use**: more than 56 paused days in the 120 ending with a new pause shows one neutral question about maintenance on the
  form. It refuses nothing.
- Thresholds are in `PauseRule`. Tests: `pause_test.dart` (engine), `pause_test.dart` (app), the pause repository contract against
  both implementations, and the migration test.

Not built:
- Reminders are silent during a pause, and streaks neither advance nor break: reminders (MM-146) and process rewards (MM-92) do not
  exist yet. Each must read the pause when it is built.
- Notices about training lapses (MM-134): not built either.
- The glycogen rule at both ends of a pause (MM-131): the scale is not yet treated as settling when a pause starts or ends, beyond
  the sentence on the resume screen. The wording is this ticket's, not MM-130's, which is not built.
- The Coach screen still shows the stored targets under the paused notice; only the dashboard and Food screen swap in the guide.
- The guide for a past paused day is today's maintenance estimate, not that day's.
- A pause cannot be edited (only ended, cancelled or extended a week), and its dates are set with sliders; there is no date picker
  component yet.
- Not checked on a device.
