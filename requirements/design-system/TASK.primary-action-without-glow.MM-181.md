---
id: MM-181
status: in-progress
component: design-system
related: [MM-103, MM-180]
---

# Task: Remove the primary action's incandescent glow

## Decisions
The owner rejects the glow around the floating Add food button. Remove the
shared floating action's decorative halo and shadow in both themes, retaining
its solid Ember fill, contrasting foreground, shape, position and behavior.
Hover, focus and pressed states must not reintroduce elevation or glow.
This supersedes the earlier FAB-halo direction; unrelated chart/hero effects
are unchanged.

## Acceptance Criteria
```gherkin
Scenario: Flat primary action
  Given either the light or dark theme
  Then the floating Add food button has no decorative shadow or halo
  And its resting, focus, hover and pressed elevations are zero
  And pressing the button still opens food entry
```

## Validation
Guarded by `mm_fab_test.dart`, alongside the existing app food-entry tests.
The integrated workspace passed `mm check`; the flat Add food button was
inspected on the seeded Android emulator in both themes.
