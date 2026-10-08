---
id: MM-24
status: done
component: adaptive-coach
related: [MM-22, MM-23, MM-25, MM-28, MM-31, MM-33]
---

# Story: Targets that change once a week, by a small step

## Context
See MM-22. A target that moves daily cannot be followed, and one that swings on a noisy week destroys trust.

## Decisions (made with the product owner)
- **Days 1 to 14 are calibration**: targets are issued on day one and do not change.
- **Weekly changes are bounded** (MM-28): at most 100 kcal or 5%, whichever is smaller.

Choices I made without asking (say if any is wrong):
- **The check-in happens by itself** when the app is opened on or after the due day. There is no button and nothing to confirm.
- **At most one change every seven days.**
- **A change of goal applies immediately and is not step-limited**, because switching from a cut to maintenance must not be throttled over
  several weeks.
- **While the estimate is held, targets do not change.**
- **Macros**: protein from the range in MM-28 (its midpoint); fat the larger of the minimum and 25% of calories; carbohydrate the rest.

## Description
The Coach screen's "Daily targets" card shows calories, protein, carbohydrate and fat, the intended pace as a percent of body weight per
week and in the user's weight unit, the date of the next check-in, and a plain-language note for anything unusual about this week's
targets (floored at the safety minimum, step-limited, a diet break, goal not allowed, protein capped). The Today screen shows the same
targets against what has been logged (MM-41), using the targets that were in force on the day being viewed.

## Acceptance Criteria
```gherkin
Scenario: Targets on day one
  Given onboarding has just finished
  Then targets exist, based on the starting estimate

Scenario: Calibration holds
  Given good data on day 7 and day 13
  Then targets have not changed

Scenario: The first adaptive change
  Given good data on day 14
  Then new targets are issued, within 100 kcal of the old ones, based on a measurement

Scenario: No data, no change
  Given three weeks with no food logged
  Then targets have not changed

Scenario: Changing goal
  Given fat-loss targets
  When the goal is changed to maintenance mid-week
  Then maintenance targets apply at once, more than 100 kcal higher

Scenario: A biased, sloppy logger still progresses
  Given a simulated user who under-reports by 20%, skips days and partly logs others, on fat loss at 0.75% a week
  Then after the estimate settles their true loss is between 0.4% and 1.05% of body weight a week
```

## Notes (built and verified)
- `nextTargets` and `consecutiveDeficitWeeks` in `coach.dart`; `computeTargets` in `targets.dart`; `checkInProvider` in the app persists a
  new record when the engine returns one; targets history is stored (MM-60). Tests in `coach_test.dart`, `targets_test.dart`,
  `closed_loop_test.dart`.
- **Only day-one targets have been seen in the app.** The first adaptive change needs two weeks of data and has not been driven through the
  app; the engine tests cover the logic.
- A user is never told that targets changed; they have to notice. A notice or summary at check-in belongs with MM-33.
