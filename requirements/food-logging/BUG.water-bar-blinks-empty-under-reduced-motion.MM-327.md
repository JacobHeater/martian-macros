---
id: MM-327
status: done
component: food-logging
related: [MM-326]
---

# Bug: under reduced motion the water bar blinked empty before taking its level

## Context
Found by the panel's UX guard reviewing MM-326's water bar (UX-1, `docs/agent-runs/mm326-water-bar/`). The
bar is painted empty and fills two frames later so that it pours. With reduced motion the fill has no
duration, so each time the bar appeared or its section opened it flashed empty for a frame or two, where
the motion rules say it takes its level at once.

## Description
With reduced motion set, the water bar is at its level on its first paint, as the welcome step's arc
already does (`WelcomeStep`).

## Acceptance Criteria
```gherkin
Scenario: Reduced motion
  Given the phone asks for reduced motion
  When the water bar appears at half its goal
  Then its first paint is half full

Scenario: Motion allowed
  Given the phone does not ask for reduced motion
  When the water bar appears at half its goal
  Then it is painted empty first and pours to half
```

## Notes
Guarded by `apps/mobile/test/ui/waterBarReducedMotion.test.tsx`, which failed before the fix
(`usePoured` reads `prefers-reduced-motion`).
