---
id: MM-45
status: in-progress
component: food-logging
related: [MM-37, MM-39, MM-42, MM-44, MM-47, MM-61, MM-167]
---

# Story: Save my own foods and recipes

## Context
Recents (MM-39) remember one amount of one food. Someone who makes the same chili every week, or eats a protein bar the database lacks,
needs a food they define once and log in any amount.

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
```

## Notes
- Needs new tables, so it is the first real use of schema migrations (MM-61).
- Cooked-versus-raw weight is the classic recipe error (raw rice weighs a third of cooked). Ask for the cooked weight of the whole recipe
  as an optional step; do not try to model cooking loss.

## Clarified by MM-167 (proposed)
Logging a custom food or recipe "in any number of servings or grams" writes the same quantity, unit and basis fields as any other food.

## Progress
Built: schema version 12 with `custom_foods` and `recipe_ingredients` (migration 11 to 12), `CustomFoodRepository` (Drift and in-memory,
with a shared contract test), and in the add-food sheet a "My foods and recipes" step. **A saved food** has a name, a serving
description and weight, numbers per serving (with the same energy-against-macros warning as a typed entry) and an optional barcode.
**A recipe** has ingredients (found by search and a weight, or typed as totals), a number of servings and an optional cooked weight of
the whole pot; one serving is the summed ingredients divided by the servings, and a serving weighs the cooked weight over the
servings (raw weights are never used, so a recipe with no cooked weight is logged by servings only). Saved foods and recipes appear in
search above recents and database results, are found by scanning their barcode, can be edited, and are deleted after a confirmation
that says logged entries stay. They are logged through the same amount step as any food (servings, grams, ounces), recording the
quantity, unit and per-serving reference (MM-167). Editing never touches entries already logged: each entry stores its own totals.
Tests: `custom_foods_test.dart`, `recipe_test.dart`, the repository contract in both stores, and the migration tests.

Not built: inclusion in backup (MM-63 is unbuilt; its format must carry these tables); ingredient lines do not remember which
database food they came from, only the totals at the time; a recipe's ingredients cannot yet be reordered; saved foods are not used by
the "Fix this food" copy (MM-153); the raw-or-cooked prompt (MM-151) for ingredients. Not seen on the emulator.
