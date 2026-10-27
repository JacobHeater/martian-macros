---
id: MM-640
status: done
component: food-logging
related: [MM-634]
---

# Bug: choosing foods, the count changed on screen but was not said

## Context
The UX guard's review of MM-634 (2026-10-26), a follow-up recorded in that ticket: when a box is ticked, the
bar's "2 foods chosen" changes but a screen reader is not told. Someone who cannot see the bar cannot tell
how many foods the next action will change. WCAG 4.1.3 (status messages) asks for it.

## Description
The bar says its count in a polite status as it changes: "1 food chosen", "2 foods chosen", "No foods chosen".

## Acceptance Criteria
```gherkin
Scenario: The count is said
  Given foods are being chosen
  When a second food's box is ticked
  Then "2 foods chosen" is in a status that is announced
```

## Notes
- Fixed in `SelectionBar`. Regression test: the MM-634 time test in `test/food/chooseFoodsToChange.test.tsx`
  checks the status.
