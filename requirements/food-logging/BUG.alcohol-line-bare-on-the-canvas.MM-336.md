---
id: MM-336
status: done
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

## Fix (2026-10-19)
The day's fiber and alcohol lines moved inside the calorie hero, in a `lines` slot under its picture (`.food-hero-lines`), with the fiber line as the alcohol line's sibling so both left the canvas together. The guard `MM-336` in `apps/mobile/test/gallery/registerDefects.test.tsx` runs (its selector corrected to the hero's real class, `.mm-hero`). Story `FoodWithAlcohol` draws it; the panel's review of this batch is in `docs/agent-runs/m2-design-bugs`.

## Decisions after the panel (2026-10-19, `docs/agent-runs/m2-design-bugs`)
- The lines are rows shaped like the macro rows' heads above them (the designer's PD-3, rule 9): the name at the start, the figures at the end (`HeroFactLine`), not muted sentences.
- The alcohol row says "109 kcal, in the total": the hero's figure sums every entry's kcal, alcohol included, and only the Split picture leaves it out (the UX guard's F9, the designer's question; `intakeDayFrom`, `FoodEntry.alcoholKcal`).
- `FoodWithAlcohol` is drawn at Full detail so both rows show (PD-4). The MM-336 guard checks the row's name and its figure.
