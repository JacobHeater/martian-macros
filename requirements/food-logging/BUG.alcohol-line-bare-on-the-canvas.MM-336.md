---
id: MM-336
status: proposed
component: food-logging
related: [MM-321, MM-127, MM-291]
---

# Bug: the day's alcohol is a bare line on the canvas of Food

## Context
Found drawing the states no story drew, for MM-321 (story "Food With Alcohol"). With alcohol logged, "Alcohol: 109 kcal" is a lone line of text between the hero and the meal sections, outside every section and surface (MM-291).

## Description
The day's alcohol is said where the day's energy is: in the hero or a row of the screen's hierarchy, matched to its siblings.

## Acceptance Criteria
```gherkin
Scenario: Alcohol logged today
  Given a glass of wine logged today
  Then its energy is said inside the hero or a section, not alone on the canvas
```

## Notes
Guarded by "MM-336" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built (AGENTS.md).
