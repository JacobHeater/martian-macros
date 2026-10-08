---
id: MM-27
status: done
component: adaptive-coach
related: [MM-22, MM-23, MM-30, MM-40, MM-46]
---

# Task: Do not let incomplete logging starve the user

## Context
Adaptive calorie engines have a known failure, which planning called the death spiral. A user logs breakfast and lunch and skips dinner.
The engine reads a 900 kcal day, concludes expenditure is low, and cuts the target. The user, now hungrier, logs even less carefully, and
the target falls again.

## Decisions (made with the product owner)
- **Missing days are missing, never zero.**
- **Consistency matters more than accuracy**: a user who under-logs by the same amount every day gets correct guidance (MM-23). What breaks
  the estimate is a *change* in how they log.

Choices I made without asking (say if any is wrong):
- **A day the user marks partial is never used. A day they mark complete is always used**, however small (an intentional fasting day
  counts).
- **An unmarked day is treated as partial when it is below 65% of the window's 75th-percentile intake.** The first version used half the
  median; the simulator showed that with a third of days partly logged, the partial days dragged the median down and those logged at 50 to
  60% slipped through, biasing the estimate 200 kcal low. The 75th percentile stays among the fully logged days.
- **A change of logging style restarts the window.** Each day records what share of its calories were weighed. If the average share before
  and after some day in the window differs by more than half, with at least seven days on each side, the window starts at that day. If
  that leaves too little data, the estimate is held.

## Description
Implemented inside the expenditure estimator. The estimate reports how many days it used and how many partial days it left out, and the
Coach screen shows both.

## Acceptance Criteria
```gherkin
Scenario: Unmarked partial days are left out
  Given simulated users who partly log 35% of days without marking them
  Then on average more than three such days are excluded per window
  And the estimate's bias stays above -150 kcal

Scenario: Marked partial days are never used
  Given every logged day is marked partial
  Then no days are usable and the estimate is held

Scenario: A user buys a food scale
  Given two weeks of hand-portion logging that under-reports by 30%, then three weeks of weighed logging that under-reports by 5%
  Then the window starts at the first weighed day and the estimate reflects the new logging

Scenario: Logging collapses and targets do not
  Given a user whose logging turns mostly partial from week six
  Then seven weeks later the target is less than 250 kcal below where it was
  And no weekly change exceeded 100 kcal
```

## Notes (built and verified)
- `_usableDays` and `_styleSwitch` in `tdee_estimator.dart`; `DayCompleteness`, `IntakeDay.weighedShare` and `QuantitySource` in
  `mm_domain`. Tests in `tdee_estimator_test.dart` and the "no death spiral" test in `closed_loop_test.dart`.
- A legitimately light, unmarked day is excluded too, which biases the estimate slightly high. That is the safer direction.
- The style-switch rule only sees weighed versus not weighed. Hand portions (MM-46) will need it to tell more styles apart.
