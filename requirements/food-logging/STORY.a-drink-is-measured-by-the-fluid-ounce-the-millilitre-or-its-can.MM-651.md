---
id: MM-651
status: done
component: food-logging
related: [MM-42, MM-167, MM-221, MM-627, MM-628, MM-636, MM-650]
---

# Story: a drink is measured by the fluid ounce, the millilitre or its own can

## Context
With MM-650 a pack states a drink per 100 mL, with its serving in millilitres. The amount step, the edit sheet
and the rows that say a food's numbers all assumed per 100 g and a serving with a weight. The food-logging
plan's §5.2: for a per-100 mL source, "volume is exact; weight is offered only with a density." The owner said to
get started (2026-10-27).

## Decisions
From the owner (2026-10-27): build C2's liquids half.

Choices made without asking (say if any is wrong):
- **The amount step for a per-100 mL food offers** its servings ("1 Can (355 mL)"), then fluid ounces,
  millilitres, cups, tablespoons and teaspoons, every one exact; grams and ounces only when the food has a
  density. No hand portion: a drink is poured, not held.
- **The usual figure** is 100 for millilitres and 8 for fluid ounces (a cup), as grams start at 100 and ounces
  at 4, for every food that offers them.
- **The helper under the amount says millilitres** ("355 mL") where it said grams, for a serving or a cup of a
  per-100 mL food; grams are said only when the food has a density. The "About this food" line and the edit
  sheet's reference line say "Per 100 mL".
- **A serving in millilitres can be changed into a fluid ounce and back**, the same portion (MM-628), through its
  millilitres; into grams only with a density, otherwise the amount is asked again.
- **The edit sheet** offers a per-100 mL entry its serving and every volume, and a weight only with a density,
  by the same rule as logging (it already filtered units by what the reference can scale).
- **Extras follow the millilitres**: fiber, sodium, sugar alcohols and the micronutrients of a per-100 mL food
  scale by the millilitres eaten, as they scale by grams for a per-100 g food (MM-648's rule).
- **Rows say the basis**: a found drink's row reads "1 Can (355 mL) · 149 kcal (42 per 100 mL)" (MM-627's
  form); the online results, a recipe ingredient's row and View meal's matches say "per 100 mL" for such a food.
  The entry's own line says "calculated from 42 kcal per 100 mL" and "(355 mL)" where it said grams.
- **"Fix this food"** copies a per-100 mL food at its first serving's millilitres (or 100 mL), with no weight
  unless a density gives one.
- **A food matched in View meal** to a per-100 mL food takes its grams as millilitres unless the food has a
  density, since the assistant's grams are themselves an estimate.
- **Trades** (the coach's swaps) take a per-100 mL food only through a serving with a weight: they are said in
  grams, and nothing is guessed.
- **Not in this ticket**: a recipe ingredient that is a per-100 mL food is still weighed in grams (a cook may
  type millilitres; a follow-up, the owner's call); the online path stays per 100 g (MM-650).

## Acceptance Criteria
```gherkin
Scenario: A can
  Given a cola the pack states per 100 mL at 42 kcal, served "1 can (355 mL)", with no density
  When it is logged as one serving
  Then the entry is 149 kcal, a label serving, calculated from 42 kcal per 100 mL, and no grams are offered

Scenario: Twelve fluid ounces
  When the same cola is logged as 12 fluid ounces
  Then the field says 355 mL, the entry is 149 kcal and a household measure

Scenario: Grams only with a density
  Given a milk the pack states per 100 mL with a density of 1.03 and a serving "1 cup (240 mL)"
  Then grams and ounces are offered, and 240 mL reads as 247 g

Scenario: Same portion in another unit
  When one serving of the cola is changed to fluid ounces
  Then the amount reads 12 and the helper says it is the same amount as 1 × 1 can (355 mL)

Scenario: The search row
  Then the cola's row reads "1 can (355 mL) · 149 kcal (42 per 100 mL)"
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: AddFoodAmountDrink, AddFoodAmountDrinkWithDensity,
  AddFoodSearchDrink, EditFoodDrink).

## Notes
- Built in `domain/food/portion/referenceAmounts.ts`, `millilitersFor.ts`, `scaleNutrition`, `convertedQuantity`,
  `unitsOffered`, `food/FoodAmountStep.tsx`, `food/volumeChoices.ts`, `format/searchResultAmount.ts`,
  `format/portionSummary.ts`, `format/per100Label.ts`, `food/custom/copyOfPackFood.ts`,
  `food/meal/matchedMealItem.ts`, `state/CatalogTradeCatalog.ts`, `gallery/screens/storyFoods.ts`.
  Tests: `test/food/drinkByVolume.test.tsx`, `test/domain/referenceAmounts.test.ts`.
