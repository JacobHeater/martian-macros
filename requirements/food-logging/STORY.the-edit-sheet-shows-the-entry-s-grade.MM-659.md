---
id: MM-659
status: done
component: food-logging
related: [MM-221, MM-370, MM-642, MM-654]
---

# Story: the edit sheet shows the entry's grade

## Context
The owner, 2026-10-27, on the Edit food sheet: "I've decided I want this screen to have the food grade on it."
The Food row shows an entry's letter (MM-370) and the amount step shows a found food's (MM-642), but the sheet
an entry is edited on showed none.

## Decisions
From the owner (2026-10-27): the grade on the edit sheet.

Choices made without asking (say if any is wrong):
- **Under the food's name, as the amount step draws it** (`FoodGrade` in the amount step's `food-amount-grade`
  block, MM-318): the letter in view, its meaning and what was not counted a press away.
- **It follows the numbers on the sheet**: the grade of the entry as it would be saved, so a corrected amount or
  a filled-in fiber changes the letter before Save changes is pressed. The question mark says why when there is
  no grade, as on the row.
- Only when editing a logged entry; a food being typed for the first time keeps its sheet as it is.

## Acceptance Criteria
```gherkin
Scenario: The letter on the sheet
  Given a logged soda graded C on its row
  When its entry is edited
  Then the sheet shows "Grade C" under the food's name
```

## UI/UX
- `Screens/Food`, `EditFoodPerServing`: the badge under the name. A change the owner dictated, so no panel.

## Notes
- `AddFoodSheet`; the owner's case in `test/food/drinkGradeOnThePhone.test.tsx` reads the badge off the sheet.
