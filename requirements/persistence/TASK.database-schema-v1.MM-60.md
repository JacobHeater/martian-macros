---
id: MM-60
status: done
component: persistence
related: [MM-59, MM-5, MM-14, MM-61]
---

# Task: The first database schema, behind one typed interface

## Context
See MM-59.

## Decisions (made with the product owner)
- **Drift over SQLite, not Isar.** Isar's original repository was archived in 2025 and its future rests on a community fork. Drift is
  maintained, is plain SQL underneath, and has migrations and full-text search.

Choices I made without asking (say if any is wrong):
- **Six tables**:

| table | one row per | notes |
|---|---|---|
| `setups` | the user (exactly one row; `id` is constrained to 1) | profile, screening, goal, units |
| `weight_entries` | day | 20 to 500 kg |
| `food_entries` | logged food | values must be zero or more |
| `day_marks` | day | complete, partial, unmarked |
| `waist_entries` | day | 30 to 300 cm |
| `targets_history` | day targets took effect | with the expenditure estimate they were based on |

- **Rules that must never be broken are constraints in the schema**, not only checks in code: sex is `male` or `female` (MM-14), ranges on
  weight and waist, non-negative nutrients, a single setup row.
- **Days are stored as a count of days since 1970**, with no time zone.
- **Nothing outside the data package sees a table or a row.** `MmStore` takes and returns domain objects, and exposes streams so screens
  update when data changes.
- **Targets history is stored, not recomputed.** The weekly step limit depends on what the previous targets actually were.
- **The package is pure Dart.** The app supplies the platform's database connection; tests use an in-memory database.

## Description
`AppDatabase` (the schema) and `MmStore` (the interface) in `packages/data`.

## Acceptance Criteria
```gherkin
Scenario: Round trip
  Given a setup with every field set
  When it is saved and loaded
  Then every field is unchanged

Scenario: One setup
  Then saving a setup twice leaves one row, and inserting a second row directly is rejected

Scenario: Constraints
  Then the database rejects a sex outside male and female, a 5 kg weigh-in, and a second setup row

Scenario: Streams
  Given a screen watching the intake for a day
  When that day's completeness mark changes
  Then the screen receives the updated intake

Scenario: Nothing leaks
  Then the data package exports only the database class and the store
```

## Notes (built and verified)
- `packages/data/lib/src/database.dart` and `store.dart`; generated code in `database.g.dart` (run `mm gen` after a schema change).
  Fourteen tests in `store_test.dart` against an in-memory database.
- Verified on an Android emulator: the app opens the database, and onboarding and targets persist.
- **No test covers waist entries.**
- Planning described storing every observation as an append-only event. What was built is simpler: current-state tables with upserts (a
  corrected weigh-in overwrites the old one). The engine can still recompute everything from what is stored, but the history of edits is
  not kept. If an audit trail or sync is ever wanted, that is the change to make.
- `schemaVersion` is 1 and there is no migration code (MM-61).
