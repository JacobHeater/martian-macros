---
id: MM-21
status: done
component: weight-trend
related: [MM-15, MM-32, MM-34]
---

# Story: Track waist circumference

## Context
For someone recomposing, weight may barely move while fat is lost and muscle gained. Waist is the cheapest measurement that shows it: a
tape costs a few dollars and repeats to within about a centimeter, far better than a consumer body-fat scale.

## Decisions (made with the product owner)
- **Waist is one of the three headline progress measures**, with trend weight and strength.

Choices I made without asking (say if any is wrong):
- **The instruction**: measure at the navel, relaxed; take three and enter the middle one; once a week is plenty.
- **One value per day; 30 to 300 cm accepted.**
- **The card shows the latest value and the change since the first.**

## Description
The Progress screen has a "Waist" card: a number in the user's length unit and Save. With no entries it shows how to measure; with entries
it shows the latest value and date, and the change since the first entry.

## Acceptance Criteria
```gherkin
Scenario: First measurement
  When 36 in is saved
  Then the card shows the latest value as 36.0 in

Scenario: Change over time
  Given a first measurement of 92 cm and a later one of 90 cm
  Then the card shows a change of -2.0 cm since the first date

Scenario: Inches are stored as centimeters
  Given the user's unit is inches
  When 36 is saved
  Then 91.4 cm is stored
```

## Notes (built, not verified beyond compiling)
- The waist `_EntryCard` and `_waistSummary` in `progress_screen.dart`; `MmStore.saveWaist` and `watchWaist`.
- **No test covers waist**, in the data package or the app, and it was not exercised on a device. Add both under MM-93.
- Not built: a waist chart, and using waist in the recomp signal (MM-32) or a body-fat estimate (MM-34).
