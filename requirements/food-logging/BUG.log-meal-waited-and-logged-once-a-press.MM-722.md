---
id: MM-722
status: in-progress
component: food-logging
related: [MM-586, MM-591, MM-624, MM-625, MM-721]
---

# Bug: "Log meal" waited behind the health import, and every press logged the meal again

## Context
Found by the product owner on their Pixel on 2026-11-03, in AI meal analysis (MM-586) with no photos: the
assistant's answer pasted, "Log meal" pressed, and the sheet stayed where it was. Pressed again, several times;
the sheet was closed by hand. By the end of the day the log held the meal over and over, more than 5,000 kcal,
entries still appearing, and none of them could be deleted while that went on. The app had to be force-closed.
After it, the same answer pasted again and logged, the sheet closed by hand, and all was well.

Read from the code, not yet from the phone. `logMeal` wrote the meal one food at a time through `addFood`,
and each write took its turn on the one database queue, which a transaction holds until it ends. On the
owner's Pixel the health import's transaction held it: the build on the phone predates MM-721 and writes the
imported samples one `INSERT` a bridge call, some twenty minutes after an open, every open (MM-721). So each
food of the meal, and every delete, waited behind it. Nothing said so: "Log meal" dropped the promise of
its work, so the button was never busy, and every press queued the meal again. When the import's transaction
ended, every queued meal was written at once, and the deletes after them. The second attempt waited the same
way, once; the owner closed the sheet before the write landed, and it landed.

Two defects of the app's own, whatever the build on the phone:
- a meal logged food by food, each food waiting its turn and then on the health platform's write, against the
  rule of MM-625 (the log never waits on the platform food by food, and a meal goes whole);
- "Log meal" not pressed once (MM-624): a second press logged the meal again.

The import holding the queue for minutes is MM-721's, already batched on main and not yet on the owner's phone.

## Description
"Log meal" logs the meal in one write (`applyFoodChanges`, as a meal logged again or copied is, MM-625): all
or nothing, the health platform told afterwards without being waited for. The button is busy until the write
settles, and a second press does nothing (`MmButton`'s promise, MM-624). A failure is said as before (MM-591).

## Acceptance Criteria
```gherkin
Scenario: One write
  Given a clean answer under review
  When the person presses "Log meal"
  Then the meal's foods are written to the log in one step, never one at a time

Scenario: Pressed once
  Given the log is slow to write
  When the person presses "Log meal" twice before it is written
  Then the button is busy, the meal is logged once, the sheet closes, and "Logged …" is said

Scenario: A failure logs nothing
  Given the log refuses the write
  When the person presses "Log meal"
  Then the step says the meal could not be logged, and nothing is logged
```

## Notes
- Regression tests: `test/food/logMeal.test.ts` ("MM-722: a meal is logged in one write") and
  `test/food/analyzeMeal.test.tsx` ("MM-722: Log meal pressed again while the write is slow logs the meal
  once"). Stories unchanged: the review's Log meal is as drawn.
- Where: `apps/mobile/src/food/meal/logMeal.ts` (one `applyFoodChanges`), `AnalyzeMealStep.tsx` (the button
  takes the promise).
- Not changed: `MirroredFoodLog.addFood`, `updateFood` and `deleteFood` still wait on the platform for a single
  food; no screen logs a meal through them any more. The health import's `replace` still runs a kind in one
  transaction; after MM-721 that is hundreds of statements, not tens of thousands.
- Owed on the owner's Pixel, on a build of main: the same answer pasted and logged once, the sheet closing by
  itself; a meal deleted while a health import runs. Not run locally; CI validates.
