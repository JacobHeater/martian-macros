---
id: MM-372
status: done
component: design-system
related: [MM-370, MM-361, MM-268]
---

# Bug: A popover opened from the middle of the screen hung off its left edge

## Context
The popover (`MmPopover`, drawn by the overlay host like a menu, MM-268) was added for MM-370's "why can't
this be graded". The panel's design review (`docs/agent-runs/mm361-coaching-insights/`, UX-1 and PD-2) found
that opened from the Snacks header's question mark it ran about 40 px off the left edge, so the title and every
line of the explanation were cut. It was placed by its right edge under the trigger's end, with no limit on the
left.

## Description
The bubble stays at least 16 px inside both edges of the screen wherever its trigger is, at any width.

## Acceptance Criteria
```gherkin
Scenario: A trigger in the middle of the screen
  Given a 412 px screen and a trigger whose right edge is at 284 px
  When the popover opens
  Then its left edge is at least 16 px from the screen's left edge

Scenario: A narrow phone
  Given a 320 px screen
  When the popover opens from anywhere
  Then it is at least 16 px inside both edges

Scenario: A trigger at the right edge
  Then the popover still hangs under the trigger's end, 16 px from the right edge
```

## Notes
Guarded by `apps/mobile/test/ui/popoverPlacement.test.tsx`, which failed on the first two scenarios before the
fix. Fixed in `MmPopover`: the width is worked out where the bubble is placed and the right offset is limited
so the left edge keeps 16 px. Drawn in `Designs/Coaching insights › FoodMealGradeWhy` and at 200% text.
