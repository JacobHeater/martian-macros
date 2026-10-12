---
id: MM-204
status: in-progress
component: food-logging
related: [MM-167, MM-169, MM-201, MM-203]
---

# Bug: Converting a calculated entry to typed totals drops alcohol

## Context
Independent QA audit found that Enter the totals myself copies calculated
energy/macros but omits alcohol. Save writes null alcohol at unchanged energy.
This is distinct from per-serving scaling MM-203.

## Description
Preserve consumed alcohol when converting an existing calculated entry to
typed nutrition. Fixed alongside MM-226; serving entries expose Edit nutrition
per serving rather than a competing nutrition-basis choice.

## Acceptance Criteria
```gherkin
Scenario: Converting the nutrition basis preserves consumed alcohol
  Given a calculated serving entry records 14 g alcohol and 138 kcal
  When Edit nutrition per serving is selected and the entry is saved unchanged
  Then consumed alcohol remains 14 g
  And consumed energy remains 138 kcal
```

## Notes
Guard: `MM-204 converting calculated entry to totals preserves alcohol` in
food_portion_test. Now enabled alongside MM-226.
Owner ran the guard before skipping: energy remained 138 kcal but alcohol
became null instead of 14 g. Synthetic widget reproduction, no device claim.
