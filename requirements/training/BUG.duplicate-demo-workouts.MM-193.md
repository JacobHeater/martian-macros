---
id: MM-193
status: done
component: training
related: [MM-77]
---

# Bug: Demo workouts repeated for each nutrition day

The new training seed was inside the daily nutrition loop and wrote 1,065
sessions instead of 15. Move it outside that loop. No normal store is seeded.
The unusable lift also used a nonexistent library ID; use the canonical
dumbbell lateral raise ID so it appears in all histories.

## Acceptance Criteria
```gherkin
Scenario: Deterministic training seed
  When the isolated demo is seeded or reseeded
  Then exactly 15 finished workouts span fourteen weeks
  And every training date occurs once
  And all five seeded exercises are found in the library
```

## Regression
Both fixture and SQLite "synthetic histories reset" tests in
`demo_seed_test.dart` failed with 1,065 rather than 15 workouts before the fix.
