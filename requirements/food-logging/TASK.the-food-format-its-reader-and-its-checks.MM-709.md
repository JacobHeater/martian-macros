---
id: MM-709
status: in-progress
component: food-logging
related: [MM-53, MM-307, MM-309, MM-382, MM-397, MM-586, MM-616, MM-703, MM-708, MM-710]
---

# Task: The food format `martian-macros-food`, version 1, its reader and its checks

## Context
MM-708 pastes an assistant's answer back. The meal format (MM-586, `martian-macros-meal`) describes a sitting: foods
with the grams eaten. A food to be saved is different: numbers per 100 g, a serving, a group, and for a homemade food
its ingredients.

## Decisions
The owner's (MM-703): per 100 g plus a serving; every field required; a group required; the evidence rule of the meal
format; an array of foods.

Choices made without asking (say if any is wrong):
- **The format**: one JSON code block, `"format": "martian-macros-food"`, `"version": 1`, `"foods": [ … ]`. Each food:
  `name`, `brand` (a string or null; "Homemade" for a homemade food), `lookup` (a plain name for the packs), `group` (one of
  `FoodGroup`'s values, spelled as the code spells them), `serving` (`description`, `grams`), `barcode` (a string or
  null), `per_100g` (`kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_alcohols_g`, `alcohol_g`, and each of
  `Micronutrient` under its column name: `sodium_mg`, `potassium_mg`, `calcium_mg`,
  `iron_mg`, `magnesium_mg`, `zinc_mg`, `vitamin_a_ug`, `vitamin_c_mg`, `vitamin_d_ug`, `vitamin_b12_ug`, `folate_ug`,
  `sugars_g`, `saturated_fat_g`, `cholesterol_mg`), `ingredients` (an array of `name` and `grams`, empty unless homemade)
  and `source` (`verified`, `citation`), as the meal format spells it.
- **Every number in `per_100g` is required; 0 is a number.** A missing one is a problem on the food, named.
- **The reader** (`parseFoodAnalysis` beside `parseMealAnalysis`, in `domain/food/custom/`) finds the block in chatter,
  refuses another format or version with a reason, and returns `FoodDraft`s. A `FoodDraft` holds the per-100 g numbers,
  the serving, the group, the barcode, the ingredients and the evidence; `customFoodOf(draft)` derives the per-serving
  `CustomFood` (MM-710's fields filled).
- **The checks** (`foodDraftProblems`): the energy rule (MM-53) on the per-100 g numbers; no negative number; serving
  grams above 0 and at most 3,000; at most `maxKcalPer100g`; each micronutrient at most its `maxPer100g`; the group one
  of the list; the name not blank; the required fields present.
- **The evidence rule** (`resolveFoodDrafts`, as `resolveMealItems`): verified with a specific citation
  (`isSpecificCitation`) keeps the assistant's numbers as "cited"; otherwise the packs are searched by `lookup` and a
  match replaces the per-100 g numbers, "matched"; otherwise "estimated". A number the person types makes the food
  "yours".
- **The prompt** (`format/foodPrompt.ts`, with `foodPromptWith(answers)` for the questions' answers, MM-708) is fixed,
  holds nothing about the person, asks for this format with every field, says 0 for a nutrient the food has none of,
  asks for the ingredients and their grams when the food is homemade, and carries its own example, which the reader's
  tests read back clean.
- **The fix message** (`foodFixMessage`) names each problem and the foods as they stand, asking for the whole answer
  back in the same format.

## Description
A format for foods, its reader, its checks, the evidence rule, the prompt and the fix message, each the sibling of the
meal format's.

## Acceptance Criteria
```gherkin
Scenario: The prompt's example reads back
  When the example in the prompt is read
  Then it yields one food with no problems

Scenario: A field left out
  Given a food whose per_100g lacks vitamin_d_ug
  Then the food has the problem "Vitamin D is missing"

Scenario: A wrong group
  Given "group": "pastry"
  Then the food has a problem naming the group

Scenario: The evidence rule
  Given one food verified with an FDC id, one verified with "USDA", and one unverified with no match
  Then they are cited, matched (when the packs have the lookup name) and estimated

Scenario: Per serving derived
  Given 353 kcal per 100 g and a serving of 60 g
  Then the saved food has 212 kcal per serving, serving grams 60
```

## Notes
- Tests: `test/domain/foodAnalysis.test.ts` (reading, every check, the evidence rule, the derivation, the fix message,
  the prompt's example).
- A change to the prompt is reviewed here, as the meal prompt's is in MM-586.

## Progress
Built 2026-10-30 (PR C of MM-703), not run locally; CI validates.
- In `apps/mobile/src/domain/food/custom/`: `foodAnalysisFormat` (the name and version), `FoodDraft`,
  `FoodAnalysisReading`, `parseFoodAnalysis` (the block found in chatter; another format or version refused with a
  reason), `foodDraftProblems` (every field required with 0 as given, nothing below zero, the serving between 0 and
  3,000 g, at most `maxKcalPer100g`, each micronutrient at most its `maxPer100g`, the group one of `FoodGroup`, the
  energy rule), `customFoodOfDraft` (per 100 g scaled to the serving, the group, evidence and ingredients carried),
  `FoodQuestionAnswers` and `FoodIngredient`.
- In `apps/mobile/src/food/ai/`: `resolveFoodDrafts` and `matchedFoodDraft` (the evidence rule: cited with a specific
  citation, else the packs by `lookup`, a per-100 mL pack food never taken, else estimated).
- In `apps/mobile/src/format/`: `foodPrompt` (fixed, with its own example), `foodPromptWith` (the answers and today's
  date in place of what the prompt says it will be told), `foodDraftJson`, `foodFixMessage`, `foodGroupLabel`;
  `foodEvidenceLine` says "Read from the label".
- Tests: `test/domain/foodAnalysis.test.ts` (the prompt's example reads back with no problems, the reading, every
  check, the evidence rule over the fixture pack, the derivation, the JSON round trip, the fix message).
- One name differs from the ticket's: the saved food's ingredients are `madeOf` on `CustomFood`, since `ingredients`
  already names a recipe's lines (MM-45).
