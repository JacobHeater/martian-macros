---
id: MM-432
status: proposed
component: adaptive-coach
related: [MM-135, MM-117, MM-31, MM-325]
---

# Story: Choose a one-week break instead of two

## Context
MM-135 built the diet break at two weeks, chosen or planned, on the panel's recommendation ("two weeks by default, one
selectable"). The second half was not built: the length a person chooses has to survive between the press on the Coach
screen and the check-in that issues the break's targets, and nothing stored carries it. `UserSetup` has the day a break
was chosen (`maintenanceWeekFrom`) and no length; `user_preferences` has fixed columns; a targets record's flags could
carry the length once the record exists, but the engine writes that record from the setup. A `setups` column is
unavoidable, and the schema belongs to another lane (MM-325), so MM-135 stopped this item here.

## Description
Add `break_weeks` (1 or 2, default 2) to `setups` with a new schema version and migration step, carry it through
`UserSetup`, the setup repository contract and its fixture, and let the Coach's offer (`ReliefOfferCard`) choose the
length: two weeks as the prominent choice, one week beside it, in the same card or a sheet like the pace sheet
(`PaceSheet`). `nextTargets` and `breakInForce` read the length from the break's first record rather than
`DietBreakRule.breakWeeks`, so a break's length is the one chosen when it began; the planned break at twenty weeks stays
two weeks. A one-week break is partly consumed by the glycogen rebound and the engine's blind period (MM-131): the sheet
says so, without a metabolic claim.

## Acceptance Criteria
```gherkin
Scenario: One week chosen
  Given the break offer on the Coach screen
  When the person chooses one week
  Then targets go to maintenance at once, flagged as the break they chose, and the next check-in is seven days later

Scenario: Two weeks is the default
  When the person takes the break without choosing a length
  Then the break is two weeks

Scenario: The length survives a restart
  Given a one-week break chosen today
  When the app is closed and opened again before the check-in runs
  Then the break issued is one week

Scenario: The planned break is unchanged
  Given twenty unbroken weeks of deficit
  Then the break the app plans is two weeks whatever was chosen before
```

## Notes
- Needs a schema version bump (`currentSchemaVersion.ts`, `currentSchema.ts`, a migration step and its test; MM-325).
- `nextCheckIn` must read the break's own length too, or the Coach and dashboard say the wrong date.
