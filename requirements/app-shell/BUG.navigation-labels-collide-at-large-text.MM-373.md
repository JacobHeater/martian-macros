---
id: MM-373
status: done
component: app-shell
related: [MM-91, MM-106, MM-361]
---

# Bug: The navigation bar's labels run together at 200% text

## Context
Found at the design review of coaching insights (`docs/agent-runs/mm361-coaching-insights/`, the UX guard's UX-10), in
the first stories ever drawn at 200% text (`Designs/Coaching insights › FoodLargeText`, `FoodMealGradeWhyLargeText`).
The coaching insights did not cause it. The navigation bar's five labels ("Dashboard", "Food", "Train", "Progress",
"Coach") share the width equally (`.mm-nav-destination` in `ui.css`) and have no rule for text that does not fit. At
200% text they run into each other ("Train Progress Coach"), and "Dashboard" is cut at the left edge. MM-91, which checks
large text on every screen, has not been done.

## Description
At 200% text on a 412 px phone, each label is readable and stays inside its own destination.

## Acceptance Criteria
```gherkin
Scenario: Large text
  Given the phone's text at 200% on a 412 px screen
  When any screen with the navigation bar is shown
  Then every destination's label is inside its own destination, with none touching the next or cut by the screen's edge
```

## Notes
- Regression test: `apps/mobile/test/app/largeTextLayout.test.ts`, skipped with this ticket's ID until the fix lands.
  Layout cannot be measured in the test's document, so the test is the place the browser check will go. Until then the
  guard is the 200% stories, looked at in the three palettes.
- Not fixed in the design pass for MM-361: it changes every screen and belongs with MM-91.

## Fix (2026-10-19)
Each label is its own `.mm-nav-label`: full width of its destination, wrapping and breaking a word if it must (`overflow-wrap: anywhere`, `hyphens: auto`), centred, on a destination with `min-width: 0`. The test's document lays out nothing, so `apps/mobile/test/app/largeTextLayout.test.ts` reads the rules that make the layout hold; the 200% stories remain the check by eye (MM-91).
