---
id: MM-307
status: in-progress
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
  never the food. The ranges are in the code beside the nutrient list, wide enough for fortified cereals
  and supplements-like foods (for example iron up to 100 mg, vitamin C up to 2,000 mg).
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
  Given a candidate row with iron 5,000 mg per 100 g
  When the pack is built
  Then the food is in the pack with iron unknown

Scenario: An older pack still opens
  Given a version 1 pack
  When a food is read from it
  Then it has its macros, fiber and sodium, and no micronutrients

Scenario: The build says what it found
  When a pack is built
  Then the build report lists how many foods carry each nutrient
```

## Notes
- Not done here: running a real build. The sources are large downloads (MM-51) and the extract runs on
  DuckDB; the SQL is covered by review and the steps after it by the pipeline tests' CSV fixtures.
