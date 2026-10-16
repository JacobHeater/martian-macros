---
id: MM-314
status: proposed
component: health-sync
related: [MM-305, MM-313, MM-70, MM-66]
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
