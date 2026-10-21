---
id: MM-513
status: proposed
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
