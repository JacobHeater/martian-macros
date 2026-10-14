---
id: MM-312
status: in-progress
component: coach-insights
related: [MM-305, MM-311, MM-141, MM-108, MM-144]
---

# Story: The coach notices days over the sodium limit

## Context
See MM-305 and MM-311. The owner asked that going over the sodium limit gets a coach line, beyond the
plain number. The coach's insights (MM-141) come from a fixed catalog of rules, each a pattern over
`InsightRationing.patternDays` days resting on at least `minimumBasisDays` days of data; nothing in the
catalog is about a single day.

## Decisions
The product owner's (2026-10-14): a coach line, as well as the number.

Choices I made without asking (say if any is wrong):
- **A pattern, not a day.** A new rule, `sodiumOverLimit`, in the catalog with priority `pattern`, so one
  salty dinner never produces a line; the day itself is said in the Micros view (MM-311). This keeps
  MM-141's rule that no insight is about a single day.
- **It fires** when a limit is set and, among the period's whole days that can be judged, the known sodium
  was over the limit on more than half, with at least `minimumBasisDays` days judged. A day can be judged
  when its known total is over the limit (missing can only add) or when its foods with a sodium value
  carry at least 70% of its calories (the fiber rule's threshold, MM-126).
- **The words**: "Sodium was over your limit on 9 of 14 days. Most sodium in a typical diet comes from
  packaged and restaurant food, so those are the usual place to look." No food is named as bad (MM-108).
- **Not about weight**, so it is not suppressed for an eating-disorder history; it follows the same
  rationing as every other insight.

## Description
The rule in the catalog, its finding in `findInsights`, its text, and its tests.

## Acceptance Criteria
```gherkin
Scenario: A pattern
  Given a limit of 2,300 mg and 14 whole days, 9 of them with known sodium over 2,300 mg
  Then the coach's insight is about sodium over the limit, and says 9 of 14 days

Scenario: One day is not a pattern
  Given a limit and one day over it in the period
  Then there is no sodium insight

Scenario: No limit
  Given no sodium limit set
  Then there is no sodium insight, whatever was eaten

Scenario: Days that cannot be judged are left out
  Given days under the limit on which most calories came from foods with no sodium value
  Then those days are not counted as under the limit

Scenario: Plain words
  Then the insight names no food as good or bad
```
