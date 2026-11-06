---
id: MM-732
status: in-progress
component: developer-tooling
related: [MM-536, MM-695, MM-238]
---

# Bug: `mm screenshot --phone` asks the iPhone while `mm run --phone` means the Android phone

## Context
The owner (2026-11-05), with the Pixel plugged in as the development phone, ran `./mm screenshot --phone --clipboard`
to show a screen and got nothing: the runner waited 20 s and said no picture came back from the iPhone. MM-536 made
`--phone` the iPhone, through the app itself and `devicectl`, while `mm run --phone` has meant the one physical
Android phone since MM-695 (`mm run --ios --phone` is the iPhone). The same flag meant a different phone in the two
commands, and on the Android phone the screenshot command had no short way at all: `mm screenshot` alone took the
Android phone only by luck of what adb listed.

## Description
`mm screenshot --phone` is the Android phone plugged in, as `mm run --phone` means: the one physical phone adb lists,
never an emulator. The iPhone is `mm screenshot --phone --ios`, or `-d` with its devicectl name or id, as before; the
app's own snapshot (MM-536) is unchanged. The help text says so.

## Acceptance Criteria
```gherkin
Scenario: The Android phone
  Given an Android phone is plugged in with USB debugging on
  When the owner runs mm screenshot --phone --clipboard
  Then the phone's screen is on the clipboard as a PNG, and the line names the phone's adb id

Scenario: The iPhone
  Given the owner runs mm screenshot --phone --ios
  Then the dev or demo app on the iPhone is asked for a picture of itself, as MM-536 says

Scenario: Only an emulator
  Given no Android phone is plugged in and an emulator is running
  When the owner runs mm screenshot --phone
  Then the runner says no Android phone is connected, and takes no picture of the emulator
```

## Notes
- Checked on the owner's Pixel, 2026-11-05: `./mm screenshot --phone --clipboard` printed `47261FDAS00EDR -> the
  clipboard`, and the clipboard held a PNG.
- `tool/test/iphoneScreenshot.test.ts` holds the target and argument cases.
