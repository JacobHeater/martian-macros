---
id: MM-714
status: in-progress
component: food-logging
related: [MM-48, MM-587, MM-625, MM-630, MM-633, MM-634]
---

# Story: a food's menu offers what the chosen foods' menu offers, and both copy to another meal

## Context
The owner, 2026-10-30, from the phone: "on individual foods and bulk food changes we need consistent menu
items and to include a new one on both to copy to another meal". A food's ⋯ menu held "Select" and "Delete"
(MM-634); the bar for the chosen foods held "Change time", "Move to another meal", "Move to another day",
"Copy to another day" and "Delete". So one food could not have its time, meal or day changed without first
choosing it, and nothing anywhere copied foods to another meal of the same day: a lunch eaten again at
dinner was logged again by hand.

## Decisions
From the owner (2026-10-30): the same items on a food and on the chosen foods, and "Copy to another meal"
on both.

Choices made without asking (say if any is wrong):
- **One list of actions**, `togetherActionItems`, in this order: Change time, Move to another meal, Move
  to another day, Copy to another meal, Copy to another day, Delete. The bar's dialog, a food's ⋯ menu, a
  logged meal's ⋯ menu and a meal's ⋯ menu all draw it, so the four never drift apart again. A food's menu
  keeps "Select" first; a logged meal's keeps "View meal" first and "Select" after it; a meal's keeps
  "Coach breakdown" and "Macro split" first and "Save as a meal" last.
- **Copy to another meal** asks which meal ("Copy 2 foods to"), the food's own meal left out when every
  chosen food is in one meal, and logs fresh copies at that meal on the day shown, as a copy to another day
  does (MM-633): new entries, no time eaten, a logged meal copied as a new meal (MM-587). It says "Copied
  2 foods to dinner" with Undo, which takes every copy back. A copy that cannot be saved copies nothing
  and says so.
- **A food's own actions go through the same code** as the chosen foods' (`changeTogether`), with the food
  as the subject: "Moved Salmon to dinner", "Salmon at 6:30 PM". Its Delete stays what it was (MM-48),
  which says the same words. A logged meal's row does the same for all its foods, named by the meal.
- **Only the field chosen changes.** Amounts, numbers and where they came from never do.

## Description
On the Food screen, every food's ⋯ menu offers the same changes the chosen foods' dialog does, and both,
with a meal's menu, can copy foods to another meal of the same day.

## Acceptance Criteria
```gherkin
Scenario: The same items on one food and on the chosen foods
  Given dinner holds salmon
  When salmon's ⋯ menu is opened
  Then after "Select" it offers Change time, Move to another meal, Move to another day, Copy to another meal, Copy to another day and Delete
  And the dialog for the chosen foods offers the same six, in the same order

Scenario: One food moved from its menu
  Given dinner holds salmon
  When "Move to another meal" is chosen from salmon's menu and Lunch picked
  Then salmon is in lunch, and nothing else about it changed

Scenario: One food copied to another meal
  Given dinner holds salmon at 7:00 PM
  When "Copy to another meal" is chosen from salmon's menu and Breakfast picked
  Then breakfast holds a second salmon with no time eaten, dinner's is untouched
  And Undo takes the copy away

Scenario: Chosen foods copied to another meal
  Given dinner holds salmon and rice, and the snack an apple
  When salmon and the apple are chosen and "Copy to another meal" takes them to Lunch
  Then lunch holds a salmon and an apple as well, and the originals are as they were
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: FoodEntryMenu). A food's ⋯ menu open
  on all its items, at 360 px (Story: FoodEntryMenuSmallPhone).

## Notes
- Built in `togetherActionItems` (the one list), `changeTogether` (`copyMeal`), `MealSection`,
  `LoggedMealRow`, `SelectionBar`.
- Tests: `test/food/foodMenuChangesOne.test.tsx` (the food's menu and the copy), `test/food/chooseFoodsToChange.test.tsx`
  (the chosen foods copied to another meal).
