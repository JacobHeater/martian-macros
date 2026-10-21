---
id: MM-129
status: done
component: macro-targets
related: [MM-119, MM-12, MM-21, MM-25, MM-36, MM-77, MM-133, MM-134, MM-138, MM-140, MM-155, MM-156, MM-480]
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

Scenario: The cap for novices
  Given a novice, returning or untrained lifter with an expenditure of 2,800 kcal on lean gain
  Then the calorie target is not above 3,220 kcal, and a capped target says so

Scenario: Gaining too fast
  Given trend gain of 0.6% a week for three weeks against an intended 0.15%
  Then the next target is lower by at most the weekly step, and the reason is given

Scenario: Fat-heavy gain
  Given ten weeks on lean gain with trend weight up 3 kg and waist up 4 cm, with at least four waist measurements
  Then the Coach screen says the gain looks fat-heavy and offers a slower pace or maintenance
  And the offer is the goal chooser until a slower gain pace exists (MM-480)

Scenario: Waist within noise
  Given waist up 0.8 cm over ten weeks
  Then no fat-heavy notice is shown

Scenario: Time to stop
  Given a man whose estimated body fat has reached 20% on lean gain
  Then the coach recommends ending the gain, with the reason, and leaves the goal unchanged until he decides

Scenario: Weight up, strength flat
  Given eight weeks of surplus, trend weight up 2 kg, and no tracked lift's e1RM higher
  Then the coach says so and does not change calories because of it

Scenario: An eating-disorder history
  Given a user with an eating-disorder history on lean gain
  Then no weight, waist or body-fat line is said, and only the 26-week line can be
```

## UI/UX
- CoachLeanGainFatHeavy — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachLeanGainFatHeavy). The card, built like
  its sibling the recomp review (MM-133): a section with the findings in words, trend weight and the intended pace, and "Choose a
  goal", which opens the Coach screen's goal chooser.
- CoachLeanGainTimeToStop — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachLeanGainTimeToStop). Ending the gain
  recommended, with the reason.

## Progress
Built (2026-10-21), against this ticket's recommendations. Not run locally; CI validates.
- **The cap** is `SafetyBounds.maxSurplusKcal` (10% of estimated expenditure for intermediate and advanced lifters, 15% for
  untrained, novice and returning ones), applied in `computeTargetsTraced` after the deficit cap; a capped target carries the
  `surplusCapped` flag, its message on the Coach screen, and the pace the cap gives. No rules-version bump: the cap binds only
  for heavy users or the faster gain with androgen use, and the next check-in applies it.
  The safety floor wins over the cap: a heavy, lean body's energy-availability floor (30 kcal per kg fat-free mass) can sit
  above it, and the target is then the floor, flagged as such.
- **Too fast** is the ordinary loop: the lower measured expenditure brings the target down by the weekly step, and the card says
  why, with both paces.
- **The three advisory rules** are `leanGainReviewOf`, with its figures in `LeanGainRule` and the evidence register; the card is
  `LeanGainCard` on the Coach screen, under the recomp review, from the `leanGainReview` cell. None changes a target or the goal.
- Guarding tests: `apps/mobile/test/engine/leanGainGuardrails.test.ts` (every scenario above, the evidence rows),
  `apps/mobile/test/coach/leanGainCard.test.tsx` (the card, the goal chooser, the goal unchanged, the eating-disorder history,
  another goal), `apps/mobile/test/engine/evidenceRegister.test.ts` (the two new SafetyBounds values).

Choices I made without asking (say if any is wrong):
- **"Novices" includes untrained lifters**, who share the novice pace (MM-25).
- **Too fast** is the trend over the last three weeks, after the gain's first week (glycogen and water), above twice the intended
  pace.
- **The fat-heavy and waist-stop readings use the whole stretch on lean gain**, the waist's smoothed ends (MM-155), and the trend's
  change over the same days.
- **Strength flat** needs trend weight up 1% or more, at least one lift judged (four sessions in the stretch, the latest in the last
  two weeks, a baseline within a week of the start), and none up 2.5%. Bodyweight lifts are left out: their estimate rises with body
  weight.
- **Body fat for the stop line is the point estimate**, as MM-12 judges "high"; a goal body fat (MM-36) does not move it yet.
- **The card stays while a line holds**; it has no dismiss. A slower gain is MM-480.
- **An eating-disorder history** hears only the 26-week line, as MM-141 leaves out lines about weight.

## Notes
- Device checks owed: the card on a phone (CoachLeanGainFatHeavy), at 200% text.
- Priority: could-have; lean gain is the least-used goal at launch.
- Arm and thigh measurements (MM-156) would sharpen "where is the weight going"; not required here.
- Users on testosterone therapy or anabolic steroids have a faster expected gain (MM-11); the caps and the stop lines are unchanged for
  them, and the pace is already higher (MM-25). Confirm in MM-29.
