---
id: MM-208
status: done
component: dashboard
related: [MM-100, MM-176, MM-179]
---

# Bug: Dashboard Add food action obscures a chart label

## Context
A product-design audit found the Add food FAB overlapping the lower-right
macro-split chart label in the stored 360 × 800 logical-pixel Martian Dashboard
golden. An independent QA challenge confirmed the screenshot shows an actual
FAB/content overlap, not a chart overlay, and source layout is consistent with
it. Neither reviewer rendered the current build or ran tests; light/dark and
large-text behavior remain unverified.

## Description
Keep the Dashboard Add food action available without allowing it to cover
macro-chart labels or content.

## Acceptance Criteria
```gherkin
Scenario: Dashboard Add food does not obscure macro chart labels
  Given a populated Dashboard at the 360 by 800 logical-pixel reference size
  When its initial scroll position is rendered
  Then the Add food action does not overlap any macro-chart label
  And the Add food action remains available

Scenario: Dashboard chart labels remain visible with larger text
  Given a populated Dashboard with enlarged text
  When the user views and scrolls the Dashboard
  Then macro-chart labels remain reachable and are not obscured by Add food
```

## Notes
Regression guard: widget-geometry assertions in
`apps/mobile/test/dashboard_test.dart`.
Dashboard Add food is now a clearly labeled app-bar action instead of an
overlaying floating button. It remains one tap away; Food keeps its labeled
floating action. The Dashboard widget test verifies no overlap with all chart
labels at 360-by-800 logical pixels and checks reachability at 1.5x text scale.
The visual change was not inspected on an emulator or recorded in a golden.
