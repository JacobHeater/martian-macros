---
id: MM-403
status: in-progress
component: app-shell
related: [MM-228, MM-232, MM-242, MM-69, MM-404, MM-405, MM-406]
---

# Task: The iOS shell

## Context
Part 7 of MM-228: "iOS, on the Mac." The React app runs inside a thin
native shell. Until now the only shell was Android (`apps/mobile/android`),
with five Kotlin plugins of our own for what the phone provides: the
database (`MmDb`), the pack files and the one HTTP fetch (`MmPacks`),
reminders (`MmReminders`), the camera (`MmScanner`) and Health Connect
(`MmHealth`). Nothing had been built for iOS in either toolkit, and no Mac
could run an Xcode new enough.

On 2026-10-19 the product owner's 2016 MacBook Pro was brought to macOS
Sequoia 15.8 and Xcode 26.3, the newest Xcode that runs on it (26.4 and
later need macOS 26). The owner asked for the iOS work to start.

## Decisions (made with the product owner, 2026-10-19)
- **The DEMO identity, as on Android**: bundle id
  `com.martianmacros.martian_macros.demo`, name "Martian Macros DEMO". The
  switch of identities stays MM-228's.
- **No iOS build in CI yet.** iOS is checked on the Mac. A macOS runner is
  billed at about ten times a Linux minute; add one once the shell is
  stable.
- **All five plugins in one effort**, each on its own ticket (MM-404 the
  storage, MM-405 reminders, MM-406 the camera, MM-69 Apple Health), so each
  is verified and recorded on its own.
- **"Close the app" is not offered on iOS.** The terms screen's "Not now"
  page offers it on Android, where it puts the app in the background as the
  back button does. iOS has no such call, and Apple's guidelines refuse an
  app that quits itself; on iOS the page says instead to go back to the
  Home Screen, and that the app asks again when opened (the panel's F2:
  "leave the app from the Home Screen" could be read as removing it).
- **The simulator first; the owner's iPhone once a team is chosen in Xcode.**
  Signing needs the owner's Apple Developer team. `docs/ios-signing.md`
  says how to set it and what it unlocks (the phone, HealthKit on it,
  TestFlight).

Choices I made without asking (say if any is wrong):
- **Swift Package Manager, not CocoaPods.** Capacitor 8 supports it, and the
  Mac has no Ruby toolchain to keep current: `npx cap add ios
  --packagemanager SPM`. `ios/App/CapApp-SPM/Package.swift` is written by
  Capacitor's CLI and never edited by hand.
- **The plugins are Swift classes in the app target**
  (`ios/App/App/Plugins/`), registered from
  `MainViewController.capacitorDidLoad()` as `MainActivity.onCreate`
  registers the Kotlin ones. None becomes a package of its own.
- **The app learns which platform it is on from one service**,
  `AppServices.platform` (`android`, `ios` or `web`), read from Capacitor
  once in `openAppServices`. Fixtures and stories say `android` unless a
  story is about iOS (`onIos`). No screen asks Capacitor.
- **The same `mm` commands.** `mm build ios [--release]` builds for the
  simulator with no signing; `mm run --ios [-d UDID]` installs and launches
  on a simulator; `mm simulator [name | list]` boots one; `mm screenshot -d
  UDID` captures one. A device build is made in Xcode until a team is set.
- **The purpose strings are in `Info.plist`**, in the app's own words, for
  the camera and for Apple Health. App Review reads them.
- **iOS 15 is the floor**, Capacitor's default; nothing here needs newer.
- **The terms of use name the platform's own things** (MM-242): on iOS the
  health paragraph says Apple Health and the camera paragraph says the
  reader is Apple's, part of iOS; the Google ML Kit sentences are Android's.
  Still a draft awaiting the attorney, on both platforms.
- **Portrait only, as the Android shell is.**

## Description
`apps/mobile/ios/` builds and runs the React app on an iPhone simulator with
every plugin the Android shell has, under the DEMO identity. The app says
"Apple Health" where it said "Health Connect" (MM-69), the terms screen on
iOS does not offer to close the app, the tool builds, installs, launches and
screenshots the simulator, and the documents describe the shell that exists.

## UI/UX
- The terms declined on iOS — apps/mobile/src/gallery/screens/FirstRun.stories.tsx
  (Story: TermsNotNowOnIos). The page without "Close the app", saying to go
  back to the Home Screen and that the app asks again. Reviewed by the
  product designer and the UX guard (pass, no blocking finding):
  docs/agent-runs/mm403-ios-shell.

## Acceptance Criteria
```gherkin
Scenario: The shell builds and runs
  Given the Mac with Xcode 26.3
  When mm build ios runs
  Then the app builds for the simulator without a signing team
  And mm run --ios installs and launches it on a booted iPhone simulator

Scenario: Every plugin answers
  Given the app open on the simulator
  Then MmDb, MmPacks, MmReminders, MmScanner and MmHealth are registered
  And the app opens the phone's database, never the browser's in-memory one

Scenario: Not now on iOS
  Given the terms of use on an iPhone
  When "Not now" is pressed
  Then the page offers to read the terms again and, with records, to erase them
  And it does not offer to close the app
  And it says to go back to the Home Screen, and that the app asks again when opened

Scenario: Not now on Android, unchanged
  Given the terms of use on an Android phone
  When "Not now" is pressed
  Then "Close the app" is offered as before

Scenario: The web is still never a product
  Given the app in a browser
  Then everything is held in memory, as before, whatever the platform says
```

## Notes
- The owner's checklist on a phone, once signed: the app installs from Xcode;
  the terms, onboarding and a weigh-in survive a force quit; Apple Health
  on the device (MM-69); the camera on the device (MM-406); a reminder at
  its time (MM-405).
