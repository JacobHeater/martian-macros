---
id: MM-653
status: done
component: food-logging
related: [MM-576, MM-600, MM-631, MM-636]
---

# Task: the food sheets' actions and unit chips keep their distance

## Context
On the phone (the owner, 2026-10-27) the typed form's "Log 2 foods" and "Add another food" stood touching, the
unit chips ("1 tablespoon", "Grams", "Ounces", "Palms" / "Cupped hands", "Thumbs") wrapped ragged, and the
chips sat 8 px under the name field where every other field has 12 (MM-576). The same pair of actions stands
on the amount step (MM-631) and on My foods.

## Decisions
From the owner (2026-10-27): fix the placement and the spacing.

Choices made without asking (say if any is wrong):
- **Full-width actions stacked in a food sheet stand 12 px apart**, by one stylesheet rule, so no pair can
  touch again; My foods' gap between "New food" and "New recipe" is now that rule's.
- **A row of unit chips shares each row's width**, as Scan, Saved and Estimate do (MM-600), on the typed form
  and the amount step, so no row ends ragged; and it keeps a field's 12 px from what is above it.

## Description
No two stacked full-width actions touch in a food sheet; the unit chips fill their rows; the chips keep the
sheet's spacing from the field above.

## Acceptance Criteria
```gherkin
Scenario: Actions apart
  Given the typed form with a food in the meal's list
  When "Log 2 foods" and "Add another food" are drawn
  Then 12 px stand between them

Scenario: Chips fill their rows
  Given a food whose units wrap to two rows
  When the unit chips are drawn
  Then each row's chips share its width
```

## UI/UX
- `Screens/Food`, `AddFoodSessionAmount`: the two actions on the amount step, apart.
- `Screens/Food`, `EditFoodPerServing`: the unit chips filling their rows.

A fix the owner dictated, so the panel was skipped.

## Notes
- `src/food/food.css` (the two rules), `AddFoodSheet`, `FoodAmountStep`, `MyFoodsStep`. Stylesheet only: no
  test; the stories named above draw it.
