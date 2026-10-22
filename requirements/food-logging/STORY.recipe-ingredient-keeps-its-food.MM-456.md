---
id: MM-456
status: done
component: food-logging
related: [MM-45, MM-151, MM-167, MM-61]
---

# Story: A recipe's ingredient keeps the food it came from

## Context
A recipe's ingredient line (MM-45) stores its name, its weight and its totals at the time it was written, so a recipe never changes
because a food pack did. It does not store which pack food it was found as. An entry has stored its source food since MM-167, and
that is what lets the raw-or-cooked switch start where the person last weighed (MM-151) and a food's grade be shown. A recipe line
has neither: changing its weight means removing it and finding the food again, and the switch on an ingredient always starts on the
food that was picked.

## Description
- An ingredient found in a pack records its pack and food id with the line. A line typed as totals records none.
- Opening a saved recipe lets a found line's weight be changed in place: its totals are recalculated from the food's numbers per
  100 g at the time of the change, if that food is still installed; otherwise the line keeps its totals and says the food is not
  installed.
- The totals stored with a line stay the record: a later pack update never changes a saved recipe unless its line is edited.
- Needs a schema change (two nullable columns on `recipe_ingredients`, `source_pack_id` and `source_food_id`), so it waits until no
  other branch holds the next schema version.

## Acceptance Criteria
```gherkin
Scenario: The source is kept
  Given "White rice, raw" is found and added to a recipe at 200 g
  When the recipe is saved and opened again
  Then the line knows it came from that pack food

Scenario: A weight changed in place
  Given a saved recipe's line of 200 g "White rice, raw" at about 730 kcal
  When its weight is changed to 100 g
  Then the line is about 365 kcal

Scenario: A typed line
  Given a line typed as totals
  Then it records no source and its weight cannot be recalculated

Scenario: A pack update does not rewrite a recipe
  Given a saved recipe whose line's food later changes in the pack
  Then the recipe's totals are unchanged until the line is edited
```

## Notes
- Found while finishing MM-45 on 2026-10-21; that round's schema change was held by another branch, so this was not built with it.

## Decisions
Choices I made without asking (say if any is wrong):
- **"Change weight" is in a found line's menu**, beside Move up, Move down and Remove (sibling: MM-45's line menu in
  `RecipeForm`), and opens the weight under the line in place, with what the new weight comes to. A typed line has
  no such item.
- **A food no longer installed is said, not guessed**: the line's subtitle reads "200 g · 730 kcal · food not
  installed", and its menu has no "Change weight" (panel review, 2026-10-21: an item that only says it cannot be
  done is dropped), since there is nothing to work it out from.
- **The weight is entered under its row**, indented as the row's entry slot, labelled "Weight g" (heard as "Weight g
  for {name}"); it takes focus as it opens, and Save or Cancel returns focus to that line's "More actions for
  {name}". The adder's button is "Add ingredient"; after adding, focus returns to "Search ingredients" (or
  "Ingredient" when entering numbers) and "Added {name}" is said politely under it.
- **A food found online counts as installed**: it is kept in the user's own database (MM-58), so it is found again.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Schema 20 (stacked on MM-441's 19): `recipe_ingredients` gains `source_pack_id` and `source_food_id`, both
  nullable, null on every line saved before. `currentSchemaVersion`, `currentSchema`, the step keyed 19 in
  `migrationSteps`, and the fingerprint for 20 (sha256 of `currentSchema`, the method reproducing 19's first).
- `IngredientSource` (pack and food id) on `RecipeIngredient`; `SqlCustomFoodRepository` reads and writes it; the
  in-memory store keeps the object. `RecipeIngredientAdder` records it for a line found in a pack.
- `CatalogFoodLookup.foodById` on every pack (`SqliteFoodPack`, both online food caches) and on `FoodCatalog`.
- `reweighedIngredient` works a line out again from its food per 100 g; `RecipeLineWeight` changes a found line's
  weight in place in `RecipeForm`.
- Guarding tests: `customFoodRepositoryContract` (a found line keeps its source, a typed one none; in memory and
  SQL); `test/domain/recipe.test.ts` (reweighing); `test/food/customFoods.test.tsx` (the source is kept, a weight
  changed in place from 200 g to 100 g is about 365 kcal, a typed line has no Change weight, a recipe saved at
  other numbers than the pack's now is unchanged until its line is edited, a food no longer installed keeps its
  totals and says so); `test/data/upgrade.test.ts` (a version 19 database comes up with its lines kept and
  sourceless, and keeps a source saved after).
- Stories: `EditRecipeLineWeight` and `EditRecipeLineFoodGone` in `Food.stories.tsx`.
- Panel review fixes (2026-10-21): `RecipeForm` looks up which found lines' foods are installed and offers "Change
  weight" only for them, the subtitle saying "food not installed" otherwise, and returns focus to the line's menu
  button; `RecipeLineWeight` autofocuses "Weight g", seated under its row (`.food-line-weight`), and draws nothing
  should its food go while open; `RecipeIngredientAdder`'s "Add ingredient", focus back to the first field and a
  polite "Added {name}". Tests in `test/food/customFoods.test.tsx` (focus in and out of the weight; no "Change
  weight" and the subtitle for a food gone; focus and "Added" after adding). Stories: `EditRecipeLineFoodGone`
  (now the line and its menu), `NewRecipeIngredientAdded`.

## Owed on a phone
- The upgrade from 19 to 20 on the owner's phone keeps every saved recipe, and a found line's weight changes in place
  there.

