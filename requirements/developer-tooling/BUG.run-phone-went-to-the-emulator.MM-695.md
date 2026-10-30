---
id: MM-695
component: developer-tooling
status: in-progress
related: [MM-234, MM-412]
---

# Bug: `mm run --phone` went to the emulator

## What happened

The owner, 2026-10-29: `./mm run --phone` with the Pixel plugged in
installed on the emulator instead. `mm run` took `--phone` only after
`--ios` (MM-412); for Android the phone was `--env phone` (MM-234). The
Android runner never looked at an argument it did not know, so `--phone`
fell through to "whatever adb lists": one device, that device; none, an
emulator it boots. Either way the run went where the owner had just said
it should not.

## What is right

`mm run --phone` on Android means what `mm run --ios --phone` means: the
phone plugged in. It selects the one physical Android phone (an id not
beginning `emulator-`), never an emulator, and refuses plainly when there
is none or more than one, exactly as `--env phone` does; the two spellings
are the same thing. `--phone ID` is that exact device, as `-d ID` is.

Nothing `mm run` is given goes unaccounted for any more: an argument it
does not know refuses with the usage line instead of running on the wrong
device.

## Acceptance criteria

```gherkin
Scenario: --phone picks the phone over a running emulator
  Given a physical phone and an emulator are both connected
  When I run mm run --phone
  Then the app is installed and launched on the phone

Scenario: --phone with no phone does not boot an emulator
  Given no physical phone is connected
  When I run mm run --phone
  Then it refuses and tells me to connect a USB-debugging phone
  And no emulator is started

Scenario: --phone with --live
  Given a physical phone is connected
  When I run mm run --live --phone
  Then the live session runs on the phone

Scenario: an argument the runner does not know
  When I run mm run --phonee
  Then it refuses, names the argument and prints the usage line
  And nothing is built or installed
```

## Regression test

`tool/test/runTarget.test.ts`: `runTargetOf` reads `--phone`, `--env
phone`, `-d`, `--phone ID` and refuses unknown arguments; fails on the
runner that ignored `--phone`, passes with it.

## Progress

**Built (2026-10-29), not yet seen on the phone.** `runTargetOf` in
`tool/src/android.ts` is the one reader of `mm run`'s arguments for
Android, used by the bundled run and `--live` alike; `mm help` and the
README say `--phone`. Owed: the owner's `./mm run --phone` landing on the
Pixel with the emulator up, which is what closes this. Note from the
session: `adb` on the dev Mac would not start its server at the time
(`Unable to create an interface plug-in (e00002be)`, "ADB server didn't
ACK"), so the connected-device list could not be read from the agent's
shell; with no phone in adb's list the old runner booted the emulator,
the new one refuses.
