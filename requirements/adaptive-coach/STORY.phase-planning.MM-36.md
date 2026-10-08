---
id: MM-36
status: proposed
component: adaptive-coach
related: [MM-22, MM-25, MM-28, MM-31, MM-33]
---

# Story: Plan the phases ahead

## Context
Changing body composition over a year is a sequence: cut, hold, gain, hold. Today the user picks one goal and the app follows it until they
change it. Nothing says when to change, or how long the current phase should last.

## Decisions (made with the product owner)
- **At each phase boundary the app recommends the next phase** from current body fat and rate of progress (cut, then maintenance, then lean
  gain, and so on).
- **A goal body fat may be set**, within the floors in MM-28.

## Description
- The user may set a goal body fat (or goal weight). Below the soft floor it is accepted with a warning and a time limit; below the hard
  floor it is refused.
- The Coach screen shows the current phase, how long it has run, and a projected end at the current pace.
- When a phase ends (goal reached, sixteen weeks of deficit, or progress stalled), the app recommends the next phase with its reason, and
  the user accepts or chooses another.

## Acceptance Criteria
```gherkin
Scenario: A goal too low
  Given a woman sets a goal of 14% body fat
  Then it is refused, with the reason

Scenario: A projected end
  Given a fat-loss phase at a steady pace toward a goal
  Then the Coach screen shows about when the goal will be reached

Scenario: The next phase
  Given a man has cut to 12% body fat
  Then the app recommends maintenance, then lean gain, and says why
```

## Notes
- Depends on a body-fat estimate better than the formula (MM-34), or the projections are fiction.
- Part of the paid Coach unlock (MM-84).
