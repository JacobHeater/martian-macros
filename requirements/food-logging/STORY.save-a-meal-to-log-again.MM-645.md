---
id: MM-645
status: done
component: food-logging
related: [MM-45, MM-587, MM-625, MM-631, MM-637, MM-639]
---

# Story: save a meal and log it again in one press

## Context
The food-logging review (`docs/food-logging-plan.md`, W-D) proposed meal templates. A recent meal (MM-587)
covers a meal that was analysed or logged again, but a usual breakfast typed food by food has no way to come
back in one press. "Save to Saved" in View meal saves a meal as a recipe, which is one food, not its foods.
The owner decided on 2026-10-26: build it.

## Decisions
From the owner (2026-10-26): a meal's foods, from a slot or the "In this meal" list (MM-631), can be saved as
a meal that logs again in one press from Saved.

Choices made without asking (say if any is wrong):
- **Saved from** a slot's ⋯ menu ("Save as a meal", all the slot's foods) and from the "In this meal" list,
  in a small sheet that names it. The first name comes from its foods ("Oats and berries", "Oats, berries
  and 3 more").
- **Each food is kept as it was logged**: every number, its amount, its reference and where it came from.
  What it was one of is not kept, so the foods log again loose (the owner's D-2).
- **Logged again from "Your meals" in Saved**, or from a search under "Your foods and meals" (MM-637), in
  one press, at the sheet's day, meal and time. With foods already in the meal's list, they join it.
- **The row says what the press does** ("Meal · logs 2 foods · 340 kcal") and draws no chevron, as nothing
  opens. The press logs once however often it is pressed, and "Logged …" offers Undo, which takes back exactly
  those foods (the UX guard's UX-1 and UX-2).
- **Deleted from its menu in Saved**, asked first. What was logged from it stays.
- **Kept on the phone** in two tables of their own (schema 30): the meal, and its foods as a food's row is.
  Erased with everything else, and part of the backup.

## Acceptance Criteria
```gherkin
Scenario: Saved from a slot
  Given breakfast holds oats and berries
  When "Save as a meal" is chosen from breakfast's menu, named "Usual breakfast", and saved
  Then Saved has "Usual breakfast" with oats and berries

Scenario: Logged again
  Given "Usual breakfast" is saved
  When it is pressed in Saved from lunch's "+"
  Then its foods are logged today at lunch, as foods of their own

Scenario: Undone
  Given "Usual breakfast" was logged from Saved by mistake
  When Undo is pressed
  Then its foods are gone, and nothing else

Scenario: Found by search
  When "usual" is searched
  Then "Usual breakfast" is among the person's own, and pressing it logs it
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: SaveMeal, AddFoodSavedMeals).

## Notes
- Built in `SavedMealRepository` (`SqlSavedMealRepository`, `InMemorySavedMealRepository`, a contract suite),
  schema 30, `SaveMealSheet`, `MealSection`, `MyFoodsStep` and `AddFoodSheet`.
- Tests: `test/food/savedMeals.test.tsx`, `test/contracts/savedMealRepositoryContract.ts`, the version 29
  upgrade in `test/data/upgrade.test.ts`.
