---
id: MM-226
status: in-progress
component: food-logging
related: [MM-167, MM-223, MM-224, MM-225]
---

# Bug: Manual nutrition does not explain what the entered values represent

## Context

The owner identified "Everything I ate" versus "One serving" as ambiguous in
Add food. The former could mean the entire day or meal rather than this
food's logged portion. Neither option explains whether servings multiply
the entered calories and macros.

## Description

The owner explicitly rejected renaming the control: remove it. Manual label
servings always use nutrition per serving and servings eaten, with calculated
logged totals. Other measurement methods retain nutrition for the measured
amount. Existing serving entries must restore equivalent per-serving nutrition
without multiplying their already-recorded totals again. No storage migration.

## Acceptance Criteria

```gherkin
Scenario: Simple serving entry has no nutrition-basis choice
  Given I enter a food manually with two servings eaten
  When I enter 160 calories and 10 grams protein per serving
  Then there is no Everything I ate or One serving switch
  And the nutrition fields are explicitly per serving
  And the logged preview and saved food contain 320 calories and 20 grams protein

Scenario: Reopen an older serving entry recorded as totals
  Given a food recorded as two servings and 400 total calories
  When I edit it
  Then its unchanged logged preview is 400 calories
  And changing the amount to three servings previews and saves 600 calories

Scenario: Other measurement methods use portion totals
  Given I enter a food using a measurement method without a per-serving choice
  When I view its nutrition inputs
  Then the nutrition explanation identifies only this food's amount eaten
  And the entered nutrition is not multiplied by that measured amount
```

## UI/UX Assets

- [Add food](../ui-ux-assets/views/add-food.html) - Current drawing; manual
  entry, populated portion, and per-serving edit states must match the fix.

## Notes

Regressions: `manual servings have no basis switch and scale nutrition (MM-226)`
and `older serving totals reopen without double scaling (MM-226)` in the mobile
food-portion widget tests. Existing non-serving tests retain total-entry
coverage. Per-serving alcohol must also scale correctly (existing MM-203/MM-204).

Both new regressions were executed before the implementation and failed at
the intended missing heading/remaining-switch assertions. Full local `mm check`
then passed after the fix. Linux screenshot regeneration is pending.
