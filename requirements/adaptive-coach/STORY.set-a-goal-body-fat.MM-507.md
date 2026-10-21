---
id: MM-507
status: proposed
component: adaptive-coach
related: [MM-36, MM-28, MM-34, MM-129]
---

# Story: Set a goal body fat, kept across restarts

## Context
MM-36 plans the phases ahead and lets a goal body fat replace the cut's default line (`PhaseRule.cutGoalPercent`, 15% for men and
23% for women). The engine takes the goal (`planPhases`'s `goal`), checks it against the floors (`SafetyBounds.checkGoalBodyFat`) and
words a refusal or a limit (`goalBodyFatCheckText`). Storing it needs a table, and the schema was held in another change when MM-36
was built, so MM-36 stopped at the repository's interface (`GoalBodyFatRepository`), its in-memory fixture and its contract suite. No
screen sets a goal yet: a setting that forgets itself on restart would be worse than none.

## Decisions
Choices I made without asking (say if any is wrong):
- **One row, the goal and the day it was set** (`GoalBodyFat`); clearing it returns the plan to its default line.
- **The goal is set from the Coach's goal section**, beside the phase rows (MM-36), with the reason under it as the user types: refused
  under the hard floor, accepted with a warning and a time limit under the soft floor.
- **Never offered with an eating-disorder history**, as MM-36 projects nothing from body fat for that history.

## Description
A SQL table and `SqlGoalBodyFatRepository` (schema migration, tested from every earlier version), run through
`goalBodyFatRepositoryContract`; the repository in `InMemoryRepositories`, `AppServices`, backup and erase; `state.phasePlan` passing the
stored goal to `planPhases`; and the row that sets it, with its gallery story.

## Acceptance Criteria
```gherkin
Scenario: A goal too low
  Given a woman enters a goal of 14% body fat
  Then it is refused, with the reason, and nothing is stored

Scenario: Under the soft floor
  Given a man enters a goal of 9%
  Then it is stored with a warning that, once reached, it is held four weeks at most

Scenario: Kept across a restart
  Given a goal of 18% is set
  When the app is closed and opened again
  Then the plan runs the cut to 18%

Scenario: An eating-disorder history
  Given an eating-disorder history
  Then no goal body fat is offered
```

## Notes
- MM-129's end of a gain should read `PhaseRule.gainEndPercent` and `PhaseRule.longestGainWeeks` rather than repeat them.
