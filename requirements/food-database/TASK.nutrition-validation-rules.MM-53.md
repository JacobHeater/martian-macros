---
id: MM-53
status: done
component: food-database
related: [MM-50, MM-52, MM-38, MM-44, MM-45]
---

# Task: Nutrition checks every food must pass

## Context
Crowdsourced food data contains entries with 900 kcal per 100 g of lettuce, protein in milligrams entered as grams, and macros that sum to
300 g per 100 g. One such entry in a daily log corrupts the estimate for a month.

## Decisions (made with the product owner)
- **Energy must agree with macros**: within the larger of 15% and 20 kcal of 4P + 4C + 9F, adding 7 per gram of alcohol.
- **Entries that fail are dropped from the pack**, not flagged.

Choices I made without asking (say if any is wrong):
- **Fiber counts 2 kcal per gram** when present, and the check passes if energy matches either with or without subtracting fiber from
  carbohydrate (US labels are inconsistent about it).
- **Also dropped**: any negative value; protein, carbohydrate and fat summing to more than 100 g per 100 g; energy above 900 kcal per
  100 g; a missing name; missing any of energy, protein, carbohydrate, fat.
- **Zero-calorie foods are valid** (water, diet drinks) when all macros are near zero.
- **One implementation**, in `mm_domain`, used by the pipeline, the typed-entry warning, label reading and custom foods, so the rule
  cannot drift between them.

## Description
A pure function from a food's per-100 g values to "valid" or a reason. The pipeline drops on any reason; the app's entry screens warn.

## Acceptance Criteria
```gherkin
Scenario: A sound entry
  Given 165 kcal, 31 g protein, 0 g carbohydrate and 3.6 g fat per 100 g
  Then it is valid

Scenario: Units entered wrongly
  Given 52 kcal with 300 g of protein per 100 g
  Then it is invalid: macros exceed 100 g

Scenario: Energy in kilojoules entered as kilocalories
  Given 690 "kcal" with macros that imply 165 kcal
  Then it is invalid: energy disagrees with macros

Scenario: High-fiber food
  Given a food whose energy matches its macros only when fiber is counted at 2 kcal per gram
  Then it is valid

Scenario: Water
  Given 0 kcal and no macros
  Then it is valid
```

## Notes
- `macrosMatchEnergy` in `mm_domain` already implements the basic energy check for typed entries (MM-38). This ticket extends it and makes
  it the single source.

## Progress (built and verified)
- `checkNutrition(NutritionPer100g)` in `mm_domain` (`food/check_nutrition.dart`) returns the first `NutritionProblem` (missing name, missing value, negative value, macros over 100 g, energy over 900 kcal, energy disagreeing with macros) or null. Energy must be within the larger of 15% and 20 kcal of 4P + 4C + 9F + 7 per gram of alcohol; with fiber given it also passes if it matches carbohydrate with fiber at 2 kcal per gram, either counted inside or outside the carbohydrate figure. Water and other zero-energy foods pass.
- `macrosMatchEnergy`, which typed entries already use, now calls the same `energyAgreesWithMacros`, so there is one rule. Its behaviour without fiber or alcohol is unchanged.
- Tests cover each acceptance scenario plus alcohol and each rejection reason.
- **Not done**: the pipeline, label reading and custom foods that should call it do not exist yet, and the typed-entry warning does not ask for fiber, so it applies the plain rule. The 900 kcal and 100 g limits are from the ticket, not checked against a source.
