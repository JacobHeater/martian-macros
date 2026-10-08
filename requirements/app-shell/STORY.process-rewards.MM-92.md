---
id: MM-92
status: proposed
component: app-shell
related: [MM-89, MM-11, MM-32, MM-33, MM-77]
---

# Story: Reward the work, never the deficit

## Context
Body change is slow. An intermediate lifter might add half a pound of muscle in a month. An app that rewards only outcomes rewards nothing
for weeks. But the obvious engagement mechanics in a diet app (streaks of low-calorie days, "new lowest weight" badges) push people toward
disordered eating.

## Decisions (made with the product owner)
- **Reward process**: logging, hitting protein, training sessions, personal records.
- **Never reward** a bigger deficit, a lowest weight, or a streak of low intake.
- **Streaks can be repaired**: one missed day does not reset a habit.
- **Users with a history of an eating disorder get no weight-based rewards at all** (MM-11).

Choices I made without asking (say if any is wrong):
- **What is counted**: days logged and marked complete; days at or above the protein target's minimum; weigh-ins; workouts; a new best
  e1RM on a lift.
- **Eating under the calorie target earns nothing extra.** A complete day is a complete day whether it lands at, under or over.
- **A streak tolerates one missed day in seven** before it breaks.
- **Personal records are the loudest moment** in the app. They are real, they are earned, and they come from training.
- **Rewards are quiet**: a line on the Today screen and a weekly summary, with no confetti and no notifications unless the user turns them
  on.

## Description
A small set of counters and acknowledgements, shown on Today and in the weekly and monthly summaries (MM-33).

## Acceptance Criteria
```gherkin
Scenario: A logging streak with one gap
  Given six complete days, one missed, then another complete day
  Then the streak continues

Scenario: Under-eating earns nothing
  Given two complete days, one at target and one 600 kcal under
  Then both count the same

Scenario: A personal record
  Given a set that gives a new best e1RM on a lift
  Then the app marks it as a personal record

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then no reward, message or summary refers to weight going down

Scenario: Never
  Then nothing in the app celebrates a lowest weight, a largest deficit, or consecutive days under target
```

## Notes
- The last scenario is a rule for every future feature, not only this one. A reviewer should reject a pull request that breaks it.
