---
id: MM-26
status: done
component: adaptive-coach
related: [MM-22, MM-23, MM-34, MM-35]
---

# Task: How much of a weight change is fat, and what it is worth in energy

## Context
A kilogram of fat holds about 9,440 kcal and a kilogram of fat-free mass about 1,815 kcal (Hall, 2008). To turn a weight change into
energy the engine must know the mix. Measuring the mix with a body-fat scale does not work: an error of one percentage point of body fat on
an 80 kg person misplaces 0.8 kg, which is about 6,000 kcal, or 215 kcal a day over four weeks. That is as large as the deficit a recomp
prescribes.

## Decisions (made with the product owner)
- **Use a model for the split, not body-fat readings.** Body-fat readings may later inform body composition slowly (MM-34), but never the
  energy balance directly.

Choices I made without asking (say if any is wrong):
- **The Forbes curve as revised by Hall**: the lean fraction of a weight change is `10.4 / (10.4 + fat mass in kg)`. Leaner people lose
  proportionally more lean mass.
- **Halved for resistance-trained users in a deficit**, because training with adequate protein blunts lean loss. The factor of one half is
  a modelling assumption, not a fitted constant.
- **Fat mass is floored at 1 kg** in the formula.

## Description
`leanFractionOfChange`, `energyDensityKcalPerKg` and `energyDensityForSlope` in the engine. The expenditure estimate and the target
calculation both use them, so "how much energy is 0.5 kg a week" has one answer everywhere.

## Acceptance Criteria
```gherkin
Scenario: Leaner means more lean loss
  Then the lean fraction at 10 kg of fat is 10.4 / 20.4, and is lower at 40 kg of fat

Scenario: Training protects lean mass in a deficit only
  Given 20 kg of fat and a resistance-trained user
  Then the lean fraction is half the Forbes value when losing and the full value when gaining

Scenario: The ends of the range
  Then a change that is all fat is worth 9,440 kcal per kg and one that is all lean 1,815 kcal per kg
```

## Notes (built and verified)
- `packages/engine/lib/src/partition.dart`; tests in `formulas_test.dart`.
- **A known limit, accepted in planning**: in a true recomp, fat lost and muscle gained partly cancel on the scale, so weight alone cannot
  see the exchange. That leaves roughly 100 to 200 kcal a day of ambiguity in expenditure for a recomping user. The design accepts it
  because the weekly loop steers by outcomes, and the planned recomp signal (MM-32) uses waist and strength to see what weight cannot.
