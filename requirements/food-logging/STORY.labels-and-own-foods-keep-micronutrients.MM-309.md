---
id: MM-309
status: done
component: food-logging
related: [MM-305, MM-308, MM-44, MM-45]
---

# Story: A label read and a food of my own keep their micronutrients

## Context
See MM-305. The owner chose two sources of micronutrient data: the pack (MM-307) and what the user scans
or types. Today the label reader (MM-44) finds sodium and fiber, but a custom food (MM-45) stores only
calories and the three macros, so even those are lost.

A US Nutrition Facts panel (the 2016 rule) must state saturated fat, cholesterol, sodium, total sugars,
vitamin D, calcium, iron and potassium, each as an amount; other vitamins and minerals are voluntary and
often printed only as a percent of the Daily Value.

## Decisions
Choices I made without asking (say if any is wrong):
- **The reader finds amounts, not percents** (vitamin D in IU is converted at 40 IU to the microgram). A line with an amount and its unit ("Potassium 240mg 6%") is
  read; a line with only a percent ("Vitamin A 10%") is left empty, so nothing is converted through a
  Daily Value the label may not have used.
- **A custom food keeps fiber, sodium and the thirteen nutrients** (fifteen new nullable columns on
  `custom_foods`, the same schema version as MM-308). They are per serving, like its macros.
- **The form shows them folded** under "More nutrients (optional)", so the four numbers most people type
  stay the form. A label read that found any of them says how many and opens the fold. Vitamin A and
  folate are labelled "µg RAE" and "µg DFE" (the panel's MN-7).
- **A recipe carries none** in this change: its ingredients store only the macros. Said in the recipe's
  notes; a later ticket if wanted.

## Description
`parseNutritionLabel` reads the eight mandatory lines above plus any of the other nutrients printed with an
amount. `CustomFood` keeps them, the custom food form lets them be typed or read, and logging a custom food
scales them to the servings eaten (MM-308).

## Acceptance Criteria
```gherkin
Scenario: A label with the mandatory lines
  Given the recognised text of a label stating "Sat. Fat 1g", "Cholesterol 0mg", "Sodium 160mg", "Total Sugars 12g", "Vit. D 2mcg", "Calcium 260mg", "Iron 8mg", "Potassium 240mg"
  When it is read
  Then each of those eight is found with its amount

Scenario: A percent only is left empty
  Given a label line "Vitamin A 10%"
  When it is read
  Then vitamin A is not found

Scenario: Saved and logged
  Given a custom food with 160 mg sodium and 260 mg calcium per serving
  When 2 servings are logged
  Then the entry has 320 mg sodium and 520 mg calcium

Scenario: Folded until needed
  Given the custom food form for a new food
  Then the extra nutrients are folded under "More nutrients (optional)"
  When a label read finds 6 of them
  Then the fold opens and the note says 6 more nutrients were read

Scenario: Edited later
  Given a saved custom food with calcium
  When it is opened for editing
  Then the calcium is in its field
```

## Progress
Built: `parseNutritionLabel` reads saturated fat, cholesterol, total sugars (never added sugars), vitamin
D, calcium, iron, potassium and the others only with an amount and unit; `CustomFood` keeps fiber and
`micros` (fifteen columns on `custom_foods`, schema version 4); `customCatalogFood` passes them per 100 g;
the form's fold. Tested in `test/domain/parseNutritionLabel.test.ts`, the custom food repository contract
and `test/food/ownFoodMicros.test.ts`.

Not done: a recipe's ingredients carry no micronutrients; a supplement label can still be saved as a food
(the panel's SA-9, an owner question for later).
