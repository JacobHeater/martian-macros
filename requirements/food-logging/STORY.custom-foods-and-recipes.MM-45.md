---
id: MM-45
status: done
component: food-logging
related: [MM-37, MM-39, MM-42, MM-44, MM-47, MM-61, MM-151, MM-167, MM-456]
---

# Story: Save my own foods and recipes

## Context
Recents (MM-39) remember one amount of one food. Someone who makes the same chili every week, or eats a protein bar the database lacks,
needs a food they define once and log in any amount.

## Decisions
Choices I made without asking (say if any is wrong), 2026-10-21:
- **An ingredient's raw-or-cooked switch starts on the food that was picked**, as the amount step does, rather than on raw because
  ingredients usually go into the pot raw. The caption under it says the calories of both, so the difference is in view.
- **Moving and removing a line share one "More actions" menu** on the line, the sibling pattern of a meal entry's menu on Food
  (`MealSection`), instead of drag handles (no reorder control exists in the design system) or two more icons per row.
  "Remove" replaced the line's close icon.

## Description
- **A custom food** has a name, a serving description and weight, macros per serving, and optionally a barcode. It can be logged in any
  number of servings or grams.
- **A recipe** is a list of foods and amounts with a number of servings. Its macros per serving are calculated. Logging "1.5 servings"
  scales it.
- Custom foods and recipes appear in search above database results (MM-42), can be edited and deleted, and are included in backup (MM-63).
- Editing a custom food does not change entries already logged from it.

## Acceptance Criteria
```gherkin
Scenario: A custom food in any amount
  Given a custom food of 30 g per serving with 120 kcal
  When 45 g is logged
  Then the entry has 180 kcal

Scenario: A recipe
  Given a recipe of 500 g chicken, 300 g rice and 20 g oil that makes 4 servings
  Then one serving has a quarter of the summed macros

Scenario: Editing does not rewrite history
  Given a custom food was logged yesterday
  When its macros are changed today
  Then yesterday's entry is unchanged

Scenario: The energy check
  Given a custom food whose calories disagree with its macros
  Then the same warning as for a typed entry is shown

Scenario: An ingredient weighed raw or cooked
  Given "White rice, cooked" is found as a recipe's ingredient and 200 g entered
  Then "Weighed as" offers cooked and raw with the calories of each
  And choosing raw adds "White rice, raw" at about 730 kcal instead of about 260

Scenario: Ingredients in another order
  Given a recipe of beef, beans and onion, in that order
  When beef is moved down, onion moved up and beans removed through each line's menu
  Then the recipe is saved as onion, then beef
  And the first line offers no "Move up" and the last no "Move down"
```

## Notes
- Needs new tables, so it is the first real use of schema migrations (MM-61).
- Cooked-versus-raw weight is the classic recipe error (raw rice weighs a third of cooked). Ask for the cooked weight of the whole recipe
  as an optional step; do not try to model cooking loss.

## Clarified by MM-167 (proposed)
Logging a custom food or recipe "in any number of servings or grams" writes the same quantity, unit and basis fields as any other food.

## Progress
Built: tables `custom_foods` and `recipe_ingredients` (with a `position` per line), `CustomFoodRepository` (SQL and in-memory, with
the contract suite `test/contracts/customFoodRepositoryContract.ts`), and in the add-food sheet a "Saved" step (`MyFoodsStep`).
**A saved food** has a name, a serving description and weight, numbers per serving (with the same energy-against-macros warning as a
typed entry) and an optional barcode. **A recipe** has ingredients (found by search and a weight, or typed as totals), a number of
servings and an optional cooked weight of the whole pot; one serving is the summed ingredients divided by the servings, and a serving
weighs the cooked weight over the servings (raw weights are never used, so a recipe with no cooked weight is logged by servings
only). Saved foods and recipes appear in search above recents and database results, are found by scanning their barcode, can be
edited, and are deleted after a confirmation that says logged entries stay. They are logged through the same amount step as any
food, recording the quantity, unit and per-serving reference (MM-167). Editing never touches entries already logged: each entry
stores its own totals. They are in the backup and come back on restore (MM-63), and "Fix this food" saves its copy as one (MM-153).

Built 2026-10-21: **an ingredient found in the pack that has a raw or cooked pair asks which was weighed** ("Weighed as", MM-151),
with "200 g cooked is about 260 kcal. 200 g raw is about 730 kcal." once a weight is typed, and the line is of the state chosen.
The label and the sentence are shared with the amount step (`weighedStateLabel`, `weighedConsequence`). **A recipe's lines can be
put in order**: each line's "More actions" menu has "Move up" (not on the first), "Move down" (not on the last) and "Remove", and
the saved order is the order shown.

Tests: `test/food/customFoods.test.tsx` (any amount, editing keeps history, the energy warning, a recipe's servings, the cooked
weight, the barcode, delete, the raw-or-cooked ingredient, the order of ingredients), `test/domain/recipe.test.ts`,
`test/lang/moved.test.ts`, the repository contract, `test/data/restore.test.ts` and the migration tests. Stories:
`AddFoodSavedOwn`, `NewOwnFood`, `EditRecipe`, `NewRecipeByNumbers`, `NewRecipeIngredientWeighedAs`, `EditRecipeLineMenu`.
Not run locally; CI validates.

Not built: an ingredient line does not keep which pack food it came from, only its name, weight and totals at the time (MM-456,
which needs a schema change). Not seen on a phone or the emulator.
