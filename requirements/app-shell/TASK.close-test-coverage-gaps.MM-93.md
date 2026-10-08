---
id: MM-93
status: proposed
component: app-shell
related: [MM-89, MM-17, MM-21, MM-25, MM-38, MM-41, MM-62, MM-81, MM-82, MM-90, MM-91]
---

# Task: Test what shipped without a test

## Context
The first working version was built quickly. The engine and the database are well tested (the engine against simulated users). The screens
are thinner: four widget tests cover onboarding for both sexes, logging one food, and the Progress and Coach tabs rendering. While writing
these requirements, each `done` ticket recorded what was not verified. This ticket collects those so they are closed deliberately.

## Description
Add tests for:

| what | ticket | gap |
|---|---|---|
| trend chart draws a line and band from real history | MM-17 | only a single dot was ever seen |
| waist: store round trip, the card, the change summary | MM-21 | no test at all |
| change-goal sheet, and targets following a goal change in the app | MM-25 | no test, not seen on a device |
| energy-mismatch warning; swipe to delete; logging to a past day | MM-38 | no test |
| over-target wording; past day against earlier targets; day picker | MM-41 | no test |
| erase dialog: confirm and cancel | MM-62 | no widget test |
| switching units in Settings | MM-81 | no test |
| editing training days, experience and body fat | MM-82 | no test |
| the day rolling over while the app is open | MM-90 | no test |
| the first adaptive check-in, driven through the app with two weeks of stored data | MM-24 | engine-tested only |

Also add a guard against the failure that cost time while writing the first widget tests: a widget test that awaits the real database from
the test body hangs forever, because widget tests run on a fake clock. Database calls made directly by a test go through
`tester.runAsync`. A test timeout in `mm test` would turn a future hang into a failure.

## Acceptance Criteria
```gherkin
Scenario: Each gap closed
  Then every row in the table above has at least one automated test

Scenario: A hang becomes a failure
  Given a widget test that would wait forever
  Then "mm test" fails it after a timeout instead of hanging

Scenario: Tickets updated
  Then each ticket in the table has its "not verified" note replaced with what now verifies it
```
