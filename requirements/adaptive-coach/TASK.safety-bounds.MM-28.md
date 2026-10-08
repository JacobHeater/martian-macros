---
id: MM-28
status: done
component: adaptive-coach
related: [MM-22, MM-11, MM-24, MM-25, MM-29, MM-31]
---

# Task: Hard limits every target passes through

## Context
Whatever the data says, some outputs are never acceptable. These limits are the last line, applied after everything else.

## Decisions (made with the product owner)
The table proposed in planning was accepted ("yes"), subject to professional review (MM-29):

| limit | men | women |
|---|---|---|
| absolute calorie floor | 1,500 kcal | 1,200 kcal |
| also never below | resting energy | resting energy |
| fastest loss, percent of body weight per week | 1.0; 0.7 under 15% body fat; 0.5 under 12% | 1.0; 0.7 under 25%; 0.5 under 22% |
| lowest goal body fat (accepted with a warning and time limit / refused) | 10% / 8% | 18% / 16% |
| minimum fat | the larger of 0.5 g per kg and 20% of calories | the larger of 0.6 g per kg and 20% of calories |
| largest weekly change | the smaller of 100 kcal and 5% | same |
| longest unbroken deficit | 16 weeks | same |

Protein: 1.6 to 2.2 g per kg of reference weight, where reference weight is body weight, or the weight at BMI 25 for a user at BMI 30 or
over. A lean user in a deficit (men 15% body fat or under, women 23% or under) gets 2.3 to 3.1 g per kg of fat-free mass (Helms et al.,
2014). Kidney disease caps it at 0.8 g per kg.

A change I made after the table was accepted (say if it is wrong):
- **The energy-availability floor applies only to lean users** (men at or under 15% body fat, women at or under 25%). The accepted table
  applied 30 kcal per kg of fat-free mass, plus training energy, to everyone. Worked through for a 90 kg man at 25% body fat it gave a
  floor near 2,130 kcal, which forbids even a moderate 0.75%-a-week cut. The harm that floor guards against (low energy availability,
  RED-S) concentrates in lean people, so it is applied there. The absolute and resting-energy floors still apply to everyone.
- **Uncertainty can only raise that floor**: it uses the upper bound of fat-free mass.

## Description
`SafetyBounds` in the engine provides each limit as a function. `computeTargets` applies the step limit, then the floor (so the floor always
wins), and flags which limits acted.

## Acceptance Criteria
```gherkin
Scenario: The floor wins
  Given a woman whose data would put her target at 1,100 kcal
  Then the target is at least 1,200 kcal, and at least her resting energy, and is flagged as floored

Scenario: Energy availability for lean users only
  Given a man with 65 kg of fat-free mass and 300 kcal of daily training
  Then his floor is 2,250 kcal at 12% body fat, and his resting energy at 25%

Scenario: Loss slows as body fat falls
  Then the fastest allowed loss for a man is 1.0% at 25% body fat, 0.7% at 13% and 0.5% at 10%

Scenario: Goal body fat
  Then a man's goal of 9% is accepted with a warning, 7% is refused, and a woman's goal of 12% is refused

Scenario: Small steps
  Then the largest weekly change is 100 kcal from 2,400 kcal and 80 kcal from 1,600 kcal
```

## Notes (built and verified)
- `packages/engine/lib/src/safety_bounds.dart`; tests in `targets_test.dart`, and every closed-loop test asserts the step limit and floor
  held in every week.
- Sources: NIH minimum-intake guidance for the absolute floors; Loucks on energy availability; Garthe et al. (2011) on slower loss
  preserving lean mass; Helms et al. (2014) on protein. The goal body-fat floors and the lean thresholds are product judgement.
- Goal body-fat checking exists in the engine but no screen lets the user set a body-fat goal yet (MM-36).
- Training energy is always passed as zero for now; nothing estimates it until the training log exists (MM-75).
