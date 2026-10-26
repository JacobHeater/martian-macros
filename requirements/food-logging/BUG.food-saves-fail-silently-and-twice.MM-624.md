---
id: MM-624
status: proposed
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
- Regression tests (skipped with this ID until fixed): `apps/mobile/test/food/foodSaveFailures.test.tsx`.
- Food plus fat in one write depends on MM-625's all-or-nothing writer, or a rollback like `logMeal`'s.
- A single food's delete shows "Removed" and Undo before the delete is known to have worked
  (`MealSection.remove`); it is a hypothesis in the plan (H-03), not part of this bug.
