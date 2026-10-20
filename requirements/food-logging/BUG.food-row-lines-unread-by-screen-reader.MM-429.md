---
id: MM-429
status: done
component: food-logging
related: [MM-255, MM-48, MM-167, MM-49]
---

# Bug: A Food row's lines were not read by a screen reader

## Context
Since MM-255 a logged food's row is one press, "Edit {name}", around its tile (`MealSection.tsx`, `MmPressable`). The
press has an `aria-label`, and an accessible name given that way replaces the content (W3C accname 1.2, step 2D), so
a reader heard "Edit White rice, raw" and never the macros, the Full-detail extras, the portion line (MM-167) or the
calories. Found by the panel's UX-accessibility review (UX-8) of the 2026-10-20 change (`docs/agent-runs/ws08-m2-close/`),
which asked whether "200 g raw" reads correctly: for sight yes, for a reader it was never read.

## Description
The row's press is described by its lines, so a reader hears the name, then the macros, the extras and the portion
line, then the calories.

## Acceptance Criteria
```gherkin
Scenario: The row is described by its lines
  Given a logged food "Lentils" with 18 g protein, weighed, amount not recorded
  When its row is read
  Then the press "Edit Lentils" is described by "P 18 · C 24 · F 1" and "Weighed · amount not recorded"
```

## Notes
Fixed in the same change: the tile's text carries an id (`foodEntryLinesId`) and `MealSection` passes it as the press's
`describedBy` (`MmPressable` already took one). Regression test: `test/food/detailLevel.test.tsx`, "MM-429: the row is
described by its lines for a screen reader". Not changed: the method icon's `role="img"` name is read as part of the
content only where content is the name; it stays a visual cue beside the method word in the portion line.
