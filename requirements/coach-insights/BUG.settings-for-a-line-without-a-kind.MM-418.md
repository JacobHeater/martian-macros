---
id: MM-418
status: done
component: coach-insights
related: [MM-362, MM-364, MM-130, MM-142]
---

# Bug: "Settings for …" under a coach's line of no listed kind opens a screen with nothing to set

## Context
Found by the panel's UX guard reviewing MM-142 (`docs/agent-runs/mm142-weight-jump`, UX-1). `InlineInsight` ends its
figures with "Settings for “<rule>”", which opens Settings > Coach's area screen with that rule's row focused (MM-364).
The rebound note under the weigh-in (MM-130, rule "Leaving a deficit") and the weigh-in's explanation (MM-142, "A jump on
the scale") are drawn by the same component but are not insight kinds: no row of that name exists, so the button lands
on "Body insights" with nothing named, nothing focused and no switch. The person cannot tell what the button did.

## Description
A line that is not of a listed kind has no switch to go to, so it offers no "Settings for". The button is drawn only for
a line that logs itself as a kind (`InlineInsightContent.logged`), which every listed kind does.

## Acceptance Criteria
```gherkin
Scenario: A line of a listed kind
  Given the volume-jump line under a lift
  When its figures are opened
  Then "Settings for “Volume jump”" is there and opens that rule's row, focused

Scenario: A line of the app's own
  Given the weigh-in's explanation, or the rebound note after a cut
  When its figures are opened
  Then there is no "Settings for" button
```

## Notes
Guarded by "MM-418" in `apps/mobile/test/dashboard/weightJump.test.tsx` (no "Settings for" under the explanation) and
by `apps/mobile/test/coach/inlineInsights.test.tsx` (the volume-jump line keeps its route).

## Progress (2026-10-20, feat/m2)
Fixed in `InlineInsight`: the Settings button is drawn only when the line has `logged`, which only a listed kind sets.
The rebound note and the weigh-in's explanation lose a button that led nowhere; every kind keeps its route.
