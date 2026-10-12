---
id: MM-77
status: done
component: training
related: [MM-74, MM-75, MM-32, MM-33]
---

# Story: See whether I am getting stronger

## Context
See MM-74. Sets of different reps and loads cannot be compared directly; an estimated one-rep max puts them on one scale.

## Decisions (made with the product owner)
- **Estimated one-rep max (e1RM) by the Epley formula, using reps plus reps in reserve**: load x (1 + (reps + RIR) / 30).
- **Bodyweight lifts use bodyweight at the workout date plus added or assisted
  weight.** If bodyweight is unknown, omit the estimate (owner, 2026-10-10).

Choices I made without asking (say if any is wrong):
- **A session's e1RM for a lift is its best set's.**
- **Sets above 12 effective reps are not used** for e1RM; the formula is poor there.
- **A set with no RIR recorded is treated as RIR 0** (taken to failure), which understates strength rather than flattering it.
- **The trend is a smoothed line through session values**, since one bad day is not a loss of strength.
- **The Progress screen shows the user's most-trained lifts** (up to four) with the change over four and twelve weeks; any lift's history
  can be opened.
- Use the latest weigh-in on or before the workout, at most seven days old.
  Never use a later weigh-in or today's weight for an earlier workout.
- Only finished workouts dated on or before today contribute. A session's
  best set is calculated across every occurrence of that exercise.
- RIR "5 or more" is not an exact count, so those sets are excluded. Zero or
  negative total resistance cannot produce an e1RM.
- Smooth with the mean of up to three latest qualifying sessions within
  28 days of each point. Do not invent daily observations or bridge a long
  gap with a carried-forward value.
- Changes compare the latest smoothed point to the last point on or before
  28/84 days earlier, no more than seven days before that baseline date.
  Missing baselines are unavailable, never zero. Dates are shown so old
  sessions are not presented as today's strength.
- Rank the Progress cards by qualifying sessions in the last 90 days
  (ties: latest date, then exercise ID). A separate list opens any logged
  lift, including one that has no usable e1RM yet.
- Deleting an exercise keeps its lift history by stable ID. Without its
  original resistance type, estimates are unavailable rather than guessed.
- The graph shows the latest session on each recorded date; the detail list
  retains every session, including multiple sessions on the same day.
  No PR celebrations, coaching integration or monthly report changes in this slice.
- The isolated synthetic demo includes deterministic finished training over
  fourteen weeks, four chartable lifts and a high-rep-only lift. Normal
  installations are never seeded or reset.

## Description
From logged sets, the app computes e1RM per session per exercise and shows a trend per lift.

## Acceptance Criteria
```gherkin
Scenario: The formula
  Given a set of 5 reps at 100 kg with 2 reps in reserve
  Then its e1RM is 123.3 kg

Scenario: The best set counts
  Given a session with sets worth 120, 123 and 118 kg
  Then the session's e1RM is 123 kg

Scenario: High-rep sets are ignored
  Given a set of 20 reps
  Then it does not contribute to e1RM

Scenario: Progress
  Given a lift's smoothed e1RM rose from 100 to 106 kg over four weeks
  Then the Progress screen shows +6 kg (or the equivalent in pounds) for that lift

Scenario: Bodyweight resistance
  Given a pull-up session with a recent bodyweight of 80 kg and 10 kg added
  And a set of 5 reps with 2 reps in reserve
  Then its e1RM is 111 kg based on 90 kg total resistance
  And a later weigh-in is not used to estimate that session

Scenario: Not enough evidence
  Given no recent bodyweight for a bodyweight lift or only high-rep sets
  Then its history explains why no estimate is available
  And missing four- or twelve-week comparisons are not shown as zero

Scenario: Recomputed history
  When a workout is edited or deleted or its historical bodyweight is corrected
  Then the affected session estimates and trend are recomputed

Scenario: Data cannot be read
  Given workout, exercise or weight history is loading or fails
  Then the strength section shows a loading or retry state
  And does not present a failed read as an empty history
```

## Notes
- e1RM is a comparison tool, not a prediction of a real one-rep max. Say so where it is shown.
- Engine and mobile tests cover formulas, historical bodyweight, smoothing,
  baseline tolerance, gaps, ranking, same-day sessions, units, corrections,
  deletions and all three input read/retry states. Full Windows checks pass.
- Progress charts, full lift detail, all-lift navigation and an unusable
  high-rep history were inspected in the isolated Martian Android emulator
  demo. Linux screenshots cover Light, Dark and Martian. iOS was not run.

## UI/UX Assets

- [Progress](../ui-ux-assets/views/progress.html) — Current. Draws
  StrengthHistoryScreen, StrengthLiftsScreen and StrengthSection as built on
  2026-10-11: populated, empty, loading, error. Frames: `#strength-history`,
  `#strength-lifts`, `#progress-strength-states`. Partly compared with
  screenshot tests, the rest drawn from the source alone. It shows what exists
  and approves nothing.
- [Component
  catalog](../ui-ux-assets/components/index.html#strength-trend-card) —
  Current. Draws StrengthTrendCard as built on 2026-10-11: populated, no
  estimate, deleted exercise. Compared with a screenshot test of the built
  screen. The no-estimate and deleted states are on
  views/progress.html#progress-strength-states. It shows what exists and
  approves nothing.
