---
id: MM-480
status: proposed
component: macro-targets
related: [MM-129, MM-25, MM-128]
---

# Story: A slower lean-gain pace to choose

## Context
MM-129 says a fat-heavy gain would suit "a slower gain, or maintenance for a while", and offers the goal chooser. Lean gain has
no pace of its own to choose: it is set by training status (MM-25), unlike a cut (MM-128). Offering a slower gain needs a
stored choice, which is a setup column and so a migration; MM-129 was built with no schema change, while schema v15 was in
flight.

## Decisions
Choices I made without asking (say if any is wrong):
- **Two paces**: the current one, and half of it. Never faster than MM-25's.
- **Offered where MM-129's card offers a goal**, and on the Coach screen's targets section like the cut's pace row.

## Description
A stored lean-gain pace, chosen on the Coach screen; `computeTargets` uses it on lean gain, under the MM-129 surplus cap.

## Acceptance Criteria
```gherkin
Scenario: Choosing the slower gain
  Given an intermediate lifter on lean gain at 0.15% a week
  When they choose the slower gain
  Then the next targets aim for 0.075% a week, inside the weekly step

Scenario: Offered with a fat-heavy gain
  Given the Coach screen says the gain looks fat-heavy (MM-129)
  Then the slower gain is offered beside maintenance
```

## Notes
- Needs a migration (a setup column); build after schema v15 lands.
