---
id: MM-35
status: done
component: adaptive-coach
related: [MM-22, MM-18, MM-23, MM-26, MM-30, MM-34, MM-131, MM-502]
---

# Spike: One model for weight, water, fat, lean mass and expenditure

## Context
Today the engine works in two steps: a filter over weight (level, slope, water; MM-18), then a windowed energy balance on its output
(MM-23). Planning described a single state-space model instead, tracking fat mass, fat-free mass, glycogen-bound water, expenditure and a
bias per scale, updated by every kind of measurement at once. The two-step version was built first because it could be tested sooner.

## Description
Decide whether the joint model is worth building, by answering:
1. **Does it estimate expenditure better?** Run both against the simulator, including a truth model whose partition differs from the
   engine's assumption (MM-30), and compare bias, spread and honesty of uncertainty.
2. **Can carbohydrate intake predict water?** Glycogen binds three to four grams of water per gram. If recent carbohydrate intake explains
   a useful share of the water state, the trend sharpens. Needs real logs to judge.
3. **Is it identifiable?** With only weight and intake observed, can fat and lean be separated at all, or does the model just return its
   prior? What do waist and body-fat readings add?
4. **What does it cost** in code, in test difficulty, and in explaining a number to a user?

## Acceptance Criteria
```gherkin
Scenario: A recommendation
  Then this ticket records whether to build the joint model, keep the two-step model, or extend the two-step model with a glycogen term
  And the simulator results the recommendation rests on

Scenario: The honest case
  Given the joint model is no better on the simulator
  Then the recommendation is not to build it
```

## Notes
- MM-34 needs *some* model for body fat. If the answer here is "keep two steps", MM-34 still needs a small filter of its own.
- The step-limit and floors apply to whatever model produces the estimate; they are not in question.

## Finding (2026-10-21)

**Recommendation: keep the two-step model, as extended with MM-131's settling windows. Do not build the joint
model now.** The trend filter (MM-18) feeds a windowed energy balance (MM-23), a pause or a change of target opens
a settling window for glycogen and water (MM-131, MM-148), and body fat has its own small estimator (MM-34), as
this ticket's notes allowed. Revisit only on one of the two triggers at the end.

The simulator results this rests on:

| question | evidence | what it says |
|---|---|---|
| 1. Better expenditure? | MM-23's suite (`tdeeEstimator.test.ts`): forty accurate loggers, five weeks | Bias under 60 kcal and typical error under 220 kcal, with the truth inside two stated deviations at least 85% of the time. What is left is multi-day water: a single 28-day estimate is good to about 150 to 200 kcal, whatever the model, because water is not observed. |
| 1. A truth that partitions differently (MM-30's weakness) | `partitionMismatchSimulation.test.ts` (new): forty users whose lean share of each kilogram lost is ten points above or below the engine's, paired with the same users and noise | The estimate moves the way arithmetic predicts (high for a leaner loss, low for a fattier one) by less than 100 kcal, and coverage stays at least 80%. By arithmetic it is 50 to 60 kcal on a 600 kcal deficit, under a third of the water floor. That is the most a joint model could win on expenditure, and only if it could identify the partition (question 3). |
| 1. Glycogen, the term a joint model would add | MM-131's measurements | With settling windows, a deficit's first measurement is +109 kcal against +46 for the same users with no glycogen store. Coverage is 95%. After a deficit ends, targets are within 55 kcal of the truth in each of the next four weeks. The step at a change of intake is handled without a glycogen state. |
| 1. Shaped weeks | `shapedIntakeSimulation.test.ts` (MM-124) | Higher days, with a glycogen store that follows them, leave the estimate within the flat case's limits. A joint model has nothing to correct there. |

3. **Identifiable? Not from weight and intake.** The energy balance sees only the energy content of a weight change.
   Any split of fat and lean that gives the same energy fits the same data, so a joint model would return its prior
   partition: the same Forbes and Hall model the engine already uses (`leanFractionOfChange`). A waist entry narrows
   body fat from about ten points either way to about eight (MM-34). Over a 12-week cut of 6 kg, the difference
   between a 15% and a 30% lean share is under 1 kg of lean mass, or about one point of body fat. That is far inside
   the waist's range. A smart scale's body-fat reading has a fixed per-device bias of several points (MM-34's notes),
   so it cannot separate fat from lean either until MM-502 learns that bias.
2. **Can carbohydrate predict water? Not answerable yet.** It needs real logs: weeks of carbohydrate and daily weigh-ins
   from a person, which the simulator cannot give honestly because its glycogen store is a model we wrote. MM-131's
   settling windows already take the level change at a change of intake, which is where most of the glycogen effect
   is. What is left is day-to-day carbohydrate swings inside a phase, which shrink one day's reading and leave the
   28-day slope alone.
4. **Cost: high, for no measured gain.** It would replace two independently tested parts with one coupled filter of
   five or more states plus a bias for each scale. Every estimator, closed-loop, confidence and phase-change suite
   would need new reference figures. The Coach's explanation of a number ("your intake, your trend, this many kcal
   per kg") would become a covariance that can't be put into a sentence. The Dart parity record (`dartCoachLoop.json`)
   would also be lost.

The honest case in the acceptance criteria applies. The joint model cannot be better on the simulator where it matters
(expenditure), because the gain it could add is smaller than the noise floor it shares with the two-step model, and
the partition it would need is not identifiable from these data. The recommendation is not to build it.

**Revisit when either holds:**
- MM-502 has learned a per-device bias, so a smart scale gives a usable lean-mass signal. A joint model could then
  identify the partition, and question 1 should be rerun with that observation.
- The owner's own logs (months of carbohydrate and daily weigh-ins) show that recent carbohydrate explains a useful
  share of the trend's residuals. That is question 2, answered with real data. If it does, the step is a glycogen
  term in the two-step trend filter, not the joint model.

Tests: `apps/mobile/test/engine/partitionMismatchSimulation.test.ts`, with the truth model's new `leanFractionShift`
in `test/engine/support/SyntheticUser.ts` (zero by default, so existing seeds are unchanged). The bound in the table
is what CI checks, not a measured mean. Not run locally; CI validates.
