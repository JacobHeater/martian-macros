---
id: MM-340
status: proposed
component: coach-insights
related: [MM-321, MM-334]
---

# Bug: Coach with no weigh-in is one line and no way forward

## Context
Found drawing the Coach screen's undrawn states for MM-321 (story "Coach No Weigh In"): with no weigh-in
kept (each one deleted), Coach is the single line "Log a weigh-in to get started." on an empty screen, with
nothing to press. The target history before any targets (story "Target History Empty") is the same: one
bare line, "No targets yet.", and nothing to do.

## Description
With nothing for the coach to work from, Coach says so in the design system's empty state and offers the
weigh-in it asks for; the target history with none says when targets will come.

## Acceptance Criteria
```gherkin
Scenario: No weigh-in kept
  Given a person set up with no weigh-in
  When Coach opens
  Then it says a weigh-in is needed and offers a way to log one
```

## Notes
Guarded by "MM-340" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the
fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built.
