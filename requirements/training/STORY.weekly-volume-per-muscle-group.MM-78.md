---
id: MM-78
status: done
component: training
related: [MM-74, MM-75, MM-76, MM-79]
---

# Story: See how much I train each muscle group

## Context
See MM-74. Whether training is enough to drive muscle gain is mostly a question of hard sets per muscle group per week.

## Decisions (made with the product owner)
- **Weekly hard sets per muscle group.**

Choices I made without asking (say if any is wrong):
- **A hard set is one logged with 4 or fewer reps in reserve**, or with no RIR recorded.
- **A set counts fully toward its exercise's primary muscle group and half toward each secondary one.**
- **The week is the last seven days**, not a calendar week, so the figure does not reset on Monday.
- **Shown against a broad reference range** of 10 to 20 hard sets a week per group, described as a typical range, not a rule.
- Count finished workouts only, ending at today's local date: current window
  today minus six days through today, previous window minus thirteen through
  minus seven. Future and in-progress sessions are excluded.
- RIR 5+ is the logger's representation of easy sets and is excluded.
  Zero or assisted load still counts; bodyweight exercises need no weigh-in
  to count logged hard sets. Positive reps are required.
- All eleven muscle groups appear, including zero, with exact half-set values.
  No prescriptions, warnings or rewards for reaching the reference band.
- Train opens the volume view. Each row shows current and previous volume,
  a signed change, and a graphic scaled to include values above 20.
- Deleted/unknown exercise mappings are not guessed. Show the number of
  otherwise-hard sets omitted in each window and explain missing mappings.
  Failed workout/library reads show retry, not zero-volume results.

## Description
A view of hard sets per muscle group over the last seven days, with the previous seven for comparison.

## Acceptance Criteria
```gherkin
Scenario: Counting
  Given 4 sets of bench press (chest primary; shoulders and triceps secondary) in the last seven days
  Then chest shows 4 sets and shoulders and triceps 2 each

Scenario: Easy sets do not count
  Given a warm-up set logged with 6 reps in reserve
  Then it is not counted

Scenario: A neglected group
  Given no hamstring work in two weeks
  Then hamstrings show zero, visibly below the reference range

Scenario: Rolling windows
  Given finished workouts on today, six, seven, thirteen and fourteen days ago
  Then today and six days ago contribute to the current period
  And seven and thirteen days ago contribute to the previous period
  And fourteen days ago, future and in-progress workouts do not contribute

Scenario: Missing mapping
  Given a finished workout refers to a deleted exercise
  Then its hard sets are reported as omitted from muscle-group totals
  And a failed library read is shown as a retry state instead

Scenario: Recomputed volume
  When a workout is edited or deleted or a custom muscle mapping changes
  Then current and previous muscle-group totals update
```

## Validation
- Six engine cases cover exact counts, rolling boundaries, RIR/bodyweight,
  missing mappings, duplicate secondary mappings and explicit malformed data.
- Mobile tests cover updates/deletions, custom mapping changes, both source
  loading/error/retry states, and active-workout navigation (MM-195).
  Layout tested at 320px and 150% text. Full Windows `mm check` passes.
- Martian volume screen and all eleven rows inspected in the isolated headless
  Android emulator; no physical phone or normal storage used. Reviewed Linux
  goldens cover Light/Dark/Martian. iOS was not run.
