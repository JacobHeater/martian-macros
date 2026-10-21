---
id: MM-92
status: done
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
- **In the monthly report** (2026-10-21): the month's longest logging run, by the Dashboard streak's own rule, and the personal
  records set in the month. The records card is built like its sibling "Your lifts" in the same report (rows of lift and value),
  with the day as the row's detail.
- **The weekly summary does not repeat the streak.** The weekly check-in's summary is about what changed in the targets and why
  (MM-138); the streak is already said every day on the Dashboard, and the report says the month's.

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

Scenario: The month's work in the monthly report
  Given a month of whole days with one day missed, and a set that gave a new best e1RM on a lift
  Then the month's report gives the longest logging run, forgiving the missed day, and lists the personal record with its day
  And eating under the target in that month does not change the run
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

- **Personal records** (2026-10-11, `personalRecordsOf`, pure): a finished workout sets one when a lift's best estimated one-rep
  max in it is higher than in every earlier session of that lift. A lift's first session sets none, matching the best is not one,
  and a record stays one after a later session beats it. Shown as a "Personal record" card at the top of the workout that set it
  ("Back squat: estimated max 122.5 kg, up from 116.7 kg.") and as "1 personal record" on its line in the workout list. No
  confetti, no notification. Tests: `personal_records_test.dart` (engine and app).

- **In the monthly report** (2026-10-21, MM-33): "Longest logging run: 27 whole days in a row" in "What you did", said from three
  days like the Dashboard line, and a "Personal records" card with each record set in the month (the lift, its estimated
  max "up from" the best before it, the day under it), oldest first, against every earlier session of the lift in the month
  or before it. No card in a month without one. The run and the Dashboard streak share one walk (`streakEndingOn`); `longestLoggingRunOf` takes
  the month's whole days as the report already counts them, and paused days are skipped. Gallery: Screens/Coach,
  `MonthlyReportWithRecords`. Tests: `longestLoggingRun.test.ts` and `monthlyReport.test.ts` (engine),
  `coach/monthlyReport.test.tsx` (app); `loggingStreak.test.ts` still guards the Dashboard streak over the shared walk.

Not built:
- **Protein days and weigh-ins as rewards**: the adherence card on the Coach screen already shows both as plain counts; no
  acknowledgement was added. A weigh-in count is left out of rewards altogether, as it can pull attention to the scale.
- A reward for workouts as such: the monthly report counts them (MM-33) and nothing more is said.
- A personal record is not announced at the moment the workout is finished, beyond its mark in the list the user lands on.
- For a bodyweight lift the estimate includes body weight, so a record there can come partly from a change on the scale. Nothing in
  the wording refers to weight, so it is shown to everyone, including people with a history of an eating disorder; say if it
  should not be.
- **The weekly summary** does not mention the streak or records (see Decisions).
- A streak is computed from the last 60 days of food, so it cannot read past 60.
- Not checked on a device.
