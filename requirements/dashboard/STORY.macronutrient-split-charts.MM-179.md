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

Superseded by MM-254/MM-255: the chart and the bars are one switch in the
hero, not both on the screen (see the note below).

Panel review of PR #285 (2026-10-21):
- At Simple detail there is no Grams/Split switch, since the split needs all
  three macros; a remembered Split falls back to the protein bar, and the
  choice is kept for when Standard or Full is chosen again (QA-4).
- The switch's group is named "Macro picture" (UX-4).
- Inside the hero the split keeps one line, "Share of calories from each",
  in its empty state too so the hero does not grow with the first food (UX-3).
  Withdrawn by the owner on 2026-10-22 as cruft (MM-562): the hero's split has no caption.
- A choice that could not be saved is said in a snack: "Could not keep that
  choice." (UX-5).

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
  the split donut (`MacroSplitChart`), never both, behind a "Grams / Split"
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
- Panel fixes (2026-10-21): `test/charts/splitDonutCentred.test.tsx` checks
  each sector uses its macro bar's colour token ("same colors as the bars")
  and the hero's one line; `test/food/detailLevel.test.tsx` checks Simple
  with a remembered Split (no switch, no ring, the protein bar); the
  switch's group renamed and its failed save said in a snack.

### Owed on a phone
- The donut's labels at a narrow phone width in both themes, read on a
  device.
