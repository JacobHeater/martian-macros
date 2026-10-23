---
id: MM-588
status: proposed
component: food-logging
related: [MM-586, MM-587]
---

# Task: Call the breakfast/lunch/dinner/snack slot a MealSlot in code

## Context
The product owner chose "meal" as the word for a group of foods eaten together (MM-586, 2026-10-22), with
the slot renamed in code so the two never share a name. The code calls the slot `Meal` (`domain/Meal.ts`,
`FoodEntry.meal`, `food_entries.meal`), in about 30 files and 230 lines. Until this is done, the group is
`LoggedMeal` in code.

## Decisions
Choices I made without asking (say if any is wrong):
- **Its own change, after MM-586 and MM-587 are merged**, so the rename does not collide with them or with
  other open branches; it changes no behaviour.
- **The column `food_entries.meal` stays**: renaming a column is a schema version for no behaviour.

## Description
Rename the type `Meal` to `MealSlot` and the field `FoodEntry.meal` to `slot`, with the helpers named for
it (`mealLabel` to `mealSlotLabel`, and so on). Words the person reads do not change.

## Acceptance Criteria
```gherkin
Scenario: No behaviour changes
  Given the rename is done
  Then every test passes without a changed expectation
  And no type or field in the code calls the slot a meal
```
