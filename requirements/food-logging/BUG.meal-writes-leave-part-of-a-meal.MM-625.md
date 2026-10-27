---
id: MM-625
status: done
component: food-logging
related: [MM-47, MM-587, MM-591]
---

# Bug: logging a meal again, copying a slot and deleting a meal can leave part of it

## Context
Found on 2026-10-26 by source inspection in the food-logging review (`docs/food-logging-plan.md`, F-05),
by the architecture and QA reviewers. The regression tests below are written to fail on main at f5a08b4.

**Seen by the owner the same day:** deleting a meal removes its foods one row at a time, visibly, where
it should go at once ("a pathetic user experience"). The cause is the same loop: each `deleteFood` is its
own transaction that re-notifies every food watcher, so the Food screen redraws once per food, and
`MirroredFoodLog` awaits the health platform's delete before the loop reaches the next food, so the
rows go at the platform's pace.

`FoodEntryWriter` writes one entry per call, each in its own transaction. Logging an analysed meal
removes what it wrote when a food fails (MM-591), but:

- `relogMeal` (a recent meal logged again) adds its foods one at a time with no cleanup;
- `copyEntries` ("Copy <meal> to today", "Copy yesterday") does the same, called as `void`;
- `removeMeal` deletes one food at a time and offers Undo only after every delete has worked, so a
  failure part way loses the foods already deleted, with no Undo and nothing said;
- `ViewMealSheet.updateAll` (rename, move to a slot or a day) can leave one meal's foods in two slots
  or on two days, where the meal then shows as two rows.

## Description
Every write of several foods is all or nothing and lands at once: logging a meal again, copying a slot
or a day, deleting a meal and its Undo, and changing a meal's name, slot or day. The log changes in one
step, so the screen redraws once and a meal disappears, appears or moves whole, never food by food. The
health platform is told afterwards, without holding up the screen. A write that fails leaves the log as
it was and is said where it was asked for.

## Acceptance Criteria
```gherkin
Scenario: A meal logged again fails part way
  Given a three-food meal
  When it is logged again and the second food's write fails
  Then none of it is logged, and the failure is thrown on to be said

Scenario: A slot copied to today fails part way
  Given yesterday's dinner has three foods
  When it is copied to today and the third food's write fails
  Then nothing is copied

Scenario: A meal that cannot be deleted whole
  Given a three-food meal
  When it is deleted and the second food's delete fails
  Then all three foods are still logged

Scenario: A meal is deleted at once
  Given a three-food meal on the Food screen
  When it is deleted
  Then the day's foods change once, from three foods to none, never through two or one

Scenario: The health platform does not hold up the screen
  Given writing to the health platform is slow
  When a meal is deleted
  Then it is gone from the Food screen before the platform has answered
```

## Decisions
Choices made without asking (say if any is wrong):
- The architecture review's direction: a narrow, consumer-owned batch writer (all changes in one
  transaction, one notification), with the health-platform mirror told after the commit, one record at
  a time, as today. No new table and no schema change.

## Notes
- Fixed 2026-10-26: `FoodEntryBatchWriter.applyFoodChanges` (in `FoodRepository`) adds, updates and
  deletes in one transaction with one notice to the watchers; an update or delete of a food no longer in
  the log fails the batch. `relogMeal`, `copyEntries`, `removeMeal` and its Undo, and View meal's
  rename and moves use it. `MirroredFoodLog` tells the health platform after the commit, in the
  background, so the screen never waits on it. `logMeal` keeps its own rollback (MM-591) for now.
- Regression tests: `apps/mobile/test/food/mealWritesAllOrNothing.test.ts`; the contract cases "MM-625"
  in `test/contracts/foodRepositoryContract.ts`; the mirror's in `test/healthWrite/mirroredLogs.test.ts`.
- MM-624's food-plus-fat write and the plan's bulk edits build on the same writer.
