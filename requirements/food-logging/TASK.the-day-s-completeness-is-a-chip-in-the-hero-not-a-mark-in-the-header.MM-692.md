---
id: MM-692
status: done
component: food-logging
related: [MM-255, MM-571, MM-611, MM-655]
---

# Task: the day's completeness is a chip in the hero, not a mark in the header

## Context
MM-255 put the day's completeness after the day's name in the Food header as a mark with no words: a check once
the day was marked complete, a half dial once partial, nothing while unmarked. The owner, 2026-10-28, from the
phone: "the checkmark next to today I assume is to denote a complete log day. I don't like its placement. there's
a lot of horizontal real estate in the top right corner of the graph where we can place a background colored chip
for complete/partial/not marked at the top right."

## Decisions
From the owner (2026-10-28): no mark in the header; a chip with a coloured background at the top right of the
hero, in one of three states, Complete, Partial and Not marked.

Choices made without asking (say if any is wrong):
- **The chip sits at the top right of the hero's head**, beside the day's figure, above what is left or over when
  that stands there (MM-571). It is a `MmStatusChip` with a tone (MM-611's neutral chip, given a fill): Complete
  is the positive tint, Partial the caution tint, Not marked a quiet raised fill. Each carries the mark MM-255
  drew (`completenessIcon`) before its word.
- **The chip shows state and does nothing when pressed**, as MM-655 decided for the header's chips. The control
  stays the row after the meals, "Is this day fully logged?" (MM-255, MM-575).
- **The chip is on Food only**, where the day is marked; the Dashboard and Coach heroes are unchanged.
- **The Refeed or Day off chip stays in the header** (MM-611, MM-655): the owner did not call it out.

## Description
The Food hero's head shows the day's completeness as a chip at its top right, in a word and a colour, in every
state; the day's header carries only the day, its steps and its Refeed or Day off.

## Acceptance Criteria
```gherkin
Scenario: Not marked
  Given the Food tab on a day with food logged and no completeness mark
  Then the hero's head shows the "Not marked" chip and the header has no completeness mark

Scenario: Marked
  Given a day marked complete
  Then the hero's head shows the "Complete" chip in the positive tone
  And a day marked partial shows the "Partial" chip in the caution tone

Scenario: The row stays the control
  Given the Food tab
  When the completeness row after the meals is answered
  Then the chip changes with it
```

## UI/UX
- `Screens/Food`, `DayComplete`: today marked complete, the positive chip at the hero's top right above what is left.
- `Screens/Food`, `DayNotMarkedSmallPhone`: the longest label, "Not marked", beside the figure and over the delta on a
  360 px phone.
- `Screens/Food`, `DayCompleteness`: the row that changes the chip.
- `Catalog/States`, the status chip in each tone.

A change the owner dictated, so no panel.

## Notes
- `FoodCompletenessChip` (new), `MmStatusChip` (tone and icon), `CalorieHero` (`mark`), `FoodDayHeader`,
  `FoodScreen`; `test/food/completenessChip.test.tsx`.
