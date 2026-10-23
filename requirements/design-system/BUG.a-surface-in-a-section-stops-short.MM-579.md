---
id: MM-579
status: done
component: design-system
related: [MM-344, MM-578, MM-155]
---

# Bug: a surface in a section stops short of the column's edge

## Context
Found by the owner on a phone (2026-10-22), on Progress with no waist measured: the "Waist over time" surface under
"Today's waist" ended about 36 px short of the right edge, so the two stacked boxes had different widths. It was there
before MM-578 for any surface placed directly in a section (the waist chart once measured too); MM-578's empty waist
chart made it plain.

The cause: a list group or surface in a section is pulled left under the section's icon (MM-344) by a negative margin.
A list group has no width of its own and fills the row; `.mm-surface` sets `width: 100%`, which is the indented
body's width, so the surface moved left but did not grow.

## Description
A list group, a surface or a failed read's notice directly in a section runs the column's full width, edge to edge,
whatever its own width rule.

## Acceptance Criteria
```gherkin
Scenario: Stacked boxes in a section are one width
  Given the Waist section open with no measurement
  Then "Today's waist" and "Waist over time" start and end at the same edges
```

## Notes
- Fix: `width: auto` on the section's full-width rule in `ui.css`.
- Test: `test/ui/surfaceInSection.test.ts` (the rule sets both the pull and `width: auto`; a layout engine is not
  available under the tests, so the stylesheet is what is checked).
- Not run locally; CI validates. Not yet seen on a phone.
