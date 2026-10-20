---
id: MM-435
status: done
component: food-logging
related: [MM-58, MM-43, MM-337]
---

# Bug: two primary actions while the online lookup question is asked

## Description
On the scan step, when an unknown barcode brought up the online lookup question (MM-58), "Scan with the camera" stayed the
primary action, since the code was not yet recorded as unknown, while the question's own "Just for now" was primary too:
two Ember fills on one sheet, against rule 6 of `design/screen-direction.md` (one primary action in view). Found by the
panel's product-designer and UX-accessibility reviews on 2026-10-20 (`docs/agent-runs/mm58-online-lookup/`).

## Acceptance Criteria
```gherkin
Scenario: One primary action during the question
  Given an unknown barcode on a phone that can ask online, not yet allowed
  When the question is shown
  Then exactly one button on the sheet is primary, and it is the question's first answer

Scenario: One primary action during the lookup
  Given the lookup is under way
  Then the camera button is secondary until the answer
```

## Progress (2026-10-20, feat/m2)
Fixed: the camera button is primary only while no code is unknown, no question is open and no lookup runs. Regression
test: `test/food/scanOnline.test.tsx`, "MM-435: one primary action while the question is asked". The hierarchy check
(`hierarchyProblems`) runs over destination stories only, so a sheet's two primaries were not caught; the test covers this
sheet's case.
