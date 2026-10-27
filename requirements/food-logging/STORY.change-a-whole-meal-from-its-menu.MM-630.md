---
id: MM-630
status: done
component: food-logging
related: [MM-48, MM-570, MM-587, MM-597, MM-625, MM-626]
---

# Story: a meal's ⋯ menu changes the time, meal or day of all its foods at once

## Context
The owner wants contextual fields changed across several foods, time above all (2026-10-26). The
food-logging review (`docs/food-logging-plan.md`, F-18, increment B4) found no way to do it: giving three
foods one time took about fifteen presses, one editor per food. The common case is "everything in this
meal", so this comes first, from the menu each meal already has. Selecting some foods comes later (the
plan's C3).

## Decisions
From the owner (2026-10-26, the plan's D-4): a food moved to another day keeps its time eaten.

Choices made without asking (say if any is wrong):
- **A meal's ⋯ menu** (MM-597, until now "Macro split" alone) adds "Change time", "Move to another meal"
  and "Move to another day". Each applies to every food in that meal on that day, including a logged
  meal's foods (MM-587). The menu shows only when the meal has foods, as before.
- **Only the field chosen changes.** Amounts, numbers, where they came from and their grades never do.
- **The clock opens on the meal's time** when every food has the same one. If the times differ, or there
  are none, it opens on the meal's usual time and says "(now mixed)" when they differ.
- **The day** is chosen from the past year up to today. Choosing the same day changes nothing.
- **One step, with Undo.** The foods change together through the all-or-nothing batch (MM-625). A snack
  says what was done ("Dinner at 6:30 PM, all 3 foods", "Moved dinner to lunch") and Undo puts every food
  back as it was. A change that cannot be saved changes nothing and says so.

## Description
Each meal on the Food screen can change the time eaten, the meal or the day of all its foods in one
action from its ⋯ menu, with Undo.

## Acceptance Criteria
```gherkin
Scenario: One time for the whole meal
  Given dinner holds three foods with different times, one of them a logged meal
  When "Change time" is chosen from dinner's menu and 6:30 PM is picked
  Then every food of dinner is eaten at 6:30 PM, and nothing else about them changed
  And Undo puts each time back

Scenario: Moved to another meal
  Given lunch holds two foods
  When "Move to another meal" is chosen and Dinner picked
  Then both are in dinner, at their own times

Scenario: Moved to another day
  Given dinner holds two foods logged today at 7:00 PM
  When "Move to another day" is chosen and yesterday picked
  Then both are in yesterday's dinner at 7:00 PM
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: FoodMealMenu). The meal's ⋯ menu open
  on its four actions.

## Notes
- Built in `MealSection` (`changeAll`, `slotAction`). Tests: `test/food/changeAWholeMeal.test.tsx`.
