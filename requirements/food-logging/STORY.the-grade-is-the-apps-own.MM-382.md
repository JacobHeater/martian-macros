---
id: MM-382
status: done
component: food-logging
related: [MM-380, MM-381, MM-369, MM-370, MM-371, MM-310, MM-305, MM-144, MM-108]
---

# Story: The grade is the app's own method

## Context
MM-370 built the grade on the point tables published for the Nutri-Score label (MM-369). MM-380 replaces the method with the
app's own: nutrient density per calorie. This story carries the new method into the engine, the words, the register and the
docs, and removes every reference to the published model as the basis.

## Decisions
The product owner's (2026-10-18): see MM-380. Everything the owner decided in MM-370 about where the grade shows, the
twelve steps, the question mark, the eating-disorder history and the absence of a switch stands.

Choices I made without asking (say if any is wrong):
- **The popover says what was not counted.** A graded food whose sugars, saturated fat or vitamins and minerals were not
  stated keeps its letter, and its popover adds one sentence naming what was left out, so two foods with the same letter on
  different data are told apart on a tap.
- **A recipe is not graded** (corrected at the panel's review, NU-11): its ingredients carry only the four macros, and the
  method requires fiber and sodium, so the question mark names both. Carrying fiber, sodium and the label nutrients on an
  ingredient from its origin food is a later ticket.
- **A meal's and a day's grade** stay the calorie-weighted mean of the entries' scores (MM-370), on the new score.
- **The calibration set is a test**: the reference foods of MM-380's report and their letters, so a later change to a
  threshold shows which foods move.

## Description
The engine's grade (`FoodGradeRule`, the score, the letter, the grade of a pack food, an own food, a recipe, an entry, a meal
and a day) on MM-380's method; `FoodGrade`'s popover words; `docs/food-grades.md`; the register's "How is a food graded?"
entry and rows; MM-144, MM-108 and `docs/non-goals.md` saying "the app's own nutrient-density measure" where they said
"a published basis"; the Nutri-Score conditions-of-use item removed from the handoff's waiting list.

## Acceptance Criteria
```gherkin
Scenario: The calibration set
  Given the reference foods of MM-380's report
  Then each gets the letter the report lists

Scenario: Per calorie, not per gram
  Given 100 g of a food and the same food with water added to 200 g
  Then both get the same protein, fiber and sodium points

Scenario: Required inputs
  Given a food with no fiber value, or no sodium value
  Then it is not graded and the question mark's popover names the missing nutrient
  (Amended by MM-656, the owner, 2026-10-27: only sodium is required; an unstated fiber is counted as none, said so.)

Scenario: Refinements not counted
  Given a food that states calories, macros, fiber and sodium but no sugars or saturated fat
  Then it is graded, and its popover says sugars and saturated fat were not counted

Scenario: Vitamins and minerals
  Given a food that states at least five of the ten vitamins and minerals with a reference
  Then its grade counts them, and a food that states fewer is graded without them and its popover says so

Scenario: Too few calories
  Given a food under 10 kcal per 100 g
  Then it is not graded and the popover says there is almost nothing to grade per calorie

Scenario: A recipe
  Given a recipe
  Then it is not graded, and the question mark says its ingredients carry no fiber or sodium

Scenario: No published model
  When the app's source, docs and register are searched
  Then no badge, popover, register entry or document names a published model as the method's basis
```

## UI/UX
No new screen. The badge, its fills and the popover stand (MM-370); the popover's words change to the per-calorie basis
("… and so does a food that packs many calories into little weight", the designer's PD-10) and gain the "not counted"
sentences; a long popover scrolls inside its bubble at large text, so "Got it" stays reachable (the UX guard's F3). Stories
in `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`: FoodGradeMeaning (a letter pressed) and
FoodGradeNotCounted (the popover at its longest, for a food whose source left sugars, saturated fat and most vitamins and
minerals unstated). Reviewed by the product designer and the UX guard in `docs/agent-runs/mm383-sources-and-downloads/`.

## Progress
- Built 2026-10-18. Engine: `FoodGradeRule` (the app's own figures), `nutrientDensityScore`, `gradeLetterOf` (the highest step
  whose floor the score reaches), `gradeOfNutrition` (required fiber and sodium, the 10 kcal floor, alcohol, what was not
  counted and how many of the ten are stated), `GradeMicronutrient`, `gradeMicrosFrom`, `gradeOfCustomFood`, `gradeOfFoodEntry`,
  `gradeOfMeal` (rounded half up), `food/gradeOfCatalogFood`; `domain/food/grade/GradeOmission` and the graded value's
  `notCounted` and `statedMicronutrients`; `FoodGrade`'s popover words; the amount step's caption ("per calorie").
- Tests: `test/engine/foodGrade.test.ts` (the calibration set of 61 foods, at least two on every step, the sensitivity bounds,
  the cooked-state and milk order checks, every threshold at its edge, monotonicity, dilution, the waiver's ramps, the
  micronutrient denominator, breadth and cap, the roll-up's rounding and coverage), `test/engine/foodGradeEvidence.test.ts`
  (every figure's row; no published model named), `test/food/foodGradePopover.test.tsx` (the popover's sentences).
- Docs: `docs/food-grades.md` rewritten; the register's "How is a food graded?" entry and 23 rows; MM-144, MM-108 and
  `docs/non-goals.md` say "the app's own nutrient-density measure"; the Nutri-Score conditions-of-use item is gone from the
  handoff's waiting list.
