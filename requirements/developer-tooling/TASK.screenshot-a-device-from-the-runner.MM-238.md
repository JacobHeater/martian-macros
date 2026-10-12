---
id: MM-238
component: developer-tooling
status: done
related: [MM-234, MM-235]
---

# Task: screenshot a device from the runner

## What

`mm screenshot [-d DEVICE] [path]` captures a device's screen to a PNG.
With no `-d` it picks the one physical phone when one is connected
(MM-234's selector), else the one connected device. The default path is
`mm-screenshot-<stamp>.png` in the working directory, and the command
prints where it wrote.

It captures with `screencap` on the device and `adb pull`, never by
redirecting binary output through the shell: PowerShell 5.1 corrupts
binary stdout, which is the trap this command exists to avoid. Device and
emulator screenshots are for native behavior verification; design is
reviewed in Storybook (MM-237).

## Acceptance criteria

```gherkin
Scenario: one command, one file
  Given a phone is connected
  When I run mm screenshot
  Then a valid PNG of its screen is written and its path printed

Scenario: the phone wins over an emulator
  Given a phone and an emulator are connected
  When I run mm screenshot
  Then the phone's screen is captured
```

## Progress

**Done (2026-10-12).** Verified in a plain PowerShell with the Pixel and
the emulator both connected: one command, a valid PNG of the phone's
screen. Device selection is MM-234's tested selector; the capture itself
is adb glue with no new logic.
