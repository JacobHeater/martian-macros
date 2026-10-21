---
id: MM-489
status: done
component: training
related: [MM-68, MM-69, MM-70, MM-188, MM-189, MM-242, MM-244, MM-490, MM-515]
---

# Task: Read and write workouts with their segments in the Android and iOS shells

## Context
MM-189 built the rules for workouts that line up with the health platforms, behind two interfaces in the domain:
`HealthWorkoutReader` (a workout with its segments) and `HealthWorkoutWriter` (a summary written with a permission of its own).
Only the in-memory fixture and `NoHealthWorkouts` implement them, so nothing is read or written on a phone yet. The app's own
`MmHealth` plugin reads sessions only, and its Android manifest asks to read and never to write.

## Decisions
Choices I made without asking (say if any is wrong):
- **The app's own plugins, not the `health` package.** MM-188 named that package, but the shells already use the app's own
  `MmHealth` plugin (MM-68, MM-69), and it is the one place the AndroidX client and HealthKit are reached.
- **Writing waits for this ticket and for the terms.** A write permission in the manifest and a terms change (MM-244) go in the
  same PR as the code that writes, not before.
- **A switch in Settings, kept by the plugin** (2026-10-21). "Send workouts you finish to …" sits with MM-70's food and MM-314's
  water switches in the health platform's section; turning it on asks for the write permission alone. Whether it is on is kept
  in the plugin's own preferences (SharedPreferences, UserDefaults), not the database, so no schema change was needed and the
  switch survives a restart.
- **Written when finished, and again when a finished workout is saved again**, by wrapping the workout log
  (`MirroredWorkoutLog`) where `openAppServices.ts` chooses implementations. A workout in progress is never written.
- **Deleting a workout in the app does not remove it from the platform yet** (MM-515); the terms say only that a changed
  workout is written again.
- **On iOS the workout is written with `HKWorkoutBuilder`** (iOS 12 and later), so nothing needs `#available`.

## Description
- **Android (`MmHealthPlugin.kt`)**: read a session's type, `clientRecordId` and segments (type, start, end, repetitions); write an
  `ExerciseSessionRecord` of `STRENGTH_TRAINING` with the workout's `clientId` as `clientRecordId`, so writing again replaces it,
  and its segments, on connect-client 1.1.0. Add `WRITE_EXERCISE` to the manifest, asked for apart from reading.
- **iOS (`MmHealthPlugin.swift`)**: read and write `HKWorkout` as `traditionalStrengthTraining`, session only, with the `clientId`
  as `HKMetadataKeySyncIdentifier` and a sync version, inside `if #available` where an API is newer than iOS 15. Share
  authorization for workouts is asked for apart from reading.
- **TypeScript**: a native implementation of both interfaces in `src/platform/`, over the plugin, held to
  `healthWorkoutReaderContract` and `healthWorkoutWriterContract` with the bridge stood in (as `nativeHealthSource.test.ts` does),
  and chosen in `openAppServices.ts`.
- The import types are MM-188's: strength is `STRENGTH_TRAINING`, `WEIGHTLIFTING` and `CALISTHENICS` on Android;
  `traditionalStrengthTraining`, `functionalStrengthTraining` and `coreTraining` on iOS.

## Acceptance Criteria
```gherkin
Scenario: The native workouts keep the contract
  Given the native implementation with the plugin stood in
  Then it passes the health workout reader and writer contract suites

Scenario: Writing asks for its own permission
  Given the user granted reading workouts
  When the app writes a workout
  Then nothing is written until writing workouts is granted too

Scenario: Written once
  Given a workout written to the platform and then edited in the app
  When it is written again
  Then the platform holds one workout for it
```

## Progress
Done 2026-10-21. Not run locally; CI validates the TypeScript tests. CI builds no iOS app, so the Swift is held only by
the source-reading test below until it is built on the Mac.
- Android (`MmHealthPlugin.kt`): `readWorkouts` with each session's type, `clientRecordId` and segments; `writeWorkout`
  as `STRENGTH_TRAINING` under the workout's `clientId`, with its segments; `WRITE_EXERCISE` in the manifest, asked for
  apart from reading.
- iOS (`MmHealthPlugin.swift`): `readWorkouts` of `HKWorkout` (strength is MM-188's three types; no segments, which
  HealthKit does not have); `writeWorkout` with `HKWorkoutBuilder` as `traditionalStrengthTraining`, the `clientId` as
  `HKMetadataKeySyncIdentifier` and a sync version, so writing again replaces it; sharing asked for apart from reading;
  `NSHealthUpdateUsageDescription` in `Info.plist`.
- TypeScript: `src/platform/NativeHealthWorkouts.ts` over both plugins, held to both contract suites with the bridge
  stood in (`test/platform/nativeHealthWorkouts.test.ts`); `src/healthWrite/MirroredWorkoutLog.ts`
  (`test/healthWrite/mirroredLogs.test.ts`, with the workout repository contract); chosen in `openAppServices.ts`.
- The Swift and Kotlin sides are guarded by `test/native/mmHealthWrites.test.ts`. The app's own records are no longer
  read back as readings by either plugin.
- The app's use of what is read (MM-490) and removing a deleted workout (MM-515) are their own tickets.

## Owed on a phone
- A written workout shows in Health Connect and in Apple Health; on Health Connect its segments show too.
- Writing again after an edit leaves one workout on each platform.
- Nothing is written before "Send workouts you finish" is on and its permission granted.
- Reading a watch's strength session returns its segments on Health Connect (MM-188's questions 3 and 5).
- The iOS build of `writeWorkout` and `readWorkouts` (first built on the Mac).
