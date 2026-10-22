---
id: MM-183
status: done
component: dashboard
related: [MM-176, MM-179, MM-148]
---

# Bug: Do not present ordinary targets before pause state is known

## Defect
Dashboard and Food could treat loading or failed pause history as no pause,
presenting ordinary deficit targets for a paused day. Final implementation
review found this fail-open display path.

## Acceptance Criteria
```gherkin
Scenario: Pause history loading
  Given pause history has not loaded
  Then Dashboard and Food show a loading state rather than ordinary targets

Scenario: Pause history failed
  Given pause history could not be read
  Then Dashboard and Food show an explicit failure state
  And ordinary targets are not displayed as though no pause exists
```

## Regression
`apps/mobile/test/dashboard/dashboardMetrics.test.tsx` ("MM-183: the target
display waits for pauses") and `apps/mobile/test/food/foodAndTheRest.test.tsx`
("MM-183: the Food screen's targets wait for pauses") each run the loading and
the failed case, carried over from `pause_state_display_test.dart`. Loading
shows the screen's loading indicator and no target arc; failure keeps the day
(MM-334) but withholds the targets and says "Could not check whether today is
paused" / "this day is paused" with a "Try again".

## Progress
- Built in the React app: `DashboardScreen` and `FoodScreen` wait for the
  pauses and, when they cannot be read, show no target as though nothing were
  paused (MM-183, MM-334).
- Drawn in Storybook: `Today.stories.tsx` `LoadingPauses` and `PausesFailed`,
  `Food.stories.tsx` `FoodLoading` and `FoodPausesFailed`.
- Done (2026-10-21). Not run locally; CI validates.
