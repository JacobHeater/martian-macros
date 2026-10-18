# Brief: how a food is graded A+ to D- (MM-369)

## Question
Which published nutrient-profiling method should grade every food, per 100 g, on twelve steps (A+ to D-); how its score
maps to the steps; which nutrients it needs and when a food can't be graded; and what its licensing allows.

## Why now
The product owner wants every food graded (MM-370) and asked for the whole feature to be built (2026-10-18). MM-369 is the
spike that chooses the method. The chair measures pack coverage from the data; the nutrition role answers the method.

## Inputs
- `requirements/food-logging/SPIKE.how-a-food-is-graded.MM-369.md`
- `requirements/food-logging/STORY.food-grades.MM-370.md`
- `requirements/coach-insights/TASK.food-grading-non-goal-overruled.MM-371.md`
- what a food carries: `apps/mobile/src/domain/FoodEntry.ts`, `apps/mobile/src/domain/food/` (custom foods, recipes,
  micronutrients, `Micronutrient.ts`), `apps/mobile/src/foodCatalog/` (the pack's food shape), `docs/evidence.md`
- MM-310's rule: a missing value is never counted as zero

## Roles
- nutrition: the method (Nutri-Score 2023, Health Star Rating, or another), with evidence for each and how it treats drinks,
  fats and oils, cheese and whole foods; the point ranges for twelve steps and whether + and - are equal splits; the nutrients
  required and which missing ones make a grade impossible; trademark and naming terms (the app must not look like
  Nutri-Score's label unless allowed); the evidence rows.

Omitted: the other roles for this spike; coaching and safety review the grades' presentation separately (MM-370's open
question on judging food).

## Output
`findings/nutrition.md` using `agents/templates/findings/role.md`, with a concrete recommendation the chair can build:
the formula, the component tables, the twelve-step mapping, the required nutrients and the licensing position. Read-only.
