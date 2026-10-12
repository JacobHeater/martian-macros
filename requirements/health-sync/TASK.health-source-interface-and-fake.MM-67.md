---
id: MM-67
status: done
component: health-sync
related: [MM-66, MM-68, MM-69, MM-71]
---

# Task: One interface for health platforms, and a fake that replays history

## Context
See MM-66. HealthKit cannot be exercised on Windows at all, and Health Connect only on a device with data in it. Without a seam, every
screen that shows imported data needs a phone with a scale attached to test.

## Description
- A `HealthSource` interface in a new `packages/health_ingest` package: which data types are available and permitted; request permission;
  read samples of a type in a date range, each with its value, time, a stable id, and the source app or device; read changes since a saved
  token; write nutrition.
- A `FakeHealthSource` that loads a recorded history from a file (several sources, overlapping readings, gaps, an edited reading, a deleted
  reading) and serves it through the same interface, including the "changes since" behavior and an expired token.
- Imported samples are stored in their own table with source and platform id, separate from readings the user typed, so a re-import never
  duplicates and a typed correction is never overwritten.

## Acceptance Criteria
```gherkin
Scenario: Screens need no device
  Given the fake source loaded with a recorded history
  Then the trend, the weigh-in list and the source choices can be shown and tested on any machine

Scenario: Importing twice
  Given a history is imported and then imported again
  Then there are no duplicate readings

Scenario: A reading deleted on the platform
  Given an imported reading the platform later reports as deleted
  Then it is removed from the app

Scenario: The fake behaves like the real thing
  Then one shared test suite passes against the fake and, on a device, against each real source
```

## Progress
Built (2026-10-11), with the product owner away; the choices are mine, say if any is wrong:
- **`packages/health_ingest`**, pure Dart, with no platform plugin in it (`mm arch` forbids one): `HealthSource` (what is available
  and permitted, asking permission, reading a type over a range, changes since a token, writing nutrition), `HealthSample` (value,
  times, the platform's id, the source app or device), and one unit per type whatever the platform.
- **`HealthImporter`** brings a `HealthSampleStore` up to date from a source: only what changed since the saved token; an edited
  reading replaces the stored one; a deleted one is removed; importing twice changes nothing; an expired token means everything is
  read again and the store made to match. The token is saved last, so an import cut short is repeated harmlessly.
- **`FakeHealthSource`** replays a recorded history given as JSON (a string or a file's contents): several sources, two readings
  the same morning, a gap, an edit, a deletion. A test lets part of the history happen, imports, lets the rest happen, and imports
  again. Tokens can be expired and permission refused. `recordedHealthHistory` is one such history; every reading in it is made up.
- **`healthSourceContract`**, the shared suite: it assumes no particular readings, so the same suite can run against a real
  platform on a device. It runs against the fake in four states.
- A stored reading is keyed by type and platform id, apart from anything the user typed. `InMemoryHealthSampleStore` is the only
  store so far.

Built (2026-10-11), schema 29:
- **Two tables**: `imported_samples`, one row per platform reading keyed by type and platform id, and `health_import_tokens`,
  where each type's import left off. A Drift `HealthSampleStore` over them, held to the same suite (`healthSampleStoreContract`)
  as the in-memory one. Nothing imported is written to the weigh-ins the user typed.
- **Erasing the user's data empties both**, in the database and in memory (tested in each).
- **The app's providers**: `healthSampleStoreProvider`, `healthSourceProvider` (throws until a platform is registered) and
  `healthImporterProvider`. The app may not import the fake (`mm arch`).

Left to the tickets that own them:
- Any real platform: Health Connect is MM-68, HealthKit MM-69. `healthSourceContract` has run only against the fake; running it
  on a device is part of those.
- Nothing above the seam: no screen shows an imported reading, and which reading counts when two sources disagree is MM-71. So
  the first scenario above is met for the import and the store, not yet for a trend or a list on screen.
- The ticket named the `health` plugin as the start; no plugin was added here.

## Notes
- Start on the `health` plugin behind this interface. Where it cannot do anchored or change-token queries, add typed platform channels
  (Pigeon) for those calls only.
