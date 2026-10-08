---
id: MM-41
status: done
component: food-logging
related: [MM-37, MM-24, MM-38, MM-40, MM-90, MM-98, MM-99]
---

# Story: See today's intake against today's targets

## Context
See MM-37.

## Decisions
Choices I made without asking (say if any is wrong):
- **Calories are the large number**, with the target beside it, a bar, and "N kcal remaining" or "N kcal over".
- **Three macro bars** (protein, carbohydrate, fat), each "eaten / target g".
- **Going over is stated, not scolded**: no red, no warning.
- **A past day is compared with the targets that were in force on that day**, not today's.
- **During calibration a banner counts the day** ("Calibration, day 3 of 14") and says to log everything and weigh in each morning.
- **Entries are grouped by meal**, each with its total; meals with nothing logged are not shown.

## Description
The Today screen, top to bottom: a day picker (back, forward as far as today, and tap the label to return to today); the calibration banner
while it applies; the summary card; a card per meal with its entries (name, macros, how measured, calories); the completeness control
(MM-40). "Add food" floats above.

## Acceptance Criteria
```gherkin
Scenario: An empty day
  Given targets of 2,473 kcal and nothing logged
  Then the card shows 0 of 2,473 kcal and 2,473 kcal remaining

Scenario: After logging
  Given a 510 kcal entry is logged
  Then the card shows 510 and the remaining figure falls by 510

Scenario: Over target
  Given more calories logged than the target
  Then the card says how many kcal over

Scenario: Looking back
  Given targets changed last week
  When a day before the change is viewed
  Then it is compared with the earlier targets

Scenario: No future days
  Then the forward arrow is disabled on today
```

## Notes (built and verified)
- `today_screen.dart` (`_SummaryCard`, `_MealSection`, `_DayPicker`, `_targetsOn`). Seen on a device with no entries; the widget test
  checks the logged-entry case.
- **Not verified**: the over-target wording, viewing a past day against earlier targets, and the day picker (MM-93).
- With the dashboard (MM-98, MM-99) this screen is renamed from "Today" to "Food" and the calibration banner moves to the dashboard.
