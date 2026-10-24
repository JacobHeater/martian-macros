---
id: MM-615
status: proposed
component: coach-insights
related: [MM-141, MM-124, MM-605]
---

# Bug: "Weekends higher" can rest on one day

## Context
`weekendHigher` (MM-141, `findInsights.ts:204-212`) compares the mean of weekend days with the mean of weekdays, with as few as 2
weekend days (`WeekPatternRule.minimumWeekendDays`) and no check that the weekends agree. With a 2,000 kcal target, one Saturday
1,000 kcal over and an on-target Sunday make the weekend mean 500 over, which is 25% of target. That passes the 20% threshold, so
the insight fires on a single day, against MM-141's own rule. Found by the measurement panel on 2026-10-24 and confirmed by
reading the code.

## Description
"Weekends higher" needs every contributing week to agree: ≥ 3 weeks each with the weekend beyond the margin in the same direction,
or ≥ 5 weeks with ≥ 80% agreeing. Each week is paired within itself: the weekend against that week's own weekdays (MM-605's D5).

## Acceptance Criteria
```gherkin
Scenario: One big Saturday
  Given 14 whole days at target except one Saturday 1,000 kcal over
  Then no weekends-higher insight is shown

Scenario: A real weekend pattern
  Given 3 weeks each with the weekend at least 20% of target above that week's weekdays
  Then the insight is shown
```

## Notes
Regression test: the one-Saturday scenario, written to fail on the current rule.
