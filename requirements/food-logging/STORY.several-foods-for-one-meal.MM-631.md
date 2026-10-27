---
id: MM-631
status: done
component: food-logging
related: [MM-42, MM-218, MM-220, MM-438, MM-570, MM-576, MM-586, MM-587, MM-624, MM-625]
---

# Story: several foods for one meal in one sitting

## Context
The owner's first priority (2026-10-26): first-class multi-food logging. The food-logging review
(`docs/food-logging-plan.md`, F-10, increment C1) found the Add food sheet logs one food and closes. Dinner
of three foods meant three sheets, three searches, and the meal and time set up to three times (the time
starts at now, so dinner logged at 9 PM said 9 PM on every food until changed). Only AI analysis and
logging a meal again took several foods at once.

## Decisions
From the owner (2026-10-26, the plan's D-1 and D-2):
- **The foods are saved together**, on one press, not one at a time as each is added.
- **They are logged as loose foods**, each its own row in the meal, not as a named meal (MM-587 stays for
  AI analysis and meals logged again).

Choices made without asking (say if any is wrong):
- **One food still logs in one press.** The amount step and the typed form keep "Log it" as their one
  primary action. A second action, "Add another food", puts the food in the meal's list and goes back to
  search with what was typed still there.
- **"In this meal"**: once a food is in the list, the search step shows the list under the search field.
  Each food is a row (its name, amount and calories) with a Remove action, under a line with the count
  and the calories ("In this meal · 2 foods · 640 kcal").
  - The meal and the time eaten sit with the list, set once for every food in it.
  - Its one primary action is "Log 2 foods", with the check icon, the result on the button (the owner,
    2026-10-22).
- **Once a food is in the list, the amount step and the form ask no meal or time.** The list's own are
  used; they were taken from the first food added.
- **The last food can be logged with the list** from the amount step or the form: "Log it" there becomes
  "Log 3 foods", the list and this food together.
- **All or nothing** (MM-625): the foods are written in one step. A failure logs none of them, keeps the
  list, and says so above the action (MM-624).
- **Leaving the sheet with foods in the list asks first** ("Discard 2 foods?"), from Close, a drag down,
  a press outside, Escape or Back. The list lives only while the sheet is open, so nothing half-entered is
  kept on the phone (the plan's privacy call).
- **While the list has foods**, AI meal analysis, Saved and Estimate are not offered. Each logs on its own
  and would leave the list behind. Search, recent foods, Scan and entering by hand stay. A recent meal
  pressed adds its foods to the list, at the list's meal and time.
- Cooking fat chosen with a food goes into the list with it, as its own row, and is logged with it; the
  action's count includes it ("Log 3 foods" for two foods and a fat).
- **Said, not only seen** (the UX guard's UX-1): adding says "Added White rice, cooked · 2 foods in this
  meal" and the list's line takes focus; taking a food out says "Removed …" with Undo.
- **While a search is typed the list is its one line** ("In this meal · 2 foods · 640 kcal"), so the results
  stay in view (the designer's PD-1); cleared, its meal, time, foods and action show again. Meal and time
  come first, then the line and the foods, as an analysed meal's review has them.
- **Rows** are `MmListRow`s with a Remove icon. The sibling is `MealItemRow` (an analysed meal's review),
  which has a menu because its rows also open to be changed; these rows have one action (MM-318).
- A failure names the action that is there ("Press Log 2 foods to try again"), wherever it is said.

## Description
From a meal's "+", foods can be added one after another to an "In this meal" list, each found, scanned,
typed or taken from recent foods as before, and logged together in one press at one meal and time.

## Acceptance Criteria
```gherkin
Scenario: Three foods to dinner, the time set once
  Given the Add food sheet opened from dinner's "+"
  When rice is added with "Add another food", then chicken, then a salad logged with "Log 3 foods"
  Then dinner holds the three foods, all at the time the list had
  And the sheet was opened once

Scenario: One food in one press
  Given the Add food sheet with nothing in the list
  When a food's "Log it" is pressed
  Then that food is logged and the sheet closes, as before

Scenario: A food taken out
  Given the list holds rice and chicken
  When rice is removed
  Then the list holds chicken only

Scenario: Leaving with foods in the list
  Given the list holds two foods
  When the sheet is closed
  Then it asks "Discard 2 foods?" and, kept, the sheet and its list stay

Scenario: A failure logs none
  Given the food log refuses a write
  When "Log 2 foods" is pressed
  Then nothing is logged, the list stays, and the sheet says so
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: AddFoodSessionOne, AddFoodSessionMany,
  AddFoodSessionAmount, AddFoodSessionLogFailed). The list under the search, its rows and its one action.

## Notes
- Built in `AddFoodSheet` (the list, its meal and time, Log N foods), `FoodAmountStep` (Add another food),
  `MmOverlays` (a sheet may ask before it closes) and `showAddFoodSheet`.
- Tests: `test/food/severalFoodsForOneMeal.test.tsx`.
