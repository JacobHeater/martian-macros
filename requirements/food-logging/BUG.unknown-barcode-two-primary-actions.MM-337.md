---
id: MM-337
status: proposed
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
Guarded by "MM-337" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built (AGENTS.md).
