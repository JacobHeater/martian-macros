---
id: MM-690
status: in-progress
component: health-sync
related: [MM-69, MM-489, MM-551, MM-677]
---

# Bug: the iPhone app remembers asking Apple Health for a kind HealthKit was never asked for

## Context
The owner, 2026-10-28, after an outdoor walk on the watch that Apple Health showed and Martian Macros did not: "cardio is
bugged... martian macros isn't picking it up." Read from the phone itself (the app's database copied over USB, the
Health app's sharing page): schema 31, today's steps saved, the cardio table empty; 511 workout readings ending
2026-10-09 and none since, while step readings were minutes fresh; and in Health › Sharing › Martian Macros, Workouts
under "Allow to Write" only. The "Allow to Read" list, which names every kind an app has asked to read, had no Workouts.

The Swift plugin answered `permitted` from a list of kinds it had asked for, kept in `UserDefaults`
(`mm_health_asked`). That list held "workout", so Settings showed Exercise sessions as asked for and never asked again,
while HealthKit's own record had no read request for workouts and answered every workout query, the anchored changes
and the 30-day read alike, with nothing and no error, as it does for a kind it was not asked for. How the two drifted
apart is not known; that the plugin kept its own memory at all is the defect. The 511 readings came from a read made
while the two agreed.

## Decisions
Choices made without asking (say if any is wrong):
- **HealthKit's record is the only "asked".** `getRequestStatusForAuthorization(toShare: [], read: [kind])` answers
  `.unnecessary` for a kind HealthKit has been asked to read; `permitted` and `requestPermission` answer from it, one kind
  at a time, and the `UserDefaults` list is gone (the stale key is left where it is, read by nothing). HealthKit still
  says nothing of what the person chose (MM-69): a kind refused reads as nothing held, as before.
- **Health Connect is untouched:** its `permitted` already asks the platform (`getGrantedPermissions`).
- **No new screen or words:** with the record consulted, Settings › Health shows Exercise sessions as not yet asked, the
  row is a button again, and pressing it shows HealthKit's sheet with Workouts under Read.

## Acceptance Criteria
```gherkin
Scenario: What was asked is HealthKit's record
  Given the app's preferences say workouts were asked for and HealthKit's record says they were not
  When Settings › Health is opened on the iPhone
  Then Exercise sessions is shown as not asked for, and pressing it asks HealthKit, which lists Workouts under Read

Scenario: A kind asked for stays asked for
  Given weight was asked for on the iPhone and the app is reinstalled
  Then Settings › Health shows weight as asked for without asking again
```

## Progress
Fixed 2026-10-28 in `MmHealthPlugin.swift`: `askedToRead` walks the kinds asked about, one request-status query each,
carrying the answers forward; `permitted` and `requestPermission` resolve through it. Guarded by
`apps/mobile/test/ios/healthAskedFromHealthKit.test.ts`, which reads the Swift source (CI compiles no Swift, MM-440's
pattern). Owed: the owner rebuilds (`mm run --ios --phone`), presses Exercise sessions in Settings › Health, allows
Workouts on the sheet, and sees the walk under Train › Cardio.
