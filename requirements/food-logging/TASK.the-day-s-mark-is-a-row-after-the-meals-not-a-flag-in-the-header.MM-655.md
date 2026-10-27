---
id: MM-655
status: done
component: food-logging
related: [MM-255, MM-291, MM-611, MM-612]
---

# Task: the day's mark is a row after the meals, not a flag in the header

## Context
MM-611 put the "Mark day" action (a Refeed or a Day off) in the Food day's header as a flag icon beside the day's
name. The owner, 2026-10-27, from the phone: "I absolutely hate the random flag just sitting at the top beside the
day of the week." A flag with no words, next to the day, said nothing about what it did.

## Decisions
From the owner (2026-10-27): no flag in the header.

Choices made without asking (say if any is wrong):
- **The action becomes a row after the meals**, under "Is this day fully logged?", built like that row (MM-255,
  MM-318): a leading flag icon with words, "Mark a refeed or a day off · Not marked.", or the mark's name once
  marked with "Marked, so the coach does not judge this day on its own." It opens the same options dialog. A
  rare action, so a row and not a control of its own, as MM-255 chose for completeness.
- **The chip in the header stays**: it shows state, as the completeness mark does there.
- **The row shows for any day up to today, with or without entries** (a day off may have nothing logged); a day
  still to come has none, as before.

## Description
The Food day's header carries the day, its steps and its marks, and no action; the day's Refeed or Day off is
set and cleared from a row after the meals.

## Acceptance Criteria
```gherkin
Scenario: No flag
  Given the Food tab on any day
  Then the header has no "Mark day" control

Scenario: The row
  Given the Food tab on a day up to today
  Then a row after the meals reads "Mark a refeed or a day off", and pressing it offers Refeed, Day off and No mark

Scenario: Marked
  Given a day marked a Refeed
  Then the header shows the "Refeed" chip and the row reads "Refeed"
```

## UI/UX
- `Screens/Food`, `MarkDay`: the row pressed, with its three options.
- `Screens/Food`, `DayMarkedRefeed`, `DayMarkedDayOffSmallPhone`: the chip in the header and the row's state.

A change the owner dictated, so no panel.

## Notes
- `FoodDayMarkRow` (new), `FoodDayHeader`, `FoodScreen`; `test/food/markDay.test.tsx`.
