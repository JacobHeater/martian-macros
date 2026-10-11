---
id: MM-202
status: in-progress
component: food-logging
related: [MM-167, MM-201]
---

# Bug: An unchanged food edit rounds stored quantity and totals

## Context
The bounded panel audit found quantityText rounds an edit seed to two decimals,
and typed/legacy nutrition seeds round to one. Saving reparses these fields.
MM-167 requires unchanged saves to preserve consumed totals.

## Description
Preserve recorded precision on an unchanged edit, including fractional
calculated servings and typed/legacy totals. Application fix is deferred:
PR #79 is tooling only.

## Acceptance Criteria
```gherkin
Scenario: A fractional calculated entry survives an unchanged edit
  Given one third serving at 300 kcal per serving is logged as 100 kcal
  When the entry is opened and saved without changing its quantity
  Then its stored quantity and consumed totals are unchanged

Scenario: Typed totals survive an unchanged edit
  Given a legacy entry has fractional recorded nutrition
  When it is opened and saved without changing nutrition
  Then the recorded totals retain their precision
```

## Notes
Guard: `MM-202 unchanged fractional calculated edit preserves nutrition` and
`MM-202 unchanged legacy edit preserves recorded totals` in food_portion_test.
Tests are skipped with this ID until the separately scoped application fix.
Both widget guards ran before skipping and failed at the intended assertions:
100 kcal became 99; legacy 100.123 became 100.1. Source inspection plus
synthetic widget reproduction, not an emulator or production-data test.
