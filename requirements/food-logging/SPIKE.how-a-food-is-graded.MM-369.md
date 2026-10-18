---
id: MM-369
status: done
component: food-logging
related: [MM-361, MM-370, MM-371, MM-305, MM-307, MM-310, MM-49]
---

# Spike: How a food is graded A+ to D-

## Context
See MM-361 and MM-370. The owner wants every food graded A+ to D- on universal nutrition quality: the same grade for every person,
for the food per 100 g. There are twelve steps (A+, A, A-, B+ … D-), with no E or F.

Published nutrient-profiling systems exist. Nutri-Score (2023 algorithm, five letters), the Health Star Rating (ten steps) and
others score energy, sugars, saturated fat, sodium, fiber, protein, and fruit, vegetable and legume content. Each needs nutrients
that the food packs don't always carry: MM-49 found coverage patchy, and MM-307 is adding micronutrient columns.

## Decisions
The product owner's (2026-10-17): universal quality, A+ to D-, on the food per 100 g. A food that can't be graded shows a question
mark that says why.

## Description
Answer, with a short written report under `docs/` and an evidence-register entry (MM-143):
1. **Which method.** Adopt a published one, with its letter bands split into twelve steps, or define our own? Name the
   evidence for each and how it treats drinks, fats and oils, cheese and whole foods.
2. **The mapping to twelve steps.** The point ranges for each letter, and whether + and - are equal splits of the source's bands.
3. **Inputs.** The nutrients required and how each is read from a pack food, a custom food and a recipe (a recipe's grade
   follows from its ingredients' totals per 100 g).
4. **When a food can't be graded.** Which missing nutrients make a grade impossible, and which can be ignored. MM-310's rule
   holds: a missing value is never counted as zero.
5. **Coverage.** The share of foods in the current pack that would get a grade, measured from the pack build report.
6. **Licensing and naming.** Whether the method's name, logo or colors carry trademark terms. The grade must not look like
   Nutri-Score's label unless that is allowed.

## Acceptance Criteria
```gherkin
Scenario: A method is chosen
  When the spike is done
  Then its report names the method, the twelve-step mapping and the evidence, and MM-370 refers to it

Scenario: Coverage is known
  Then the report states the share of pack foods that can be graded, and which nutrient most often blocks a grade

Scenario: Licensing is checked
  Then the report says whether the method or its marks have usage terms, and how the app complies
```

## Progress
- **Superseded 2026-10-18 by MM-380.** The product owner withdrew the published tables the same day: the grade is to be the
  app's own method, nutrient density per calorie (MM-380, built as MM-382). The report below is kept as the record of what
  was chosen and why; `docs/food-grades.md` now describes the app's own method.
- Done 2026-10-18: `docs/food-grades.md`, from the nutrition role's research (`docs/agent-runs/mm369-grading-method/`).
  The method is the general-foods point tables published for the Nutri-Score label (2023 update), on twelve steps, with
  five documented differences (no fruit, vegetable and legume share; one table for every food; twelve steps with no E;
  alcohol read by weight; missing is never zero). The required inputs are sugars, saturated fat, sodium and fiber.
- Coverage, measured on the packs published 2026-10-09: 90.9% of common foods and 84.3% of barcode foods state fiber and
  sodium, but the packs are format 1 and carry no sugars or saturated fat, so no pack food is graded until a format 2 pack
  is published (MM-307). The owner's own foods that state those values are graded now.
- Licensing: the grades are not Nutri-Scores and the app never says they are; the method is named once in the evidence
  register with the differences. The Conditions of Use were not readable by the role; reading them, and whether to notify
  Santé publique France, are for the owner and the attorney (MM-242).
