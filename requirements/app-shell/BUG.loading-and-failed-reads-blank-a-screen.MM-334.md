---
id: MM-334
status: done
component: app-shell
related: [MM-321, MM-148, MM-183]
---

# Bug: loading and failed reads are bare lines, name internals, and a failed pause read blanks a whole screen

## Context
Found drawing the states no story drew, for MM-321 (stories "Loading", "Loading Pauses", "Pauses Failed", "Records Failed", "Food Loading", "Food Pauses Failed"). While a read is out, Dashboard and Food show one bare line halfway down an empty screen ("Loading pause history…", "Loading your Dashboard…") where the app's own start shows a spinner; when the pauses cannot be read, the whole Dashboard or Food screen is replaced by one notice, "Pause history could not be loaded".

## Description
A screen that waits shows the design system's own loading state, in words a person knows; a read that fails takes out only what needs it: pauses missing never hide the day's food. Its targets are
withheld and the reason said, since a day that may be paused must not show ordinary targets (MM-183).

## Acceptance Criteria
```gherkin
Scenario: Waiting
  Given a read that has not come back
  Then the screen shows the app's loading state, and no internal name such as "pause history"

Scenario: Pauses cannot be read
  Given the pauses cannot be read
  Then the Dashboard and Food still show the day's calories logged and its food
  And no targets, and say they could not check whether the day is paused
```

## Notes
Guarded by "MM-334" in `apps/mobile/test/gallery/registerDefects.test.tsx`, which failed before the fix, and by the MM-183 tests in `test/dashboard/dashboardMetrics.test.tsx` and `test/food/foodAndTheRest.test.tsx`. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16) with MM-333 and MM-340. Their changes were built: one pattern for a failed read, `ReadFailedNotice`, as screen-direction's Error state (a neutral notice headed with what failed, "Nothing you logged has been changed.", Try again, announced as an alert); the theme and terms failures moved onto it; pauses are named by what they decide ("Could not check whether today is paused"). Waiting is `ScreenLoading`, the app's spinner.
