---
id: MM-576
status: done
component: food-logging
related: [MM-570, MM-48, MM-221, MM-218]
---

# Story: Time eaten first, and roomier food sheets

## Context
MM-570 put the "Time eaten" row under the meal chips, at the foot of every food sheet, below the macro split and just above the
action. The owner (2026-10-22), looking at Edit food on a phone, asked for the time eaten to be brought to the top of the sheet,
and said the sheet felt cramped: its margins needed checking.

## Decisions
With the owner (2026-10-22):
- **The time eaten is at the top of the form**, before what was eaten and how much.

Choices I made without asking (say if any is wrong):
- **The meal chips move with it.** The row opens its clock at the meal's usual time (MM-570), so the two read as one "when"
  and stay together. Order: (on Edit food, "Logged on" and its day stepper, MM-221), the meal chips, "Time eaten", then the food
  name or the amount. The same order on the typed form (`AddFoodSheet`), the amount step (`FoodAmountStep`) and the estimate
  step (`EstimateMealStep`), every place a food is logged.
- **The row is flush with the sheet's edge** (`MmListRow`'s `flush`), so its icon lines up with the chips and fields above it
  rather than sitting 16 px in.
- **The sheet's margins grow**, in `food.css`, for every sheet that uses `food-sheet` (add and edit food, amount, estimate, scan, saved foods,
  custom food, recipe, water, easy to miss): the sides and foot from 16 px to 24 px; a labelled group ("Macro split", "How big was it?" and the like) from 12 px
  to 24 px above it; a row of chips from 8 px to 12 px below what it follows; the "Logs …" line (MM-218) from 12 px to 16 px.
- The panel pass is skipped: the change was dictated by the owner (apps/mobile/AGENTS.md, "Design").

## Description
On every food sheet, the meal chips and the "Time eaten" row stand at the top of the form, under the headline (and on Edit food
under "Logged on"), before the food's name, amount and numbers. The "Logs …" line and the action follow the numbers directly.
The sheets have 24 px at the sides and a clearer break before each labelled group.

## Acceptance Criteria
```gherkin
Scenario: The time eaten is at the top of the form
  Given the add food form is open, typed by hand
  Then the meal chips come first, then "Time eaten", then "Food name"

Scenario: The same order where a food is logged from search or estimated
  Given the amount step or the estimate step is open
  Then the meal chips and "Time eaten" come before the amount

Scenario: Margins
  Given any food sheet
  Then its content stands 24 px from the sheet's sides
  And the "Time eaten" row lines up with the fields above it
```

## UI/UX
- AddFoodTimeEaten, EditFoodTimeNotSet, AddFoodAmount, AddFoodEstimate — apps/mobile/src/gallery/screens/Food.stories.tsx. The
  stories draw the sheets as they are, so they show the new order with no change of their own.

## Notes
- Tests: `test/food/timeEaten.test.tsx` ("the meal and the time eaten come before the food name").
- Not run locally; CI validates. Not yet seen on a phone.
