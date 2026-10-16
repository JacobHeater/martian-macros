---
id: MM-337
status: done
component: food-logging
related: [MM-321, MM-43, MM-224]
---

# Bug: an unknown barcode leaves two primary actions on the scan sheet

## Context
Found drawing the states no story drew, for MM-321 (story "Scan Unknown Code"). After "Look up" finds nothing, the sheet has two primary buttons, "Scan with the camera" and "Read the label", against the one primary action of the hierarchy (MM-224), and "Enter manually" and "Back to search" squeeze onto one uneven row.

## Description
Once a code is unknown, the sheet has one primary action, the next step offered; the others are secondary, laid out as the design system lays out a sheet's actions.

## Acceptance Criteria
```gherkin
Scenario: A code the pack does not know
  When an unknown barcode is looked up
  Then the scan sheet has one primary action
```

## Notes
Guarded by "MM-337" in `apps/mobile/test/gallery/registerDefects.test.tsx`, which failed before the fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16), with MM-337, MM-338, MM-346 and MM-347 as one batch; their changes were built. Once a code is unknown, "Read the label" is the one primary action; "Scan with the camera" steps down to secondary; "Enter manually" is a full-width secondary under it. Announcing the result is MM-351.
