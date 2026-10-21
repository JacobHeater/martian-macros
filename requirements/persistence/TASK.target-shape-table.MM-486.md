---
id: MM-486
status: proposed
component: persistence
related: [MM-122, MM-124, MM-60, MM-61, MM-63, MM-325]
---

# Task: Keep the carbs-and-fat balance and the week shape on the phone

## Context
MM-122 (the balance of carbohydrate and fat) and MM-124 (the week's higher days) were built while another
branch held the next schema version (MM-71, schema 15), and only one schema change may be in flight. So they
were built against `TargetShapeRepository` with its in-memory fixture and contract suite
(`test/contracts/targetShapeRepositoryContract.ts`), and the app is given the in-memory one on the phone too
(`openAppServices`). A shape set on the phone lasts until the app closes. The app's erase and restore clear it,
so nothing is left behind.

The default split also waits for this task: until a choice is kept, an unchosen balance is MM-24's (fat the
larger of its minimum and 25% of calories). With this task, the default becomes Balanced (30%), as MM-122
decided.

## Description
A table of target shapes, one row per day a shape was set from, and `SqlTargetShapeRepository` over it, chosen
in `SqlRepositories` and `openAppServices` in place of the in-memory one. The schema version goes up by one,
with its migration step, after the version MM-71 takes (`src/data/AGENTS.md`). The table goes into the
eraser, the backup and its description, and the restore, like every other table.

## Acceptance Criteria
```gherkin
Scenario: A shape outlives the app
  Given the balance set to More fat and Saturday and Sunday set 20% higher
  When the app is closed and opened again
  Then both are as they were, and so are the day's targets

Scenario: Past days keep their shape
  Given a shape set three weeks ago and changed today
  Then the days before today are read with the old shape and today with the new

Scenario: The contract
  Then targetShapeRepositoryContract passes against the SQL implementation as well as the in-memory one

Scenario: Erase and backup
  When the app's data is erased
  Then no shape is left
  And a backup holds the shapes and a restore brings them back

Scenario: The default becomes Balanced
  Given a person who never chose a balance
  When this ships
  Then their fat is 30% of calories, never under its minimum, and carbs at least 100 g where they fit
```

## Notes
- The migration test holds the upgrade from MM-71's version to this one.
- The in-memory wiring in `openAppServices` (the eraser and restorer wrappers) is removed with this task.
