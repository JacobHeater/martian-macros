---
id: MM-344
status: proposed
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
Guarded by "MM-344" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the
fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built.
