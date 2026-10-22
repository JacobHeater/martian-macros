---
id: MM-442
status: done
component: health-sync
related: [MM-71, MM-66, MM-68, MM-69]
---

# Task: Steps read through the platform's own aggregation

## Context
MM-71 decided, with the product owner, that for steps the app trusts the platform's own aggregation, which already applies the
priority the user set in their phone's health settings, rather than adding up raw samples from a phone and a watch that count
the same walk twice. Today steps are imported as raw samples and nothing in the app uses them yet, so the decision was not
built. It moved here from MM-71's Progress.

## Decisions
Choices made without asking the owner (say if any is wrong):
- **Its own narrow interface, `HealthDailySteps`, beside `HealthSource`**, as `HealthHistoryAccess` is (MM-159, I): the
  importer never needs it. The fake, the Health Connect and HealthKit adapter and the no-platform stand-in each implement
  it, and the app's `healthSource` service is typed with it.
- **Days are local calendar days**, oldest first, and a day with no steps is left out rather than given as zero.
- **The fake's priority**: where two sources' readings overlap in time, only the source that comes first in
  `stepsPriority` counts for that stretch, each reading's steps spread evenly over its span; a source not listed comes
  after the listed ones, by id. This is how both platforms describe their de-duplication, not a copy of either's code.

## Description
A day's steps come from the platform's aggregate for that day (Health Connect's aggregate request, HealthKit's statistics
query), behind the `HealthSource` interface with the fake answering as the platforms do. Needs the native plugins and a device
to verify.

## Acceptance Criteria
```gherkin
Scenario: Two devices count the same walk
  Given the phone and a watch each recorded 5,000 steps for the same walk
  When the day's steps are read
  Then the day has the platform's total, not 10,000

Scenario: The fake answers as a platform does
  Given a recorded history with overlapping steps from two sources
  Then the fake's daily total follows the source priority it was given
```

## Notes
- Steps are display-only context for now (WS-11 "Excluded or deferred"); build this before anything reads them.
- Built 2026-10-21 (not run locally; CI validates; the Kotlin is compiled by CI, the Swift is not): `HealthDailySteps` and
  `DaySteps` (`src/healthIngest/`), the fake's `dailySteps` with `stepsPriority`, `NativeHealthSource.dailySteps` over the
  plugin's new `dailySteps` (`MmHealthApi`), `MmHealthPlugin.kt` (`aggregateGroupByPeriod` of `StepsRecord.COUNT_TOTAL`
  by one day) and `MmHealthPlugin.swift` (`HKStatisticsCollectionQuery`, cumulative sum by one day). Contract suite
  `test/contracts/healthDailyStepsContract.ts`, run on the fake, the adapter and no platform; the scenarios are
  `test/healthIngest/dailySteps.test.ts` and `test/platform/nativeHealthSource.test.ts`; `test/ios/dailySteps.test.ts`
  reads the Swift source (registered, iOS 15's query).

## Progress
Done (2026-10-21): both scenarios are built and held by the tests named in the notes; not run locally, CI validates.
Nothing in the app reads steps yet, so nothing on a screen shows them.

## Owed on a phone
- With a phone and a watch (or a second app) both writing steps for the same walk, the day's total from `dailySteps`
  matches what Health Connect and Apple Health show for that day.
- It changes when the source order is changed in the platform's settings.
