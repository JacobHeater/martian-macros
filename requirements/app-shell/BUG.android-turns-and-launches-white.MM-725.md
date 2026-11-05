---
id: MM-725
status: in-progress
component: app-shell
related: [MM-403, MM-186, MM-43]
---

# Bug: the Android app turns with the phone, and its launch screen follows the phone's theme

## Context
Read from the sources on 2026-11-05, a parity pass over the Android app against the iOS shell. MM-403 says
the iOS shell is "portrait only, as the Android shell is", and the iOS one is (`UISupportedInterfaceOrientations`
holds Portrait alone, checked by `test/ios/iosShell.test.ts`); the Android manifest never locked it. With
auto-rotate on, the app turns to landscape, where no screen was drawn or reviewed, and the scanner's camera
view turns with it. The launch theme extends `Theme.SplashScreen` without a background of its own, so the
window behind the launch icon is the phone theme's `colorBackground`: white on a phone in light theme, where
the iOS launch screen is always the loading screen's sky (`#02010D`, `LaunchScreen.storyboard`).

## Description
Both Android activities are portrait only, as on iOS. The launch screen's background is the loading screen's
sky on a phone of any theme, the same value as the iOS launch screen's.

## Acceptance Criteria
```gherkin
Scenario: Turned
  Given the phone's auto-rotate is on
  When the person turns the phone while the app or its scanner is open
  Then the app stays upright, as on iOS

Scenario: Launched on a light phone
  Given the phone is in its light theme
  When the app is opened
  Then the launch screen's background is the loading screen's sky, never white
```

## Notes
- Regression test: `test/android/androidShell.test.ts` (both activities portrait; the launch colour named
  once and equal to the iOS storyboard's). The shell is compiled by CI and run by no test.
- Where: `AndroidManifest.xml` (`screenOrientation`), `res/values/styles.xml` and `res/values/launch.xml`.
- Owed on the owner's Pixel, on a build of main: the app held upright with auto-rotate on; the launch with
  the phone in light theme. Not run locally; CI validates.
