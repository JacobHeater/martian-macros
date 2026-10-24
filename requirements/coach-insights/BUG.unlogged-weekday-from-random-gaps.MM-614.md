---
id: MM-614
status: proposed
component: coach-insights
related: [MM-141, MM-605]
---

# Bug: The unlogged-weekday insight fires on random gaps

## Context
`consistentDay` (MM-141, `findInsights.ts:262-267`) fires when any weekday is unlogged in both of the last two weeks and each week
has ≥ 5 logged days. For a person who skips 2 random days a week, the chance that the two weeks share no skipped weekday is
C(5,2)/C(7,2) = 10/21. So it fires about 52% of the time. With 1 random skip a week it fires about 14% of the time. The coach
states a weekday habit that does not exist. Found by the measurement panel on 2026-10-24, by calculation, and confirmed by
reading the code.

## Description
An unlogged-weekday finding needs the weekday unlogged in ≥ 3 of the last 4 weeks, each with ≥ 5 logged days (MM-605's D5). Until
MM-605 replaces the rule, the existing rule uses that test.

## Acceptance Criteria
```gherkin
Scenario: Random gaps
  Given a simulated user leaving 2 random days a week unlogged for 8 weeks
  Then the unlogged-weekday insight appears in at most 2% of evaluations

Scenario: A real habit
  Given Saturday unlogged in 3 of the last 4 weeks, each with 5 or more logged days
  Then the insight names Saturday
```

## Notes
Regression test: the random-gap simulation above, written to fail on the current rule.
