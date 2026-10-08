---
id: MM-129
status: proposed
component: macro-targets
related: [MM-119, MM-12, MM-21, MM-25, MM-36, MM-77, MM-134, MM-138, MM-140, MM-155, MM-156]
---

# Story: A lean gain that does not quietly become a bulk

## Context
Lean gain aims for +0.1 to +0.35% of body weight a week (MM-25). That bounds the intended pace. What it does not do is tell the user
whether the weight arriving is the kind they wanted, or when to stop.

Evidence:
- **Moderate**: in trained lifters, a larger surplus added fat, not muscle. Eight weeks at maintenance, a 5% surplus or a 15% surplus
  gave similar strength and muscle-thickness changes, with skinfolds rising with the surplus (Helms 2023, n=21, short).
- **Moderate**: lean mass can be gained in a deficit or at maintenance by novices and people with more fat (Barakat 2020; Murphy and
  Koehler 2022), which is why MM-12 steers those users to recomp.
- **Judgement**: realistic rates of muscle gain fall steeply with training age; the commonly quoted models (roughly 1 to 1.5% of body
  weight a month for novices, half that for intermediates, less beyond) are coaches' rules of thumb, not measurements.

## Decisions
Choices I made without asking (say if any is wrong):
- **The surplus is capped at 10% of estimated expenditure**, whatever the percentage pace implies, and at 15% for novices and returning
  lifters.
- **A gain faster than intended is corrected by the normal loop** (MM-24), step-limited, and explained: "You are gaining about 0.6% a week;
  the aim is 0.15%. Beyond that pace, the extra is mostly fat."
- **Waist is the fat signal.** When waist has risen by more than its measurement noise (MM-155) and the ratio of waist gain to weight gain
  over at least eight weeks exceeds 1 cm per kg, the Coach screen says the gain looks fat-heavy and offers a slower pace or maintenance.
  It is an offer.
- **A gain has an end.** The coach recommends ending it (to maintenance, then a cut if wanted) at whichever comes first: estimated body
  fat reaching 20% for men or 30% for women (the same lines MM-12 uses for "high"); waist up 5% from the start of the phase; or 26 weeks.
  A recommendation with its reason, never a forced change.
- **Strength is the muscle signal.** If, over eight weeks of surplus, no tracked lift's e1RM has risen (MM-77), the coach says so: weight
  is going up and strength is not, which usually means the training, not the food, is the limit. No calorie change follows from this.
- **A surplus needs training** (MM-134).

Where the experts disagreed:
- The hypertrophy expert: the 10% cap is too tight for a true hard-gainer, whose expenditure rises with intake. The adaptive estimate
  already follows that; the cap is on the surplus over *measured* expenditure, so it rises with it.
- The physique expert wanted the stop line at 15 to 17% for men for aesthetic reasons. That is a preference; a user may set a goal body
  fat lower (MM-36). The default line is the app's existing one.
- The waist-to-weight ratio threshold has no literature behind it. It is a starting value to be tuned on real data, and says so.

## Description
A surplus cap in `SafetyBounds`; three advisory rules in the coach using waist, strength and phase length.

## Acceptance Criteria
```gherkin
Scenario: The surplus cap
  Given an intermediate lifter with an expenditure of 2,800 kcal on lean gain
  Then the calorie target is not above 3,080 kcal

Scenario: Gaining too fast
  Given trend gain of 0.6% a week for three weeks against an intended 0.15%
  Then the next target is lower by at most the weekly step, and the reason is given

Scenario: Fat-heavy gain
  Given ten weeks on lean gain with trend weight up 3 kg and waist up 4 cm, with at least four waist measurements
  Then the Coach screen says the gain looks fat-heavy and offers a slower pace or maintenance

Scenario: Waist within noise
  Given waist up 0.8 cm over ten weeks
  Then no fat-heavy notice is shown

Scenario: Time to stop
  Given a man whose estimated body fat has reached 20% on lean gain
  Then the coach recommends ending the gain, with the reason, and leaves the goal unchanged until he decides

Scenario: Weight up, strength flat
  Given eight weeks of surplus, trend weight up 2 kg, and no tracked lift's e1RM higher
  Then the coach says so and does not change calories because of it
```

## Notes
- Priority: could-have; lean gain is the least-used goal at launch.
- Arm and thigh measurements (MM-156) would sharpen "where is the weight going"; not required here.
- Users on testosterone therapy or anabolic steroids have a faster expected gain (MM-11); the caps and the stop lines are unchanged for
  them, and the pace is already higher (MM-25). Confirm in MM-29.
