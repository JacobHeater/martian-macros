---
id: MM-563
status: done
component: food-logging
related: [MM-255, MM-125, MM-49, MM-396]
---

# Story: A meal's subtotal names every macro

## Context
Under a meal's name the Food screen said "675 kcal · 26 g protein" at Full detail, and only the calories
below it. The owner (2026-10-22): the subheading "requires all macronutrients, not just protein".

## Decisions
- The subtotal is the calories and the macros in the entries' own letters: "675 kcal · P 26 · C 80 · F 30",
  at Standard and Full. At Simple, which shows no carbs or fat anywhere (MM-49), "675 kcal · P 26".
- Carbs are net where the app counts net (MM-396), as on each entry.
- The solid-protein marker stays at Full (MM-125).

## Acceptance Criteria
```gherkin
Scenario: Every macro
  Given breakfast holds eggs (P 12, C 1, F 10) and toast (P 4, C 30, F 2), 400 kcal
  Then the breakfast header says "400 kcal · P 16 · C 31 · F 12"
```

## Progress
Built in `MealSection`. Tested in `test/food/macroSources.test.tsx`. Not run locally; CI validates.
