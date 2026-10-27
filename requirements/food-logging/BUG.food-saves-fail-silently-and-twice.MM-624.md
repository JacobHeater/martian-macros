---
id: MM-624
status: done
component: food-logging
related: [MM-152, MM-220, MM-591]
---

# Bug: a food that cannot be saved says nothing, a second press logs it twice, and its cooking fat can be lost

## Context
Found on 2026-10-26 by source inspection in the food-logging review (`docs/food-logging-plan.md`, F-04),
by the chair and the QA and UX reviewers. Not reproduced at runtime; the regression tests below are
written to fail on main at f5a08b4.

- `MmButton` has no pending state, and no shared guard was found: it is off only when `onPress` is
  undefined. `AddFoodSheet.save`, `FoodAmountStep.log`, `EstimateMealStep.log`, `AddFoodSheet.logAgain`
  and `ViewMealSheet`'s writes run as `void` promises with no catch, and nothing under `src/` listens
  for an unhandled rejection. A failed write leaves the sheet open with nothing said; a second press
  while a write is in flight (the SQLite write, then the awaited health-platform mirror) writes again.
- `FoodAmountStep.log` writes the food, then the usual-fat preference, then the fat as its own entry,
  each on its own. If the preference or the fat fails, the food is already logged, the sheet stays
  open with nothing said, and pressing "Log it" again logs the food a second time.
- Only AI meal analysis says its failure and logs all or nothing (MM-591).

## Description
Every food sheet's save is pressed once: while it runs, the action cannot start it again. A save that
fails says so in the sheet, as MM-591's does, keeps what was entered, and logs nothing; pressing again
then logs it once. A food and the fat it was cooked in are logged together or not at all, and the
usual fat being remembered never decides whether the fat is logged.

## Acceptance Criteria
```gherkin
Scenario: A failed save is said
  Given the food log refuses a write
  When a typed food is logged
  Then the sheet says it could not be logged, keeps the form, and nothing is logged

Scenario: Pressed twice while saving
  Given the food log is slow to write
  When "Log it" is pressed twice before the first save finishes
  Then the food is logged once

Scenario: The fat cannot be written
  Given a cooked food with 1 tbsp of oil
  And the food log refuses the fat's write
  When "Log it" is pressed
  Then neither the food nor the fat is logged, and the sheet says so
```

## Decisions
Choices made without asking (say if any is wrong):
- The failure is said inline in the sheet, above its action, as MM-591's is, not as a snack: the form is
  still there to retry from.
- The pending state is the design system's (a shared `MmButton` behavior or a guard beside it), so every
  sheet gets it the same way; which of the two is the builder's call with the UX guard.

## Notes
- Fixed 2026-10-26:
  - `MmButton` presses an action that gives a promise once: until it settles a second press does nothing,
    and the button says it is busy (`aria-busy`) while keeping its focus, as a retry does (MM-183).
  - Add food's save, the amount step, Estimate and View meal say a failed write above their action, keep
    what was entered, and log nothing. A recent meal logged again says its failure in a snack (the row has
    no form to keep) and is logged once however often it is pressed.
  - The amount step logs the food and its fat in one batch (MM-625); remembering the usual fat comes after
    and can no longer stop the fat being logged.
- Regression tests: `apps/mobile/test/food/foodSaveFailures.test.tsx`. Stories: AddFoodLogFailed,
  EditFoodSaveFailed, AddFoodAmountLogFailed, AddFoodEstimateLogFailed, ViewMealChangeFailed.
- Not in this bug: a single food's delete shows "Removed" before the delete is known to have worked
  (`MealSection.remove`; the plan's H-03), and "Copy to today" gives no feedback (the plan's F-17, B3).
