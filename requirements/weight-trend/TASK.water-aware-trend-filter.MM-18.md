---
id: MM-18
status: done
component: weight-trend
related: [MM-15, MM-17, MM-19, MM-23, MM-30]
---

# Task: A trend filter that tells water from tissue

## Context
The first version was a two-state Kalman filter (level and slope) that treated each reading's noise as independent. The simulator (MM-30)
showed it was wrong in a way that mattered: real water swings last several days, and the filter read a multi-day run as tissue change. It
reported an uncertainty of about 0.2 kg while actually being off by up to 0.9 kg, and the expenditure estimate built on it was off by 200
to 340 kcal for an accurate logger. Water as its own state had been planned for a later version; this moved it into the first.

## Description
`WeightTrendModel.smooth` takes weigh-ins and returns one point per calendar day from the first weigh-in: tissue level, slope, estimated
water offset, and the variances of level and slope.

- **Three states**: level, slope, and water. A reading is level plus water plus independent reading noise. Water is an AR(1) process: it
  decays toward zero each day (persistence 0.65) and is refreshed with noise so its long-run spread is 0.6% of body weight.
- **Reading noise** is 0.2% of body weight (scale, clothing, timing).
- **A backward (Rauch-Tung-Striebel) pass** smooths history using later readings, so past points are better than the forward filter alone.
- **Outliers**: a reading more than five standard deviations from the prediction is discarded (a pounds-for-kilograms entry, someone else
  on the scale). After three rejections in a row the next reading is accepted, so a real step change is not locked out forever.
- **Missing days** are predicted without an update; uncertainty grows across the gap.
- **Per-day extra noise** can be supplied (MM-19).

## Acceptance Criteria
```gherkin
Scenario: A steady loss through noise
  Given six weeks of readings falling 0.08 kg a day with 0.6 kg of daily noise
  Then the trend's slope is within 0.15 kg a week of the truth
  And smoothed levels inside the series are within 0.3 kg of the truth

Scenario: A unit mix-up
  Given steady readings near 81.6 kg and one reading of 180
  Then that reading is marked rejected and the trend stays near 81.6 kg

Scenario: A real step change
  Given two weeks near 80 kg followed by two weeks at 88 kg
  Then the trend ends near 88 kg

Scenario: A gap
  Given a ten-day gap in readings
  Then there is a trend point for every day, and the points inside the gap are less certain than they would be with readings

Scenario: Honest uncertainty
  Given many simulated users with multi-day water swings
  Then the expenditure estimate built on the trend is within two of its own standard deviations at least 85% of the time
```

## Notes (built and verified)
- `packages/engine/lib/src/weight_trend.dart` (a small 3x3 matrix helper is private to the file); eight tests in `weight_trend_test.dart`.
  The last scenario is the calibration test in `tdee_estimator_test.dart`.
- The noise constants are reasonable defaults, not fitted to real users' data. They should be revisited once real weigh-in histories exist.
