---
id: MM-318
status: done
component: food-logging
related: [MM-313, MM-305, MM-255, MM-291]
---

# Story: Water is a section like the meals

## Context
MM-313 drew the Food screen's water section as something of its own: a card holding Glass, Bottle and
"Other amount" buttons above the day's drinks. Every other block on Food is a meal section (MM-255):
collapsible, its total in the summary, a "+" in the header that opens the Add food sheet, entries as rows
that swipe away with a "More actions" menu. The panel's designer said the water block outweighed the meals
(PD-5) and the chair made it smaller instead of making it one of them. The owner (2026-10-14): it should
be an accordion section like the others. This ticket also made rule 9 of `design/screen-direction.md`
(build a new part like its siblings) and its line in `AGENTS.md`.

## Decisions
The product owner's (2026-10-14): Water is a section like the meals.

The sibling it matches, part by part (rule 9): `MealSection` (`apps/mobile/src/food/MealSection.tsx`).
- **Header**: `MmSection` with the water icon, "Water", its total in the summary ("24 fl oz", "1.25 L of
  2.5 L", "2.25 L · Goal reached"; with nothing logged, no summary, or the goal alone when one is set),
  `collapsible` and `maintainState`, as a meal.
- **"+" in the header** (`MmIconButton kind="add"`, heard as "Add water") opens a sheet, "Add water", as a
  meal's "+" opens the Add food sheet: Glass and Bottle with their sizes, and Other amount with its field.
  Choosing one adds it to the day shown, closes the sheet, and the snack names the day with Undo.
- **Rows** as meal rows: the water icon, "Water", when it was had under it (its time, or "Added later",
  MM-319), the amount on the right where a meal row has its energy. Pressing one opens "Edit water", as a
  food opens "Edit food": the amount to change, the time kept, Undo (the panel's PD-1; first drawn not
  pressable, which broke rule 9 again). Each swipes away and has "More actions" with Delete, both with Undo,
  and is heard with its amount and time so repeated amounts are told apart (UX-2).
- **One difference, with its reason**: Water has no "copy to today" on a past day; there is no reason to
  copy a day's drinks. (Its fold chevron then sits where an empty meal's does on a past day, PD-3.)
- **The Dashboard keeps its row** with "+ Add a glass" (MM-301's in-place pattern among the Dashboard's
  rows, its own siblings).

## Description
`WaterSection` rebuilt on the meal section's pattern; the add controls move into a sheet behind the
header's "+".

## Acceptance Criteria
```gherkin
Scenario: A section like a meal
  Given the Food screen
  Then Water has a header with its icon, its total and a "+" heard as "Add water", and folds like a meal

Scenario: Adding from the header
  When "+" on Water is pressed and Bottle is chosen
  Then the sheet closes, 500 ml is added to the day shown, and the snack names the day with Undo

Scenario: Another amount
  When "+" on Water is pressed, Other amount is chosen and 330 ml is saved
  Then 330 ml is added and the sheet closes

Scenario: Rows like a meal's
  Then each drink is a row with "Water", its time and its amount on the right
  And "More actions" offers Delete, which can be undone

Scenario: Editing a drink
  When a drink of 250 ml at 8:00 AM is pressed, changed to 330 ml and saved
  Then it is 330 ml at 8:00 AM, and the snack offers Undo

Scenario: Nothing logged
  Given no water on the day shown and no goal
  Then the Water header has no summary, as an empty meal
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Water Section, Water None, Water Goal
  Set None, Water Goal Partway, Water Goal Reached, Water Add Sheet, Water Other Amount, Water Other Open,
  Water Other Refused, Water Edit, Water Removed), each looked at on the whole screen beside the meal
  sections, in three palettes; reviewed in `docs/agent-runs/mm318-water-section/`.

## Progress
Built: `WaterSection` on `MealSection`'s pattern, `WaterEntryTile` on `FoodEntryTile`'s, `AddWaterSheet` and
`showAddWaterSheet` (add and edit), `WaterWriter.updateWater` (SQL, in memory, the contract), rule 9 of
`design/screen-direction.md` and its line in `AGENTS.md` and the panel brief template. The panel's
product-designer and UX guard reviewed it against the meals (UX guard: pass). Tested in
`test/food/waterAndMicros.test.tsx` and the water contract.
