---
id: MM-641
status: done
component: food-logging
related: [MM-587, MM-630, MM-634]
---

# Story: take one food out of a logged meal

## Context
The food-logging review (`docs/food-logging-plan.md`, F-18, W-D) found that a logged meal's foods move only
together (MM-587, MM-630, MM-634): one food logged into the wrong meal by an analysis dragged the whole meal
with it. Its foods open only in View meal, which could change or remove a food but not set it apart.

## Decisions
Choices made without asking (say if any is wrong):
- **"Take out of the meal"** in a food's menu in View meal. The food stays in the same slot, day and time,
  with its numbers and where they came from, as a food of its own (no meal name). Then it can be moved,
  edited or chosen like any food.
- **Undo** puts it back in the meal, by the meal's key and name.
- Taking out the last food leaves no meal, and View meal says so, as removing it would.
- Not offered while an analysed meal is still under review: those foods are not logged yet.

## Acceptance Criteria
```gherkin
Scenario: Taken out
  Given "Chicken and rice" at dinner, 7:00 PM, three foods
  When "Take out of the meal" is chosen for its rice in View meal
  Then rice is a food of its own at dinner, 7:00 PM, and the meal keeps its other two foods
  And Undo puts rice back in the meal
```

## Notes
- Built in `MealItemRow` (`onTakeOut`) and `ViewMealSheet`. Tests: `test/food/takeOutOfAMeal.test.tsx`.
