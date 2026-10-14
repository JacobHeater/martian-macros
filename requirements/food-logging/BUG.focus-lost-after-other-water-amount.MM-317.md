---
id: MM-317
status: done
component: food-logging
related: [MM-313, MM-305]
---

# Bug: focus was lost after another amount of water was saved

## Context
Found by the panel's UX guard on its re-review of MM-313 before it shipped (UX-12,
`docs/agent-runs/mm305-water-micros/`). Saving "Other amount" closes the field; the code meant to put focus
back on the "Other amount" button, but looked for it in the wrong container, so focus fell to the document
and a keyboard or screen-reader user lost their place.

## Description
After another amount is saved, focus is on the "Other amount" button.

## Acceptance Criteria
```gherkin
Scenario: Focus comes back
  Given the Food screen with Other amount open
  When 330 ml is typed and saved
  Then focus is on "Other amount of water"
```

## Notes
Regression test: "after another amount is saved, focus is back on Other amount" in
`test/food/waterAndMicros.test.tsx`; it failed before the fix and passes after.
