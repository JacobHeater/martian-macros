---
id: MM-164
status: done
component: onboarding
related: [MM-9, MM-10, MM-12, MM-82, MM-24, MM-131, MM-132]
---

# Story: Ask how active I am outside the gym, and use it in my starting estimate

## Context
The first calorie target is built from a starting estimate of total daily energy expenditure (TDEE) before any logs exist: resting energy (Mifflin-St Jeor) times an activity factor. The factor was chosen from **training days per week alone** (1.35, 1.45 or 1.55). Nothing asked how active the user is the rest of the day, which is most of the difference between two people of the same size: a desk worker and a postal carrier who both train three days differ by roughly a quarter of their expenditure.

The screen also said the estimate came "from your height, weight, age, and sex", which left out the one input that did change it. Both are defects. They matter most in the first two weeks, when the day-one target and the safety floor rest on this number; after that the estimator replaces it with a measurement (MM-24).

## Decisions
Choices I made without asking (say if any is wrong):
- **Four plain-language levels of daily activity outside workouts**, each with a typical step count so a user can place themselves:
  | Level | Wording | Typical steps | Daily factor |
  |---|---|---|---|
  | seated | Mostly seated (desk work, driving) | about 3,000 | 1.20 |
  | light | Light movement (some walking, errands) | about 6,000 | 1.30 |
  | on feet | On my feet most of the day (retail, teaching, care work) | about 10,000 | 1.40 |
  | physical | Physical job (trades, farming, delivery on foot) | 12,000 or more | 1.50 |
- **Training adds to it**: factor = daily factor + 0.025 per training day per week. 0.025 times typical resting energy (about 1,700 kcal) is about 42 kcal a day per weekly session, roughly 300 kcal a session, a moderate hour of lifting.
- **Cross-check against the common published multipliers** (1.2 sedentary, 1.375 light, 1.55 moderate, 1.725 hard, which combine exercise and daily life): seated with 3 training days gives 1.275, light with 3 gives 1.375, on feet with 4 gives 1.50, physical with 6 gives 1.65. These sit at or just under the published values, which is intended: the starting estimate is deliberately conservative, because overestimating expenditure overfeeds a cut and the estimator corrects upward faster than it corrects a wrong safety floor.
- **Uncertainty stays 15%.** Self-reported activity is the least certain input; the measurement replaces it.
- **Asked on its own onboarding step**, before Training, one question per screen, default "Light movement" selected. Editable in Settings.
- **Existing users** get "Light movement" until they change it. Their targets do not change until their next check-in (as MM-82).
- **The Coach screen names every input** of the starting estimate: sex, age, height, weight, daily activity and training days.
- **Not asked**: steps from a wearable. Health-platform sync is a separate workstream (it would replace this answer with data).
- **Reviewed by a professional?** No. The table is a documented heuristic, not clinical guidance. It is exactly the kind of number the professional review (MM-29) should see.

## Description
A `DailyActivity` setting, an onboarding step and a Settings row for it, a stored column with a migration, and the starting-estimate rule above with tests for every level and training-day count.

## Acceptance Criteria
```gherkin
Scenario: Asked during onboarding
  Given the measurements step is complete
  When the user continues
  Then a step asks how active they are outside workouts, with four options and typical step counts, before the training step

Scenario: Different activity, different starting estimate
  Given two users with identical sex, age, height, weight and 3 training days
  When one chooses "Mostly seated" and the other "Physical job"
  Then the second user's starting expenditure is about 24% higher, and so is their day-one target

Scenario: Training days still count
  Given "Light movement"
  When training days change from 2 to 5
  Then the starting estimate rises by 0.075 times resting energy

Scenario: Existing data survives
  Given a database from before this change with a saved setup
  When the app opens
  Then the setup loads, its activity is "Light movement", and every other row is unchanged

Scenario: Editing it later
  When the user changes the level in Settings
  Then the stored setup has the new level and the next check-in uses it

Scenario: The screen says what the estimate used
  Given the starting estimate is shown on the Coach screen
  Then the text names sex, age, height, weight, daily activity and training days

Scenario: A measurement replaces it
  Given 14 days of logs and weigh-ins
  Then the activity answer no longer affects expenditure
```

## Notes
- Engine: `activityFactor` and `initialTdeePrior` (`packages/engine`); table of factors in one place with a test per cell.
- Data: schema version 2 adds `daily_activity` to `setups` (default `light`); migration test from the real version-1 snapshot.
- If the professional reviewer prefers different factors, only the table and its test change.

## Progress (built and verified)
- Engine: `activityFactor` and `initialTdeePrior` (`packages/engine`), one test per level and training-day count (32 cases) plus bounds, ordering and the cross-check against published multipliers (`activity_factor_test.dart`).
- Domain and data: `DailyActivity`, `UserSetup.dailyActivity` (default light); schema version 2 adds `setups.daily_activity`; migration test from the real version-1 snapshot with a populated setup row.
- App: a "Your day" onboarding step before Training; "Daily activity" in Settings; the Coach copy names every input. Tests drive onboarding for a seated and a physical-job user and check the day-one targets differ by more than 400 kcal.
- Device: upgraded the emulator's existing version-1 database in place; the setup, targets and check-in date were intact and the starting estimate moved from 3,137 to 3,029 kcal (the new factor for light movement with 4 training days is 1.40, below the old 1.45).
- Existing users' targets do not change until their next check-in.
- **Not verified**: the factors have not been reviewed by a professional (MM-29); they are a documented heuristic. One simulation test (`phase_change_test.dart`) shows the size of an old defect; its threshold was lowered from 250 to 200 because the simulated users now start from a lower prior (the measured error is 236).
