---
id: MM-656
status: done
component: food-logging
related: [MM-310, MM-380, MM-382, MM-567, MM-654]
---

# Bug: a soda with no fiber stated has no grade

## Context
After MM-654 the owner's orange soda, found online and logged by its can, still showed the question mark:
"Fiber isn't stated for this food, and with its carbs it could change the grade." The record stated neither
fiber nor sugars, so MM-567's bound (carbs less sugars) was the whole carbohydrate, and the rule withheld the
grade on the chance the soda held 14 g of fiber per 100 mL. The owner, 2026-10-27: "it's all sugar!"

## Decisions
From the owner (2026-10-27): grade it.

Choices made without asking (say if any is wrong):
- **A fiber that is not stated is counted as none, for every food**, and the grade says so. Fiber only counts for
  a food (its own points, and the sugars waiver), so the letter can be a step too low and never too high: the
  honest side to err on, and MM-567 already did this where the carbs could not move the letter. Sodium stays
  required (MM-310): it counts against a food, so guessing it as none would flatter.
- **The popover's sentence**: "Fiber isn't stated for this food, so none was counted; stated, it could only
  raise the grade."
- MM-382's "Required inputs" scenario is amended; MM-567 is superseded in part.

## Description
A food that states sodium is graded whether or not it states fiber; without fiber it is graded as having none,
and its popover says so.

## Acceptance Criteria
```gherkin
Scenario: No fiber, no sugars
  Given a soda stating 54 kcal, 14.4 g of carbs and 15 mg of sodium per 100 mL, and neither fiber nor sugars
  When it is logged by its can
  Then its row shows a D, and the popover says fiber was counted as none

Scenario: Sodium still required
  Given a food with no sodium stated
  Then it is not graded and the popover names sodium
```

## UI/UX
No new screen. A bug the owner reported, so no panel.

## Notes
- `engine/gradeOfNutrition.ts`, `food/FoodGrade.tsx` (the sentence); `test/engine/foodGrade.test.ts`;
  `test/food/drinkGradeOnThePhone.test.tsx` (the owner's case through the real screens and database, the online
  path included); `docs/food-grades.md`.
- On the 2026-10-27 pack this grades the 58,815 per-100 g foods and 29,833 drinks that state no fiber; the
  23,499 foods and 6,527 drinks stating neither fiber nor sugars among them.
