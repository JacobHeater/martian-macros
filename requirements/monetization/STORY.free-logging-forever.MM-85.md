---
id: MM-85
status: proposed
component: monetization
related: [MM-84, MM-86, MM-87, MM-24, MM-37, MM-63]
---

# Story: A complete free logger, with or without the Coach

## Context
See MM-84. A user who has not bought, or whose trial ended, must still have an app worth opening, and must never feel their data is being
held hostage.

## Decisions (made with the product owner)
- **Free forever**: food logging with search, barcode and label scanning; the training log; trend weight; waist; health sync; backup.

Choices I made without asking (say if any is wrong):
- **Without the Coach, targets freeze at their last values** and stay visible. The user can still log against them. They are labelled as
  no longer adapting.
- **A free user can set their own calorie and macro targets by hand.** A logger with no targets at all is not much use, and someone who
  knows their numbers should not need the coach to type them in.
- **Everything collected while free still counts.** If they buy later, the coach uses all their history from the first day, not from the
  purchase.
- **Locked features are shown, not hidden**: the Coach screen explains what the coach would be doing with their data, with one way to buy.
  No pop-ups, no countdown nagging, no interruption while logging.

## Description
The behavior of the app when the Coach is not unlocked and no trial is running.

## Acceptance Criteria
```gherkin
Scenario: After the trial, without buying
  Given a user whose trial has ended
  Then they can log food, weigh in, log training, see the trend, back up and restore
  And their targets are shown, frozen, and labelled as not adapting

Scenario: Setting targets by hand
  Given a free user
  When they enter 2,200 kcal and 160 g of protein
  Then the Today screen compares their intake with those

Scenario: Buying later
  Given three months of free logging
  When the Coach is bought
  Then the expenditure estimate uses those three months immediately

Scenario: No nagging
  Given a free user logging a food
  Then nothing about purchasing interrupts them
```

## Notes
- Safety limits (MM-28) are part of the coach's targets. Hand-set targets are the user's own; decide whether to warn when a hand-set
  calorie target is below the floor. Recommended: warn once, do not block.
