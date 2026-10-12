---
id: MM-218
status: proposed
component: food-logging
related: [MM-38, MM-150, MM-151, MM-167, MM-212]
---

# Story: Before logging, the sheet says what it will log

## Context
Proposed by the walkthrough review of the Add food sheet (MM-212, run
`docs/agent-runs/mm212-add-food-walkthrough/`). Both reviewers, working
apart and from the built screen, classed these as usability problems found by
inspection. **Nothing here is decided.** The owner accepts, changes or
declines it; until then the app stays as it is.

What the built sheet does today (source and screenshot tests):
- **Typed numbers, the default.** The form opens on "Label serving", one
  serving, with "The numbers below are for: Everything I ate" selected. With
  that selected, "Servings eaten" is recorded and multiplies nothing, and no
  line says what will be logged. A person who copies a label's per-serving
  numbers and types 2 servings logs half of what they ate, with no error.
  The default is MM-167's decision 3; the "Logs …" line is drawn only for
  "One serving" (findings F-01, PD-01; high).
- **Calories left blank, or kept after an edit.** The figure worked out from
  the macros is shown only as a hint while the field has focus. On editing,
  the stored calories stay in the field after a macro is corrected, and the
  caution appears only past a tolerance and says "Double-check the label",
  not which figure will be kept (F-07).
- **Estimate a meal.** The size chip shows calories; the protein,
  carbohydrate and fat the chosen kind will log are shown nowhere before
  logging (PD-09, F-04).
- **Cooking oil.** Choosing 1 tsp or 1 tbsp logs a second entry, "Cooking
  oil"; the totals on screen do not change and the choice shows no calories
  (F-13; source only, no screenshot).
- **Four ways of showing the result.** No line; "Logs N kcal …" after the
  meal chips; the totals without "Logs" before the meal chips; calories
  inside a chip (PD-09).

## Description
Every step of the sheet that ends in logging or saving states, in one place
and one wording, the calories and macros it is about to record, and it does
so in every state in which the action is enabled.

Open to the owner, and not settled here:
- whether the default under "Label serving" stays "Everything I ate"
  (MM-167 decision 3), changes, or is asked each time;
- whether a quantity typed beside entered totals should be shown as
  descriptive only.

## Acceptance Criteria
```gherkin
Scenario: A label copied with two servings
  Given the typed form with per-serving numbers and "Servings eaten" at 2
  Then the sheet shows the totals it will log before "Log it" is tapped
  And it is plain whether the 2 multiplies them

Scenario: Calories left blank
  Given macros typed and the calories field empty and not focused
  Then the calories that will be logged are shown

Scenario: Correcting a macro
  Given an entry being edited whose calories were worked out from its macros
  When a macro is changed
  Then the sheet shows which calorie figure will be saved

Scenario: An estimated meal
  Given a size and a kind chosen
  Then the calories and macros the estimate will log are shown before logging

Scenario: Cooking oil
  Given a found food with oil chosen
  Then what the oil adds is shown before logging

Scenario: One wording
  Then each of these steps states what it will log in the same place and words
```

## Notes
- Evidence: step records 1.5, 1.7, 2.6, 3.3 and 4.3a in the two reports;
  screenshot tests `add_food_opened_dark`, `add_food_form_end_dark`,
  `add_food_estimate_dark`.
- This is analysis of the built screen. Nobody was observed using it, and it
  says nothing about how many people would get it wrong.
