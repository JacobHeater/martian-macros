---
id: MM-120
status: done
component: macro-targets
related: [MM-119, MM-28, MM-29, MM-121, MM-138]
---

# Bug: The protein target falls about 30 g when a user crosses BMI 30

## Context
MM-28 sets protein at 1.6 to 2.2 g per kg of *reference weight*: body weight, "or the weight at BMI 25 for a user at BMI 30 or over". The
intent is right (an obese user should not be told to eat 300 g of protein). The implementation is a step:

```
reference = bmi >= 30 ? 25 * heightM * heightM : weightKg      (safety_bounds.dart, proteinRangeG)
```

For a man 180 cm tall:

| weight | BMI | reference weight | protein target (midpoint, 1.9 g/kg) |
|---|---|---|---|
| 96.9 kg | 29.9 | 96.9 kg | 184 g |
| 97.3 kg | 30.0 | 81.0 kg | 154 g |

A 400 g change in trend weight moves the protein target by 30 g. It also runs the wrong way during the most common journey in the app: a
user at BMI 31 who diets down through 30 has their protein target *jump up* 30 g mid-cut for no reason they could be given, and one who
drifts up through 30 has it cut.

## Decisions
Choices I made without asking (say if any is wrong):
- **Reference weight is continuous and never decreases as weight increases.** Proposed rule: body weight up to BMI 25; above that, the
  weight at BMI 25 plus a quarter of the excess. This is the "adjusted body weight" convention used in clinical dietetics for obesity
  (**judgement**: a long-standing convention, not derived from trials of protein targets).
- **The same reference weight is used wherever protein, and the fat minimum per kg, are computed**, so the two cannot disagree.
- **Users who already hold a target computed the old way move to the new one at their next check-in**, with the change explained (MM-138).

Effect of the proposed rule for the same man: 81 kg at BMI 25 (154 g), 85.1 kg reference at 97.3 kg (162 g), 91.0 kg reference at 121 kg
(173 g). No step anywhere.

Alternatives considered:
- *Cap at the BMI 30 weight.* Continuous, but gives a 140 kg user the protein of a 97 kg one and everyone between BMI 25 and 30 full body
  weight, which over-prescribes for the heavier half of that band.
- *Use fat-free mass for everyone.* The better basis in principle (Helms 2014 expresses lean-dieter needs per kg FFM), but fat-free mass
  rests on a body-fat figure that is usually a formula estimate good to ten points (MM-34). It would trade a visible step for invisible
  error. Revisit when MM-34 ships.

## Description
Replace the step with the continuous rule in `proteinRangeG`, apply the same reference weight to the per-kilogram fat minimum, and add
tests that would have caught it.

## Acceptance Criteria
```gherkin
Scenario: No step at BMI 30
  Given a 180 cm man
  Then the protein target at 96.9 kg and at 97.3 kg differ by less than 2 g

Scenario: Continuous everywhere
  Given any height from 150 to 200 cm and either sex
  When weight rises in 0.5 kg steps from BMI 18 to BMI 50
  Then no step changes the protein target by more than 2 g
  And the target never falls as weight rises

Scenario: Unchanged at healthy weight
  Given a user at BMI 24
  Then the protein range is 1.6 to 2.2 g per kg of body weight, as before

Scenario: Sensible at high weight
  Given a 180 cm man of 140 kg
  Then his protein target is between 150 and 200 g

Scenario: Lean rule unaffected
  Given a lean user in a deficit
  Then the 2.3 to 3.1 g per kg of fat-free mass rule still applies
```

## Notes (built and verified)
- `SafetyBounds.referenceWeightKg` in `packages/engine/lib/src/safety_bounds.dart`, used by `proteinRangeG` and `minFatG` (which now
  takes height). Tests in `targets_test.dart` cover each scenario above, sweeping 150 to 200 cm, both sexes, BMI 18 to 50 in 0.5 kg
  steps.
- Built with the proposed rule (a quarter of the excess over the BMI 25 weight) on the product owner's go-ahead to start; the two
  alternatives above remain open to MM-29.
- The kidney-disease cap still uses body weight, as MM-11 specifies.
- **Not verified in the app**: no screen was looked at. A user between BMI 25 and 30 gets a slightly lower protein target than before
  (for a 180 cm, 90 kg man, 158 g instead of 171 g) at their next check-in.
- Priority: fix before the first adaptive check-in reaches real users; it is a visible, unexplainable jump in a headline number.
- The lean-user rule has its own step at the body-fat threshold (15% for men, 23% for women); MM-132 covers thresholds on an uncertain
  body-fat figure, and MM-121 the size of that step.
- MM-28 says women's lean threshold for protein is 23% and for the energy-availability floor 25%. Two thresholds for "lean woman" may be
  deliberate; flag for MM-29.
