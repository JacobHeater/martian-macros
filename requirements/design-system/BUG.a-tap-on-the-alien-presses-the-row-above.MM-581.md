---
id: MM-581
status: done
component: design-system
related: [MM-577, MM-580, MM-558]
---

# Bug: a tap on the alien can press the row above it

## Context
Found by the owner on a phone in Martian (2026-10-22): tapping the alien sometimes pressed a control above it. On a page
longer than the screen, the ridge's auto top margin is nothing, so the ridge sits right under the last row; the alien's
tap area (8 px around its 28 × 26 px) reached about 2 px above the ridge's top edge, over that row.

## Decisions
- The owner: a bit more room above the alien, in Martian. 24 px of clear ground above the ridge, as a transparent top
  border so the ridge, the alien and the UFO keep their places inside it, and presses there go through to nothing.
  The ridge still meets the navigation bar, and a short page still pushes it to the bottom.

## Description
In Martian, the alien's tap area stays at least 16 px below the content above the ridge, on any page.

## Acceptance Criteria
```gherkin
Scenario: The alien and the last row do not overlap
  Given a Martian page longer than the screen, scrolled to its end
  When the alien is tapped
  Then only the alien takes the tap
```

## Notes
- Test: `test/ui/martianRidge.test.tsx` ("MM-581: clear ground above the ridge…"), from the stylesheet's numbers, as a
  layout engine is not available under the tests.
- Not run locally; CI validates. Not yet seen on a phone.
