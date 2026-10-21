---
id: MM-510
status: done
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
- **Wired before MM-29, by the owner's direction (2026-10-21).** The owner is
  the only user while testing on their own phone, and every feature is built
  and switched on. The words marked "pending MM-29" in `calorieAimText`,
  `weightLossMedicationPaceNote`, `weightLossMedicationTrainingNote` and
  `underEatingText`, and the 5-day rule
  (`UnderEatingRule.minimumDaysOnWeightLossMedication`), ship as they are.
  They are still pending MM-29: its clinician review is a release gate in
  M5, so nothing here reaches anyone else before it. (Changed from "not
  before MM-29", the panel safety finding that notice wording goes through
  MM-29, MM-114.)
- **Never falls back to `weightAffectingMedication`.**
- **Schema 18**, step 17 to 18 (version 17 is MM-480's).
- **One calorie card everywhere.** The protein bar and the calorie aim live in
  `CalorieHero`, so Coach's card changes with Food's and the dashboard's
  (MM-187: one calorie visual). Protein's bar is drawn above the arc, the
  same `MacroBar` as below it; the figure is what is logged so far and the
  caption the rest of `calorieAimText`, so the card reads "900 so far,
  aiming for about 1,900 kcal". The other macros stay under the arc.
- **The pace line follows the raised-pace message in the same notice**, not a
  notice of its own, so the two read as one account.
- **The training note is a plain notice** under the hero and its warnings,
  above the goal, built like the diet break's rebound note beside it.
- **The week's summary** is the Coach card and the "why your targets" sheet,
  both of which use `adherenceLines`; the protein-minimum line moves first
  in both.
- **Terms (MM-242): no change.** Section 4 already names "any medicine that
  changes your weight or appetite", and the answer stays on the phone with
  the other health answers.

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

## What is built (2026-10-21)
Not run locally; CI validates.
- `setups.weight_loss_medication` (schema 18, step 17 to 18, fingerprint
  recorded); `ScreeningAnswers.weightLossMedication`, so `ScreeningAnswers`
  is a `WeightLossMedicationAnswer`; `SqlSetupRepository` stores it.
- The health step (onboarding, the profile's health check and the re-check)
  asks it; the profile's ticked count counts it; a change of sex keeps it.
- Wired: `findUnderEating`'s `weightLossMedication` (state),
  `underEatingText`'s (the notice), `calorieAimText` and protein first
  (`CalorieHero`), `weightLossMedicationPaceNote` and
  `weightLossMedicationTrainingNote` (Coach), and `adherenceLines`'s
  `weightLossMedication` (Coach's week, the targets sheet).
- Tests: `test/data/upgrade.test.ts` (a version 17 database), the schema and
  fingerprint tests, the setup contract suite,
  `test/coach/weightLossMedicationOnScreens.test.tsx` (each MM-113 scenario
  on its screen, and none unticked), `test/coach/adherenceSummary.test.tsx`,
  `test/app/onboarding.test.tsx`, `test/settings/profileCorrection.test.tsx`.
- Stories: Coach, Food, Today, FirstRun and Settings, ticked and unticked
  (`weightLossMedicationScenario`).

## Notes
- Device check owed: a phone with the answer ticked, restarted; and a phone
  upgraded from schema 17.
- Still pending MM-29 (release gate, M5): every string marked "pending
  MM-29", the escalation line, and the 5 days.
- A user who unticks the answer is a candidate for MM-130's maintenance
  guidance; not specified here.
