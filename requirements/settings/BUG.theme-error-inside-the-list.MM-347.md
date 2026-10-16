---
id: MM-347
status: done
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
Guarded by "MM-347" in `apps/mobile/test/gallery/registerDefects.test.tsx`, which failed before the fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16), with MM-337, MM-338, MM-346 and MM-347 as one batch; their changes were built. A failed change of the look is a snack, as Settings says a failed save (`NutritionGoalsSection`): "Your appearance could not be saved. Nothing was changed.", with Try again; a snack with an action stays until dismissed and is announced. The first-run chooser keeps its own message.
