---
id: MM-587
status: in-progress
component: food-logging
related: [MM-45, MM-47, MM-48, MM-370, MM-382, MM-570, MM-586]
---

# Story: A meal shows as one row, and opens to its foods

## Context
A meal imported by AI meal analysis (MM-586) is several foods eaten together under one name. In the day it
is one thing; its foods are one press away.

## Decisions
Made with the product owner (2026-10-22):
- **One row in the day**, like a food's: the meal's name, "Meal · N items" with its macros, its calories and
  its grade. Pressing it opens **View meal**; the row's ⋯ menu has **View meal** and **Delete**.
- **The meal's grade** is the calorie-weighted mean of its foods' grades, with the rule the slot's and the
  day's grades use (`gradeOfMeal`, MM-370): a pickle does not count as much as a steak.
- **In View meal** the person sees each food with its grams, calories, macros, grade and where its numbers
  came from, and the meal's totals. They can change or remove a food, add one, rename the meal, and move it
  to another slot or day. Removing the last food asks first and then deletes the meal.
- **Delete removes the whole meal**, with Undo, as a food's delete does (MM-48).
- **Recent foods offer a meal again**: pressing it logs the same foods to the open slot and day in one
  press.
- **"Save to Saved"** is in View meal too. What is saved is a copy: changing the logged meal never changes
  the saved one, nor the other way round.

Choices I made without asking (say if any is wrong):
- **The foods of a meal are not listed one by one in Recent foods**: the meal is, once.
- **Swiping the meal's row away deletes the meal**, as swiping a food deletes the food.
- **Copying a slot to today (MM-47) copies its meals as meals**, each under a new key, so the copy and the
  original are separate.
- **Moving a meal to another day** uses the day stepper of the add-food sheet, and keeps its time eaten, as a
  food's move does (MM-570). Superseded on 2026-10-26 by the owner (MM-626): it was cleared on a day move,
  and View meal had no time to give it again; View meal now has the "Time eaten" row.

## Description
The day's slot groups the entries that carry the same meal key into one row. View meal is a sheet over the
Food screen.

## Acceptance Criteria
```gherkin
Scenario: One row
  Given "Taco night" was logged to dinner with three foods totalling 820 kcal
  Then dinner shows one row "Taco night" with "Meal · 3 items" and 820 kcal
  And the dinner total counts all three foods

Scenario: The meal's grade
  Given a meal of 600 kcal of a B food and 50 kcal of a D food
  Then its grade is the calorie-weighted mean of the two, as a slot's grade is

Scenario: View meal from the menu
  When the person opens the row's menu
  Then it offers "View meal" and "Delete"

Scenario: View meal from the row
  When the person presses the row
  Then View meal opens with each food, its grade and where its numbers came from

Scenario: Change a food
  Given View meal is open
  When the person changes a food's grams from 200 to 100
  Then that food's numbers halve and the meal's total follows

Scenario: The last food
  Given a meal with one food
  When the person removes it
  Then they are asked first, and confirming deletes the meal

Scenario: Move
  When the person moves the meal from lunch to dinner
  Then every food of the meal is in dinner

Scenario: Delete with undo
  When the person deletes the meal
  Then all its foods are removed and Undo puts them back as the same meal

Scenario: Logged again from recents
  Given "Taco night" was logged yesterday
  When the person opens Add food for lunch today and presses "Taco night" in Recent foods
  Then the same foods are logged to lunch today as one meal

Scenario: Saved separately
  Given a meal saved to Saved
  When a food of the logged meal is changed
  Then the saved recipe is unchanged
```

## UI/UX
- A logged meal — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Stories: FoodWithLoggedMeal,
  AddFoodRecentMeal, AddFoodSearchFindsMeal). The row is drawn as a food's row is (MM-564).
- View meal — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Stories: ViewMeal,
  ViewMealChangeRefused, ViewMealAddFood, ViewMealGone). Moving to another day uses the add-food sheet's
  "Logged on" stepper.

## Notes
- Built in the owner's checkout on 2026-10-22, not yet run: tests are written for CI. Nothing tried on a
  phone yet.
- A food of a logged meal must be complete to be saved in View meal (no number missing, the energy rule); in
  the preview a problem is allowed and said, since the assistant can fix it.
- Tests: `test/food/loggedMeal.test.tsx` (every scenario above, copying a slot, the grade), the food
  repository contract (recent meals, MM-587 cases).
