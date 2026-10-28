---
id: MM-666
status: done
component: coach-insights
related: [MM-362, MM-365, MM-597, MM-607, MM-663, MM-665]
---

# Story: On-demand meal "Coach breakdown" sheet and inline food swap insights

## Context
Coaching belongs where food decisions happen—on the `Food` tab—not only in a separate review tab. Users need two ambient coaching surfaces on the `Food` tab:
1. **On-demand meal analysis (`"Coach breakdown"`)** in each meal's `⋯` overflow menu alongside `"Macro split"`, opening a slide-up bottom sheet (`MealBreakdownSheet`) with tactical daily impact (% of daily calories and protein, remaining runway, and required rest-of-day protein density), the #1 calorie-displacement outlier item in the meal, a deterministic higher-efficiency swap from the user's foods or installed catalog, and the coaching paragraph (Track 1 archetype or Track 2 BYOK narration).
2. **Actionable inline food swaps** under logged food rows (`useItemInsightContents`), replacing generic `"A protein food alongside..."` advice with a concrete higher-protein swap (`Swap for <Food> (<P> g protein, <kcal> kcal) next time.`) and protein density ($P\%$) whenever a qualifying swap exists.

## Decisions
- Add `'breakdown'` (`"Coach breakdown"`) as a separate item alongside `'split'` (`"Macro split"`) in `MealSection.tsx`.
- Build `MealBreakdownSheet.tsx` and `showMealBreakdownSheet.tsx` over `mealBreakdownAnalysisOf`, `mealBreakdownArchetypeText`, and `services.coachNarrator`.
- Enhance `useItemInsightContents.ts` so `mostlyFat` and `lightOnProtein` food entry insights automatically resolve `swapFor` from `state.coachAnalysis.foodInput` and surface the concrete swap and protein density when a candidate exists.

## Description
Add `"Coach breakdown"` to the meal `⋯` overflow menu on the `Food` tab, implement `MealBreakdownSheet.tsx` and `showMealBreakdownSheet.tsx`, and enrich inline food insights with concrete swaps in `useItemInsightContents.ts`.

## Acceptance Criteria
```gherkin
Scenario: Meal overflow menu offers Coach breakdown alongside Macro split
  Given a meal on the Food tab has one or more logged foods
  When the user opens Options for that meal and selects "Coach breakdown"
  Then MealBreakdownSheet opens showing the coaching summary, Meal impact, Meal protein density, Remaining runway, and any Highest calorie drag or Suggested swap

Scenario: Inline food insight surfaces a concrete swap when available
  Given a logged food triggers lightOnProtein or mostlyFat and a qualifying higher-protein swap exists in the user's foods or catalog
  When the inline insight renders under the food
  Then the insight names the swap and its protein and calories, and includes the swap in its evidence rows
```

## Progress (built)
- Added `MealBreakdownSheet.tsx`, `showMealBreakdownSheet.tsx`, and the `"Coach breakdown"` item in `MealSection.tsx`.
- Updated `useItemInsightContents.ts` to attach concrete swaps (`swapFor`) and protein density to `mostlyFat` and `lightOnProtein` food insights when a swap candidate exists.
- Added `MealCoachBreakdown` story in `Food.stories.tsx` and regression tests in `test/food/mealCoachBreakdown.test.tsx`.
