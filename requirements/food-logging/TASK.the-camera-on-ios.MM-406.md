---
id: MM-406
status: done
component: food-logging
related: [MM-43, MM-44, MM-54, MM-403]
---

# Task: The camera on iOS: a barcode and a label

## Context
MM-43 reads a barcode with the camera and MM-44 reads the text of a
photographed Nutrition Facts panel; both are read on the phone, no photo is
kept and nothing is uploaded. On Android the `MmScanner` plugin does both
with Google's ML Kit: a full-screen live scan that ends at the first retail
barcode (UPC-A, UPC-E, EAN-13, EAN-8), telling the symbology so a UPC-E is
expanded and never guessed (MM-54), and a photo through the camera app read
as text. `NativeCamera` takes `{ digits, symbology }` and `{ text }` and
knows nothing of the engine behind them.

## Decisions
Choices I made without asking (say if any is wrong):
- **Apple's own frameworks, no third-party component.** `AVFoundation`
  reads barcodes from the live camera and `Vision` reads text from the
  photo, both on the device. So the terms of use on iOS do not carry the ML
  Kit sentences (MM-403).
- **What iOS says a UPC-A is.** iOS reports a UPC-A as an EAN-13 whose
  first digit is 0. The plugin passes it on as `ean13`; `normalizeBarcode`
  pads both to the same 14 digits, so the lookup is the same.
- **UPC-E arrives as its eight digits** (number system, six digits, check
  digit), as it does on Android, so the existing expansion applies.
- **The photo stays in memory** and is read at once; no file is written, so
  there is nothing to delete.
- **A camera that cannot be used is reported, not hidden**: the simulator
  has none, and a phone can refuse. The plugin rejects with "The camera
  cannot be used." and the screens say so, as they do on Android.

## Description
`MmScanner` in Swift, in the iOS shell: a live barcode scan with Cancel that
ends at the first retail barcode with its symbology, and a label photographed
and read as text on the device.

## Acceptance Criteria
```gherkin
Scenario: A barcode is read with its kind
  Given the scan open on a phone and a retail barcode in view
  Then the scan ends with the digits and one of upcA, upcE, ean13 or ean8
  And a UPC-E is passed on as its eight digits

Scenario: Cancelled
  Given the scan open
  When Cancel is pressed
  Then the app is told it was cancelled and nothing is looked up

Scenario: No camera
  Given the simulator, or camera permission refused
  When a scan or a label read is asked for
  Then the app is told the camera cannot be used, and says so

Scenario: A label is read on the device
  Given a Nutrition Facts panel photographed
  Then its text is read on the device and no image is written to storage
```

## Notes
- Barcodes and labels need a phone; on the simulator only the refusal path
  runs. On the owner's checklist.

## Progress
Done 2026-10-21. Not run locally; CI validates the TypeScript tests. CI builds no iOS app, so the Swift is held by
`test/ios/cameraOnIos.test.ts`, which reads it, until it is built on the Mac.
- `ios/App/App/Plugins/MmScannerPlugin.swift` and `ScanViewController.swift`: a full-screen live scan with
  AVFoundation that ends at the first EAN-13, EAN-8 or UPC-E with its symbology, and Cancel; a label photographed
  with the camera app and read with Vision's text recognition on the device, the photo kept in memory only. Camera
  permission is asked for once; a refusal or a missing camera is rejected and the screens say so.
- Fixed while finishing: a camera that could not be started was reported from `viewDidLoad`, while the scan was
  still being presented, so the dismissal could fail and the app never hear back. It is now reported once the scan
  is on screen.
- MM-44's label read on iOS is this plugin's `readLabel`: Apple's Vision, not ML Kit, as decided above.

## Owed on a phone
- A retail barcode in view ends the scan with its digits and its kind; a UPC-A arrives as an EAN-13 beginning with 0
  and is found by the same lookup; a UPC-E arrives as its eight digits (whether AVFoundation gives eight digits for a
  UPC-E is the first thing to check).
- Cancel returns to the app with nothing looked up.
- The simulator, and a phone with the camera refused in Settings: the scan and the label read say the camera cannot
  be used.
- A Nutrition Facts panel photographed is read as text on the phone, and nothing is added to Photos or the app's
  files.
- The first iOS build of the two files.
