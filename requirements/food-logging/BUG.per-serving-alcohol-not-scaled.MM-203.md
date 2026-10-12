---
id: MM-203
status: in-progress
component: food-logging
related: [MM-167, MM-201]
---

# Bug: Per-serving alcohol grams are not scaled with consumed energy

## Context
The food feature audit found that the per-serving basis scales energy/macros
but saves typed alcohol grams without scaling. No clinical claim is needed
to establish this internal arithmetic mismatch.

## Description
Scale alcohol consistently with consumed servings and retain reference
semantics on subsequent edits. Fixed alongside the simple-serving entry
change MM-226, which makes serving scaling the default.

## Acceptance Criteria
```gherkin
Scenario: Alcohol and energy share the consumed quantity
  Given a reference serving contains 14 g alcohol and 10 g carbohydrate
  When two servings are logged with calories derived from those values
  Then consumed energy is 276 kcal
  And consumed alcohol is 28 g
```

## Notes
Guard: `MM-203 per-serving alcohol scales with consumed calories` in
food_portion_test. Now enabled alongside MM-226.
The guard ran and failed at the intended assertion: energy was 276 kcal,
but consumed alcohol was 14 rather than 28 g. Initial test setup forgot the
optional alcohol toggle; corrected setup then reproduced the real defect.
