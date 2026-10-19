---
id: MM-397
status: done
component: food-logging
related: [MM-396, MM-307, MM-381, MM-52, MM-45]
---

# Task: Sugar alcohols carried as a nutrient

## Context
Net carbs (MM-396) subtract sugar alcohols, which the app did not carry anywhere: not in the packs, a
logged entry, a saved food, the label reader or by hand.

## Description
Sugar alcohols in grams, optional like fiber, everywhere fiber is:
- **Packs:** format 3 adds a `sugar_alcohols` column, filled from USDA Branded's nutrient 1086 ("Total
  sugar alcohols"; Foundation, SR Legacy and FNDDS carry none, so generic foods mostly have no value) and
  Open Food Facts' `polyols_100g`; a negative value or one above the carbohydrate is dropped. A format 1 or
  2 pack stays readable, its foods without it, and a listing in a newer format than the app reads is not
  offered (the integrations role's IN-1 to IN-6).
- **An EU label's carbohydrate** (fiber already left out) is made a US total at build time for an Open
  Food Facts product also sold outside the US and Canada, when its stated calories agree better with that
  reading (`usLabelCarbs`, the nutrition role's NU-1), so net carbs take fiber once.
- **The phone's store:** a migration adds the column to logged entries and saved foods.
- **The label reader** reads "Sugar Alcohol", "Polyols" or a single polyol by name, only with grams; never a
  bare "alcohol" (ethanol) nor allulose (IN-7). **A saved food's** "More nutrients" takes it by hand.
- It scales with the amount, is copied with an entry, and is erased with everything else.

## Acceptance Criteria
```gherkin
Scenario: A label with sugar alcohols
  When a label reading "Sugar Alcohol 10g" is read
  Then the food carries 10 g of sugar alcohols

Scenario: An older pack
  Given a format 2 pack
  Then its foods open with no sugar-alcohol value

Scenario: An older phone store
  Given entries logged before this change
  When the app opens after the update
  Then they are kept, with no sugar-alcohol value
```

## Notes
Tests: `test/domain/parseNutritionLabel.test.ts` (sugar alcohols), `test/foodPipeline/packMicronutrients.test.ts`
(formats 1 to 3), `test/foodPipeline/usLabelCarbs.test.ts`, `test/foodCatalog/packManifest.test.ts`. Not
run: a real pack build with the new columns (the owner's, `docs/food-packs-data.md`). Open: whether the
energy check should give polyols a lower factor (IN-8).
