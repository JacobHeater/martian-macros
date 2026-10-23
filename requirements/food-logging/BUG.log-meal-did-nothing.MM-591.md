---
id: MM-591
status: in-progress
component: food-logging
related: [MM-586, MM-587, MM-590]
---

# Bug: "Log meal" does nothing and says nothing

## Context
Found by the product owner on their iPhone on 2026-10-22, in a live run (MM-586): a clean meal under review,
"Log meal" pressed, and nothing happened, with no message. The meal's key came from `crypto.randomUUID`,
which exists only in a secure context, and a live run serves the app over plain http; the error it threw was
dropped by the button, so nothing was said.

## Description
The key is 128 random bits from `crypto.getRandomValues`, which every page has. A meal that cannot be
logged says so above "Log meal", keeps the review, and logs nothing: foods already written are removed.

## Acceptance Criteria
```gherkin
Scenario: Logged where randomUUID does not exist
  Given the app is served over plain http
  When the person presses "Log meal" on a clean review
  Then the meal is logged

Scenario: A failure is said
  Given the food log refuses a write
  When the person presses "Log meal"
  Then the step says the meal could not be logged, and nothing is logged
```

## Notes
- Regression tests: `test/food/logMeal.test.ts` (the MM-591 cases) and `test/food/analyzeMeal.test.tsx`
  ("MM-591: a meal that cannot be logged says so"). Story: AnalyzeMealLogFailed.
