---
id: MM-328
status: done
component: food-logging
related: [MM-326]
---

# Bug: changing the day moved the water bar as if water had been added

## Context
Found by the panel's UX guard reviewing MM-326's water bar (UX-2, `docs/agent-runs/mm326-water-bar/`).
The Water section is kept when the day changes, so the bar moved from the old day's level to the new
day's with the motion that means "water was added", and while the new day's drinks loaded it could drain
toward empty and pour back. Motion should explain a change of state; this one suggested a change that did
not happen.

## Description
The bar belongs to its day: a new day's bar is drawn anew and fills from empty, as when it first appears,
and it is drawn only once that day's drinks have loaded (an empty track until then).

## Acceptance Criteria
```gherkin
Scenario: Another day
  Given today's water at half its goal and yesterday's at the goal
  When the previous day is shown
  Then the water bar is drawn anew and fills to full, never moving from half
```

## Notes
Guarded by "changing the day draws the bar anew for that day" in
`apps/mobile/test/food/waterAndMicros.test.tsx`, which failed before the fix.
