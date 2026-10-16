---
id: MM-334
status: proposed
component: app-shell
related: [MM-321, MM-148]
---

# Bug: loading and failed reads are bare lines, name internals, and a failed pause read blanks a whole screen

## Context
Found drawing the states no story drew, for MM-321 (stories "Loading", "Loading Pauses", "Pauses Failed", "Records Failed", "Food Loading", "Food Pauses Failed"). While a read is out, Dashboard and Food show one bare line halfway down an empty screen ("Loading pause history…", "Loading your Dashboard…") where the app's own start shows a spinner; when the pauses cannot be read, the whole Dashboard or Food screen is replaced by one notice, "Pause history could not be loaded".

## Description
A screen that waits shows the design system's own loading state, in words a person knows; a read that fails takes out only what needs it: pauses missing never hide the day's food or targets.

## Acceptance Criteria
```gherkin
Scenario: Waiting
  Given a read that has not come back
  Then the screen shows the app's loading state, and no internal name such as "pause history"

Scenario: Pauses cannot be read
  Given the pauses cannot be read
  Then the Dashboard still shows the day's calories and targets, and says pauses could not be read where they matter
```

## Notes
Guarded by "MM-334" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built (AGENTS.md).
