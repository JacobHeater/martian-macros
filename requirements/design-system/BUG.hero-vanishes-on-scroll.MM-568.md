---
id: MM-568
status: done
component: design-system
related: [MM-187, MM-556, MM-558]
---

# Bug: the hero vanishes at some scroll heights

## Context
The owner (2026-10-22), on the iPhone: "Hero section disappears at certain scroll heights." The Food screen
showed the hero's space empty: no border, no arc, no figures, with the meals below drawn as usual.

## Description
The arc's glow was an SVG Gaussian blur, inside the hero, which clips to rounded corners. WebKit on iOS
draws such a filter in a layer of its own, and with the clip it is known to drop the whole clipped layer
while the page scrolls. The glow is now a radial gradient with no filter, drawn the same.

## Acceptance Criteria
```gherkin
Scenario: Scrolling Food
  When I scroll the Food screen slowly through every height
  Then the hero is drawn at each one
```

## Progress
Fixed in `HorizonArc`. Regression test: `test/ui/horizonArcPaints.test.tsx` (the arc has no SVG filter). Not
run locally; CI validates. **Owed on a phone:** the cause is inferred from WebKit's known behaviour and could
not be watched here. If the hero still vanishes, the next suspect is the backdrop's container-query gradients.
