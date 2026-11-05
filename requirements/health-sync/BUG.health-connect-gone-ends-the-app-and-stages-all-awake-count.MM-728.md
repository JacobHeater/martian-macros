---
id: MM-728
status: in-progress
component: health-sync
related: [MM-68, MM-73, MM-250, MM-323, MM-690]
---

# Bug: Health Connect gone mid-run ends the app; the one history ask can be spent unshown; a night of awake stages counts as sleep

## Context
Read from the sources on 2026-11-05, a parity pass of the Android health plugin against the iOS one. The
two are close twins: every method answers the same shape in the same units. Three differences:
- `requestPermission`, `requestHistory` and `startWriting` started Health Connect's question outside any
  try; a Health Connect uninstalled since the app found it throws from the launch, which Capacitor rethrows
  and Android ends the app on. iOS never throws there. `typeNames` threw on a kind named by anything but a
  string.
- `requestHistory` marked the one history ask (MM-73) as asked before starting the question; a launch that
  threw, or a process ended behind the system dialog, spent the ask without it being seen, and the person
  had to find the permission in Health Connect.
- `minutesAsleep` fell back to the session's whole span whenever no asleep stage was found, including a
  session whose stages are all awake, in bed or out of bed; iOS counts only asleep segments, so such a
  session is no sleep. MM-250's "the span when there are none" meant no stages at all.

## Description
Each question the plugin starts is wrapped, and refused in words when Health Connect is gone. The history
ask is marked asked only once its question is on its way. A sleep session with stages that are all awake is
no sleep, as on iOS; the span counts only when the session has no stages at all.

## Acceptance Criteria
```gherkin
Scenario: Health Connect gone
  Given Health Connect was uninstalled while the app ran
  When the person turns a kind on in Settings
  Then the app says the question could not be asked, and stays up

Scenario: A night of awake stages
  Given a sleep session whose stages are all awake
  When the night is imported
  Then it holds no minutes asleep, as on iOS
```

## Notes
- Regression test: `test/android/healthOnAndroid.test.ts`.
- Where: `MmHealthPlugin.kt` (`requestPermission`, `requestHistory`, `startWriting`, `typeNames`,
  `minutesAsleep`).
- Not changed: `STAGE_TYPE_UNKNOWN` stays not asleep; iOS counts `asleepUnspecified`, which Health Connect
  spells `STAGE_TYPE_SLEEPING`, already counted.
- Owed on the owner's Pixel, on a build of main: nothing visible changes on a phone with Health Connect
  present. Not run locally; CI validates.
