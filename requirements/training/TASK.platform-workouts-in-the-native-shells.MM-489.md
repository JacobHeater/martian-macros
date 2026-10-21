---
id: MM-489
status: proposed
component: training
related: [MM-68, MM-69, MM-188, MM-189, MM-244, MM-490]
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

## Notes
- Owed on a device: a written workout shows in Health Connect and Apple Health, a segment shows in Health Connect, writing again
  replaces it, and reading a watch's strength session returns its segments (MM-188's questions 3 and 5).
