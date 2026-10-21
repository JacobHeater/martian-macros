---
id: MM-440
status: done
component: sleep
related: [MM-250, MM-403]
---

# Bug: the iOS app does not build, because the sleep values name an iOS 16 case

## Context
Found by the owner on 2026-10-20, building the iOS app in Xcode 26.3. The app supports iOS 15.0 and
later, but `MmHealthPlugin.swift` (MM-250) named `HKCategoryValueSleepAnalysis.asleepUnspecified`
outside an `#available(iOS 16.0, *)` check. That name exists only from iOS 16, so Swift refused to
compile: `'asleepUnspecified' is only available in iOS 16.0 or newer`. CI builds Android only, so it
did not catch the error.

## Description
The iOS app compiles for iOS 15.0. From iOS 16 the asleep values are unspecified, core, deep and REM.
Before iOS 16 the one asleep value is `.asleep`, the same raw value that iOS 16 renamed
`.asleepUnspecified`.

## Acceptance Criteria
```gherkin
Scenario: The app builds for its deployment target
  Given the iOS deployment target is 15.0
  When the App scheme is built for a device
  Then the build succeeds

Scenario: The same nights count as sleep
  Given a night recorded as unspecified asleep
  Then it counts as sleep on iOS 15 and on iOS 16 and later
```

## Notes
Fixed in `apps/mobile/ios/App/App/Plugins/MmHealthPlugin.swift`; the device build was checked once
with `xcodebuild` before the owner's rule of 2026-10-20 against local validation. Guarded by
`apps/mobile/test/ios/sleepValuesAvailability.test.ts`, which reads the Swift source: no iOS 16 sleep
case may be named before the `#available(iOS 16.0, *)` check in `asleepValues`.
