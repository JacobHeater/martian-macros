---
id: MM-206
status: done
component: dashboard
related: [MM-99, MM-100]
---

# Bug: Dashboard Add food can log to a historical day

## Context
A bounded novice meal-logging audit traced Food's retained selected day through
the shared Dashboard Add food action into the saved food entry. A separate
Flutter review corroborated the source-level path against MM-100. No runtime
reproduction has yet been performed.

## Description
Dashboard's Add food action must create a new entry for today, even when Food
retains a selected historical day. Food's own Add food action must continue to
use the day being viewed.

## Acceptance Criteria
```gherkin
Scenario: Dashboard logging targets today after historical Food review
  Given today and yesterday have distinguishable food entries
  And the user selected yesterday in Food
  When the user switches to Dashboard with bottom navigation
  And logs a uniquely identifiable manual food entry using Add food
  Then the new entry is stored exactly once under today
  And yesterday's entries remain unchanged
  And today's Dashboard intake includes the new entry

Scenario: Food logging retains the selected historical day
  Given the user selected yesterday in Food
  When the user logs a food entry from Food
  Then the new entry is stored under yesterday
```

## Notes
Regression guard: `apps/mobile/test/dashboard_test.dart`.
Dashboard's Add food action now explicitly targets `todayProvider`; Food's
floating Add food action continues to use its selected day. The Dashboard
widget test verifies both routes, persisted dates, unchanged historical data,
and updated today's intake. Verified with focused Flutter tests and the
repository-wide `mm check`.
