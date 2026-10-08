---
id: MM-23
status: done
component: adaptive-coach
related: [MM-22, MM-18, MM-26, MM-27, MM-28, MM-30, MM-40]
---

# Story: Measure my energy expenditure from my food log and weight trend

## Context
See MM-22.

## Decisions (made with the product owner)
- **Wearable "active calories" are not used.** Validation studies put their error between about 27% and over 90%; the estimate needs only
  intake and weight.
- **A day with nothing logged is missing data, never zero intake.**
- **When there is not enough data the estimate is held**, and targets are never changed on a guess.

Choices I made without asking (say if any is wrong):
- **Window**: the last 28 days, or from the first weigh-in if that is more recent, and at least 14 days long.
- **Enough data** means at least 10 usable intake days and at least 8 accepted weigh-ins in the window.
- **The estimate is as of yesterday**, since today's intake is still in progress.
- **The starting estimate** is Mifflin-St Jeor resting energy times 1.35, 1.45 or 1.55 for 0-2, 3-4 and 5+ training days a week, with an
  uncertainty of 15%.
- **The measurement is blended with the starting estimate** in proportion to how certain each is, so a noisy first measurement moves the
  number less than a clean one.
- **The result is kept between 1.1 and 3.0 times resting energy.** Hitting a limit is reported: it usually means food is going unlogged.

## Description
Expenditure = average intake on usable days, minus the energy stored or released by the change in trend weight (MM-26).

The Coach screen's "Your metabolism" card shows the estimate and its uncertainty (for example "2,739 ± 411 kcal / day"), whether it is the
starting estimate or a measurement, and either what is still needed ("Needs 10 more fully logged days and 8 more weigh-ins before your
first measurement") or what the measurement used (logged days, weigh-ins, partial days left out).

## Acceptance Criteria
```gherkin
Scenario: Not enough data
  Given ten days of history
  Then the estimate is the starting estimate, marked held, and the card says what is still needed

Scenario: A first measurement
  Given fifteen days of weigh-ins and logged food
  Then the estimate is a measurement

Scenario: Unbiased, with honest uncertainty
  Given forty simulated users who log accurately for five weeks
  Then the average error is under 60 kcal, the typical error under 220 kcal
  And the truth is within two stated standard deviations at least 85% of the time

Scenario: A consistent under-reporter
  Given simulated users who log 25% less than they eat, every day
  Then the estimate equals true expenditure minus the calories they do not log, so targets in their own logging units still work

Scenario: An implausible log
  Given a log of 600 kcal a day with steady weight
  Then the estimate is held at 1.1 times resting energy and flagged
```

## Notes (built and verified)
- `TdeeEstimator` in `packages/engine/lib/src/tdee_estimator.dart`; `analyze` in `coach.dart`; the card is `_Metabolism` in
  `coach_screen.dart`. Tests in `tdee_estimator_test.dart` and `closed_loop_test.dart`.
- **Expect a single 28-day measurement to be off by roughly 150 to 200 kcal.** That is set by multi-day water noise, not by the code; the
  tests check for no bias and honest uncertainty, not for precision that is not available.
- The under-reporter result was a surprise worth recording. Weight change is valued in true calories, so the estimate is not simply "true
  expenditure in logging units"; it is exactly that only once intake is steady at target, which is the point the weekly loop converges to.
- Seen on a device only in the held state. No user has yet reached a measurement through the app.
