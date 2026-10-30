---
id: MM-696
component: developer-tooling
status: in-progress
related: [MM-695, MM-234]
---

# Bug: the runner said "No Android phone connected" when adb's server would not start

## What happened

The owner, 2026-10-29, straight after MM-695: `./mm run --phone` with the
Pixel 9 Pro XL plugged in answered "No Android phone connected. Connect a
data-capable USB cable, enable USB debugging, and accept the authorization
prompt on your phone." The phone was connected, authorized and on the USB
bus (`ioreg` listed it with its ADB interface, class 255/66/1).

What failed was adb itself. Its server, started by `adb devices`, hung in
USB enumeration under its native macOS backend (`usb_osx.cpp`: a repeated
`Unable to create an interface plug-in (e00002be)`, then nothing; the
client reported "ADB server didn't ACK" and "failed to start daemon").
macOS showed Google Chrome holding a user client on the Pixel's USB
device at the time. Under adb's libusb backend (`ADB_LIBUSB=1`) the same
server started at once and listed the phone as `device`; the server it
started stays up, and a plain `adb` talks to it.

The runner's `deviceIds` treated any failing `adb devices` as an empty
list, so the only thing the owner saw was the message for a phone that is
not there.

## What is right

A failing `adb devices` is never read as "no phone". When adb says its
server could not be started or reached, the runner tries adb's libusb
backend (`ADB_LIBUSB=1`, macOS and Linux only; Windows has no such
switch) and keeps it for the rest of the run, so Gradle's and Capacitor's
adb calls inherit it; it says so on stderr in one line. When adb still
fails, the runner shows adb's own last line ("adb could not list
devices: …") before anything about phones.

## Acceptance criteria

```gherkin
Scenario: adb's native backend hangs, libusb works
  Given the phone is connected and adb's server will not start under its default USB backend
  When I run mm run --phone
  Then the runner says it is trying adb's libusb backend
  And the app is installed and launched on the phone

Scenario: adb fails for another reason
  Given adb devices exits non-zero without a server-start failure
  When I run mm run --phone
  Then the runner prints adb's own last line before refusing

Scenario: an empty list is still an empty list
  Given adb devices succeeds and lists nothing as device
  When I run mm run --phone
  Then the runner tells me to connect a USB-debugging phone, as before
```

## Regression test

`tool/test/adbServer.test.ts`: the server-start failure is recognised in
adb's words, `connectedDeviceIds` reads only `device` rows, and the last
line of adb's output is what is shown.

## Progress

**Built (2026-10-29), seen through the real adb, not yet through the
runner.** `deviceIds` in `tool/src/android.ts` retries with
`ADB_LIBUSB=1` and reports adb's failure; `ADB_LIBUSB=1 adb devices`
was observed listing `47261FDAS00EDR device` on the dev Mac while the
default backend hung, and the phone answered `getprop` through that
server. Owed: the owner's `./mm run --phone` landing on the Pixel. The
cause of the native backend's hang (Chrome's hold on the device, or the
backend on this macOS) is not settled; the fallback does not depend on
which.
