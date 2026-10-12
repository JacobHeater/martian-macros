---
id: MM-216
status: done
component: food-logging
related: [MM-167, MM-212]
---

# Bug: Changing how a food was measured clears the amount without saying so

## Context
Found on 2026-10-11 by the walkthrough review of the Add food sheet (MM-212,
run `docs/agent-runs/mm212-add-food-walkthrough/`, noted by the product
designer as an edge case), and confirmed by a test.

## Description
MM-167 section 5: "Changing the method clears the quantity and unit, and the
form says so ('Enter how much again')." The sheet clears the amount
(`apps/mobile/lib/src/food/add_food_sheet_state.dart`, `_selectMethod`) and
says nothing. The words do not appear anywhere in the app. A person who typed
an amount and then corrects the method finds an empty field, or does not
notice it, and "Log it" is off with no reason shown.

Expected: the form says the amount has to be entered again, as MM-167 asks.

## Acceptance Criteria
```gherkin
Scenario: Changing the method
  Given the Add food sheet with an amount typed
  When another way of measuring is chosen
  Then the amount is cleared
  And the form says to enter how much again
```

## Resolution
When a method change clears an amount that was entered or restored from an
existing entry, the amount field says to enter it again. Choosing the already
selected method does not clear the amount.

## UI/UX Assets
- [Add food sheet](../ui-ux-assets/views/add-food.html) — Current. Shows the
  amount-field instruction after changing the measurement method.

## Notes
- Regression: `apps/mobile/test/add_food_method_change_test.dart`, enabled for
  a user-entered amount that is cleared by a method change.
