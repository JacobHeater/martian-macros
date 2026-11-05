---
id: MM-726
status: in-progress
component: food-logging
related: [MM-43, MM-44, MM-406, MM-725]
---

# Bug: the scanner's Cancel can sit under Android's navigation bar, and no camera app ends the app

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app. `ScanActivity` placed Cancel
120 raw pixels from the bottom of a window drawn edge to edge (every activity is, on Android 15 and later
with this target), with no word of the navigation bar's height: on a phone with the three-button bar
(48 dp, 130 to 170 px) the button is partly or wholly behind it, and with the gesture bar it stands close.
iOS pins its Cancel to the safe area (`ScanViewController.swift`). And "Scan a label" starts the phone's
camera app with no check that one can take the picture; a phone whose camera a policy disabled throws
`ActivityNotFoundException` through the bridge, which Capacitor rethrows and Android ends the app on. iOS
checks `isSourceTypeAvailable(.camera)` and says "The camera cannot be used."

## Description
Cancel stands 32 dp above the navigation bar, whatever the bar's kind, with the bar's height added as the
window reports it. A label's photo with no camera app to take it is refused in words, the same words as iOS.

## Acceptance Criteria
```gherkin
Scenario: Three-button bar
  Given the phone uses the three-button navigation bar
  When the barcode scanner opens
  Then Cancel stands whole above the bar

Scenario: No camera app
  Given no app on the phone can take a picture
  When the person presses "Scan a label"
  Then the app says the camera cannot be used, and stays up
```

## Notes
- Regression test: `test/android/scannerOnAndroid.test.ts`.
- Where: `ScanActivity.kt` (the margin in dp, the window-insets listener), `MmScannerPlugin.kt` (`startPhoto`).
- Owed on the owner's Pixel, on a build of main: the scanner with three-button navigation turned on in the
  phone's settings. Not run locally; CI validates.
