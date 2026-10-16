---
id: MM-307
status: done
component: food-database
related: [MM-305, MM-306, MM-52, MM-53, MM-55, MM-51]
---

# Story: The food pack carries micronutrients

## Context
See MM-305. The pack (MM-55) stores energy, the macros, fiber, sodium and alcohol per 100 g. The sources
carry more: USDA's Foundation, SR Legacy and Branded files have a row per nutrient in `food_nutrient.csv`,
and Open Food Facts has a `<nutrient>_100g` column for each. `extract.sql` (MM-52) picks the nutrients
out and the pipeline writes them.

## Decisions
Choices I made without asking (say if any is wrong):
- **Thirteen nutrients added**, in these units, per 100 g:

  | Nutrient | Unit | USDA nutrient id | Open Food Facts column (grams) |
  |---|---|---|---|
  | Potassium | mg | 1092 | `potassium_100g` × 1,000 |
  | Calcium | mg | 1087 | `calcium_100g` × 1,000 |
  | Iron | mg | 1089 | `iron_100g` × 1,000 |
  | Magnesium | mg | 1090 | `magnesium_100g` × 1,000 |
  | Zinc | mg | 1095 | `zinc_100g` × 1,000 |
  | Vitamin A | µg RAE | 1106 | `vitamin-a_100g` × 1,000,000 |
  | Vitamin C | mg | 1162 | `vitamin-c_100g` × 1,000 |
  | Vitamin D | µg | 1114, else 1110 (IU) ÷ 40 | `vitamin-d_100g` × 1,000,000 |
  | Vitamin B12 | µg | 1178 | `vitamin-b12_100g` × 1,000,000 |
  | Folate | µg DFE | 1190 | `folates_100g` × 1,000,000 |
  | Total sugars | g | 2000, else 1063 | `sugars_100g` |
  | Saturated fat | g | 1258 | `saturated-fat_100g` |
  | Cholesterol | mg | 1253 | `cholesterol_100g` × 1,000 |

- **Vitamin A in IU (USDA 1104) is not converted.** IU to RAE depends on whether it came from retinol or
  carotenoids, which the label does not say; a food with only IU has no vitamin A in the pack.
- **Folate is taken as DFE only.** Total folate (1177) differs from DFE in fortified foods, so it is not
  substituted.
- **The pack format goes to version 2**: thirteen nullable integer columns at the existing scale (× 100).
  A version 1 pack stays readable; its foods simply have no micronutrients.
- **The same checks as before**: a value outside its plausible range per 100 g is dropped (made missing),
  never the food. Each range is a little above the richest food of its kind, so a unit slipped by a
  thousand is caught (the panel's MN-3): sodium 40,000 mg (salt), potassium 55,000 mg (salt substitute),
  calcium 5,000 mg, iron 100 mg (fortified cereal), magnesium 1,000 mg (rice bran), zinc 100 mg
  (oysters), vitamin A 30,000 µg and vitamin D 300 µg (cod liver oil), vitamin C 2,000 mg (acerola),
  B12 200 µg (clams), folate 2,000 µg (fortified cereal), sugars and saturated fat 100 g, cholesterol
  4,000 mg (dried egg yolk).
- **Open Food Facts vitamin A and folate are not taken** (the panel's MN-2): its values are not reliably
  RAE or DFE (its taxonomy converts IU at the retinol factor and has no DFE), the same reasons USDA's IU
  and total folate are refused. They stay unknown for Open Food Facts products.
- **The build report counts**, for each nutrient, how many foods carry it, so the coverage the non-goal
  asked about (MM-306) is measured by the first real build.

## Description
`extract.sql`, `CandidateFood`, the pack writer and reader, and `CatalogFood` carry the thirteen nutrients.
The pack's size change is measured on the next real build and written into MM-51's size table.

## Acceptance Criteria
```gherkin
Scenario: A USDA food keeps its micronutrients
  Given a candidate row with potassium 358 mg and vitamin C 8.6 mg per 100 g
  When the pack is built and the food is read back
  Then the catalog food has potassium 358 mg and vitamin C 8.6 mg per 100 g

Scenario: Missing stays missing
  Given a candidate row with no calcium
  When the food is read back
  Then its calcium is unknown, not zero

Scenario: An implausible value is dropped, not the food
  Given a candidate row with iron 5,000 mg per 100 g (or 500 mg)
  When the pack is built
  Then the food is in the pack with iron unknown

Scenario: An older pack still opens
  Given a version 1 pack
  When a food is read from it
  Then it has its macros, fiber and sodium, and no micronutrients

Scenario: The build says what it found
  When a pack is built
  Then `coverage.txt` beside the report lists how many foods carry each nutrient
```

## Notes
- Not done here: running a real build. The sources are large downloads (MM-51) and the extract runs on
  DuckDB; the SQL is covered by review and the steps after it by the pipeline tests' CSV fixtures.

## Progress
Built: `FoodPackFormat` version 2 (thirteen nullable columns, `oldestReadable` 1), `PackMicronutrient`
(the pack's own list, held equal to the domain's by a test, since `foodCatalog` may not import `domain`),
`CatalogFood.micros`, the writer and reader (a format 1 pack opens with no micronutrients),
`CandidateFood.micros` from the extract's columns, `plausibleMicros`, `BuildReport.countStated` and
`formatCoverage` written to `coverage.txt` (the report itself is unchanged, so the Dart parity holds),
and `extract.sql`'s USDA ids and Open Food Facts conversions. Tested in
`test/foodPipeline/packMicronutrients.test.ts` and the parity test (format 1 columns compared with Dart;
the new ones all unknown).

Not done: a real build, so the pack's size and the coverage are still unmeasured.
