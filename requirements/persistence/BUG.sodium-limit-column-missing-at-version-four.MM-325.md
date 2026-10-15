---
id: MM-325
status: done
component: persistence
related: [MM-305, MM-311, MM-231]
---

# Bug: the daily sodium limit would not switch on, on a phone that ran an earlier build

## Context
The owner, 2026-10-14: "Why is the daily sodium limit toggle not working?" The switch springs back off.

Database version 4 changed after it had been built and installed. The build drawn for the panel (14aa735)
created version 4 without `user_preferences.sodium_limit_since_epoch_day`; the build after the panel
(75f00ba) added that column to the same 3-to-4 step without raising the version. A phone that ran the first
build is at version 4 and never gets the column, so saving the limit fails ("no such column"), the failure
was swallowed, and the switch went back off. The water goal's column was there from the start, so it works.
In tests and Storybook every database is new, so nothing showed it.

## Description
- Version 5: a step that adds `sodium_limit_since_epoch_day` when a version 4 database lacks it, and does
  nothing when it has it.
- A released version cannot change shape again unnoticed: each version's schema is fingerprinted, and a
  change to the schema without a new version fails the tests.
- A goal switch whose save fails says so, and stays as it was.

## Acceptance Criteria
```gherkin
Scenario: A phone that ran the first build
  Given a database at version 4 without the sodium limit's start day
  When the app opens it and the sodium limit is switched on
  Then the limit is 2,300 mg from today

Scenario: The schema changes without a new version
  When currentSchema changes and currentSchemaVersion does not
  Then the tests fail

Scenario: A save that fails
  Given the sodium limit cannot be saved
  When it is switched on
  Then a snack says it could not be saved, and the switch stays off
```

## Notes
Regression test: "a version 4 database from the build drawn for the panel can switch the sodium limit on" in
`test/data/upgrade.test.ts`; it failed before the fix and passes after.
