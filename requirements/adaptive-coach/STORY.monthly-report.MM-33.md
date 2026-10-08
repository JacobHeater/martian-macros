---
id: MM-33
status: proposed
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
