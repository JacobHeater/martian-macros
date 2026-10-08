---
id: MM-67
status: proposed
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

## Notes
- Start on the `health` plugin behind this interface. Where it cannot do anchored or change-token queries, add typed platform channels
  (Pigeon) for those calls only.
