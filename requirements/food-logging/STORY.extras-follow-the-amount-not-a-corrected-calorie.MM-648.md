---
id: MM-648
status: done
component: food-logging
related: [MM-204, MM-308, MM-623]
---

# Story: a food's other nutrients follow the amount, never a corrected calorie

## Context
The food-logging review (`docs/food-logging-plan.md`, F-20) found that on the typed path the sheet scaled a
food's micronutrients and sugar alcohols by how much its calories changed (`AddFoodSheet`, `scaledMicros`):
a calorie typo corrected from 200 to 400 doubled the calcium. On the calculated path the calories say the
amount, so the scaling was right there (MM-308, MM-623); typed, the calories are what the person typed. The
plan left it undecided and recommended that extras follow the amount or stay as stated; "finish the plan"
takes the recommendation.

## Decisions
Choices made without asking (say if any is wrong):
- **Typed per serving, the servings say the amount.** The form remembers what the entry's extras stood for
  (its calories, and its servings) when the typed path was entered: by opening a typed entry, or by "Edit
  nutrition per serving" / "Enter the totals myself" (MM-204). Two servings instead of one doubles the
  calcium; 200 kcal typed instead of 100 changes only the calories.
- **Typed totals are kept as stated.** There is no amount to follow, so the calcium is what the label said.
- **The calculated path is as it was**: the amount scales everything (MM-308).
- Fiber, sodium, sugars and saturated fat are typed fields on this path and were already right.

## Description
Correcting a typed food's calories leaves its other nutrients alone. Changing how many servings scales them.

## Acceptance Criteria
```gherkin
Scenario: A corrected calorie
  Given one label serving of yogurt with 100 kcal, 190 mg calcium and 2 g sugar alcohols
  When its nutrition per serving is edited to 200 kcal and saved
  Then it has 200 kcal, 190 mg calcium and 2 g sugar alcohols

Scenario: More servings
  When instead two servings are logged, per serving
  Then it has 200 kcal, 380 mg calcium and 4 g sugar alcohols

Scenario: Typed totals
  Given a stew typed as totals, 200 kcal with 190 mg calcium
  When its calories are corrected to 400
  Then its calcium is still 190 mg
```

## Notes
- Built in `AddFoodSheet` (`extrasAt`, `extrasFactor`). Tests: `test/food/extrasFollowTheAmount.test.tsx`.
