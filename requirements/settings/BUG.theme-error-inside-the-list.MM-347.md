---
id: MM-347
status: proposed
component: settings
related: [MM-321, MM-291]
---

# Bug: a failed save of the look is a notice inside the list of Settings rows

## Context
Found drawing Settings' undrawn states for MM-321 (story "Change Appearance Fails"). When the new look
cannot be saved, "Could not save your theme. Please try again." is a caution notice drawn inside the
Appearance list group, between the Appearance and Units rows, a surface inside a surface.

## Description
The failure is said where the design system says a row's failure, outside the list's rows, matched to how
its siblings in Settings report a failed change.

## Acceptance Criteria
```gherkin
Scenario: The look cannot be saved
  When a new look is chosen and saving it fails
  Then the failure is said, and not as a notice inside the list group
```

## Notes
Guarded by "MM-347" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the
fix lands. A design fix: drawn in Storybook, reviewed by the panel, then built.
