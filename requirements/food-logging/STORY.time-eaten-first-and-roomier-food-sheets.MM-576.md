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
- **The sheet's margins grow**, in `food.css`, for every sheet that uses `food-sheet` (add and edit food, amount, estimate,
  scan, saved foods, custom food, recipe, water, easy to miss). The owner found 24 px at the sides still too tight on a phone
  (2026-10-22), so: 32 px at the sides and foot; 20 px above each field; 16 px above each row of chips; 12 px around the
  "Time eaten" row; 32 px above a labelled group ("Macro split", "How big was it?"); 24 px above the "Logs …" line (MM-218);
  8 px under a field before its caption. A text action ("Edit nutrition per serving") lines up with the words above it, its
  padding hanging out, as in a section (`mm-section-body`).
- The panel pass is skipped: the change was dictated by the owner (apps/mobile/AGENTS.md, "Design").

## Description
On every food sheet, the meal chips and the "Time eaten" row stand at the top of the form, under the headline (and on Edit food
under "Logged on"), before the food's name, amount and numbers. The "Logs …" line and the action follow the numbers directly.
The sheets have 32 px at the sides and a clear break between every field, row of chips and group.

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
  Then its content stands 32 px from the sheet's sides
  And the "Time eaten" row lines up with the fields above it
```

## UI/UX
- AddFoodTimeEaten, EditFoodTimeNotSet, AddFoodAmount, AddFoodEstimate — apps/mobile/src/gallery/screens/Food.stories.tsx. The
  stories draw the sheets as they are, so they show the new order with no change of their own.

## Notes
- Tests: `test/food/timeEaten.test.tsx` ("the meal and the time eaten come before the food name").
- Not run locally; CI validates. Not yet seen on a phone.
