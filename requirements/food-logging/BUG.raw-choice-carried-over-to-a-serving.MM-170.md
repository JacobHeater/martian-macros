---
id: MM-170
status: done
component: food-logging
related: [MM-151, MM-42, MM-167]
---

# Bug: Choosing "Raw" while weighing, then a serving, logged the raw food

## Context
The amount step shows "Weighed as: Cooked / Raw" only while a food is logged by weight (MM-151: "not for servings"). The switch changes
which pack entry is logged. If the user chose a weight, switched to Raw, then went back to a serving such as "1 cup", the switch
disappeared but the raw entry stayed selected. One cup of cooked rice was logged as one cup's weight of raw rice: about 580 kcal in
place of about 205, under the name "White rice, raw", with nothing on screen saying so.

Found by reading the amount step while adding the remembered choice (MM-151), which would have made it more likely: the remembered state
is applied on opening. It was fixed there in passing, with no ticket and no test.

## Decisions
- **The raw or cooked switch applies to weighing only.** Choosing any amount that is not a weight logs the food as it was picked.

## Description
`FoodAmountStepState._pick` resets the food to the one picked whenever the chosen unit is not a weight.

## Acceptance Criteria
```gherkin
Scenario: Back to a serving
  Given "White rice, cooked" is chosen, Grams selected and "Raw" chosen
  When "1 cup" is selected
  Then no switch is shown
  And logging it records "White rice, cooked" at the cooked food's calories
```

## Notes
- Regression test: `apps/mobile/test/raw_or_cooked_test.dart`, "a serving logs the food as picked, not the raw one (MM-170)". Confirmed to
  fail with the reset removed, and to pass with it.
