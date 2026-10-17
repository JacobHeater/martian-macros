---
id: MM-360
status: done
component: food-logging
related: [MM-358, MM-202]
---

# Bug: the suggested water goal made Food work out the coach on every change

## Context
Found by `mm check` on 2026-10-16 while building MM-358: "editing a saved food does not rewrite what was logged"
(`apps/mobile/test/food/customFoods.test.tsx`) timed out at 20 seconds in two full runs in a row. Alone, it took
about 8 seconds on this branch and on main alike, and earlier full runs that day had passed. That pointed at the
branch, not the test. The new water-goal cell read the coach's trend weight. Because cells are worked out only
while something watches them, the Water section on Food now kept the coach watched, the app's costliest
computation, and it was worked out again on every food change. Under a full run's load that pushed the test past
its limit.

## Description
The water goal is worked out from the latest weigh-in, which costs nothing, and never makes the coach be watched.

## Acceptance Criteria
```gherkin
Scenario: The water goal is watched
  Given a person with a weigh-in
  When the water goal is watched, as the Water section watches it
  Then the coach is not watched
```

## Notes
Guarded by `apps/mobile/test/state/waterGoalCost.test.ts`, which fails with the trend weight read back in. The
saved-food test passes in the full run again.
