---
id: MM-595
status: in-progress
component: food-logging
related: [MM-586, MM-596]
---

# Story: Each food of an analysed meal carries a usual portion of it

## Context
The product owner, 2026-10-22: the foods the app gathers from AI meal analysis (MM-586) should be reusable,
so the prompt and the format must require, for each food, a reasonable portion of it on its own, not only the
amount eaten in that meal. Logged again from the log (MM-596), 25 g of katsu sauce is not a serving; 2 tbsp is.

## Decisions
Made with the product owner (2026-10-22):
- **Every item must carry `usual_portion`**: `{ "description": "1 tbsp", "grams": 15 }`, one reasonable serving
  of the food on its own, whatever was eaten of it. The prompt says so, with examples.

Choices I made without asking (say if any is wrong):
- **An item without one is a problem** in the review, said on the item, as a missing number is, and can be
  fixed in the app ("Usual portion" and "Its grams" in the food's editor) or by the assistant.
- **A food added or changed by hand with none given** takes the amount eaten as its usual portion.
- **Kept as the food's serving** with its numbers per 100 g, so no schema change: logged again from the log,
  it opens as one serving of its usual portion ("Label serving", 1 × "1 cup", 158 g), the number of servings
  changeable.

## Acceptance Criteria
```gherkin
Scenario: Required
  Then the prompt requires a usual portion for every item, apart from the grams eaten

Scenario: Missing
  Given an answer whose item has no usual portion
  Then the item says it is missing its usual portion, and the meal cannot be logged until it has one

Scenario: Logged again as a usual portion
  Given white rice logged in a meal at 186 g, with a usual portion of 1 cup, 158 g
  When it is found in the log and pressed
  Then it opens as 1 serving of 158 g, with its numbers for 158 g
```

## Notes
- Tests: `test/domain/mealAnalysis.test.ts` (MM-595 cases), `test/food/searchTheLog.test.tsx`.
