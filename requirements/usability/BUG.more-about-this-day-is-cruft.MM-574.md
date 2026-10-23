---
id: MM-574
status: done
component: usability
related: [MM-389, MM-315, MM-562]
---

# Bug: "More about this day" is cruft

## Context
The owner (2026-10-22), at the foot of the Food screen: "how useless is this more about this day feature.
complete waste of space." The fold held two paragraphs: that partial days are left out of the metabolism
estimate, and how the Split picture counts calories. Neither is about the day; both explain the app's own
arithmetic, which is the cruft MM-389 took out elsewhere (`design/anti-cruft-and-anti-slop.md`: "if this
disappeared, would the user lose a useful action, meaning, safety or confidence?").

## Description
The fold is gone from the Food screen. What it said is not lost where it matters: a partial day already says
so where it is marked (the completeness row) and in the coach's lines (`insightText`), and the split is the
owner's own choice of picture.

## Acceptance Criteria
```gherkin
Scenario: No fold
  Given food is logged on a day
  Then the Food screen has no "More about this day" fold
```

## Progress
Removed from `FoodScreen`. Regression test: `test/food/emptyDayCruft.test.tsx`, "the Food screen has no
'More about this day' fold". Not run locally; CI validates.
