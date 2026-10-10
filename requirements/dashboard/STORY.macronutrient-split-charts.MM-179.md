---
id: MM-179
status: in-progress
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
