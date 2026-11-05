---
id: MM-731
status: in-progress
component: health-sync
related: [MM-68, MM-95, MM-454]
---

# Bug: Health Connect's link to why the app asks opens the app on whatever screen it was on

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app. The manifest declares, as Health
Connect requires (MM-68), the rationale intent (`ACTION_SHOW_PERMISSIONS_RATIONALE`, Android 13 and
earlier) and its Android 14 alias (`VIEW_PERMISSION_USAGE` with the health category), both on
`MainActivity`. Nothing read the intent: the link in Health Connect's permission sheet brought the app to
the front on whatever it was showing, the lock or the terms included, and the person read nothing about why.

## Description
Sent into the app by Health Connect's link, the app opens on its privacy policy, whether the app was started
by the link or brought back to the front by it. `MainActivity` notes the intent's action; the health plugin
says once whether it was noted (`rationaleRequested`); the web app asks when it is up and when it comes back
to the front, and pushes the privacy policy. On iOS and in a browser nothing is ever noted.

## Acceptance Criteria
```gherkin
Scenario: From Health Connect's sheet
  Given Health Connect shows the app's permission sheet
  When the person presses the link to why the app asks
  Then the app opens on its privacy policy

Scenario: Opened as usual
  When the app is opened from its icon
  Then it opens as it always does
```

## Notes
- Regression tests: `test/app/healthRationale.test.tsx` (`InMemoryHealthRationale`); the shell test
  `test/ios/iosShell.test.ts` holds the Swift twin to the new method.
- Where: `MainActivity.java` (`onNewIntent`), `MmHealthPlugin.kt` and `.swift` (`rationaleRequested`),
  `src/domain/integration/HealthRationale.ts`, `src/platform/NativeHealthRationale.ts`,
  `NoHealthRationale.ts`, `src/fixtures/InMemoryHealthRationale.ts`, `src/app/HealthRationaleLink.tsx`,
  `AppServices.healthRationale`.
- Owed on the owner's Pixel, on a build of main: the link from Health Connect's permission sheet. Not run
  locally; CI validates.
