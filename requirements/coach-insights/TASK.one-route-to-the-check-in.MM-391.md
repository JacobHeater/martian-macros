---
id: MM-391
status: proposed
component: coach-insights
related: [MM-256, MM-389]
---

# Task: one way into the weekly check-in on Coach

## Context
Raised by the UX role in the MM-389 review (UX-10) and not built there because it needs the product
designer. In a week the recovery check-in is due, Coach shows two ways to answer it, the one-thing row
("Answer this week's five questions") and the recovery card's "Answer this week", and both explain the
questions as what the log and the scale cannot see.

## Description
Coach offers one way into the check-in while it is due, and says once what the questions are for,
keeping "never to a lower target". The product designer recommends the one-thing row, which sits under
the goal where MM-256 keeps the one routine action: the recovery card drops its "Answer this week"
while the check-in is due and keeps its history. Open: whether "Skip this week" moves into the
check-in.

## Acceptance Criteria
```gherkin
Scenario: The check-in is due
  When Coach is shown in a week the check-in is due
  Then there is one control that opens the check-in
  And what the questions are for is said once
```
