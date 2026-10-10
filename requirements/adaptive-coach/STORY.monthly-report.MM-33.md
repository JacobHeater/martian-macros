---
id: MM-33
status: in-progress
component: adaptive-coach
related: [MM-22, MM-17, MM-21, MM-23, MM-24, MM-77, MM-86]
---

# Story: A monthly report

## Context
Daily screens show today. Body change is visible over months. The plan for the first month ends with a report on day 28, and the Coach
unlock's trial (MM-86) is timed so the paywall arrives after the user has seen what the app measured about them.

## Decisions (made with the product owner)
- **A report on day 28, then monthly.** It covers: waist change, estimated one-rep-max change, adherence, the expenditure estimate with its
  uncertainty, and the body-fat range if one has settled.

Choices I made without asking (say if any is wrong):
- **Also in it**: trend weight change against the intended pace, days logged and days marked complete, weigh-ins, average protein against
  target, and each target change in the month with its reason.
- **Reports are kept** and can be reread.
- **The weekly check-in gets a short version**: what changed in the targets and why.

## Description
A report screen generated from stored history for a date range, reachable from the Coach screen, with a notice when a new one is ready.

## Acceptance Criteria
```gherkin
Scenario: The first report
  Given 28 days since onboarding
  Then a report is available covering those 28 days

Scenario: Honest about thin data
  Given a month with six logged days
  Then the report says the expenditure estimate could not be measured and why, rather than showing a number

Scenario: Target changes are explained
  Given two check-ins in the month changed the targets
  Then the report lists both, with the estimate each was based on
```

## Notes
- Photos side by side were in the original plan for the report. Photos are not planned yet; leave room for them.

## Progress
Built:
- **A report every 28 days from the day coaching started** (`reportPeriods`, `buildMonthlyReport`, pure). The first is ready the day
  after day 28; one more every 28 days. Reports are not stored: each is rebuilt from the stored history when opened (the food log is
  read from the start of its own month, not only the last 60 days), so an old one can be reread. If an old entry is later edited, the
  old report changes with it.
- **What it holds**, as four cards: what you did (days logged of 28, whole days, weigh-ins, average protein against the target
  then in force); what your body did (trend weight change against the change the targets intended, and the waist change from the
  first to the last measurement); what the coach measured (the expenditure estimate with its uncertainty); and every change to the
  targets in the month, each with its reasons and the estimate it was based on.
- **Honest about thin data**: with fewer than 14 whole days of food in the month the estimate card says it was not measured, how many
  whole days there were, and how many the coach needs, instead of showing a number. With enough food but no settled estimate it says
  that. A trend change needs four weigh-ins.
- **Reaching it**: a "Monthly reports" card on the Coach screen listing every report, newest first, and for a week after one is
  ready a notice on the Dashboard.
- Tests: `monthly_report_test.dart` (engine and app). The app tests include six logged days, two target changes listed with their
  estimate, a report reread from a later day, and no grading or praise.

Not built:
- **Estimated one-rep-max change** (needs the training log, MM-75 and MM-77).
- **The body-fat range if one has settled** (needs the body-fat estimate from measurements, MM-34).
- **The short weekly version** at the weekly check-in: the existing target-change summary (MM-138) already says what changed and why.
- **Photos** (MM-157): no room is left on the screen yet.
- Adherence is shown as counts and protein; the report does not repeat the adherence summary's intake-against-target line, because
  that wording is for a week and the report restates nothing it can avoid.
- Not checked on a device.
