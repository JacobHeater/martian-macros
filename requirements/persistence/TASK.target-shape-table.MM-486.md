---
id: MM-486
status: done
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

The default split was to wait for this task too (Balanced, 30%, once a choice is kept). It was taken out of
this task on 2026-10-21: an unchosen balance stays MM-24's issued split (MM-122's Decisions), so this task is
the table alone.

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

Scenario: No choice, no change
  Given a person who never chose a balance
  When this ships
  Then their carbs and fat are as the check-in issued them
```

## Notes
- The migration test holds the upgrade from MM-71's version to this one.
- The in-memory wiring in `openAppServices` (the eraser and restorer wrappers) is removed with this task.

## Progress
Built 2026-10-21 on PR #221 (with MM-122 and MM-124). Not run locally; CI validates.
- Schema 16: a `target_shapes` table, one row per day a shape was set from (`since_epoch_day` the key; `fat_share`
  null for a balance not chosen, held between 0.2 and 0.4; `carb_floor_off`; `higher_days` as weekday numbers,
  Sunday 0, joined by commas, empty for a flat week; `raise_share`). `currentSchemaVersion`, `currentSchema`,
  `tables` (so the eraser, the restore and the backup, which is the whole database, carry it), the step keyed 15
  in `migrationSteps`, and the fingerprint for 16 in `test/data/schemaFingerprint.test.ts` (sha256 of
  `currentSchema`, the method reproducing version 15's recorded value first).
- `SqlTargetShapeRepository`, in `SqlRepositories` and `openAppServices`; the in-memory store and its eraser and
  restorer wrappers are gone from `openAppServices`.
- The default did not move: with no balance chosen a day's carbs and fat are as issued (MM-24's split). Moving
  everyone to Balanced was taken out of this task (coordinator, 2026-10-21; MM-122's Decisions).
- Guarding tests: `targetShapeRepositoryContract` in `test/data/sqlContracts.test.ts` as well as the in-memory
  run; `dataEraserContract` now asks that no shape is left (both implementations); `test/data/restore.test.ts`
  (a backup's shapes replace this phone's); `test/data/upgrade.test.ts` (a version 15 database comes up with no
  shape and keeps one saved after); `test/data/schema.test.ts` (the table is named among those added);
  `test/engine/shapedTargets.test.ts` (no balance chosen leaves the targets as issued).
- Not verified: the upgrade from 15 to 16 on the owner's phone, and a shape surviving a restart there.
