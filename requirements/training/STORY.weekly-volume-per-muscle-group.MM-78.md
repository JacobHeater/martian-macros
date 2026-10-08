---
id: MM-78
status: proposed
component: training
related: [MM-74, MM-75, MM-76, MM-79]
---

# Story: See how much I train each muscle group

## Context
See MM-74. Whether training is enough to drive muscle gain is mostly a question of hard sets per muscle group per week.

## Decisions (made with the product owner)
- **Weekly hard sets per muscle group.**

Choices I made without asking (say if any is wrong):
- **A hard set is one logged with 4 or fewer reps in reserve**, or with no RIR recorded.
- **A set counts fully toward its exercise's primary muscle group and half toward each secondary one.**
- **The week is the last seven days**, not a calendar week, so the figure does not reset on Monday.
- **Shown against a broad reference range** of 10 to 20 hard sets a week per group, described as a typical range, not a rule.

## Description
A view of hard sets per muscle group over the last seven days, with the previous seven for comparison.

## Acceptance Criteria
```gherkin
Scenario: Counting
  Given 4 sets of bench press (chest primary; shoulders and triceps secondary) in the last seven days
  Then chest shows 4 sets and shoulders and triceps 2 each

Scenario: Easy sets do not count
  Given a warm-up set logged with 6 reps in reserve
  Then it is not counted

Scenario: A neglected group
  Given no hamstring work in two weeks
  Then hamstrings show zero, visibly below the reference range
```
