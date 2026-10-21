---
id: MM-513
status: in-progress
component: health-sync
related: [MM-70, MM-71, MM-66]
---

# Story: Body weight I type is written to my phone's health app

## Context
MM-70 decided that a body weight typed in the app is also written, so the user's other apps see it. Its write path was
built on 2026-10-21 for food, water (MM-314) and workouts (MM-489); weight was left out so that it can be built against
MM-71's rules for which reading counts, since the app also reads weight from the same platform.

## Decisions
Choices I made without asking (say if any is wrong):
- **A switch of its own**, "Send weight you type to …", beside the other writing switches, with Health Connect's
  `WRITE_WEIGHT` and HealthKit's body mass share authorization asked for by itself.
- **The weigh-in the app wrote is never read back as a reading**: the plugins already skip the app's own records.
- **When a weigh-in is said to be from**: the app keeps one weigh-in a day and not its time, so one typed for today is
  written at the moment it is saved, and one for an earlier day at 08:00 that day. Its id is its day
  (`martian-macros-weight-<namespace>-<yyyy-mm-dd>`), so typing again that day replaces it (2026-10-21, the builder).
- **Only what is typed passes through the writer**: `MirroredWeightLog` wraps the app's weigh-ins
  (`services.weights`), which only the screens that take a typed weight save to; a reading imported from the platform is
  kept elsewhere and so is never written back.
- **Built like its siblings (rule 9)**: the switch is a row of `HealthWritingGroup` beside food, water and workouts, with
  the scale icon, and its subtitle says what is written as the water row does.

## Description
When turned on, each weigh-in typed in the app is written to Health Connect or Apple Health under the app's own id,
written again when it is changed and removed when it is removed. A weigh-in read from the platform is never written back.

## Acceptance Criteria
```gherkin
Scenario: A typed weight appears
  Given writing weight is on
  When 82.4 kg is typed for today
  Then the phone's health app shows 82.4 kg from Martian Macros today

Scenario: Not read back
  Given a weight the app wrote
  When the app reads weight from the health app
  Then that weight is not imported as a reading

Scenario: Off
  Given writing weight is off
  Then typing a weight writes nothing
```

## Notes
- Built 2026-10-21: `HealthWeightWriter` (contract `healthWeightWriterContract`, run against the plugin adapter, the
  in-memory fixture and no platform), `MirroredWeightLog` (`test/healthWrite/mirroredLogs.test.ts`, held to
  `weightRepositoryContract` too), the plugins' `writeWeight` and `removeWeight` (`WRITE_WEIGHT` on Android, body mass
  share authorization on iOS; `test/native/mmHealthWrites.test.ts`), the switch (`test/settings/healthWriting.test.tsx`,
  story `HealthConnectWriting`). Terms and privacy policy say weight is written (terms version 4).
- Device checks owed: on a phone, 82.4 kg typed appears in Health Connect and Apple Health from Martian Macros, a second
  weigh-in that day replaces it, and the app does not import it back.
