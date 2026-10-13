---
id: MM-181
status: done
component: design-system
related: [MM-103, MM-180, MM-232]
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
In the Flutter app: guarded by `mm_fab_test.dart`, alongside the existing
app food-entry tests. The integrated workspace passed `mm check`; the flat
Add food button was inspected on the seeded Android emulator in both themes.

## Progress
**Done (2026-10-13), in the React app.** `MmFab` (`src/ui/MmFab.tsx`) is
one rule in `ui.css`: an Ember fill, the on-Ember foreground, the group
radius, no shadow, and no hover, focus or pressed rule that adds one. The
rebuild (MM-232) carried the flat button over and never the halo.
`test/ui/flatFab.test.ts` reads the stylesheet and fails on any `.mm-fab`
rule that sets a shadow, filter or halo in any state. Looked at in a browser
from the static Storybook build, the Food screen story in Martian at phone
size: a flat lime pill, nothing drawn around it. Pressing it opens food
entry (`test/food/`, the Add food stories).
