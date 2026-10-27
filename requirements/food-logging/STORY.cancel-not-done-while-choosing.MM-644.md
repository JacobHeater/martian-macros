---
id: MM-644
status: done
component: food-logging
related: [MM-634]
---

# Story: the choosing bar's way out says "Cancel"

## Context
The UX guard's review of MM-634 (UX-4): the bar's "Done" may read as applying something, though it changes
nothing. The owner decided on 2026-10-26: "Select" stays in the menus, and "Done" becomes "Cancel".

## Acceptance Criteria
```gherkin
Scenario: Cancel
  Given foods are being chosen
  When "Cancel" is pressed
  Then nothing changed, and choosing ends with focus back on the row it started from
```

## Notes
- Built in `SelectionBar`. Tests: `test/food/chooseFoodsToChange.test.tsx`.
