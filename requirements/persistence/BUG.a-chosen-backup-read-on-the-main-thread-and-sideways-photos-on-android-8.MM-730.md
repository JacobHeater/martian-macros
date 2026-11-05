---
id: MM-730
status: in-progress
component: persistence
related: [MM-63, MM-599, MM-724]
---

# Bug: a chosen backup is read on Android's main thread, and a meal's photo is sideways on Android 8

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app. `picked`, the document picker's
answer for a backup brought back (MM-63), read and base64-encoded the whole file on the main thread, as
Capacitor's activity callbacks run there; a backup of many megabytes holds the screen and, long enough,
brings Android's "not responding" dialog. iOS reads on the main thread too and freezes silently; neither
should. And the photo picker's path for Android 8.0 and 8.1 (`BitmapFactory`, below the `ImageDecoder` of
Android 9) ignores the photo's orientation tag, so a photo shot with the phone upright is handed to the
assistant sideways; Android 9 and later and iOS hand it upright. The app supports Android 8 (`minSdk 26`).

## Description
A chosen backup is read on the plugin's own thread. On Android 8, a meal's photo is turned upright by its
own orientation tag before it is reduced and handed on.

## Acceptance Criteria
```gherkin
Scenario: A large backup chosen
  Given a backup of many megabytes
  When the person chooses it to restore
  Then the screen stays responsive while it is read

Scenario: A photo on Android 8
  Given a phone on Android 8 and a photo shot upright
  When the person chooses it for a meal
  Then the assistant receives it upright
```

## Notes
- Regression test: `test/android/backupOnAndroid.test.ts`.
- Where: `MmBackupPlugin.kt` (`picked`, `upright`).
- Not changed: iOS still reads a chosen backup on its main thread (`MmBackupPlugin.swift`); its own ticket
  if the owner wants it.
- Owed on a phone on Android 8, which the owner does not have; the Pixel takes the Android 9 path. Not run
  locally; CI validates.
