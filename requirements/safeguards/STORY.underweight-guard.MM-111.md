---
id: MM-111
status: done
component: safeguards
related: [MM-110, MM-11, MM-25, MM-28, MM-29, MM-36, MM-132]
---

# Story: Never coach an underweight user into a deficit

## Context
The only "too lean" protection today is a floor on *goal body fat* (MM-28), and no screen sets a body-fat goal yet. The body-fat figure it
would be checked against is, for most users, a formula estimate good to about ten points either way (MM-34). So in practice a 170 cm woman
at 50 kg (BMI 17.3) can pick fat loss at onboarding and be given a deficit at the 1,200 kcal floor.

Body mass index is a poor measure of fatness in muscular people, but at the low end it is the right tool: it needs only height and weight,
which the app always has and measures well, and nobody is underweight by BMI because of muscle.

Evidence: the BMI 18.5 boundary is the WHO and CDC classification of underweight (**strong** as a convention; the exact number is a
convention, not a threshold of harm). The margin above it is **judgement**.

## Decisions
Choices I made without asking (say if any is wrong):
- **Below BMI 18.5, deficit goals are not offered.** Maintenance and lean gain remain. The reason is shown.
- **BMI 18.5 to 20 is a caution zone**: deficit goals are allowed, the fastest pace is the gentlest one (0.5% a week, MM-128), and the Coach
  screen carries a caution.
- **A deficit ends itself at BMI 18.5.** When *trend* weight (not one reading) puts the user at or below BMI 18.5 for seven consecutive
  days, the next targets are maintenance, flagged, exactly as for a goal the health check rules out (MM-25). It is not step-limited.
- **A goal weight below BMI 18.5 is refused** when goal weights exist (MM-36), whatever the goal body fat says.
- **BMI is computed from trend weight and stored height**, and is not shown to the user as a headline number; it appears only in the
  explanation of this rule.

Where the experts disagreed:
- The bodybuilding coach's objection: a stage-lean competitor can sit near BMI 20 and wants to cut. The caution zone, not the block, covers
  them. Contest preparation is a non-goal (MM-144).
- The safety reviewer wanted the block at 19 for a margin against measurement error. Trend weight is good to a few hundred grams and height
  rarely changes, so the conventional 18.5 was kept and the margin expressed as the caution zone.

## Description
`CoachingPolicy` gains a rule from height and current trend weight that removes deficit goals below the threshold. The engine re-evaluates
it at every check-in.

## Acceptance Criteria
```gherkin
Scenario: Underweight at onboarding
  Given a 170 cm woman weighing 50 kg
  Then the plan screen offers Maintenance and Lean gain only, and says why

Scenario: The caution zone
  Given a 180 cm man weighing 63 kg (BMI 19.4) who chooses fat loss
  Then his pace is at most 0.5% of body weight a week
  And the Coach screen shows a caution

Scenario: A deficit that reaches the floor
  Given a user on fat loss whose trend weight has been at or below BMI 18.5 for seven days
  When the next check-in runs
  Then the targets are at maintenance, more than 100 kcal above the previous ones, and flagged with the reason

Scenario: One low reading
  Given a user at BMI 18.9 with a single reading that would be BMI 18.3
  Then nothing changes

Scenario: Above the caution zone
  Given a user at BMI 24
  Then this rule changes nothing
```

## Notes
- Priority: must-have before public release.
- BMI cut-offs are not adjusted by sex, age or ancestry here. Lower healthy-weight cut-offs are sometimes used for Asian populations at
  the *upper* end; the underweight boundary is the same. Confirm in MM-29.
- An older adult (65+) loses more function per kilogram lost. Whether the block should sit higher for them is a question for MM-112.

## Progress (built and verified)
- `bodyMassIndex` and the thresholds (`underweightBmi` 18.5, `lowWeightCautionBmi` 20, 0.5% gentlest pace) in `packages/domain/lib/src/body_mass_index.dart`.
- `CoachingPolicy.derive` takes the user's weight. Below 18.5 it removes fat loss and recomp (maintenance and lean gain remain; pregnancy, lactation and eating-disorder rules still narrow it further, never widen it) and adds the `underweight` caution. From 18.5 up to 20 it caps weekly loss at 0.5% and adds the `lowBodyWeight` caution. Both cautions show on the Coach screen.
- `analyze` judges the policy on the **highest trend weight of the last seven days**, so one low reading, or a dip that lasts a day, changes nothing; weight has to stay at or under the threshold for the whole week.
- `nextTargets` ends a deficit the policy no longer allows at the next check-in, during calibration too. `computeTargets` produces maintenance, flagged `underweightMaintenance`, and is **not step-limited** upward (so the ticket's "more than 100 kcal above the previous ones" holds).
- Onboarding passes the entered weight, so the plan step offers only the allowed goals and says why (`ModeReason.underweight`).
- **Added, not in the ticket:** when a deficit is ended this way the app also sets the user's goal to maintenance (and the record is stored as maintenance), so a deficit does not resume by itself when weight recovers above 18.5. Going back to a deficit is then the user's choice. Without this the stored goal stayed "Fat loss" and the deficit would have restarted automatically.
- Tests: policy (thresholds, boundaries, combination with other rules), engine (what weight the rule is judged on, pace cap, forced maintenance not step-limited, calibration, check-in cadence, no rewrite loop), and app (onboarding offers maintenance and lean gain only with the reason; the caution zone caution on the Coach screen; the end-to-end switch to maintenance and the goal change).
- **Not done**: "A goal weight below BMI 18.5 is refused" (there are no goal weights yet; MM-36). The pace cap in the caution zone is a policy limit; MM-128 (choosing a pace) does not exist yet.
- **Not verified**: a real user's data; the look of the new caution on a device; whether 18.5 should sit higher for people 65 and over (MM-112), or differ by ancestry (MM-29).
- The ticket says both "below 18.5" and "at or below 18.5"; the code uses below throughout.
