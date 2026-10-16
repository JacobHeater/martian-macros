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

## Second cause (found with MM-318)
When "Other amount" moved into the Add water sheet, focus still fell to the document: `NumberEntry` blurred
whatever was focused after a save, and by then the sheet had closed and put focus back on the section's
"+". It now lets go only of focus inside itself.

## Notes
Regression test: "after another amount is saved, focus is back on Add water" in
`test/food/waterAndMicros.test.tsx` (it was "…on Other amount" before MM-318 moved the field into a sheet);
each version failed before its fix and passes after.
