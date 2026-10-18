---
id: MM-378
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-364, MM-365, MM-366, MM-363]
---

# Story: Snooze an inline insight for one item

## Context
Every qualifying item shows its insight (MM-362). Many people log the same food most days, so the same line would sit under
it every day. At first only Settings > Coach could quiet a line (MM-364), for a whole kind; volume jump rested by itself after
its first week (MM-366).

## Decisions
The product owner's (2026-10-18, through the question tool):
- **Every qualifying item still shows its line, every time**, and the person can **snooze** it.
- **A snooze quiets one kind on one item**: "Mostly fat" snoozed under peanut butter is quiet for peanut butter only. Other
  foods still get "Mostly fat"; peanut butter still gets other kinds.
- **Lengths: 1 day, 1 week, 1 month, or always** (until turned back on).
- **The snooze sits inside the opened line**, beside "Settings for “Mostly fat”", as "Snooze…" offering the lengths. The
  closed line stays one caption with no second target.
- **Snooze everywhere**: food and workouts alike. Volume jump's automatic rest after its first week (MM-366) is replaced by
  the snooze.
- **Undo** in the message right after snoozing, and **a "Snoozed" list on each area's screen in Settings > Coach**
  ("Mostly fat · Peanut butter · until Oct 25", or "… · always"), each with "Turn back on".

Choices I made without asking (say if any is wrong):
- **"One item" means the same food or the same exercise**, by its name for a food and its id for an exercise, not one
  entry: snoozing peanut butter today keeps it quiet on tomorrow's peanut butter too. A one-entry snooze would do nothing
  for a food logged daily.
- **For volume jump, the item is the muscle group's exercise**: snoozing it under the bench press quiets volume jump under the
  bench press, not under another chest exercise.
- **A snooze ends at the start of the day after its length**, on the device's calendar, so "1 day" snoozed in the evening is
  quiet the whole next day.
- **A snoozed line is not listed in the Coach tab's Recent insights** while snoozed, as a switched-off kind is not (MM-363).
- **Stored on the device** with the other preferences, and erased with everything else.

## Description
Snoozes stored by kind and item with an end day (or none), honoured by the filter MM-362 reads; "Snooze…" in the opened line
with the four lengths and an Undo; the Snoozed list on each area's screen; volume jump's automatic rest removed.

## Acceptance Criteria
```gherkin
Scenario: Snoozed for a week
  Given "Mostly fat" shows under peanut butter
  When "Snooze…" is chosen in the opened line, then "1 week"
  Then no "Mostly fat" line shows under peanut butter for the next 7 days
  And "Mostly fat" still shows under other foods

Scenario: Undo
  When a snooze is undone from the message that follows it
  Then the line shows again at once

Scenario: Always
  Given "Mostly fat" snoozed always under peanut butter
  Then it never shows under peanut butter until turned back on in Settings > Coach

Scenario: The Snoozed list
  Given two snoozes in Food
  When Food's screen in Settings > Coach is opened
  Then both are listed with their item and end, each with "Turn back on"

Scenario: A snooze runs out
  Given a 1-day snooze made today
  Then the line shows again the day after tomorrow

Scenario: Workouts too
  Given a volume jump that has held for two weeks and was never snoozed
  Then it still shows under its lift
```

## UI/UX
To be drawn in Storybook and reviewed by the product designer and the UX guard before it is built (MM-293): the opened line
with "Snooze…", the lengths offered, the message with Undo, and the Snoozed list (empty, one timed, one always).
