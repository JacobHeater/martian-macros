---
id: MM-660
status: done
component: food-logging
related: [MM-310, MM-380, MM-382, MM-567, MM-654, MM-656]
---

# Story: a fried or sweet-and-fatty food grades no better than C-

## Context
The owner, 2026-10-27, on General Tso chicken graded C: "A C for a deep fried food seems unreasonable." The grade is
nutrient density per calorie (MM-380), and in a nutrient table a battered, sauced dish with its protein scores
like an average food; breaded fried chicken breast scored B-. Nutri-Score 2023, computed on the same records,
gives fried chicken breast a B and General Tso chicken a D, the D by reading salt and sugar per 100 g, which also
puts cheddar and peanut butter at E. Neither method sees the fryer. The owner's fear: "a master dictionary of
names that are going to have to be maintained in perpetuity."

## Decisions
From the owner (2026-10-27): the source's own words, not a dictionary of foods; then "go" on words plus a
numeric rule, since the words alone do not reach the dish that started this (FNDDS files it under "Stir-fry and
soy-based sauce mixtures" with no "fried" in its name, and its recipe breakdown is one lab-analysed dish).

Choices made without asking (say if any is wrong):
- **A cap, not a penalty**: a caught food grades no better than C- (its score held to −2); a food already below
  keeps its letter. The popover says which cap and why, before what was not counted.
- **Fried, by the words of the name** (`friedByName`): fried, deep-fried, battered, breaded, doughnut/donut,
  french fries/fries, fritter, tempura, onion rings, hush puppies, corn dog, nuggets, funnel cake, churro, hash
  browns, potato/tortilla/corn chips, potato crisps. Not: stir-fried, pan-fried, air-fried, fast fried (USDA's
  lean cuts), refried, "not fried", "NS as to fried", "not breaded", a coating removed or not eaten, eggs and
  omelets. Measured on the generic pack: 409 foods caught, 333 moved; the top movers are fried chicken and fish,
  fried tofu and fried organ meats.
- **Sweet and fatty, by the numbers**: at 200 kcal or more per 100 g or mL, 40% or more of calories from fat,
  10 g or more of sugars, and fewer than 3 points for the food from protein, fiber and the vitamins and
  minerals. The last condition is what keeps a nut butter, a cheese, paneer and a fibrous granola out, where
  thresholds on sugars alone could not (peanut butter at 10.5 g of sugars sat on the line). Measured: 396
  caught, 24 moved: General Tso chicken, sweet and sour pork and chicken, cakes, pies, muffins, French toast
  sticks, fruit salad with marshmallows, trail mix with pretzels, a dressed carrot salad.
- **Applied wherever a grade is computed**: a pack food, a food found online, an own food, a logged entry and a
  food of an analysed meal, all by the same function, so a search row and the logged row agree. The numbers
  need fat and sugars stated; without either, the numbers cannot cap a food.
- **In the app, not the pack**: no rebuild, and the same rule reaches online foods and typed names. Reading the
  ingredients lists (99.7% of USDA Branded products carry one; 46% of Open Food Facts US products) is a
  follow-up that needs a pack column.
- The full list of every generic food the caps move, with its old letter, is `docs/food-grade-cap-moves.md`,
  as the owner asked to see before anything merged.

## Acceptance Criteria
```gherkin
Scenario: General Tso chicken
  Given the pack's General Tso chicken, 295 kcal, 16.4 g of fat and 11.6 g of sugars per 100 g
  When it is graded
  Then it is C-, and the popover says it is mostly fat and sugar with little that counts for it

Scenario: Fried by name
  Given breaded fried chicken breast, B- by its numbers
  When it is graded
  Then it is C-, and the popover says it is fried by its name

Scenario: Not the fat
  Given grilled chicken breast with the same numbers
  Then it keeps its B-

Scenario: Never a nut butter
  Given peanut butter, 50 g of fat and 10.5 g of sugars per 100 g
  Then it is not capped
```

## UI/UX
- `Screens/CoachingInsights`, `FoodGradeCappedFried` and `FoodGradeCappedSweetAndFatty`: the two popover
  sentences. A change the owner dictated, so no panel.

## Notes
- `domain/food/grade/GradeCap.ts`, `friedByName.ts`; `engine/FoodGradeRule.ts` (`cap`), `GradeNutrition.ts`
  (`fatG`), `gradeOfNutrition.ts` (the cap, by `name`); the four callers pass fat and the name; `FoodGrade.tsx`.
  Tests: `test/engine/foodGrade.test.ts` (the words, the numbers, the nut butter), `test/food/foodGradeCap.test.tsx`
  (the owner's two foods on the Food row, with the popover).
- The simulation that produced the counts is a replica of the engine's rules in Python over the built pack; it
  reproduced the row's C for General Tso chicken before the change. The engine's own tests hold the rules.
