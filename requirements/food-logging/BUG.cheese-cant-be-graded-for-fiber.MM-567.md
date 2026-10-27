---
id: MM-567
status: done
component: food-logging
related: [MM-380, MM-382, MM-370, MM-310, MM-565]
---

# Bug: grated parmesan "can't be graded" for want of a fiber value

## Context
The owner (2026-10-22), on "Cheese, parmesan, grated, refrigerated": "it says can't be graded with no fiber,
but it's cheese... this app has to be smarter than that." A missing fiber value blocked the grade of every
food, including ones with almost no carbohydrate, where fiber cannot matter. The popover also said "Can't be
graded" twice, in its title and again in its message.

## Description
Fiber is part of the carbohydrate, and not the sugars, so a food that leaves fiber out holds between none
and its carbs less its sugars. The score only rises with fiber, so the grade is worked at both ends:

- **Same letter at both ends** (cheese, meat, eggs, oils): the food is graded as having none, and the
  popover says "Fiber isn't stated for this food, but it has too few carbs for fiber to change the grade."
- **Different letters**: still not guessed (MM-310), and the reason says why: "Fiber isn't stated for this
  food, and with its carbs it could change the grade."
- Sodium has no such bound and stays required: "Sodium isn't stated for this food, so it can't be graded."
- The reasons no longer start with "Can't be graded:", which the popover's title already says.

## Acceptance Criteria
```gherkin
Scenario: Cheese
  Given a food per 100 g: 392 kcal, 36 g protein, 3.2 g carbs, 0.8 g sugars, fiber not stated
  Then it is graded, with the same letter as with 0 g fiber
  And its popover says fiber wasn't stated and could not change the grade

Scenario: Lentils without fiber
  Given lentils with 20 g carbs and fiber not stated
  Then it is not graded, and the reason says the fiber could change the grade
```

## Progress
Fixed in `gradeOfNutrition` (with `carbsG` in `GradeNutrition`), `GradeOmission` ("fiber") and
`FoodGrade`. Regression test: `test/engine/foodGrade.test.ts`, "grades a food whose unstated fiber could not
change its letter". Not run locally; CI validates. Not checked against the owner's own parmesan entry: if its
carbs are high enough to move the letter, it still says so.

(Superseded in part by MM-656, the owner, 2026-10-27: every food with fiber unstated is graded as having none, not only those whose carbs could not change the letter.)
