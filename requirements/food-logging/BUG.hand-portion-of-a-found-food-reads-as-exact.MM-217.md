---
id: MM-217
status: done
component: food-logging
related: [MM-46, MM-167, MM-212]
---

# Bug: A found food logged by palm, cupped hand or thumb reads as an exact amount

## Context
Found on 2026-10-11 by the walkthrough review of the Add food sheet (MM-212,
run `docs/agent-runs/mm212-add-food-walkthrough/`, finding F-12), and
confirmed by a test.

## Description
MM-167: a hand portion "is never presented as exact", and its example of the
logged line is "2 cupped hands, estimated". MM-46: "the app shows the grams
and macros it will record."

Built: a food found by search and logged as one palm is listed as
"1 palm (114 g) · calculated from 89 kcal per 100 g"
(`apps/mobile/lib/src/format/portion_summary.dart`). "Estimated" is used only
when the totals were typed. On the amount step, the line giving the grams is
shown for a serving and not for a hand unit
(`apps/mobile/lib/src/food/food_amount_step_state.dart`), so a palm shows
totals with no weight and no word that it is an estimate.

Expected: wherever a hand portion's weight or totals are shown, they are
marked as an estimate.

## Acceptance Criteria
```gherkin
Scenario: The logged line
  Given a found food logged as one palm
  Then its line in the food log says the amount is estimated

Scenario: Choosing the amount
  Given the amount step for a found food with "Palms" chosen
  Then the grams it will record are shown, marked as an estimate
```

## Resolution
Hand portions now label the amount-step grams and nutrient totals as estimates,
and the saved food-log line uses the same estimate wording. The regression
test covers both the pre-log display and the saved portion summary.

## UI/UX Assets
- [Add food sheet](../ui-ux-assets/views/add-food.html) — Current. Shows
  hand-portion grams and nutrient totals marked as estimates.

## Notes
- Regression: `apps/mobile/test/hand_portion_summary_test.dart`, enabled for
  both the amount-step estimate and the saved log line.
