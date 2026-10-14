---
id: MM-319
status: done
component: food-logging
related: [MM-313, MM-318]
---

# Bug: water added to a past day showed today's clock time on that day

## Context
Found by the panel's UX guard reviewing MM-318 (UX-1, `docs/agent-runs/mm318-water-section/`). A drink is
stamped with the moment it is logged. Added to yesterday at 3:12 PM today, yesterday's list said "3:12 PM",
which reads as when it was drunk.

## Description
A drink logged on its own day shows its time; one logged on another day says "Added later". The stored
moment stays the true moment of logging. Its "More actions" and "Edit" are heard with the same words, so
repeated amounts are told apart.

## Acceptance Criteria
```gherkin
Scenario: Added to yesterday
  Given a drink logged yesterday at 8:00 AM
  When a glass is added to yesterday today
  Then yesterday's rows say "8:00 AM" and "Added later", and no time from today
  And their actions are heard as "… at 8:00 AM" and "…, added later"
```

## Notes
Regression test: "a drink added to yesterday shows no time from today, and its actions are told apart" in
`test/food/waterAndMicros.test.tsx`; it failed before the fix and passes after.
