---
id: MM-258
component: training
status: done
related: [MM-253, MM-224, MM-222, MM-75, MM-77, MM-78, MM-79]
---

# Story: the Train screen in tiers

## What is built

- **One primary action**: Start workout. "Repeat last workout" is a text
  action beside it; "Weekly training volume" is a section, not a chip.
- **This week as a strip**: the seven days with a mark on trained days,
  and the week's sets per muscle group as a compact row with muscle-group
  marks, opening the volume screen.
- **Workouts grouped by week** (this week, last week, then by month), each
  row with the day, the duration and a record mark when a personal record
  was set, so a record day reads at a glance; "5 exercises · 9 sets" moves
  to the row's detail.
- **Suggestions** (MM-79) as a section with an icon, one row per lift.

## Acceptance criteria

```gherkin
Scenario: One primary action
  Then Start workout is the only primary button, and Repeat is a text action

Scenario: Grouped
  Given workouts over three months
  Then they are grouped by this week, last week and month, with a record mark on record days

Scenario: Nothing lost
  Then every workout and figure the old list showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Train.stories.tsx` (Train), before and
after.

## Progress

Built 2026-10-13. Start workout is the one primary; Repeat last workout is a text action under it. The strip (`trainedDays`) marks the last seven days with a finished workout, the same rolling week as the Dashboard's. Weekly training volume is a section whose header opens the volume screen, with the week's hard sets per muscle group as its line in words ("Back 4 · Chest 2 …", the text marks until the app has its own glyphs, PD-21). Workouts are grouped by `workoutGroups`: This week, Last week, then months (the first open, older months folded with their count, PD-23); a row is the day, the summary with the record count in words, and a star mark with "personal record" spoken (UX-15, PD-22; not a trophy). Suggestions (MM-79) have no data source on this screen and were not added. Tests: `test/train/workoutGroups.test.ts`, the Train suites. Story: `Screens/Train` Train. The demo seed shows a record on every row; MM-289 varies it.
