---
id: MM-179
status: done
component: dashboard
related: [MM-176, MM-98, MM-49]
---

# Story: See the logged macronutrient split on Dashboard and Food

## Decisions
The owner requests a pie chart on both screens. Food keeps the existing macro
progress bars and adds the chart below them, without a switcher. The split is
by energy contributed by logged protein/carbs/fat, using 4/4/9 kcal per gram,
not by gram weight or target amounts. Alcohol and other calorie discrepancies
are explicitly excluded from the macro-energy denominator.
The pie always labels all three macro shares; Simple detail still limits the
progress bars to protein.

## Acceptance Criteria
```gherkin
Scenario: Energy shares, not gram shares
  Given 100 g protein, 150 g carbohydrate and 50 g fat are logged
  Then the pie uses 400, 600 and 450 kcal respectively
  And its labels show grams and percentages of their 1450 kcal total

Scenario: Both destinations
  Then the Dashboard pie uses today's recorded food
  And the Food pie uses the currently selected day's recorded food
  And protein, carbohydrate and fat progress bars remain in Standard and Full detail
  And both charts use the same shared component and colors as the bars

Scenario: No macros logged
  Given no macro amounts are recorded
  Then the chart explains that it needs logged macro amounts
  And it does not invent an equal three-way split

Scenario: Accessibility
  Then named labels communicate the shares without relying on color
  And zero-valued macros have a zero share without a fake pie sector
  And narrow phones and both themes have no overflowing chart labels
```

## Progress
Implemented one shared chart on Dashboard and Food, retaining the progress
bars. Tests verify exact 400/600/450 kcal sector values and percentage labels,
empty/zero-share behavior, both themes and Food's selected-day versus
Dashboard's current-day data. Integrated `mm check` passed. Charts were
inspected on the seeded Android emulator.

## Note (2026-10-13, MM-253)
The donut repeats the hero's macro bars. The owner chose to keep both behind a switch (bars or donut, remembered as a preference) inside the hero, on Dashboard and Food alike (MM-254, MM-255); the separate "Macronutrient split" card goes.

## Progress (2026-10-21)
- Built as the owner decided (MM-254, MM-255): `CalorieHero` shows bars or
  the split donut (`MacroSplitChart`), never both, behind a "Bars / Split"
  switch whose choice is a remembered preference shared by Dashboard and
  Food. The separate "Macronutrient split" card is gone.
- Superseded, not built: "Food keeps the bars and adds the chart below them,
  without a switcher" and "progress bars remain in Standard and Full detail"
  alongside the chart. The later owner decision above replaces both with the
  switch; the bars remain one of its two pictures.
- Tests: `test/charts/charts.test.tsx` (400/600/450 kcal, grams and
  percentages of 1,450 kcal, empty, zero share without a sector),
  `test/food/mealCards.test.tsx` (one picture at a time, remembered and shared
  with the Dashboard; Food follows the selected day, Dashboard stays on
  today), `test/charts/macroSplitRoundsToNothing.test.tsx`,
  `test/charts/splitDonutCentred.test.tsx`. Stories: `Food.stories.tsx`
  `FoodSplit` and `FoodSplitEmpty`. Not run locally; CI validates.

### Owed on a phone
- The donut's labels at a narrow phone width in both themes, read on a
  device.
