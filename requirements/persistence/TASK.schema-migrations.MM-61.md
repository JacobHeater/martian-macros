---
id: MM-61
status: proposed
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

## Notes
- A backup made by an older version must restore into a newer app (MM-63): restoring is opening an old database, so it uses these same
  migrations.
