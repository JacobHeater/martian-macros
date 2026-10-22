---
id: MM-536
status: done
component: developer-tooling
related: [MM-238, MM-412, MM-403, MM-8]
---

# Task: Screenshot the iPhone through the app

## Context
`mm screenshot` captures an Android device through adb (MM-238) and a
simulator through `simctl` (MM-403). For the owner's plugged-in iPhone
(MM-412) there was no way: Apple's own tools take no screenshot of a phone
any more, and the usual routes (libimobiledevice, pymobiledevice3, Appium)
need Python, Homebrew or a WebDriver agent installed on the Mac. The owner
asked (2026-10-21) for "the native flow within the app" instead, with
nothing installed beyond Xcode.

## Decisions (made with the product owner)
- **The app takes the picture of itself.** In the dev and demo apps only, a
  small native plugin snapshots the app's own web view
  (`WKWebView.takeSnapshot`) to a PNG in the app's data container.
- **`xcrun devicectl` is the only tool.** It asks for the picture, opens the
  app, and copies the PNG out; no Python, Homebrew, libimobiledevice or
  Appium.
- **Never the real app.** The plugin is not registered in the prod identity
  `com.martianmacros` (MM-8), and checks again itself; `mm screenshot`
  refuses `--prod` and `--env prod` for a phone and says why.
- **The trade-off: the app's screen, not the phone's.** The picture is what
  the web view draws: no status bar, no Home indicator, no system sheet,
  alert, keyboard or permission prompt, and nothing native drawn over the
  web view (the barcode camera, MM-403). The help text says so. For those, a
  screenshot taken on the phone itself (side button and volume up) is the
  way.

## Decisions (owner, 2026-10-22)
- **The real app takes screenshots too, while the owner is the only user.** The owner lives with the prod identity on the
  iPhone, so a dev-only plugin answered nothing ("could not be reached… Is it installed?"). The plugin is now registered in
  every identity, and `mm screenshot --phone` asks the real app unless `--env dev|demo` says, as `mm run --ios --phone`
  does (MM-412). It still answers only a request file that only the Mac can put in the app's container, and opens nothing
  to the web app. **Blocked again in the real app before any release: MM-552 (M5).** This replaces "Never the real app"
  above for now.

## Decisions (made by the author, easy to overrule)
- **The request is a file, not a URL.** `mm` copies
  `Library/Caches/mm-screenshot-<stamp>.request` into the app's container
  (`devicectl device copy to`), opens the app
  (`devicectl device process launch`, which brings it to the front and does
  not restart it), and posts the Darwin notification
  `<bundle id>.mm-screenshot` (`devicectl device notification post`) to
  tell an app already in front to look. The app looks when its plugin loads,
  when it becomes active, and on that notification. A URL
  (`--payload-url`) would need a URL scheme in `Info.plist`, which every
  identity, prod too, would then register; a file in the dev app's own
  container needs none. The notification carries nothing and does nothing
  without the request file, which only the app and a developer's Mac can
  write.
- The app answers once the web view has finished loading, writes
  `Library/Caches/mm-screenshot-<stamp>.png` atomically, and deletes every
  other request and picture of its own; at most one picture stays on the
  phone, in the dev or demo app's caches, which iOS may clear.
- `mm` re-posts the notification and tries to copy the PNG once a second,
  for up to 20 seconds, then says the phone must be unlocked with the app in
  front, from a build made after this ticket.
- **Choosing the phone**: `mm screenshot --phone` takes the one connected
  iPhone (`MM_IPHONE` names a default), as `mm run --ios --phone` does
  (MM-412); `-d <name | id>` takes a paired iPhone by devicectl's name or
  identifier, checked before a simulator UDID (both are UUIDs). The dev
  twin unless `--env demo` says. `--phone` takes no value here, so a path
  after it is a path.
- Android has adb's own screenshot (MM-238), so this plugin has no Kotlin
  twin.

## Description
With the iPhone plugged in and unlocked and the dev (or demo) app
installed, `mm screenshot --phone [path] [--clipboard]` writes the app's
screen as a PNG on the Mac, with MM-238's path and clipboard behaviour, and
prints where it went.

## Acceptance Criteria
```gherkin
Scenario: The app's screen, from the phone plugged in
  Given one iPhone is connected and unlocked, with the dev app installed from this ticket on
  When mm screenshot --phone runs
  Then the app is brought to the front, takes a picture of its web view, and the PNG is copied to mm-screenshot-<stamp>.png
  And the picture has no status bar or system interface

Scenario: Path and clipboard as before
  When mm screenshot --phone shot.png --clipboard runs
  Then the picture is written to shot.png and put on the clipboard

Scenario: A phone by name
  Given an iPhone named "Test iPhone" is paired and connected
  When mm screenshot -d "Test iPhone" runs
  Then the phone path is taken, not adb or simctl

Scenario: Never the real app
  When mm screenshot --phone --prod runs
  Then nothing is sent to the phone, and the command says the real app takes no screenshots, and to use the dev or demo app
  And the real app never registers the screenshot plugin

Scenario: The phone is away
  Given the iPhone is paired but not connected
  When mm screenshot --phone runs
  Then the command says it is paired but not connected, and to plug it in

Scenario: No answer
  Given the app is not in front, or the phone is locked, or the build is older
  When no picture appears within 20 seconds
  Then the command stops, and says to unlock the phone, keep the app open, and install a current dev build
```

## Regression test
- `tool/test/iphoneScreenshot.test.ts`: the arguments (`--phone`, `-d`,
  `--env`, the path), the choice of phone, simulator or adb, the devicectl
  command lines, the prod refusal before anything runs, and the wait that
  ends at the first copied picture or at the timeout.
- `tool/test/iphoneScreenshotSwift.test.ts` reads the Swift (CI builds no
  iOS): the plugin is registered only behind its dev-only check, which
  refuses `com.martianmacros`; it is in the Xcode target's sources; and its
  file names and notification agree with the runner's.

## Progress
Done 2026-10-21 (#235). Not run locally; CI validates the unit tests, and CI builds no iOS app, so the Swift
(`ios/App/App/Plugins/MmScreenshotPlugin.swift`, registered from `MainViewController` behind `isAllowed`) is held
only by `tool/test/iphoneScreenshotSwift.test.ts` until it is built on the Mac. The devicectl flags relied on are
from `xcrun devicectl ... --help` on Xcode 26.3: `device copy to` and `copy from` with `--domain-type
appDataContainer --domain-identifier <bundle id>` and a container-relative `--source` / `--destination`;
`device process launch` of an app already running without `--terminate-existing`; and
`device notification post --name`.

## Owed on a phone
With the phone plugged in and unlocked, after `mm run --ios --phone --env dev`:
- `mm screenshot --phone` brings the app to the front and writes its web view as `mm-screenshot-<stamp>.png`, with
  no status bar; `mm screenshot --phone shot.png --clipboard` writes `shot.png` and puts it on the clipboard.
- `mm screenshot -d "<the phone's name>"` takes the phone path.
- With the phone unplugged, the command says it is paired but not connected; with the phone locked, it stops after
  20 seconds and says why.
- The real app (`--prod`) is refused before anything is sent (covered by the unit test; the phone shows nothing).
- The first iOS build of `MmScreenshotPlugin.swift`.
