---
id: MM-340
status: done
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

Scenario: Weighed in, and a record the coach needs cannot be read
  Given a person with weigh-ins
  And the pauses cannot be read
  When Coach opens
  Then it says it could not read what the coach works from, and offers to try again

Scenario: No targets yet
  When the target history is empty
  Then it says when the first targets come, or that Coach explains why none are set
```

## Notes
Guarded by the two "MM-340" tests in `apps/mobile/test/gallery/registerDefects.test.tsx`, both failing before
the fix. Coach offers the Dashboard's own `WeighInRow` and confirms the save as the Dashboard does. The UX
guard found Coach would spin for good when any record it works from failed to read; that is the second
scenario. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16) with MM-333 and MM-334. Their changes were built: one pattern for a failed read, `ReadFailedNotice`, as screen-direction's Error state (a neutral notice headed with what failed, "Nothing you logged has been changed.", Try again, announced as an alert); the theme and terms failures moved onto it; pauses are named by what they decide ("Could not check whether today is paused"). Waiting is `ScreenLoading`, the app's spinner.
