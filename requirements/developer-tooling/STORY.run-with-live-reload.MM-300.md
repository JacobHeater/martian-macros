---
id: MM-300
component: developer-tooling
status: done
related: [MM-3, MM-234, MM-235, MM-238]
---

# Story: run on the emulator with live reload

## Why

The owner (2026-10-14): "mm needs an emulator run with hot reload." `mm
run` builds the web app, syncs it into the Android shell and reinstalls
the APK, so every change to a screen costs a full build. Native behavior
(the plugins, the back button, the keyboard) can only be checked in the
shell, and checking it should not cost a build per edit.

## What is built

`mm run --live [-d DEVICE] [--port N]`:

- picks the device as `mm run` does (starting an emulator when none is
  connected; `--env phone` for the one physical phone);
- builds the web app once if `dist` is missing (Capacitor copies it into
  the shell), then starts the Vite dev server on `127.0.0.1` (port 5173
  unless `--port`) with hot module replacement; "localhost" would bind
  only `::1` on Windows, where adb reverse found nothing;
- runs Capacitor's own `cap run android --live-reload` against that
  server on the chosen device, with `--forwardPorts` (adb reverse), so the
  device reaches the server as its own `localhost` and nothing listens on
  the network; Capacitor starts `gradlew` by its bare name, so its
  environment drops `NoDefaultCurrentDirectoryInExePath` (set by some
  shells and agents, under which Windows refuses that);
- stays until Ctrl+C, then stops the server (its whole process tree on
  Windows) and removes the reverse;
- Vite ignores `android/`, `dist/` and `storybook-static/`, so the shell's
  own build does not reload the app.

The live URL lives only in the generated, git-ignored
`android/app/src/main/assets/capacitor.config.json`; the next `mm run` or
`mm build android` syncs over it, and the offline check of `dist` is
unchanged. A shell installed by `--live` loads nothing once the server is
stopped: `mm run` puts the bundled app back.

## Acceptance criteria

```gherkin
Scenario: A change shows on the emulator without a rebuild
  Given mm run --live has launched the app on an emulator
  When a screen's source file is saved
  Then the app on the emulator shows the change without a new install

Scenario: The device reaches the server only through adb
  Given mm run --live on a device
  Then the dev server listens on 127.0.0.1 only
  And the device reaches it through adb reverse on the same port

Scenario: Nothing of the live run reaches a normal build
  Given a live run has ended
  When mm run or mm build android runs
  Then the synced Capacitor config has no server URL

Scenario: The arguments are checked
  Given mm run --live --port abc
  Then mm says the port must be a number and exits with a usage error
```

## Progress

Built 2026-10-14. Verified on the Pixel 10 Pro XL emulator: built and
deployed in about 3 s; the app loaded from the dev server; changing the
macro switch's label in `CalorieHero.tsx` showed on the emulator in about
4 s as an `hmr update`, with no install and the screen's state kept;
after the session a normal sync (`npm run android`) left no server URL in
the shell's config. Found on the way: `gradlew` refused under
`NoDefaultCurrentDirectoryInExePath`, and `ERR_EMPTY_RESPONSE` from Vite
on `::1`; both fixed and the second tested in `tool/test/liveRunPlan.test.ts`.
Not verified: Ctrl+C in an interactive terminal (the session was ended
from outside, and the reverse removed by hand); a physical phone.
