---
id: MM-218
status: done
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
- **Delivery reconciliation, 2026-10-12:** the observations above describe the
  earlier walkthrough, not the current app. MM-226 removed the basis switch:
  manual servings now scale per-serving nutrition and show logged totals.
  MM-225 adds live macro previews to manual, amount, and estimate steps,
  including selected cooking oil. Still open here: consistent placement and
  wording of complete calorie/macro totals across routes, and explicit handling
  of a stored calorie figure after macros are edited. Do not reopen the
  removed basis choice or claim the preview resolves every criterion.
- Evidence: step records 1.5, 1.7, 2.6, 3.3 and 4.3a in the two reports;
  screenshot tests `add_food_opened_dark`, `add_food_form_end_dark`,
  `add_food_estimate_dark`.
- This is analysis of the built screen. Nobody was observed using it, and it
  says nothing about how many people would get it wrong.

## Decisions and build (2026-10-19, the owner's instruction to close the beta's tickets)
- **One wording across the sheet**: a line beginning "Logs" (the amount step: "Logs 105 kcal · …", or "Logs an estimate: …" for a hand portion; the typed form: "Logs 290 kcal · 20 g protein · …", with the servings in brackets when more than one multiplies per-serving numbers; the estimate: "Logs about 520 kcal · …"). It shows whenever the totals can be known, before and after the action is enabled.
- **Calories left blank** log the figure from the macros, and the line says that figure. **A typed figure that disagrees** with the macros keeps the typed one, and the caution says so: "Macros add up to 290 kcal; the 400 kcal typed will be logged. Double-check the label."
- **Open items decided here**: the default under "Label serving" stays "Everything I ate" (MM-167 decision 3) and is not asked each time; a quantity typed beside entered totals stays as it is. The owner may overrule either.
- Cooking oil's second entry (F-13) is unchanged: it is said by the oil control itself, outside this sheet's totals.
- Regression test: `apps/mobile/test/food/addFoodSays.test.tsx` (the typed form, the amount step, the estimate).

## After the panel (2026-10-19, `docs/agent-runs/m2-add-food`)
- The calorie caution names the kept basis and never a second logged figure (the designer's PD-1, the guard's F2): "Macros add up to 290 kcal per serving; the 400 typed is kept. Double-check the label." The Logs line alone says what is logged, with the servings in brackets on either path (PD-9, F10).
- The finishing action carries the Logs line as its description, so a reader landing on it hears what it will record (F1); the line itself is not live, since a value that changes on every keystroke would be noise.
- The amount step's missing amount is said in the caption pattern, not in heading weight (PD-8).
- Stories `AddFoodManuallyTwoServings` and `AddFoodAmountHand` draw the two-serving form with its caution and the hand portion's "Logs an estimate" (PD-4, F11).
