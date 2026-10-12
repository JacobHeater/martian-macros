---
id: MM-234
component: developer-tooling
status: done
related: [MM-232]
---

# Bug: `mm run --env phone` was lost in the task runner's port

## What happened

The Flutter-era runner selected the one physical Android phone with
`mm run --env phone`, never an emulator, through
`physicalAndroidDeviceId`. The TypeScript port (MM-232 step 6) carried
`mm run [-d DEVICE]` only: `--env phone` was accepted silently and ignored,
so with a phone and an emulator both attached the command refused with
"More than one device is connected" instead of picking the phone, and the
owner's habit broke without a word of why.

Found by the owner on 2026-10-12, running `./mm run --env phone` right
after the switch.

## What is right

`mm run` takes `--env dev|prod|phone` again. `phone` selects the one
physical Android phone (an id not beginning `emulator-`), never an
emulator, and refuses plainly when there is none or more than one; it also
refuses `-d` alongside, as the old runner did. `dev` and `prod` are
accepted for compatibility and change nothing: the build has no
per-environment defines any more (one config), and the runner says so.

## Acceptance criteria

```gherkin
Scenario: the phone is picked over a running emulator
  Given a physical phone and an emulator are both connected
  When I run mm run --env phone
  Then the app is installed and launched on the phone

Scenario: no phone connected
  Given only an emulator is connected
  When I run mm run --env phone
  Then it refuses and tells me to connect a USB-debugging phone

Scenario: more than one phone
  Given two physical phones are connected
  When I run mm run --env phone
  Then it refuses and tells me to choose one with -d

Scenario: an explicit device and phone selection cannot be mixed
  When I run mm run --env phone -d SOME_ID
  Then it refuses and names the two ways to choose a device
```

## Regression test

`tool/test/physicalAndroidDeviceId.test.ts` (ported from the Dart
`physical_android_device_id_test.dart`): fails on the runner without the
selector, passes with it.

## Progress

**Fixed (2026-10-12).** `physicalAndroidDeviceId` is ported into
`tool/src/android.ts` and `mm run` parses `--env` again; verified by the
regression tests and by `mm run --env phone` installing on the connected
Pixel with the emulator still running.
