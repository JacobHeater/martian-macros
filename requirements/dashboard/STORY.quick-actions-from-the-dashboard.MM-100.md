---
id: MM-100
status: done
component: dashboard
related: [MM-97, MM-98, MM-16, MM-38, MM-42, MM-43, MM-75]
---

# Story: Start the common actions from the dashboard

## Context
See MM-97. The two things a user does every day are logging food and recording a weigh-in. If the app opens on a dashboard, neither should
cost an extra navigation step compared with today.

## Decisions
Choices I made without asking (say if any is wrong):
- **One prominent "Add food" button** on the dashboard, opening the same sheet as on the Food screen, logging to today, with the meal chosen
  from the clock.
- **The weigh-in is entered in place**: when today has no weigh-in, the weight card has a number field and Save. Once saved it shows the
  trend instead. Correcting today's weigh-in is done on the Progress screen.
- **When barcode scanning exists** (MM-43), a second button opens the scanner directly.
- **When the training log exists** (MM-75), "Start workout" joins them.
- **No more than three actions.** The dashboard is a summary first.
- **After logging from the dashboard the user stays on the dashboard**, and its numbers update.

## Description
Action buttons and the in-place weigh-in on the dashboard.

## Acceptance Criteria
```gherkin
Scenario: Logging a food
  Given the dashboard
  When Add food is tapped and a 510 kcal food is logged
  Then the dashboard is shown again with calories eaten higher by 510

Scenario: Weighing in
  Given no weigh-in today
  When 181.4 lb is entered on the weight card and saved
  Then the card shows the trend weight and no longer asks

Scenario: One tap to start
  Then from a cold start, logging a food begins with one tap and recording a weigh-in begins with one tap

Scenario: Already weighed in
  Given a weigh-in today
  Then the weight card has no entry field
```

## Notes (built and verified)
- The dashboard has the same Add food button as Food (it logs to today, meal from the clock) and stays on the dashboard afterwards. With no weigh-in today the weight card is a number field with Save;
  once saved it shows the trend (`dashboard_test.dart`). Scanner and Start workout are not added because those features do not exist.
- **Not verified**: "one tap from a cold start" was reasoned from the layout, not timed on a device.
