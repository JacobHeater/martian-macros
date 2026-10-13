---
id: MM-238
component: developer-tooling
status: done
related: [MM-234, MM-235]
---

# Task: screenshot a device from the runner

## What

`mm screenshot [-d DEVICE] [path] [--clipboard]` captures a device's screen
to a PNG. `--clipboard` puts the image on the clipboard, ready to paste:
with a path, as well as the file; with none, instead of one, leaving no
file behind. If the clipboard refuses it, the capture is kept and the
command says where.
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

Scenario: straight to the clipboard
  When I run mm screenshot --clipboard
  Then the image is on the clipboard and no file is left behind

Scenario: a file and the clipboard
  When I run mm screenshot shot.png --clipboard
  Then shot.png is written and the same image is on the clipboard

Scenario: the clipboard refuses
  Given the image cannot be put on the clipboard
  When I run mm screenshot --clipboard
  Then the capture is kept, the command says where, and it exits non-zero
```

## Progress

**Done (2026-10-12).** Verified in a plain PowerShell with the Pixel and
the emulator both connected: one command, a valid PNG of the phone's
screen. Device selection is MM-234's tested selector; the capture itself
is adb glue with no new logic.

**`--clipboard` (2026-10-12).** Windows through PowerShell's
`Clipboard.SetImage` in a single-threaded apartment, macOS through
`osascript`, Linux through `xclip`; `tool/test/clipboardImageCommand.test.ts`
holds the command for each, and that a quote in a path cannot end the
string it is written in. Verified in a plain PowerShell on Windows by
clearing the clipboard, running each mode and reading the clipboard back:
clipboard-only left a 1008x2244 image and no file; with a path, the file
and the same image. macOS and Linux are not run here.
