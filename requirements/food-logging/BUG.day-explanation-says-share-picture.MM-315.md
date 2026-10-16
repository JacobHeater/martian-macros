---
id: MM-315
status: done
component: food-logging
related: [MM-290, MM-255, MM-108]
---

# Bug: the Food screen's explanation calls the split "the share picture"

## Context
MM-290 renamed the hero's switch "Grams | Split": the macro picture is the split, never a "share". Found in
passing while building MM-305 (2026-10-14): the Food screen's "More about today" still said "The share picture
counts protein and carbs at 4 kcal a gram and fat at 9."

## Description
The sentence names the picture the way the switch does: "The Split picture counts protein and carbs at 4 kcal a
gram and fat at 9."

## Acceptance Criteria
```gherkin
Scenario: The explanation and the switch agree
  Given a day with food on the Food screen
  Then "More about today" says "The Split picture counts protein and carbs"
  And nothing on the screen says "share picture"
```

## Notes
Regression test: "the explanation under the day says Split, never share" in `test/food/mealCards.test.tsx`; it
failed before the fix and passes after.
