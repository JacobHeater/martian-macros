---
id: MM-92
status: in-progress
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

## Progress
Built:
- **The logging streak** (`loggingStreakOf`, pure): whole days in a row, counted by the same rule the adherence summary and the
  expenditure estimate use (`usableIntakeDays`), so nothing is rewarded that is not counted elsewhere. How much was eaten does not
  matter: a test logs the same run at 1,700 and 2,800 kcal and gets the same streak.
- **One missed day in seven is forgiven**: a second miss within a week breaks the streak, keeping the days before it. Two misses a
  full week apart are two different weeks. Two days missed running break it at once.
- **A pause neither counts nor breaks it** (MM-148), and does not use up the forgiven day. Today is never a miss.
- **A quiet line on the Dashboard**, "Your logging": "7 whole days logged in a row. A missed day is forgiven, once a week." Said from
  three days. No confetti and no notification. A test forbids "lowest", "deficit", "under target", "lost", "weight", "record", "best",
  "kcal" and "calories" in it.
- **Eating-disorder history**: the line is about logging only and never about weight, so it is shown to everyone.
- Thresholds are in `StreakRule`. Tests: `logging_streak_test.dart` (engine) and `process_rewards_test.dart` (app).

Not built:
- **Protein days and weigh-ins as rewards**: the adherence card on the Coach screen already shows both as plain counts; no
  acknowledgement was added. A weigh-in count is left out of rewards altogether, as it can pull attention to the scale.
- **Workouts and personal records**: they need the training log (MM-75, MM-77), so "the loudest moment in the app" does not exist yet.
- **The weekly and monthly summaries** (MM-33) do not mention the streak yet.
- A streak is computed from the last 60 days of food, so it cannot read past 60.
- Not checked on a device.
