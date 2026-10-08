---
id: MM-61
status: done
component: persistence
related: [MM-59, MM-60, MM-45, MM-63]
---

# Task: Schema migrations that never lose a user's data

## Context
The schema is at version 1 with no upgrade path. The first new table (custom foods, MM-45) will need one. During development the answer has
been "erase the app's data"; once anyone has a month of logs in the app that answer is unacceptable.

## Description
- A migration strategy in `AppDatabase` that steps from any released version to the current one.
- A snapshot of every released schema version checked into the repository (Drift's schema export), and a test that creates a database at
  each old version with representative data, migrates it, and checks the data arrived intact and the result matches a freshly created
  current schema.
- A rule in this folder's process: a pull request that changes a table bumps `schemaVersion`, adds a migration step and its test, and
  exports the new snapshot.
- If a migration fails on a user's device, the app must not open with a half-migrated database: the migration runs in a transaction, and a
  failure leaves the old database intact and shows an error that says the data is safe.

## Acceptance Criteria
```gherkin
Scenario: Upgrading
  Given a version 1 database with a setup, weigh-ins and food entries
  When the app with a later schema opens it
  Then all of that data is present and the schema matches a fresh install

Scenario: Skipping versions
  Given a database two or more versions old
  Then it migrates through each step to the current version

Scenario: A failed migration
  Given a migration step that throws
  Then the database is unchanged at its old version and the app says the data is safe

Scenario: A forgotten bump
  Given a table definition changed without a schema version bump
  Then a test fails
```

## Notes (built and verified)
- `AppDatabase.migration` in `packages/data/lib/src/database.dart`: one step per version in `migrationSteps`, all steps in one
  transaction, `SchemaMigrationException` on failure with a message that says the data is safe. `mm schema` exports the snapshot for
  the current version to `packages/data/drift_schemas/` and regenerates the test helpers in `test/generated_migrations/`; it refuses to
  replace an existing snapshot.
- Tests in `packages/data/test/migration_test.dart`. The schema is still at version 1, so the upgrade, multi-step, failure,
  missing-step and newer-data cases run against a test-only later version that adds a column. The forgotten-bump test was checked by
  adding a column without a bump: it failed with "unexpected entries", and the change was reverted.
- **A database written by a newer app is refused** (not in the original description; needed for restore, MM-63).
- **Not verified**: the error on a device. The app's existing "Could not open your data" screen prints the exception, which carries
  the message; nobody has seen it there. The first real migration (version 1 to 2) will be the first use on real data.
- The rule for contributors is in `AGENTS.md` and the roadmap README's schema lane.
- A backup made by an older version must restore into a newer app (MM-63): restoring is opening an old database, so it uses these same
  migrations.
