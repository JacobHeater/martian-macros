---
id: MM-510
status: proposed
component: safeguards
related: [MM-113, MM-112, MM-114, MM-115, MM-121, MM-134, MM-149, MM-29, MM-242]
---

# Task: Store the weight-loss medication answer and wire its effects

## Context
MM-113's rule and words are built as pure, tested functions that take a
`WeightLossMedicationAnswer`, but nothing on the phone asks the question or
reads the answer. There is no place to keep it: the existing
`weightAffectingMedication` answer ("A medication I take can change my weight
or water retention") also covers steroids, antipsychotics, insulin and other
drugs, so reusing it would give this coaching to the wrong people, and the
setup table has no other free column. A schema change was held for another
pull request when MM-113 was built, and a question whose answer is forgotten
on restart must not ship.

## Decisions
Choices I made without asking (say if any is wrong):
- **A new column on `setups`**, `weight_loss_medication`, 0 or 1, default 0,
  in the migration after the one in flight. `ScreeningAnswers` takes the field
  and so satisfies `WeightLossMedicationAnswer`; `SqlSetupRepository` and its
  in-memory fixture store it, and the setup contract suite covers it.
- **Not before MM-29 has reviewed the words** marked "pending MM-29" in
  `calorieAimText`, `weightLossMedicationPaceNote`,
  `weightLossMedicationTrainingNote` and `underEatingText`, and the 5-day rule
  (`UnderEatingRule.minimumDaysOnWeightLossMedication`). Panel safety:
  wiring notice wording goes through MM-29 (MM-114).
- **Never falls back to `weightAffectingMedication`.**

## Description
- The health step and the profile's health answers ask "I take a
  prescription weight-loss medication" (MM-112), not blocking.
- The answer reaches: the Food screen and dashboard (protein first, then
  `calorieAimText` under the target, the usual "over" wording kept), the
  under-eating notice (`findUnderEating`'s `weightLossMedication`, and
  `underEatingText`'s), the too-fast-loss message on Coach
  (`weightLossMedicationPaceNote` after `targetFlagMessage`), the Coach
  training note (`weightLossMedicationTrainingNote`), and the first line of the
  weekly summary (protein-minimum days, MM-149).
- Every screen change has its gallery story, in the ticked and unticked states.
- The terms (MM-242) already name "any medicine that changes your weight or
  appetite"; check that no terms change is needed.

## Acceptance Criteria
```gherkin
Scenario: The answer survives a restart
  Given the medication answer is ticked in the health check
  When the app is closed and opened again
  Then the answer is still ticked and the MM-113 effects still apply

Scenario: An older database
  Given a database from before the new column
  When it is migrated
  Then the medication answer is not ticked

Scenario: The MM-113 scenarios on the phone
  Given the medication answer is ticked
  Then each scenario of MM-113 holds on its screen
  And with the answer not ticked, none of them applies
```

## Notes
- Device check owed once wired: a phone with the answer ticked, restarted.
- A user who unticks the answer is a candidate for MM-130's maintenance
  guidance; not specified here.
