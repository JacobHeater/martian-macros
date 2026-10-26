---
id: MM-626
status: done
component: food-logging
related: [MM-570, MM-587, MM-594]
---

# Bug: a logged meal's time eaten cannot be changed, and moving its day loses it for good

## Context
Found on 2026-10-26 by source inspection in the food-logging review (`docs/food-logging-plan.md`, F-06),
by the UX and architecture reviewers. Not reproduced at runtime; the regression test below is written to
fail on main at f5a08b4.

MM-570 says a time eaten "can be changed, never cleared". A logged meal's foods open only in View meal
(MM-587), never one by one in the food editor, and View meal has no "Time eaten" row. Moving the meal to
another day clears its time (MM-587's rule), after which nothing in the app can give it one again. A
meal logged with the wrong time from an analysis (MM-594) cannot be corrected either.

## Description
View meal has a "Time eaten" row, laid out as the food editor's (`TimeEatenRow`). A time chosen there is
saved to every food of the meal. A meal without a time shows "Not set" and opens the clock at its slot's
usual time, as a food does.

## Acceptance Criteria
```gherkin
Scenario: A meal's time is changed
  Given "Chicken and rice" was logged for dinner at 7:00 PM
  When its time eaten is changed to 6:30 PM in View meal
  Then every food of the meal is eaten at 6:30 PM

Scenario: A meal moved to another day keeps its time
  Given "Chicken and rice" was logged for dinner at 7:00 PM today
  When it is moved to yesterday in View meal
  Then every food of the meal is on yesterday at 7:00 PM

Scenario: A meal with no time is given one
  Given a meal has no time eaten
  When a time is chosen in View meal
  Then every food of the meal has that time
```

## Decisions
From the owner (2026-10-26, the plan's D-4): a food or a meal moved to another day keeps its time
eaten, for both alike. This supersedes MM-587's clearing of a meal's time on a day move; this ticket
makes the time settable and keeps it on a move.

## Notes
- Fixed 2026-10-26: View meal has a "Time eaten" row (`TimeEatenRow`, the food editor's) under the meal
  chips, written to every food in one step (MM-625's batch); a day move keeps the time. MM-587's
  decision is amended to say so.
- Regression tests: `apps/mobile/test/food/loggedMealTime.test.tsx`.
