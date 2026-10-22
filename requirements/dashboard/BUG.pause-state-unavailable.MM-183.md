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

## Decisions
Panel review of PR #285 (2026-10-21):
- "Try again" keeps the day drawn: while the pauses are read again after a
  failure the screen stays as it was, the notice stays, and its button says
  "Trying…" and keeps its focus (`useHeldFailure`, `ReadFailedNotice`'s
  `pending`, MM-411), instead of the screen being swapped for the loading
  indicator (UX-2).
- Under the Dashboard, the history is not failed by the pauses: it is drawn
  with targets and coverage withheld and says "Paused days could not be
  checked"; the Dashboard's pauses notice is the one alert and one retry
  (UX-1, with MM-176 and MM-334).

## UI/UX
- `apps/mobile/src/gallery/screens/Today.stories.tsx`: `LoadingPauses`,
  `PausesFailed`, `HistoryPausesFailed`.
- `apps/mobile/src/gallery/screens/Food.stories.tsx`: `FoodLoading`,
  `FoodPausesFailed`.

## Regression
`apps/mobile/test/dashboard/dashboardMetrics.test.tsx` ("MM-183: the target
display waits for pauses") and `apps/mobile/test/food/foodAndTheRest.test.tsx`
("MM-183: the Food screen's targets wait for pauses") each run the loading and
the failed case, carried over from `pause_state_display_test.dart`. Loading
shows the screen's loading indicator and no target arc; failure keeps the day
(MM-334) but withholds the targets and says "Could not check whether today is
paused" / "this day is paused" with a "Try again". Targets are stored in
both, so a missing "kcal left of" is the pauses' doing; the failed case then
clicks "Try again" with the read working and sees "kcal left of 2,000".

## Progress
- Built in the React app: `DashboardScreen` and `FoodScreen` wait for the
  pauses and, when they cannot be read, show no target as though nothing were
  paused (MM-183, MM-334).
- Drawn in Storybook: `Today.stories.tsx` `LoadingPauses` and `PausesFailed`,
  `Food.stories.tsx` `FoodLoading` and `FoodPausesFailed`.
- Done (2026-10-21). Not run locally; CI validates.
- Panel fixes (2026-10-21): targets seeded in the Food case (QA-1); "Try
  again" asserted and exercised to recovery in both failed cases (QA-2); the
  day kept drawn while retrying (UX-2); the history drawn without targets and
  coverage when the pauses cannot be read (UX-1); stories named above
  (QA-15).
