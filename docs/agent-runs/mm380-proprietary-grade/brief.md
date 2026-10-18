# Brief: a food grade of the app's own (MM-380) and fuller food packs (MM-381)

## Question
The product owner has withdrawn the published point tables (MM-369) and asked for a grade of the app's own: nutrient
density per calorie, counting the vitamins and minerals the app tracks, with calories, the macros, fiber and sodium
required and sugars, saturated fat and the micronutrients counted when stated. The chair has drafted the method
(`requirements/food-logging/SPIKE.a-food-grade-of-our-own.MM-380.md`, the table under Decisions). Does the draft stand,
and what changes before it is built? And, for MM-381, should the food packs draw on fuller sources?

## Why now
The owner asked on 2026-10-18 for the replacement to be built end to end tonight. The grade shows on every logged food,
meal, day, search result and the add sheet (MM-370), so its method is the most visible nutrition claim in the app.

## Inputs
- `requirements/food-logging/SPIKE.a-food-grade-of-our-own.MM-380.md` (the draft method and the calibration letters)
- `requirements/food-database/SPIKE.food-packs-with-fuller-data.MM-381.md`
- `requirements/food-logging/STORY.the-grade-is-the-apps-own.MM-382.md` (the build)
- `requirements/food-logging/STORY.food-grades.MM-370.md` (where the grade shows; the owner's decisions that stand)
- `docs/food-grades.md` (the method being replaced), `docs/evidence.md` ("How is a food graded?" and the `foodGrade` rows)
- the engine as built: `apps/mobile/src/engine/{FoodGradeRule,GradeNutrition,nutrientProfileScore,gradeLetterOf,gradeOfNutrition,gradeOfCustomFood,gradeOfFoodEntry,gradeOfMeal}.ts`,
  `apps/mobile/src/food/gradeOfCatalogFood.ts`, `apps/mobile/src/food/FoodGrade.tsx` (the popover words)
- what a food carries: `apps/mobile/src/foodCatalog/CatalogFood.ts`, `PackMicros.ts`, `apps/mobile/src/domain/food/micros/{Micronutrient,Micronutrients,referenceAmount}.ts`,
  `apps/mobile/src/domain/food/custom/{CustomFood,RecipeIngredient}.ts`, `apps/mobile/src/domain/FoodEntry.ts`
- the pipeline: `apps/mobile/src/foodPipeline/node/extract.sql`, `tool/src/foodSource.ts`, `requirements/food-database/*MM-307.md`, `*MM-51.md`, `*MM-52.md`
- MM-310's rule: a missing value is never counted as zero; MM-108's voice rules (no moral words)

## Roles
- nutrition: whether the components, bases and thresholds give an order a nutrition professional would accept; the
  sugars waiver as a stand-in for added sugars; energy density alongside a per-calorie basis; dairy, eggs, nuts, oils,
  fruit, juice and drinks; low-calorie foods (broth, vegetables) under per-calorie sodium; the twelve cut points against
  the calibration set; what the literature on nutrient-density scoring (NRF 9.3 and kin, per-100-kcal indices) says about
  each choice, as context not validation; the evidence rows and their grades.
- micronutrients: the vitamins-and-minerals component: the US Daily Values as the universal reference against the app's
  sex- and age-specific reference amounts; the 100% cap per nutrient; the mean over ten; the minimum stated (five) and
  what a food whose source states few of them should get; fortified foods; the popover sentence when not counted; for
  MM-381, which sources carry which of the thirteen nutrients.
- measurement: the score as an instrument: sensitivity to typical label and database error, ties and the spread across
  the twelve steps, the behaviour at the per-calorie extremes (very low and very high energy density), the 10 kcal per
  100 g floor, the waiver's discontinuities, the roll-up by calorie-weighted mean of scores, and whether the calibration
  set is enough to hold the letters in a test.
- integrations: MM-381: what USDA Foundation, SR Legacy, Branded and Open Food Facts carry of the thirteen MM-307
  nutrients; candidate sources (USDA FNDDS, the FDC Experimental set, the Canadian Nutrient File, others fit for a US
  launch) with licence, format, size, coverage, cadence and how each joins `extract.sql`, the conflict policy and the
  pack's provenance; the recommendation and the next commands or tickets.

Omitted: coaching and safety (the grade's presentation and the eating-disorder decision were reviewed under MM-361 and
MM-370 and are unchanged); product designer and UX guard (no new screen; the popover's words change and are checked at
the build).

## Output
`findings/<role>.md` using `agents/templates/findings/role.md`, read-only, handed back to the chair as text. Each with a
verdict ("build as drafted", "build with the listed changes", "do not build as drafted"), concrete figures where a figure
is changed, and the owner decisions it would hand up (the chair takes them tonight and records them as "say if any is
wrong").
