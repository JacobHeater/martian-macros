---
id: MM-225
status: in-progress
component: food-logging
related: [MM-179, MM-223, MM-224, MM-42, MM-150, MM-167]
---

# Story: Preview the macro-energy split before logging food

## Context
The owner requests a macro split pie chart in Add food. Dashboard and Food
already use the shared MacroSplitChart (MM-179), but the entry flows only
show numeric totals.

## Decisions
- Reuse the shared chart and macro colors without a new card or dependency.
- Show the food being entered, not the day's intake or target percentages.
  Energy shares use 4 kcal/g protein, 4 kcal/g carbs, and 9 kcal/g fat.
- Include manual entry, recent/edit forms, found/scanned/saved food amount
  steps, and meal estimates. Discovery has no food to preview.
- Use the totals that will be logged. Selected cooking oil contributes to
  the amount-step preview because it is logged with that food.
- Retain estimate labels, named grams/shares, and the explanation that alcohol
  and calorie discrepancies are excluded. Do not describe a preview as logged.

## Description
Add an inline, live macro-energy pie to Add food's nutrition-entry steps,
including edit and estimate flows. Its grams and sectors describe the totals
that the current selection will log, without changing how food is saved or
adding a competing discovery-screen visualization.

## Acceptance Criteria
```gherkin
Scenario: Live manual preview
  Given the manual form contains 100 g protein, 150 g carbs, and 50 g fat
  Then the pie sectors contain 400, 600, and 450 kcal
  And the labels show 27.6%, 41.4%, and 31.0%
  When a macro amount changes
  Then the chart updates without logging the food

Scenario: Serving basis and editing
  Given typed nutrition is for one serving
  When the servings eaten changes
  Then chart grams use the scaled totals that will be logged
  And the same preview is available when editing or reusing a recent entry

Scenario: Food amount and cooking oil
  Given a found, scanned, or saved food is selected
  When its amount or preparation changes
  Then the pie uses that selection's calculated macro totals
  When cooking oil is selected
  Then its fat contributes to the preview

Scenario: Meal estimate
  Given maintenance energy is available
  When the estimated meal size or kind changes
  Then the chart updates to the estimated macro totals
  And the preview is labeled as estimated

Scenario: No invented split
  Given discovery is open or the amount cannot be calculated
  Then no preview pie sectors are shown
  Given the food has calories but no macro amounts
  Then no equal three-way split is invented
  And the preview explains that macro amounts are needed
  Given a typed macro amount is negative
  Then no misleading preview pie is shown

Scenario: Accessible preview
  Then grams and energy shares are named without relying on color
  And semantics describe the chart as a food preview rather than logged intake
  And the chart excludes alcohol and calorie discrepancies from its denominator
  And the chart remains usable on a narrow phone at enlarged text
```

## UI/UX Assets
- [Add food](../ui-ux-assets/views/add-food.html#add-food-macro-preview) - Current. Food-entry previews reuse the shared macro-energy chart; drawings are not device verification.

## Notes
- Tests: `apps/mobile/test/add_food_macro_split_test.dart` and
  `apps/mobile/test/macro_split_chart_test.dart`.
- Linux screenshot baselines and emulator verification are recorded separately
  in the handoff; Windows tests do not validate Linux goldens.
