---
id: MM-314
status: done
component: health-sync
related: [MM-305, MM-313, MM-70, MM-66, MM-242]
---

# Story: Water I log is written to my phone's health app

## Context
See MM-305 and MM-313. The owner asked that logged water be written to the phone's health platform. The app
reads from Health Connect today (`MmHealth`, read-only) and writing nutrition is MM-70, still proposed.
Health Connect has a `HydrationRecord` (volume over an interval) and HealthKit has
`HKQuantityTypeIdentifierDietaryWater`.

## Decisions
The product owner's (2026-10-14): water is written to the health platform.

Choices I made without asking (say if any is wrong):
- **Built with MM-70's write path**, not before it: the same permission screen, the same switch in Settings,
  the same rule that only what the user logged in this app is written.
- **One record per water entry**, at the entry's time, so a removal in the app deletes that record.
- **No hydration is read back** from the platform in this ticket; another app's water would need its own
  rule for double counting.
- **Its own switch and permission** (2026-10-21), "Send water you log to …", beside MM-70's food switch rather than the same
  one: each write is asked for by itself, apart from reading.
- **A drink is a minute on Health Connect**, which keeps hydration over a span: from the time it was logged, a minute
  long. On iOS it is a dietary water sample at that time. Its id is `martian-macros-water-<entry id>`; a change of amount
  writes it again under that id.

## Description
Each water entry is written to Health Connect (and HealthKit when iOS exists) as it is logged, and removed
when it is removed, once the user has allowed writing.

## Acceptance Criteria
```gherkin
Scenario: Written
  Given writing to Health Connect is allowed
  When a glass of water is logged
  Then Health Connect has a 250 ml hydration record at that time from Martian Macros

Scenario: Removed
  When that entry is removed in the app
  Then the hydration record is deleted

Scenario: Not allowed
  Given writing is not allowed
  Then logging water works as before and nothing is written
```

## Notes
- Waits for MM-70 (WS-11 step 6). Verifying it needs a device or emulator with Health Connect.
- Built 2026-10-21 with MM-70, not run locally; CI validates: `MirroredWaterLog` with the water repository contract
  (`test/healthWrite/mirroredLogs.test.ts`), `writeWater` and `removeWater` of both plugins, `WRITE_HYDRATION` in the
  manifest.

## Progress
Done (2026-10-21): every scenario is built with MM-70's write path and held by the tests named in the notes; not run
locally, CI validates.

## Owed on a phone
- A glass shows as 250 ml at its time in Health Connect and Apple Health.
- Removing it in the app removes it there.
