---
id: MM-724
status: in-progress
component: food-logging
related: [MM-63, MM-599, MM-708, MM-723]
---

# Bug: the app died when the share chooser opened with a meal's photos on Android

## Context
Read off the product owner's Pixel on 2026-11-05, a parity pass over the Android app. Android's crash log
holds two deaths of the app on 2026-11-04, a minute apart, both `TransactionTooLargeException` as the
activity stopped: a saved state of 1.5 MB and then 2.4 MB, made of `capacitorLastPluginCallOptions` and
`capacitorLastPluginCallBundle`, each holding the same 0.76 MB and then 1.19 MB of plugin call options. That
is "Send to assistant" with photos (MM-599, MM-708): `shareMeal` is handed the photos as base64 in its
options, writes them to the cache and starts the chooser with `startActivityForResult(call, …)`. Capacitor
keeps the call of an activity it started in the activity's saved state, its options twice over, so that a
killed process can answer it; Android refuses a saved state near a megabyte, and the app died the moment
the chooser put it in the background. One photo at the picker's two megapixels is enough. The backup's
`share` (MM-63) carries the whole encrypted copy the same way, so sharing a backup past a few hundred
kilobytes would have died too (the owner's database is 19 MB). iOS keeps no such state and is unaffected.

The owner was not told: the app vanished under the chooser, and the meal's photos with it.

## Description
On Android, a chooser call carries its bytes no further than the disk: `share` drops `data` and
`shareMeal` drops `photos` from the call once the file is written and before the chooser is started. The
saved state then holds a name and a prompt, and the app stays up under the chooser with any number of photos
and a backup of any size.

## Acceptance Criteria
```gherkin
Scenario: Photos sent to the assistant
  Given a meal with photos on Android
  When the person presses "Send to assistant" and the chooser opens
  Then the app is still running behind the chooser, and comes back to the step when the chooser closes

Scenario: A backup shared
  Given a database of many megabytes on Android
  When the person shares a backup and the chooser opens
  Then the app is still running behind the chooser
```

## Notes
- Regression test: `test/android/shareCallsOnAndroid.test.ts` (each share drops its payload from the call
  before `startActivityForResult`); the Kotlin is compiled by CI and run by no test.
- Where: `apps/mobile/android/app/src/main/java/com/martianmacros/MmBackupPlugin.kt` (`lightened`).
- Not changed: the photos still cross the bridge as base64 and are written to the cache; only the call's
  copy of them is dropped. `pick`, `pickPhotos` and `unlock` carry no payload.
- Owed on the owner's Pixel, on a build of main: "Send to assistant" with two photos, the app still up
  behind the chooser and the step back when it closes; a backup shared. Not run locally; CI validates.
