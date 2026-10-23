---
id: MM-592
status: in-progress
component: food-logging
related: [MM-221, MM-587]
---

# Task: The day stepper draws no arrow to a day it cannot go to

## Context
The product owner, 2026-10-22, on Food on today: "if we're not going to allow to forward past today, why have
a forward chevron?" The stepper drew the next-day arrow on today, turned off: a control that looks like a way
forward and does nothing.

## Decisions
Made with the product owner (2026-10-22):
- **An arrow with nowhere to go is not drawn.** On today there is no next-day arrow.

Choices I made without asking (say if any is wrong):
- **Its room is kept**, so the day's name does not move as the person steps to today and back.
- **Everywhere the stepper is**: Food's day, Add food's "Logged on" and View meal's day (MM-587), and the
  previous-day arrow at a first day, if one is ever given.

## Description
`DayStepper` draws an empty space of the arrow's size, hidden from screen readers, in place of an arrow
whose action is absent.

## Acceptance Criteria
```gherkin
Scenario: No tomorrow
  Given Food shows today
  Then there is no next-day arrow
  And the day's name is where it is on yesterday

Scenario: A day before today
  Given Food shows yesterday
  Then both arrows are drawn
```

## Notes
- Tests: `test/ui/components.test.tsx` (the day stepper) and `test/food/foodFlows.test.tsx` ("the day
  picker steps back and returns to today").
