---
id: MM-393
status: done
component: coach-insights
related: [MM-362, MM-365, MM-366, MM-367, MM-363, MM-378]
---

# Bug: one insight per item hid every other rule that held on it

## Context
The owner, 2026-10-18: "I logged Popeyes biscuits and it flagged the servings rule … It showed me one
insight – portions, and not low protein. It should show multiple." MM-362 had "One insight per item at
most", a choice recorded for the owner to overrule ("say if any is wrong"), and the owner overruled it.
The engine found both insights; `allowedItemInsights` kept only the higher priority.

## Description
Every insight the safeguards, switches and snoozes allow on an item is shown under it, one line each,
the higher priority first (MM-141's order: safety, data quality, coaching, pattern, education), then
the order of the area's catalog. This holds for every item that carries insights: a logged food, a lift
in a workout, and the Dashboard's waist and water rows. Each line is logged for the Coach tab (MM-363)
and snoozed (MM-378) on its own, as it already was per kind and item.

## Acceptance Criteria
```gherkin
Scenario: Two rules hold on one food
  Given biscuits logged as three servings of 260 kcal, with 12 g of protein in 780 kcal
  When the Food screen shows the day
  Then the portion check and the protein line are both under the entry
  And the portion check comes first

Scenario: One snoozed
  Given two lines under one food
  When the portion check is snoozed on it
  Then the protein line still shows
```

## Notes
Regression test: "a food that two rules hold on shows both lines under it, the higher priority first"
in `apps/mobile/test/coach/foodAndBodyInsights.test.tsx`; it failed before the fix (the protein line
was missing) and passes with it. `test/engine/allowedItemInsights.test.ts` lists every kind in order.
Story: `FoodTwoInsightsOnOneEntry` in `CoachingInsights.stories.tsx`.
