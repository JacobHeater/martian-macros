---
id: MM-329
status: done
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
Built 2026-10-21: the ripple band (`.mm-progress-wave` in `apps/mobile/src/ui/ui.css`) takes the fill's
round end (`border-radius: inherit`) and clips its `::before` to it (`overflow: hidden`), so the band can no
longer end square across the front while the level moves. Guarded by "MM-329: the ripple is clipped to the
fill's round end" in `apps/mobile/test/ui/waterBarEdge.test.ts`, now unskipped; its pattern read `\s` inside
a template string as a plain `s`, so it could not match a declaration after a line break, and it now
escapes it. Not run locally; CI validates.

Not verified: the cause was not confirmed with frames captured over the DevTools protocol (the owner's
rule is no local builds). Owed: watch a glass pour on the phone in all three palettes; if a square front
still shows, the next suspect is the fill itself during the width transition.
