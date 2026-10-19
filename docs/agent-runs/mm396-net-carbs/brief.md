# Brief: net carbs (MM-396), sugar alcohols as a nutrient (MM-397), Settings as an accordion (MM-398)

## Question
The owner asked (2026-10-18): a Settings switch for net carbs, on by default, counted everywhere carbs
show, net = total − fiber − sugar alcohols (all of them, as labels do); and Settings as an accordion with
every section closed by default. The chair has drafted the three tickets. What changes before building?

## Inputs
- `requirements/food-logging/STORY.net-carbs.MM-396.md`, `TASK.sugar-alcohols-as-a-nutrient.MM-397.md`,
  `requirements/settings/STORY.settings-as-an-accordion.MM-398.md`
- carbs as shown: `apps/mobile/src/food/CalorieHero.tsx`, `charts/MacroSplitChart.tsx`, `ui/MacroBar*`,
  `ui/MacroKind.ts`, `food/FoodEntryTile.tsx`, `food/FoodAmountStep.tsx`, `domain/IntakeDay.ts`,
  `domain/intakeDayFrom.ts`, `domain/FoodEntry.ts` (`netCarbsG`), `engine/DailyTargets.ts`,
  `engine/computeTargetsTraced.ts`
- the data: `foodCatalog/FoodPackFormat.ts`, `foodPipeline/node/extract.sql`, `domain/food/label/parseNutritionLabel.ts`,
  `data/currentSchema.ts`, `data/migrationSteps.ts`, `food/custom/CustomFoodForm.tsx`
- Settings: `settings/SettingsScreen.tsx` and its section components, `ui/MmSection.tsx` (collapsible),
  `ui/MmSwitchRow.tsx`

## Roles and questions
- **nutrition:** the net-carb definition and the target read as net (same grams); energy of fiber and
  polyols in the Split at 4 kcal a gram of net carbs; anything net carbs must not touch.
- **integrations:** USDA FoodData Central's sugar-alcohol nutrient id(s) in Foundation, SR Legacy, FNDDS
  and Branded; Open Food Facts' `polyols_100g`; pack format 3; label wording ("Sugar Alcohol",
  "Sugar Alcohols", "Polyols") and per-polyol lines (erythritol) on US labels.
- **product-designer and ux-accessibility:** the switch's place and words; "Net carbs" labels; the
  accordion: closed headers, summaries or not, how deep links open a section, the screen reader.
