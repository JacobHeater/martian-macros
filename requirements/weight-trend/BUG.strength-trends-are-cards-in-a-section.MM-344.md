---
id: MM-344
status: done
component: weight-trend
related: [MM-321, MM-224, MM-253, MM-77]
---

# Bug: the strength trends on Progress are cards inside their section

## Context
Found drawing the Progress screen's undrawn states for MM-321 (stories "Progress Weight Events Loading",
"Progress Opens Session History"). Under "Strength trends", each lift is a card inside the section, against
rule 1 of the screen direction (MM-253: a section is never drawn on a surface and nothing nests in a card);
the cards stop short of the column's right edge. The same is below the fold of the existing Progress story.

## Description
Each lift's trend is drawn the way the section's siblings draw their content, matched to them (rule 9),
with no card inside the section.

## Acceptance Criteria
```gherkin
Scenario: Lifts with a trend
  Given finished workouts with qualifying sessions
  Then each lift's trend is part of the Strength trends section, not a card inside it
```

## Notes
Guarded by "MM-344" in `apps/mobile/test/gallery/registerDefects.test.tsx` and the strength tests in
`apps/mobile/test/progress/strengthProgress.test.tsx`, which failed before the fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16), with MM-344 and MM-348 as one change; their changes were built. "Strength trends" is a
list group: a row per recent lift ("Est. max 319.7 lb · +16.8 lb in 4 weeks", "with body weight" for a bodyweight
exercise, "4-week change not ready yet" before there is one), opening its history, where the chart lives (rule 4,
one home per fact; the designer ruled out a sparkline per row), then "All lift histories". "Lift histories" is a
list group too, with its own waiting and failure (no Progress section inside it). A failed read is
`ReadFailedNotice`, at the column's width inside a section. The plural slip found on the way is MM-355.
