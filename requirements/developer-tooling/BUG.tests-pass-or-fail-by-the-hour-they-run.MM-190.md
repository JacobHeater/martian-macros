---
id: MM-190
status: done
component: developer-tooling
related: [MM-7, MM-93, MM-167, MM-169, MM-187]
---

# Bug: Six Food-screen tests passed or failed by the hour they ran

## Context
`main` was red in CI from the merge of MM-184 onward, while the same tests passed on the development machine. The cause was not the
operating system. The add-food sheet chose a new entry's meal from the device's time (`DateTime.now().hour`) instead of the app's
`Clock`: Breakfast before 11:00, Lunch before 15:00, Dinner before 21:00, otherwise Snack. Every test fixes the day with `FixedClock`,
but the hour still came from the machine. CI runs in UTC, so a run after 15:00 UTC put the entry under Dinner, further down the Food
screen's lazy list; once the calorie hero grew taller (MM-187) that section was no longer built, and a test that looked for the entry or
tapped it found nothing.

The tests failing: four in `food_portion_test.dart` (including the MM-169 regression test), `app_test.dart` ("logging food updates the
day against its targets") and `estimate_meal_test.dart` ("a regular balanced meal is logged as an estimate").

It was first written up as a Linux layout difference. That was wrong, and was a guess made without reproducing it: `main` passes on
Linux in the morning and fails in the afternoon, on any operating system.

## Decisions
- **The app asks its `Clock` for the time, everywhere.** The add-food sheet's default meal, the birth-date picker's range and the demo
  seed's "today" read the device directly; all three now ask the clock. `SystemClock` is the one place that reads the device.
- **An architecture rule keeps it so**: `DateTime.now` is refused in the app and the packages outside `SystemClock`.
- **`FixedClock` can fix the hour**, noon by default, so a test about the time of day can say which.
- **The tests also scroll to what they look for** (`revealOnFoodScreen`), so they do not depend on which meal section is on screen.

## Acceptance Criteria
```gherkin
Scenario: A new entry's meal follows the app's clock
  Given the app's clock says 08:00, 12:00, 19:00 or 22:00
  When food is added without choosing a meal
  Then it is logged under Breakfast, Lunch, Dinner or Snack respectively

Scenario: The tests pass at any hour
  Given the machine's time is morning, afternoon or night
  Then the app's tests pass

Scenario: Reading the device's time is refused
  Given code in the app or a package calls DateTime.now outside the system clock
  Then the architecture check fails
```

## Notes
- Regression tests: `apps/mobile/test/default_meal_follows_clock_test.dart` and `tool/test/one_clock_rule_test.dart`.
- Reproduce on any Linux or macOS machine by running the app's tests with `TZ` set so the local hour is past 15:00 (for example
  `TZ=Etc/GMT-10`). Before the fix six tests fail; after it none do.
