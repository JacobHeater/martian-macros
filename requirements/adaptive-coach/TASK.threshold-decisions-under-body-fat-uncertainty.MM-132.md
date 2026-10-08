---
id: MM-132
status: done
component: adaptive-coach
related: [MM-12, MM-22, MM-28, MM-34, MM-82, MM-111, MM-120, MM-121, MM-128, MM-133, MM-139, MM-143]
---

# Task: Body-fat thresholds applied to a body-fat number nobody knows

## Context
Body fat decides a great deal: the goal recommended (MM-12), the fastest allowed loss, the protein rule, the energy-availability floor
(MM-28), which paces are offered (MM-128) and when a gain should stop (MM-129). Every one of those is a threshold: at or under 15%, under
12%, 20% and over.

The number the thresholds are applied to is, for most users, either a formula estimate from height, weight, age and sex, good to about
ten points either way, or a self-assessment. Evidence that both are poor is **strong**: BMI-based prediction equations have standard
errors of about 4 to 5 body-fat points against reference methods; circumference methods about 3.5 points (the US Navy equations' original
validation: 3.5 for men, 3.7 for women, with systematic bias of several points in some populations); consumer bioimpedance worse and
variable day to day.

Today each rule compares the point estimate with the threshold. That has three consequences:
- **Safety rules can miss.** A man estimated at 18% who is really 13% gets the 1.0% loss limit instead of 0.7%, the lower protein rule,
  and no energy-availability floor. (The floor alone already uses the upper bound of fat-free mass.)
- **Rules flip.** An estimate hovering at 15% moves the user between two protein rules and two loss limits from one check-in to the next.
- **Precision is implied.** "Recomp is recommended because you are at 24%" is a sentence the app cannot back.

## Decisions
Choices I made without asking (say if any is wrong):
- **Every body-fat estimate carries a standard deviation**: 5 points for the formula, 4 for a user's own figure, and what the model reports
  once MM-34 exists.
- **Safety thresholds take the cautious branch when it is plausibly the true one.** If the probability that the user is on the stricter
  side of a threshold is 25% or more, the stricter rule applies. With a 5-point standard deviation this means a man is treated as "15% or
  under" when his estimate is about 18.5% or lower. This covers the loss limit, the protein rule and the energy-availability floor.
- **Non-safety decisions use the point estimate and say it is one**: the goal recommendation, the offer of the Faster pace (which requires
  the user to be *clearly* above its line: probability 75% or more), and the end-of-gain line.
- **No flipping**: once a threshold rule has switched, it does not switch back until the estimate has moved 2 points past the threshold
  the other way.
- **Changes at a threshold are announced** (MM-138): "Your estimated body fat is now low enough that the app slows your fastest pace to
  0.7% a week."
- **A user who corrects their body fat in Settings** (MM-82) has the rules re-evaluated at once, which answers that ticket's open question
  for the safety rules: a correction toward leaner applies immediately; a correction toward fatter waits for the next check-in.

The cost, stated plainly: users near a threshold with only a formula estimate get slower limits and higher protein than their true body
fat might warrant. That is the price of not knowing, and the app tells them how to remove it (a tape measure, MM-34).

Where the experts disagreed:
- The bodybuilding coach: lifters know their body fat better than 4 points. Some do; self-assessment in the general population does
  not support it. A user who enters a tape or caliper measurement gets the tighter uncertainty that method earns.
- The engineer preferred propagating the full distribution through every calculation over a 25% rule. Cleaner in principle, much harder
  to explain to a user, and the downstream rules are step functions anyway.

## Description
`BodyComposition` estimates carry uncertainty everywhere they are used; one shared function answers "is the user on the strict side of
this threshold" with hysteresis; the rules in `SafetyBounds`, `mode_advisor.dart` and `targets.dart` call it.

## Acceptance Criteria
```gherkin
Scenario: Plausibly lean
  Given a man with a formula estimate of 18% body fat
  Then his fastest loss is 0.7% a week and the energy-availability floor applies
  And his protein target is at least what the smoothed lean rule in MM-121 gives at 15%

Scenario: Clearly not lean
  Given a man with a formula estimate of 26%
  Then his fastest loss is 1.0% a week

Scenario: A better measurement relaxes it
  Given a man estimated at 18% with a standard deviation of 2 points
  Then his fastest loss is 1.0% a week

Scenario: No flipping
  Given an estimate that moves 18.0, 18.6, 18.2, 18.9 over four check-ins
  Then the loss limit is the same at all four

Scenario: Faster needs to be clear
  Given a man with a formula estimate of 27%
  Then the Faster pace is not offered
  And at an estimate of 29% it is

Scenario: Correcting toward leaner
  Given a user who changes their body fat from 30% to 15% in Settings
  Then the stricter limits apply immediately, without waiting for the check-in

Scenario: The recommendation admits it
  Then the goal recommendation's reason describes body fat as an estimate with a range
```

## Notes
- Priority: must-have before public release for the safety rules; the rest can follow.
- "Faster" at 75% probability with a 5-point deviation needs an estimate of about 28.4% for a man (25% + 0.67 standard deviations), which
  is why 27% fails and 29% passes.
- The thresholds themselves are product judgement (MM-12, MM-28) and go to MM-29. This ticket is only about applying them to an uncertain
  number.

## Progress (built and verified)
- `packages/engine/lib/src/safety_body_fat.dart`: `cautiousBodyFatPercent` (the estimate less 0.6745 of its deviations, which is the same as "a quarter chance of being at or under the threshold"), `safetyBodyFatPercent` (that figure held against moves of 2 points or less from the last check-in's), and `bodyFatClearlyAbove` (a three-quarters chance of being over a line).
- The loss limit, the protein rule and the energy-availability floor in `computeTargets`, and the limit in the fast-loss raise (MM-115), now use the cautious figure. The goal recommendation and the recomp pace keep the point estimate.
- Uncertainty: formula 5 points (as before), the user's own figure 4 (was 3).
- The figure used is stored with each set of targets (`TargetsRecord.safetyBodyFatPercent`; schema version 3 adds a nullable column, migration tested from every earlier version), so the next check-in starts from it. This is what stops an estimate hovering at a threshold from flipping a rule.
- A correction toward leaner (more than 2 points under the stored figure) applies the stricter limits at once, ahead of the weekly check-in; toward fatter waits for it.
- The goal recommendation says body fat is an estimate that can be off by a few points either way.
- Tests: every scenario in the criteria (plausibly lean at 18%, clearly not lean at 26%, a better measurement, no flipping across 18.0, 18.6, 18.2, 18.9 and a counter-test showing it flips without the hold, faster needs to be clear at 27% and 29%, correcting toward leaner or fatter), the stored figure through the Drift and in-memory repositories, and the recommendation wording.
- **Deviations**
  - The hold is a dead band of 2 points around the figure last used, not "2 points past the threshold the other way". It is simpler, needs no list of thresholds, and cannot flip on a small move; the cost is that a user who keeps drifting leaner or fatter by under 2 points stays on the old figure until the drift passes 2.
  - "At least what the smoothed lean rule in MM-121 gives at 15%": MM-121 is not built, so the test compares with the current lean rule at 15%.
  - Whether "Faster" is offered (MM-128) is not built; the rule it needs (`bodyFatClearlyAbove`) is, and tested.
  - The announcement of a change at a threshold waits for MM-138.
- **Cost, as the ticket says**: users near a threshold with only a formula estimate get slower limits and higher protein than their true body fat might warrant.
- **Not verified**: real users; the effect of the larger own-figure uncertainty on users who enter a measurement (their limits relax later than before).
