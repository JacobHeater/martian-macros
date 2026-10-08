---
id: MM-16
status: done
component: weight-trend
related: [MM-15, MM-10, MM-17, MM-68, MM-71]
---

# Story: Log a daily weigh-in

## Context
See MM-15. Weigh-ins are the engine's most important input: without them there is no trend and no measured expenditure.

## Decisions
Choices I made without asking (say if any is wrong):
- **One reading per calendar day.** Saving again on the same day replaces it. (When health platforms supply several readings a day, MM-71
  chooses which one counts.)
- **The day is the user's local calendar day**, stored without a time zone, so travel and daylight saving never split or merge days.
- **Weights outside 20 to 500 kg are rejected** by the database; the screen shows "That value looks off".
- **The card says when to weigh**: first thing in the morning, after the bathroom. Consistency matters more than the scale's accuracy.

## Description
The Progress screen has a "Today's weigh-in" card: one number in the user's weight unit and a Save button. If today already has a reading
the field shows it and Save is disabled until the number changes.

## Acceptance Criteria
```gherkin
Scenario: Saving a weigh-in
  Given no weigh-in today
  When 89.5 kg is entered and saved
  Then today's weigh-in is 89.5 kg and the trend updates

Scenario: Correcting it
  Given today's weigh-in is 89.5 kg
  When 89.2 is entered and saved
  Then today has one weigh-in, of 89.2 kg

Scenario: Pounds are stored as kilograms
  Given the user's unit is pounds
  When 200 is saved
  Then the stored weigh-in is 90.7 kg

Scenario: An impossible value
  When 5 kg is saved
  Then nothing is stored and the user is told the value looks off
```

## Notes (built and verified)
- `_EntryCard` in `apps/mobile/lib/src/progress/progress_screen.dart`; `MmStore.saveWeight` (an upsert keyed on the day);
  `CalendarDate` in `mm_domain`.
- Data tests cover one-per-day and the range check; the widget test "progress and coach tabs render from stored data" saves a weigh-in.
- Not built: logging a weigh-in for a past day, and deleting one from the screen (the store can delete; nothing calls it).
