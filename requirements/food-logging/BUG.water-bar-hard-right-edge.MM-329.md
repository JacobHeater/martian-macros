---
id: MM-329
status: proposed
component: food-logging
related: [MM-326]
---

# Bug: the water bar shows a hard right edge while it pours

## Context
Found by the owner (2026-10-15) watching the water bar of MM-326 pour: "it has a hard right edge that is
noticeable when the animation plays". Small; the bar is right once it settles.

## Description
While the bar fills, its front end stays the round end of a liquid, with nothing square or sharp at the
edge. Suspected cause, not yet confirmed: the ripple band (`.mm-progress-wave` and its `::before`) is not
clipped to the fill's rounded end, so it ends square across it while the level moves.

## Acceptance Criteria
```gherkin
Scenario: A round front while pouring
  Given the water bar on Food
  When a glass is added and the bar pours
  Then its front end is round in every frame, in all three palettes
```

## Notes
Guarded by "MM-329: the ripple is clipped to the fill's round end" in
`apps/mobile/test/ui/waterBarEdge.test.ts`, skipped with this ticket's ID until the fix lands. Confirm the
cause with frames captured over the DevTools protocol before fixing (the headless `--screenshot` flag shows
only the settled bar).
