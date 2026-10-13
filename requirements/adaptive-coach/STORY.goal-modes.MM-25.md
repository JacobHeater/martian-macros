---
id: MM-25
status: done
component: adaptive-coach
related: [MM-22, MM-12, MM-24, MM-28, MM-36, MM-93]
---

# Story: Four goals, each with its own pace, and changing between them

## Context
See MM-12 for how a goal is recommended.

## Decisions (made with the product owner)

| goal | intended pace, percent of body weight per week |
|---|---|
| fat loss | -0.5 to -1.0, slower as the user gets leaner |
| recomp | 0 to -0.25 |
| lean gain | +0.1 to +0.35, novices at the high end |
| maintenance | 0 |

Choices I made without asking (say if any is wrong):
- **Fat loss defaults to -0.75%**, capped by the safety maximum for the user's body fat (MM-28). A user-chosen pace is supported by the
  engine but there is no control for it yet.
- **Recomp is -0.25% at high body fat** (men 20%+, women 30%+) **and -0.1% otherwise.**
- **Lean gain is +0.35% for untrained, novice and returning lifters; +0.15% for intermediate and advanced; +0.25% for those on
  testosterone therapy or anabolic steroids.**
- **A goal the health check rules out falls back to maintenance**, and says so.

## Description
The Coach screen's first card shows the current goal with a "Change" action. It opens a sheet with a card per allowed goal, the current one
selected and the engine's recommendation badged. Choosing one saves it; targets follow immediately (MM-24).

## Acceptance Criteria
```gherkin
Scenario: Fat loss sets a deficit
  Given a 90 kg man at 25% body fat with an expenditure of 2,800 kcal
  Then the fat-loss target is below 2,800 kcal at -0.75% a week

Scenario: The requested pace is capped
  Given a man at 13% body fat asking for -1.0% a week
  Then the pace used is -0.7%

Scenario: Recomp is a small deficit
  Given a man at 24% body fat on recomp
  Then the pace is -0.25% a week and the deficit is under 400 kcal

Scenario: Novices gain faster
  Then a novice's lean-gain target is higher than an intermediate's with the same expenditure

Scenario: Only allowed goals are offered
  Given a user whose health check removed deficit goals
  Then the change sheet offers neither Fat loss nor Recomp
```

## Notes (built and partly verified)
- `_weeklyRate` and `computeTargets` in `targets.dart` (tests in `targets_test.dart`); `_changeGoal` in `coach_screen.dart`.
- **The change-goal sheet has no test and was not exercised on a device** (MM-93). The engine's handling of a goal change is tested.
- Not built: choosing a fat-loss pace.
