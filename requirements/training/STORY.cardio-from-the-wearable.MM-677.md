---
id: MM-677
status: in-progress
component: training
related: [MM-23, MM-74, MM-188, MM-189, MM-253, MM-258, MM-442, MM-489, MM-490, MM-678]
---

# Story: Cardio from the wearable: sessions and steps, on Train and the Dashboard

## Context
The owner, 2026-10-28: "Next big swing here on a feature is steady state cardio. I don't want the app to track steady
state cardio, but we'll track this in two forms: steps, and cardio workout sessions within the user's wearable. I love
strength training here and it must stay, but part of training on any fatloss or recomp program must be steady state
cardio." The Q&A that followed (four rounds, 2026-10-28) settled the shape below. The coach's side is MM-678.

What exists: steps are read through each platform's own daily total (MM-442) but nothing uses them; the platform's
workouts are imported (MM-490) but only MM-188's strength types, `workoutFromPlatform` dropping the walks and runs a
watch records (the coordinator's call of 2026-10-21, not the owner's).

## By the product owner (the Q&A of 2026-10-28)
- **Platform only.** Steps come from the platform's daily total and cardio sessions from the wearable. The app has no
  timer, no manual entry and no logging of cardio or steps.
- **Every non-strength session counts** as cardio: walks, runs, rides, HIIT, sport, all of it. Not only steady state;
  so the word on the screen is **"Cardio"**, never "steady state".
- **Strength training stays** as it is.
- **The floors:** 8,000 steps a day and 150 minutes of cardio a week ship as the coach's defaults; the person can change
  both in Settings › Coach (MM-678).
- **One section on Train, "Cardio"**, under Weekly training volume, the same shape; the week's dots fill half on a day
  with cardio and no strength workout.
- **On the Dashboard too:** one row with today's steps and this week's cardio minutes against the floors, opening Train.
- **A walk recorded as a session also counts in that day's steps.** Both count; nothing is summed into energy, so there
  is no double count (MM-23 stays: nothing is eaten back).
- **Both shells**, both checked by the owner on a phone.

## Decisions
Choices made without asking (say if any is wrong):
- **A session's activity** is said by the plugin by name (`CardioActivity`): walking, running, hiking, cycling,
  elliptical, rowing, stair climbing, swimming, intervals, or `other` for any other non-strength type (sport, dance,
  yoga and the rest). Health Connect's `EXERCISE_TYPE_*` constants and HealthKit's `HKWorkoutActivityType` cases map to
  them; a strength type stays a workout (MM-490). An older plugin says no activity, and nothing is counted.
- **A cardio session is its own record, not a workout.** The training log stays the lifting log. A `CardioSession`
  (`domain/training/`) has the platform's id and source, its activity, start and end; it counts toward the local day
  it started. It is kept in `cardio_sessions` (schema 31), keyed by the platform's id, so a re-read changes it and never
  adds a second (MM-71). The platform is the only source of truth: nothing is edited or deleted in the app.
- **A day's steps are kept in `daily_steps`** (schema 31), one row a day from the platform's total, read over the last
  56 days on every health read so the stall rule (MM-678) has the four weeks before its window. A day the platform
  gives no total for has no row.
- **The same session recorded twice is counted once** (as MM-490): a new session whose span overlaps 80% or more of
  the shorter of its span and that of one kept from another source is left out.
- **The measures** (`buildCardioWeek`): the last seven days beside the seven before, the same rolling week the Train
  screen's other facts use (MM-258): cardio minutes in all and by activity, sessions, and steps a day on average over the
  days with a total, with today's steps. The floors are read beside them (MM-678's `CardioRule` defaults until the
  person sets their own).
- **Train's section** is built like Weekly training volume (`MmSection` with a summary that opens a screen), icon
  `walk`. Summary: "About 8,400 steps a day · 96 min of cardio this week" with the floors on the screen, or
  "Nothing from your watch in the last seven days." `CardioScreen` is built like `WeeklyVolumeScreen`: the week's span
  and the two measures against their floors with the previous week, the minutes by activity, the sessions of the week
  (day, start time, minutes, source), and the steps by day. The floors are changed in Settings › Coach, said on the
  screen.
- **The Dashboard row** sits with the week's workouts row in the list group: "{steps} steps today · {minutes} of cardio
  this week", subtitle the floors, `walk` icon, opens Train.
- **Disclosure, not deferral (the owner's rule):** with no platform, or steps and exercise sessions not allowed, the
  section and the row are still drawn and say what brings them to life ("Comes from your watch through Apple Health.
  Allow Steps and Exercise sessions in Settings › Health."). No new permission: the existing Steps and Exercise sessions
  cover it. The purpose text for Steps changes: the coach now reads them; still never for calories.
- **The rhythm strip** (MM-258): full for a day with a finished strength workout, half for a day with a cardio session
  and no workout, read as "cardio only".
- **Non-goal narrowed** (`docs/non-goals.md`, MM-140): "no cardio prescriptions" goes; "no burn it off" stays.

## Description
- `PlatformWorkout.cardio`: the activity, or undefined for a strength session. Both shells send `activity`; the
  adapter maps it. `cardioSessionImports` says what a read changes; `AppState.importWorkouts` saves the sessions from
  the same read as the strength imports, and `AppState.readHealth` saves the last 56 days of steps.
- `CardioSessionRepository` and `DailyStepsRepository`: SQL, in-memory, contract suites. Schema 31.
- `buildCardioWeek`, the Train section and `CardioScreen`, the Dashboard row, the strip's half dot, stories for each state.

## Acceptance Criteria
```gherkin
Scenario: A walk on the watch shows on Train
  Given the platform holds a 42-minute walk from the watch yesterday and 8,400 steps for each of the last seven days
  When Train is opened
  Then the Cardio section says "About 8,400 steps a day · 42 min of cardio this week"
  And the Cardio screen lists the walk with its day, time, "42 min" and "from Watch", and the steps by day
  And the cardio_sessions store holds one session for it and daily_steps a row a day

Scenario: Read again, the session is kept once
  Given a walk already kept from the platform
  When the platform is read again
  Then the store still holds one session for it

Scenario: A strength session is a workout, not cardio
  Given the platform holds a strength session
  Then it is imported as a workout (MM-490) and no cardio session is kept for it

Scenario: Every other session counts
  Given the platform holds a HIIT session
  Then a cardio session is kept for it, as "Intervals"

Scenario: The rhythm strip
  Given a day with a walk and no strength workout
  Then that day's dot is half full and reads "cardio only"

Scenario: The Dashboard
  Given 6,100 steps today and 96 minutes of cardio this week
  Then the Dashboard has a row "6,100 steps today · 96 min of cardio this week" that opens Train

Scenario: No platform
  Given no health platform on the phone
  Then the section and the row are drawn and say what would bring them to life
```

## UI/UX
- Cardio — apps/mobile/src/gallery/screens/Train.stories.tsx (Story: Cardio, CardioSessions, CardioEmpty, CardioFailed,
  CardioSmallPhone). The fold in each state (MM-680 made it a fold and drew it; the screen is gone), at phone width with
  the longest activity name the data has ("Stair climbing") and a two-digit hour of minutes.
- The Dashboard row — apps/mobile/src/gallery/screens/Today.stories.tsx (Story: DashboardCardio).

## Owed on a phone
- The Swift is not compiled by CI: the owner's iPhone with Apple Watch is the check that a walk recorded on the watch
  arrives with its activity, and that steps arrive by day. The Kotlin compiles in CI; the Android phone is the check
  that Health Connect's session types map.
