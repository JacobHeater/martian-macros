---
id: MM-634
status: done
component: food-logging
related: [MM-48, MM-570, MM-587, MM-625, MM-630, MM-633]
---

# Story: choose some foods of a day and change them together

## Context
The owner wants contextual fields changed across several foods at once, time above all (2026-10-26).
MM-630 does it for every food of one meal from that meal's menu. This is the rest of it, from the
food-logging review (`docs/food-logging-plan.md`, F-18, increment C3): some foods, from any meals of the
day, changed in one action.

## Decisions
From the owner (2026-10-26, D-4): a food moved to another day keeps its time eaten.

Choices made without asking (say if any is wrong):
- **"Select"** in a food's ⋯ menu, or a logged meal's, starts choosing with that one ticked. Choosing does
  not start on a long press: that is easy to miss and collides with swiping a food away.
- **While choosing**, each row of the day is a box to tick (the design system's check row, MM-266), with
  the food's name and calories. A logged meal is one box and stands for all its foods (MM-587). Choosing
  only some foods of a meal is not offered. The meals' own actions (add, copy, menu) step aside, and
  swiping does not delete.
- **A bar at the foot of the list**, kept in view as it scrolls, says how many foods are chosen. Its one
  action, "Change 2 foods", asks what to do: change time, move to another meal, move to another day, copy
  to another day, or delete. "Done" stops choosing. The bar is a meal's card, as the meals are.
- **Only the field chosen changes**, in one step (MM-625), with Undo. A time opens on the foods' own time
  when they share one, and says "(now mixed)" when they do not. Deleting takes them all, and Undo puts
  them all back (meals as the same meals).
- **After an action, choosing ends.** Showing another day ends it too.
- **It is the same code as MM-630's**, so a meal's menu and a choice say things the same way.
- **Focus and what is said** (the UX guard's UX-1): when choosing starts, the box it started from holds
  the focus and "Choosing: tick the foods to change together" is said. When it ends, focus is back on the
  row it started from. The bar stays clear of a snack (MM-302, the designer's PD-1).
- Follow-ups noted, not built: the bar's count spoken as it changes; focus when the row it started from
  was deleted or moved away; the bar's height at 200% text (UX-2); "Done" and "Select" may be worded
  better (UX-4, UX-6, owner's call).

## Description
On the Food screen, foods can be chosen, from one meal or several, and their time eaten, meal or day
changed together. They can also be copied to another day or deleted together, all with Undo.

## Acceptance Criteria
```gherkin
Scenario: One time for some foods
  Given dinner holds salmon, rice and salad, and the snack an apple
  When salmon is selected from its menu, the apple ticked, and "Change time" chosen for 6:30 PM
  Then salmon and the apple are eaten at 6:30 PM, the apple is still a snack, and rice and salad are as they were

Scenario: A logged meal counts as its foods
  Given lunch holds "Chicken and rice", three foods
  When it is selected and moved to dinner
  Then all three foods are in dinner

Scenario: Deleted together, back together
  When rice and salad are chosen and deleted
  Then both are gone, and Undo puts both back

Scenario: Done
  When choosing is ended with Done
  Then nothing changed, the rows are as before, and the row it started from has the focus
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: FoodChoosing). Rows as boxes, the bar at
  the foot.

## Notes
- Built in `FoodScreen` (what is chosen), `MealSection` and `LoggedMealRow` (rows and "Select"),
  `SelectionBar`, and `changeTogether` (shared with MM-630's meal menu).
- Tests: `test/food/chooseFoodsToChange.test.tsx`.
