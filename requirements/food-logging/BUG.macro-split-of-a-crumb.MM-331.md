---
id: MM-331
status: done
component: food-logging
related: [MM-49, MM-321]
---

# Bug: a gram of a food drew "0 g · 100%" as its macro split

## Context
Found drawing the Food screen's undrawn states for MM-321 (story "Add Food Amount Rounds To Zero"). One
gram of cola has 0.1 g of carbs: the split drew a full carbs ring labelled "0 g · 100.0%", beside
"0 kcal from food macros".

## Description
Macros worth less than half a calorie, which round to none, have no split to show: the chart says what
to enter instead, as it does with no macros at all.

## Acceptance Criteria
```gherkin
Scenario: A crumb
  Given an amount whose macros come to less than half a calorie
  Then no split is drawn and the chart asks for macro amounts

Scenario: A real amount
  Given 10.6 g of carbs and nothing else
  Then the split is all carbs
```

## Notes
Guarded by `apps/mobile/test/charts/macroSplitRoundsToNothing.test.tsx`, which failed before the fix.
