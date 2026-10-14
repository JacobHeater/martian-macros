---
id: MM-316
status: done
component: food-logging
related: [MM-310, MM-305]
---

# Bug: the Micros picture said "Nothing logged yet today." on a past day

## Context
Found by the panel's product-designer (PD-8) and UX guard (UX-9) reviewing MM-310 before it shipped
(`docs/agent-runs/mm305-water-micros/`). With nothing logged, the Micros picture always said "Nothing
logged yet today.", even when the Food screen showed another day, and repeated the screen's own line
("Nothing logged yet. Start with breakfast.") in the same viewport.

## Description
With nothing logged on the day shown, the Micros picture draws nothing; the screen's own line says it.

## Acceptance Criteria
```gherkin
Scenario: A past day with nothing logged
  Given Full detail with Micros chosen
  When the Food screen shows yesterday, with nothing logged
  Then nothing on the screen says "today."
```

## Notes
Regression test: "a past day with nothing logged never says "today" in the Micros picture" in
`test/food/waterAndMicros.test.tsx`; it failed with the old line and passes with the fix.
