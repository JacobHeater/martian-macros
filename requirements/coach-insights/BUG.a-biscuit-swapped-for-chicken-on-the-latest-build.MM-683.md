---
id: MM-683
status: in-progress
component: coach-insights
related: [MM-617, MM-666, MM-674, MM-682, MM-684]
---

# Bug: a biscuit swapped for a chicken fillet, on a build of main made moments before

## Context
The owner's screenshot, 2026-10-28, on the breakfast breakdown of a build made from main after PR #360 (MM-674 in it):
"Suggested swap: Just Bare lightly breaded chicken breast original fillet in place of Buttermilk biscuit, −325 kcal ·
+12 g protein." Whether the fillet was on that day's plate is not known from the screenshot; it did not need to be.
`swapFor`'s first strategy (`ownSwapOf`) takes any food the person logs in the same meal slot that trades better on
fat, calories, protein or sodium, with no regard to the food's kind, so the fillet logged at other breakfasts qualifies
in the biscuit's place. MM-674 removed only the plated fillet from the candidates; the fillet from other days still
stands. A bread for a chicken is not a swap, it is a different meal.

## Decisions
- A swap is within the food's group or none (the owner, 2026-10-28: "same-group swap only"). The engine that enforces it
  is MM-684's; this ticket holds the regression test on the owner's breakfast, which fails on main today.
- The catalog's swap first, the person's own foods second, both held to the food's group; a food whose group is not
  known (typed by hand, saved) gets no swap, and its move is a cut, an add or the next meal.

## Description
On the owner's breakfast (the biscuit, eggs, the fillet; the fillet logged at breakfast on earlier days too), the
biscuit's swap is never the fillet, under any spelling, on any day, and never any food outside the biscuit's group.

## Acceptance Criteria
```gherkin
Scenario: No swap across food groups
  Given a breakfast whose outlier is a bread and the person logs a chicken fillet at breakfast on other days
  When the meal's moves are computed
  Then no move names the fillet in the bread's place, whether or not the fillet is on today's plate

Scenario: The owner's screenshot
  Given the breakfast of 844 kcal and 34 g with the biscuit at 541 kcal and 10 g, 2177 kcal and 187 g targets, 347 kcal left
  Then the sheet's move is the next-meal order and its words are line A of MM-682
```

## Notes
- Test: `test/engine/mealSwapSameGroup.test.ts` (fails on main: the fillet is offered). Not run locally; CI validates.
- The owner's call-out from the phone: no panel.
