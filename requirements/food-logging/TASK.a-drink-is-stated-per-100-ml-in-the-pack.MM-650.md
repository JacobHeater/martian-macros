---
id: MM-650
status: done
component: food-logging
related: [MM-52, MM-167, MM-383, MM-616, MM-636, MM-651]
---

# Task: a drink is stated per 100 mL in the pack, with its serving in millilitres (pack format 5)

## Context
The food-logging plan's C2 (`docs/food-logging-plan.md`, §5.2 and the H-06 data check of 2026-10-27, recorded in
`docs/food-packs-data.md`, "Liquids, measured"): both sources state a liquid's nutrition per 100 mL, and both
hold its serving as a number of millilitres. The pack build read neither. USDA Branded keeps a serving only when
its unit is grams, so every one of its 268,295 US rows stated in mL (13.5%: sodas, juices, waters, milks, oils,
dressings, syrups) reached the pack with no serving at all, and its per-100 figures, really per 100 mL, were
read as per 100 g. Open Food Facts' mL servings were written as grams, which is right only while a drink's density
is near 1. The owner said to get started (2026-10-27).

## Decisions
From the owner (2026-10-27): build C2's liquids half.

Choices made without asking (say if any is wrong):
- **A pack food has a basis**, per 100 g or per 100 mL (`CatalogFood.basis`, the domain's `ReferenceBasis` less
  "per serving"). The pack's `foods` table gains `basis` ('g' or 'ml'); a pack older than format 5 is per 100 g
  throughout.
- **A serving may be a volume, a weight, or both** (`CatalogServing.grams?`, `milliliters?`, at least one).
  The pack's `servings` table gains `milliliters` and lets `grams` be empty. A format-4 pack's servings are
  weights, as before.
- **USDA Branded**: a row whose serving unit is `ml` or `MLT` is per 100 mL and its serving is that many
  millilitres, described by the household text ("1 Can (355 mL)") or "355 mL". `g`, `GRM` and `gm` are grams
  (the 344 `gm` rows were dropped before). Any other unit (`mg`, `IU`, `mc`, empty: supplements and mistakes)
  keeps no serving, as before.
- **Open Food Facts**: a product is per 100 mL, its serving `serving_quantity` millilitres, when the serving text
  states those millilitres ("1 can (355 ml)", "240 ml": equal in 65,207 of 65,669 US servings) or states fluid
  ounces that convert to them ("1 can (12 fl oz)": the export converts them itself, 3,913 of 4,475). The
  export's quantity is the last unit in the text, so "240 ml (245 g)" stays grams (the panel's IN-2 and IN-3).
  Any other serving is grams, as before. A liquid whose serving names no unit stays per 100 g, as today: the
  export's `nutrition_data_per` is only 100g or serving, its `quantity` names the package, not the serving, and
  nothing is guessed from a category (IN-4).
- **The nutrition rule reads the basis**: "macros exceed 100 g" allows up to 150 g per 100 mL, honey's density
  (1.42) rounded up, so a syrup is not refused for weighing more than water. Energy's ceiling is unchanged.
- **The online path is unchanged**, bar `gm` now read as grams by FoodData Central online as the extract does: an
  Open Food Facts product found online is still read per 100 g with its serving as grams, so the same soda
  found online offers weights where the pack's offers volumes (the panel's IN-7). Parity needs a column in the
  person's own database; the API's `serving_quantity_unit` is that follow-up's signal.
- **The micronutrient ceilings** are half as much again per 100 mL, as the macro ceiling is (IN-6), so a syrup's
  sugars are not dropped for its density. The same barcode in both sources keeps the winner whole, basis and
  servings (IN-5, a test).
- **The owner rebuilds and publishes the packs** (`mm food fetch` is not needed: the cache of 2026-10-19
  suffices; `mm food build`, `mm food package`, the release, as `docs/food-packs-data.md` says). Until then the
  app reads the format-4 packs as before, with no volume for these foods.

## Acceptance Criteria
```gherkin
Scenario: A Branded soda
  Given a USDA Branded row with serving_size 355, serving_size_unit MLT, household text "1 Can (355 mL)" and 39 kcal per 100
  When the pack is built
  Then the food is per 100 mL at 39 kcal, with one serving "1 Can (355 mL)" of 355 mL and no gram weight

Scenario: An Open Food Facts juice
  Given a product whose serving_size is "8 OZA (240 ml)" and serving_quantity 240
  When the pack is built
  Then the food is per 100 mL with a serving of 240 mL; a product served "1 pot (125 g)" stays per 100 g with 125 g

Scenario: A format-4 pack still reads
  Given a pack written before format 5
  When it is opened
  Then every food is per 100 g and every serving a weight, as before
```

## UI/UX
- None of its own: MM-651 draws the amount step for these foods.

## Notes
- Built in `foodPipeline/node/extract.sql`, `candidateFromRow`, `CandidateFood`, `packEntryFor`, `PackBuilder`,
  `checkNutrition`, `foodCatalog/CatalogBasis`, `CatalogServing`, `CatalogFood`, `FoodPackFormat` (5),
  `SqliteFoodPack`, `writeFoodPack`. Tests: `test/foodPipeline/liquids.test.ts`, `test/foodCatalog/foodPack.test.ts`.
- The extract was run once on the dev Mac with DuckDB 1.5.6 over the 2026-10-19 cache into a scratch folder, to
  check the SQL parses and the three H-06 drinks come out per 100 mL with their servings; the pack itself was
  not rebuilt.
